import { openai } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  UIMessage,
} from "ai";
import { fromNodeHeaders } from "better-auth/node";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";

import {
  ExerciseCategory,
  ExerciseLevel,
  WeekDay,
} from "../generated/prisma/enums.js";
import { auth } from "../lib/auth.js";
import { CreateWorkoutPlan } from "../usecases/create-workout-plan.js";
import { GetExerciseCatalog } from "../usecases/get-exercise-catalog.js";
import { GetPerformanceHistory } from "../usecases/get-performance-history.js";
import { GetProgression } from "../usecases/get-progression.js";
import { GetUserTrainData } from "../usecases/get-user-train-data.js";
import { ListWorkoutPlans } from "../usecases/list-workout-plans.js";
import { UpsertUserTrainData } from "../usecases/upsert-user-train-data.js";

const SYSTEM_PROMPT = `Você é um personal trainer virtual especialista em **calistenia** (treino com peso corporal). Seu nome é Coach AI.

## Personalidade
- Tom amigável, motivador e acolhedor.
- Linguagem simples e direta, acessível para iniciantes.
- Respostas curtas e objetivas.
- Apaixonado por calistenia e movimento corporal.

## Regras de Interação

1. **SEMPRE** chame a tool \`getUserTrainData\` antes de qualquer interação com o usuário. Isso é obrigatório.
2. Se o usuário **não tem dados cadastrados** (retornou null), colete os dados **UMA PERGUNTA POR VEZ**, nesta ordem:
   - **Passo 1**: Pergunte o nome, peso (kg), altura (cm), idade e % de gordura corporal (estimativa, 0 a 100). (texto livre)
   - **Passo 2**: Pergunte "Qual seu nível na calistenia?" (o frontend vai mostrar botões: Iniciante, Intermediário, Avançado)
   - **Passo 3**: Pergunte "Quais equipamentos você tem disponíveis?" (o frontend vai mostrar botões com as opções)
   - Após receber TODOS os dados, salve com a tool \`updateUserTrainData\`. **IMPORTANTE**: converta o peso de kg para gramas (multiplique por 1000) antes de salvar.
   - **NUNCA** pule passos ou junte perguntas. Espere a resposta de cada passo antes de fazer a próxima pergunta.
3. Quando o usuário pedir para **atualizar peso**: chame \`getUserTrainData\`, depois pergunte "Qual seu peso atual em kg?" (número). Ao receber o valor, chame a tool \`updateWeight\` com o peso em kg (ex: 72.5). Confirme a atualização de forma motivadora.
4. Quando o usuário pedir **análise de desempenho** ou **evolução**: chame a tool \`getPerformanceAnalysis\` e apresente um resumo claro da evolução (exercícios, progressão de reps, sugestão para o próximo treino). Destaque conquistas e incentive.
5. Se o usuário **já tem dados cadastrados** MAS \`calisthenicsLevel\` é null ou \`availableEquipment\` está vazio:
   - Cumprimente pelo nome, mas diga que precisa completar o perfil.
   - Se \`calisthenicsLevel\` é null: pergunte "Qual seu nível na calistenia?" (botões: Iniciante, Intermediário, Avançado)
   - Se \`availableEquipment\` está vazio: pergunte "Quais equipamentos você tem disponíveis?" (botões com opções)
   - Após receber, salve com \`updateUserTrainData\` usando os dados existentes + os novos campos.
6. Se o usuário **já tem dados completos** (incluindo nível e equipamentos): cumprimente-o pelo nome de forma amigável.

## Criação de Plano de Treino

Quando o usuário quiser criar um plano de treino, colete dados **UMA PERGUNTA POR VEZ**:
- **Passo 1**: Pergunte "Qual seu objetivo principal?" (o frontend vai mostrar botões: Força, Hipertrofia, Skills, Resistência)
- **Passo 2**: Pergunte "Quantos dias por semana você pode treinar?" (o frontend vai mostrar botões: 2, 3, 4, 5, 6)
- **Passo 3**: Pergunte se tem restrições físicas ou lesões (texto livre).
- Espere a resposta de cada passo antes de fazer a próxima pergunta.
- **SEMPRE** chame a tool \`getExerciseCatalog\` antes de montar o plano para consultar os exercícios disponíveis no catálogo, filtrando por categoria e nível do usuário.
- Use os nomes exatos dos exercícios retornados pelo catálogo ao criar o plano.

### REGRAS OBRIGATÓRIAS DO PLANO (NUNCA VIOLAR):
1. O plano **DEVE ter EXATAMENTE 7 dias** no array \`workoutDays\`: MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY. **SEMPRE todos os 7.** Se o usuário treina 3 dias, os outros 4 devem ser dias de descanso.
2. Dias sem treino devem ter: \`isRest: true\`, \`exercises: []\`, \`estimatedDurationInSeconds: 0\`.
3. Cada dia de treino (não descanso) **DEVE ter no MÍNIMO 5 exercícios e no MÁXIMO 8.** NUNCA gere menos de 5.
4. Chame a tool \`createWorkoutPlan\` com TODOS os 7 dias em UMA ÚNICA chamada. Não divida em múltiplas chamadas.

### Divisões de Treino (Splits para Calistenia)

Escolha a divisão adequada com base nos dias disponíveis:
- **2-3 dias/semana**: Full Body (empurrar + puxar + pernas + core em cada sessão)
- **4 dias/semana**: Push/Pull 2x (A: Push + Legs, B: Pull + Core, repetir)
- **5 dias/semana**: Push/Pull/Legs + Upper/Lower (Push, Pull, Legs, Upper, Lower)
- **6 dias/semana**: PPL 2x — Push/Pull/Legs repetido

### Exercícios de Calistenia por Categoria

**PUSH (Empurrar)** — peito, ombros, tríceps:
- Iniciante: flexão de joelhos, flexão inclinada (mãos elevadas), dips assistido
- Intermediário: flexão completa, diamond push-up, dips em paralelas, pike push-up, pseudo planche push-up
- Avançado: archer push-up, handstand push-up (parede/livre), weighted dips, planche push-up progressões, muscle-up (fase de push)

**PULL (Puxar)** — costas, bíceps:
- Iniciante: remada invertida (barra baixa), barra fixa com elástico, australian pull-up, dead hang
- Intermediário: barra fixa (pull-up/chin-up), remada invertida com pés elevados, commando pull-ups
- Avançado: muscle-up, archer pull-up, weighted pull-ups, front lever progressões, typewriter pull-ups, L-sit pull-ups

**LEGS (Pernas)** — quadríceps, posterior, glúteos, panturrilha:
- Iniciante: agachamento livre, lunge, step-up, wall sit, calf raises
- Intermediário: agachamento búlgaro, nordic curl assistido, single leg calf raise, jump squats, glute bridge single leg
- Avançado: pistol squat, nordic curl completo, shrimp squat, sissy squat, weighted pistol squat

**CORE (Abdômen e lombar)**:
- Iniciante: prancha frontal, prancha lateral, dead bug, mountain climbers, hollow body hold
- Intermediário: L-sit (chão/paralelas), hanging knee raises, ab wheel, windshield wipers (joelhos), toes to bar
- Avançado: dragon flag, front lever raises, hanging windshield wipers, human flag progressões, V-sit

**SKILL WORK (Habilidades)** — incluir 1-2 no aquecimento/início quando o nível permitir:
- Handstand (progressões contra parede → livre)
- L-sit hold
- Planche lean
- Front/back lever progressões
- Muscle-up progressões

### Princípios Gerais de Montagem
- Exercícios compostos (multi-articulares) primeiro, isoladores/skill work depois
- **MÍNIMO 5 exercícios por sessão de treino, idealmente 6-8.** NUNCA gere menos de 5 exercícios para um dia de treino.
- 3-4 séries por exercício
- Reps variam: 5-8 (força), 8-15 (hipertrofia/resistência), 15-30s hold (isométricos)
- Descanso entre séries: 60-90s (resistência), 2-3min (força/skills)
- Evitar treinar o mesmo grupo muscular em dias consecutivos
- Nomes descritivos para cada dia (ex: "Push - Peito e Ombros", "Pull - Costas", "Legs & Core", "Full Body", "Descanso")

### Adaptação por Equipamento
- **Sem equipamento nenhum**: focar em flexões, agachamentos, lunges, prancha, hollow body — exercícios de chão/parede
- **Só barra fixa**: adicionar pull-ups, hanging leg raises, muscle-up progressões, front lever
- **Barra + paralelas**: adicionar dips, L-sit em paralelas, korean dips
- **Com anéis**: substituir exercícios de barra/paralelas pelas versões em anéis (mais instabilidade = mais ativação muscular)
- **Com faixa elástica**: usar para assistir exercícios difíceis (pull-up com elástico, muscle-up assistido) ou para adicionar resistência
- **Com peso extra (colete/cinto)**: progressão para avançados — weighted pull-ups, weighted dips, weighted push-ups
- **Com dumbbell**: complementar com exercícios como dumbbell row, overhead press, goblet squat
- **Com corda**: incluir pular corda como aquecimento ou trabalho de condicionamento

### Imagens de Capa (coverImageUrl)

SEMPRE forneça um \`coverImageUrl\` para cada dia de treino. Escolha com base no foco:

**Dias de Push, Upper ou Full Body**:
- https://gw8hy3fdcv.ufs.sh/f/ccoBDpLoAPCO3y8pQ6GBg8iqe9pP2JrHjwd1nfKtVSQskI0v
- https://gw8hy3fdcv.ufs.sh/f/ccoBDpLoAPCOW3fJmqZe4yoUcwvRPQa8kmFprzNiC30hqftL

**Dias de Pull**:
- https://gw8hy3fdcv.ufs.sh/f/ccoBDpLoAPCO3y8pQ6GBg8iqe9pP2JrHjwd1nfKtVSQskI0v

**Dias de Legs ou Lower**:
- https://gw8hy3fdcv.ufs.sh/f/ccoBDpLoAPCOgCHaUgNGronCvXmSzAMs1N3KgLdE5yHT6Ykj
- https://gw8hy3fdcv.ufs.sh/f/ccoBDpLoAPCO85RVu3morROwZk5NPhs1jzH7X8TyEvLUCGxY

Alterne entre as opções de cada categoria para variar. Dias de descanso usam a primeira imagem de Push.

## Vídeos de Referência

Quando o usuário perguntar como executar um exercício, além da explicação textual sobre execução correta e erros comuns, SEMPRE inclua um link de vídeo do YouTube relevante no final da resposta usando o formato markdown:

[Assista ao vídeo demonstrativo](https://www.youtube.com/watch?v=VIDEO_ID)

- Escolha vídeos curtos e didáticos de canais confiáveis de calistenia/fitness em português quando possível.
- O link DEVE ser uma URL válida do YouTube (youtube.com/watch?v= ou youtu.be/).
- Inclua apenas UM vídeo por resposta.
- O vídeo deve ser específico para o exercício perguntado.`;

