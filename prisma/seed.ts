import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

type ExerciseSeed = {
  name: string;
  category: "PUSH" | "PULL" | "LEGS" | "CORE" | "SKILL";
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  muscleGroups: string[];
  equipment: string[];
  isIsometric: boolean;
};

const exercises: ExerciseSeed[] = [
  // ── PUSH ─────────────────────────────────────────────
  // Beginner
  { name: "Flexão de joelhos", category: "PUSH", level: "BEGINNER", muscleGroups: ["peito", "tríceps", "ombros"], equipment: [], isIsometric: false },
  { name: "Flexão inclinada (mãos elevadas)", category: "PUSH", level: "BEGINNER", muscleGroups: ["peito", "tríceps", "ombros"], equipment: [], isIsometric: false },
  { name: "Dips assistido", category: "PUSH", level: "BEGINNER", muscleGroups: ["peito", "tríceps", "ombros"], equipment: ["paralelas", "faixa_elastica"], isIsometric: false },
  // Intermediate
  { name: "Flexão completa", category: "PUSH", level: "INTERMEDIATE", muscleGroups: ["peito", "tríceps", "ombros"], equipment: [], isIsometric: false },
  { name: "Diamond push-up", category: "PUSH", level: "INTERMEDIATE", muscleGroups: ["tríceps", "peito"], equipment: [], isIsometric: false },
  { name: "Dips em paralelas", category: "PUSH", level: "INTERMEDIATE", muscleGroups: ["peito", "tríceps", "ombros"], equipment: ["paralelas"], isIsometric: false },
  { name: "Pike push-up", category: "PUSH", level: "INTERMEDIATE", muscleGroups: ["ombros", "tríceps"], equipment: [], isIsometric: false },
  { name: "Pseudo planche push-up", category: "PUSH", level: "INTERMEDIATE", muscleGroups: ["peito", "ombros", "tríceps"], equipment: [], isIsometric: false },
  // Advanced
  { name: "Archer push-up", category: "PUSH", level: "ADVANCED", muscleGroups: ["peito", "tríceps", "ombros"], equipment: [], isIsometric: false },
  { name: "Handstand push-up (parede)", category: "PUSH", level: "ADVANCED", muscleGroups: ["ombros", "tríceps"], equipment: [], isIsometric: false },
  { name: "Handstand push-up (livre)", category: "PUSH", level: "ADVANCED", muscleGroups: ["ombros", "tríceps"], equipment: [], isIsometric: false },
  { name: "Weighted dips", category: "PUSH", level: "ADVANCED", muscleGroups: ["peito", "tríceps", "ombros"], equipment: ["paralelas", "peso_extra"], isIsometric: false },
  { name: "Planche push-up progressão", category: "PUSH", level: "ADVANCED", muscleGroups: ["peito", "ombros", "tríceps"], equipment: [], isIsometric: false },

  // ── PULL ─────────────────────────────────────────────
  // Beginner
  { name: "Remada invertida (barra baixa)", category: "PULL", level: "BEGINNER", muscleGroups: ["costas", "bíceps"], equipment: ["barra_fixa"], isIsometric: false },
  { name: "Barra fixa com elástico", category: "PULL", level: "BEGINNER", muscleGroups: ["costas", "bíceps"], equipment: ["barra_fixa", "faixa_elastica"], isIsometric: false },
  { name: "Australian pull-up", category: "PULL", level: "BEGINNER", muscleGroups: ["costas", "bíceps"], equipment: ["barra_fixa"], isIsometric: false },
  { name: "Dead hang", category: "PULL", level: "BEGINNER", muscleGroups: ["antebraço", "costas"], equipment: ["barra_fixa"], isIsometric: true },
  // Intermediate
  { name: "Pull-up", category: "PULL", level: "INTERMEDIATE", muscleGroups: ["costas", "bíceps"], equipment: ["barra_fixa"], isIsometric: false },
  { name: "Chin-up", category: "PULL", level: "INTERMEDIATE", muscleGroups: ["bíceps", "costas"], equipment: ["barra_fixa"], isIsometric: false },
  { name: "Remada invertida com pés elevados", category: "PULL", level: "INTERMEDIATE", muscleGroups: ["costas", "bíceps"], equipment: ["barra_fixa"], isIsometric: false },
  { name: "Commando pull-ups", category: "PULL", level: "INTERMEDIATE", muscleGroups: ["costas", "bíceps"], equipment: ["barra_fixa"], isIsometric: false },
  // Advanced
  { name: "Muscle-up", category: "PULL", level: "ADVANCED", muscleGroups: ["costas", "peito", "tríceps"], equipment: ["barra_fixa"], isIsometric: false },
  { name: "Archer pull-up", category: "PULL", level: "ADVANCED", muscleGroups: ["costas", "bíceps"], equipment: ["barra_fixa"], isIsometric: false },
  { name: "Weighted pull-ups", category: "PULL", level: "ADVANCED", muscleGroups: ["costas", "bíceps"], equipment: ["barra_fixa", "peso_extra"], isIsometric: false },
  { name: "Front lever progressão", category: "PULL", level: "ADVANCED", muscleGroups: ["costas", "core"], equipment: ["barra_fixa"], isIsometric: true },
  { name: "Typewriter pull-ups", category: "PULL", level: "ADVANCED", muscleGroups: ["costas", "bíceps"], equipment: ["barra_fixa"], isIsometric: false },
  { name: "L-sit pull-ups", category: "PULL", level: "ADVANCED", muscleGroups: ["costas", "bíceps", "core"], equipment: ["barra_fixa"], isIsometric: false },

  // ── LEGS ─────────────────────────────────────────────
  // Beginner
  { name: "Agachamento livre", category: "LEGS", level: "BEGINNER", muscleGroups: ["quadríceps", "glúteos"], equipment: [], isIsometric: false },
  { name: "Lunge", category: "LEGS", level: "BEGINNER", muscleGroups: ["quadríceps", "glúteos"], equipment: [], isIsometric: false },
  { name: "Step-up", category: "LEGS", level: "BEGINNER", muscleGroups: ["quadríceps", "glúteos"], equipment: [], isIsometric: false },
  { name: "Wall sit", category: "LEGS", level: "BEGINNER", muscleGroups: ["quadríceps"], equipment: [], isIsometric: true },
  { name: "Calf raises", category: "LEGS", level: "BEGINNER", muscleGroups: ["panturrilha"], equipment: [], isIsometric: false },
  // Intermediate
  { name: "Agachamento búlgaro", category: "LEGS", level: "INTERMEDIATE", muscleGroups: ["quadríceps", "glúteos"], equipment: [], isIsometric: false },
  { name: "Nordic curl assistido", category: "LEGS", level: "INTERMEDIATE", muscleGroups: ["posterior"], equipment: [], isIsometric: false },
  { name: "Single leg calf raise", category: "LEGS", level: "INTERMEDIATE", muscleGroups: ["panturrilha"], equipment: [], isIsometric: false },
  { name: "Jump squats", category: "LEGS", level: "INTERMEDIATE", muscleGroups: ["quadríceps", "glúteos"], equipment: [], isIsometric: false },
  { name: "Glute bridge single leg", category: "LEGS", level: "INTERMEDIATE", muscleGroups: ["glúteos", "posterior"], equipment: [], isIsometric: false },
  // Advanced
  { name: "Pistol squat", category: "LEGS", level: "ADVANCED", muscleGroups: ["quadríceps", "glúteos"], equipment: [], isIsometric: false },
  { name: "Nordic curl completo", category: "LEGS", level: "ADVANCED", muscleGroups: ["posterior"], equipment: [], isIsometric: false },
  { name: "Shrimp squat", category: "LEGS", level: "ADVANCED", muscleGroups: ["quadríceps", "glúteos"], equipment: [], isIsometric: false },
  { name: "Sissy squat", category: "LEGS", level: "ADVANCED", muscleGroups: ["quadríceps"], equipment: [], isIsometric: false },
  { name: "Weighted pistol squat", category: "LEGS", level: "ADVANCED", muscleGroups: ["quadríceps", "glúteos"], equipment: ["peso_extra"], isIsometric: false },

  // ── CORE ─────────────────────────────────────────────
  // Beginner
  { name: "Prancha frontal", category: "CORE", level: "BEGINNER", muscleGroups: ["abdômen", "lombar"], equipment: [], isIsometric: true },
  { name: "Prancha lateral", category: "CORE", level: "BEGINNER", muscleGroups: ["oblíquos"], equipment: [], isIsometric: true },
  { name: "Dead bug", category: "CORE", level: "BEGINNER", muscleGroups: ["abdômen"], equipment: [], isIsometric: false },
  { name: "Mountain climbers", category: "CORE", level: "BEGINNER", muscleGroups: ["abdômen", "quadríceps"], equipment: [], isIsometric: false },
  { name: "Hollow body hold", category: "CORE", level: "BEGINNER", muscleGroups: ["abdômen"], equipment: [], isIsometric: true },
  // Intermediate
  { name: "L-sit (chão)", category: "CORE", level: "INTERMEDIATE", muscleGroups: ["abdômen", "quadríceps"], equipment: [], isIsometric: true },
  { name: "L-sit (paralelas)", category: "CORE", level: "INTERMEDIATE", muscleGroups: ["abdômen", "quadríceps"], equipment: ["paralelas"], isIsometric: true },
  { name: "Hanging knee raises", category: "CORE", level: "INTERMEDIATE", muscleGroups: ["abdômen"], equipment: ["barra_fixa"], isIsometric: false },
  { name: "Ab wheel", category: "CORE", level: "INTERMEDIATE", muscleGroups: ["abdômen"], equipment: [], isIsometric: false },
  { name: "Toes to bar", category: "CORE", level: "INTERMEDIATE", muscleGroups: ["abdômen"], equipment: ["barra_fixa"], isIsometric: false },
  // Advanced
  { name: "Dragon flag", category: "CORE", level: "ADVANCED", muscleGroups: ["abdômen", "lombar"], equipment: [], isIsometric: false },
  { name: "Front lever raises", category: "CORE", level: "ADVANCED", muscleGroups: ["abdômen", "costas"], equipment: ["barra_fixa"], isIsometric: false },
  { name: "Hanging windshield wipers", category: "CORE", level: "ADVANCED", muscleGroups: ["oblíquos", "abdômen"], equipment: ["barra_fixa"], isIsometric: false },
  { name: "Human flag progressão", category: "CORE", level: "ADVANCED", muscleGroups: ["oblíquos", "ombros"], equipment: [], isIsometric: true },
  { name: "V-sit", category: "CORE", level: "ADVANCED", muscleGroups: ["abdômen", "quadríceps"], equipment: [], isIsometric: true },

  // ── SKILL ────────────────────────────────────────────
  { name: "Handstand (parede)", category: "SKILL", level: "INTERMEDIATE", muscleGroups: ["ombros", "core"], equipment: [], isIsometric: true },
  { name: "Handstand (livre)", category: "SKILL", level: "ADVANCED", muscleGroups: ["ombros", "core"], equipment: [], isIsometric: true },
  { name: "L-sit hold", category: "SKILL", level: "INTERMEDIATE", muscleGroups: ["abdômen", "quadríceps"], equipment: [], isIsometric: true },
  { name: "Planche lean", category: "SKILL", level: "INTERMEDIATE", muscleGroups: ["ombros", "peito"], equipment: [], isIsometric: true },
  { name: "Back lever progressão", category: "SKILL", level: "ADVANCED", muscleGroups: ["costas", "ombros"], equipment: ["barra_fixa", "aneis"], isIsometric: true },
  { name: "Muscle-up progressão", category: "SKILL", level: "INTERMEDIATE", muscleGroups: ["costas", "peito", "tríceps"], equipment: ["barra_fixa"], isIsometric: false },
];

async function main() {
  console.log(`Seeding ${exercises.length} exercises...`);

  for (const ex of exercises) {
    await prisma.exercise.upsert({
      where: { name: ex.name },
      update: {
        category: ex.category,
        level: ex.level,
        muscleGroups: ex.muscleGroups,
        equipment: ex.equipment,
        isIsometric: ex.isIsometric,
      },
      create: ex,
    });
  }

  console.log(`Seeded ${exercises.length} exercises.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