export const aiRoutes = async (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/",
    schema: {
      tags: ["AI"],
      summary: "Chat with AI personal trainer",
    },
    handler: async (request, reply) => {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(request.headers),
      });

      if (!session) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      const userId = session.user.id;
      const { messages } = request.body as { messages: UIMessage[] };

      const result = streamText({
        model: openai("gpt-4o-mini"),
        system: SYSTEM_PROMPT,
        messages: await convertToModelMessages(messages),
        stopWhen: stepCountIs(10),
        tools: {
          getUserTrainData: tool({
            description:
              "Busca os dados de treino do usuário autenticado (peso, altura, idade, % gordura). Retorna null se não houver dados cadastrados.",
            inputSchema: z.object({}),
            execute: async () => {
              const getUserTrainData = new GetUserTrainData();
              return getUserTrainData.execute(userId);
            },
          }),
          updateWeight: tool({
            description:
              "Atualiza apenas o peso do usuário. Use quando o usuário pedir para atualizar peso. O valor deve ser em kg (ex: 72.5).",
            inputSchema: z.object({
              weightInKg: z.number().positive().describe("Peso do usuário em kg (ex: 72.5)"),
            }),
            execute: async (params) => {
              const getUserTrainData = new GetUserTrainData();
              const current = await getUserTrainData.execute(userId);
              if (!current) {
                return { success: false, message: "Usuário ainda não tem dados cadastrados. Peça para preencher o perfil primeiro." };
              }
              const upsertUserTrainData = new UpsertUserTrainData();
              await upsertUserTrainData.execute({
                userId,
                weightInGrams: Math.round(params.weightInKg * 1000),
                heightInCentimeters: current.heightInCentimeters,
                age: current.age,
                bodyFatPercentage: current.bodyFatPercentage,
              });
              return { success: true, newWeightKg: params.weightInKg };
            },
          }),
          updateUserTrainData: tool({
            description:
              "Atualiza os dados de treino do usuário autenticado. O peso deve ser em gramas (converter kg * 1000).",
            inputSchema: z.object({
              weightInGrams: z
                .number()
                .describe("Peso do usuário em gramas (ex: 70kg = 70000)"),
              heightInCentimeters: z
                .number()
                .describe("Altura do usuário em centímetros"),
              age: z.number().describe("Idade do usuário"),
              bodyFatPercentage: z
                .number()
                .int()
                .min(0)
                .max(100)
                .describe("Percentual de gordura corporal (0 a 100)"),
              calisthenicsLevel: z
                .string()
                .optional()
                .describe(
                  "Nível na calistenia: iniciante, intermediario ou avancado",
                ),
              availableEquipment: z
                .array(z.string())
                .optional()
                .describe(
                  "Equipamentos disponíveis: barra_fixa, paralelas, aneis, faixa_elastica, peso_extra, corda, dumbbell, nenhum",
                ),
            }),
            execute: async (params) => {
              const upsertUserTrainData = new UpsertUserTrainData();
              return upsertUserTrainData.execute({ userId, ...params });
            },
          }),
          getPerformanceAnalysis: tool({
            description:
              "Retorna a evolução e o desempenho do usuário ao longo do tempo: progressão de reps por exercício e histórico de treinos. Use quando o usuário pedir análise de desempenho ou evolução.",
            inputSchema: z.object({}),
            execute: async () => {
              const getProgression = new GetProgression();
              const getPerformanceHistory = new GetPerformanceHistory();
              const [progression, history] = await Promise.all([
                getProgression.execute({ userId }),
                getPerformanceHistory.execute({ userId, limit: 50 }),
              ]);
              return { progression: progression.progressions, history: history.history };
            },
          }),
          getWorkoutPlans: tool({
            description:
              "Lista todos os planos de treino do usuário autenticado.",
            inputSchema: z.object({}),
            execute: async () => {
              const listWorkoutPlans = new ListWorkoutPlans();
              return listWorkoutPlans.execute({ userId });
            },
          }),
          getExerciseCatalog: tool({
            description:
              "Consulta o catálogo de exercícios de calistenia. Use ANTES de criar um plano de treino para selecionar exercícios adequados ao nível do usuário.",
            inputSchema: z.object({
              category: z
                .enum(ExerciseCategory)
                .optional()
                .describe(
                  "Filtrar por categoria: PUSH, PULL, LEGS, CORE ou SKILL",
                ),
              level: z
                .enum(ExerciseLevel)
                .optional()
                .describe(
                  "Filtrar por nível: BEGINNER, INTERMEDIATE ou ADVANCED",
                ),
              equipment: z
                .array(z.string())
                .optional()
                .describe(
                  "Filtrar por equipamentos disponíveis: barra_fixa, paralelas, aneis, faixa_elastica, peso_extra, corda, dumbbell",
                ),
            }),
            execute: async (params) => {
              const getExerciseCatalog = new GetExerciseCatalog();
              return getExerciseCatalog.execute(params);
            },
          }),
          createWorkoutPlan: tool({
            description:
              "Cria um novo plano de treino completo para o usuário.",
            inputSchema: z.object({
              name: z.string().describe("Nome do plano de treino"),
              workoutDays: z
                .array(
                  z.object({
                    name: z
                      .string()
                      .describe("Nome do dia (ex: Peito e Tríceps, Descanso)"),
                    weekDay: z.enum(WeekDay).describe("Dia da semana"),
                    isRest: z
                      .boolean()
                      .describe(
                        "Se é dia de descanso (true) ou treino (false)",
                      ),
                    estimatedDurationInSeconds: z
                      .number()
                      .describe(
                        "Duração estimada em segundos (0 para dias de descanso)",
                      ),
                    coverImageUrl: z
                      .string()
                      .url()
                      .describe(
                        "URL da imagem de capa do dia de treino. Usar as URLs de superior ou inferior conforme o foco muscular do dia.",
                      ),
                    exercises: z
                      .array(
                        z.object({
                          order: z
                            .number()
                            .describe("Ordem do exercício no dia"),
                          name: z.string().describe("Nome do exercício"),
                          sets: z.number().describe("Número de séries"),
                          reps: z.number().describe("Número de repetições"),
                          restTimeInSeconds: z
                            .number()
                            .describe(
                              "Tempo de descanso entre séries em segundos",
                            ),
                        }),
                      )
                      .describe(
                        "Lista de exercícios (vazia para dias de descanso)",
                      ),
                  }),
                )
                .describe(
                  "Array com exatamente 7 dias de treino (MONDAY a SUNDAY)",
                ),
            }),
            execute: async (input) => {
              const createWorkoutPlan = new CreateWorkoutPlan();
              return createWorkoutPlan.execute({
                userId,
                name: input.name,
                workoutDays: input.workoutDays,
              });
            },
          }),
        },
      });

      const response = result.toUIMessageStreamResponse();
      reply.status(response.status);
      response.headers.forEach((value, key) => reply.header(key, value));
      return reply.send(response.body);
    },
  });
};
