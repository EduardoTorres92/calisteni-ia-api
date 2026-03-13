# Auth no Render — state_mismatch e checklist

## Por que aparece `?error=state_mismatch` na URL da API

O better-auth redireciona para `baseURL + ?error=state_mismatch` quando o state do OAuth não confere. Se você está vendo isso em **https://calisteni-ia.onrender.com/?error=state_mismatch**, significa:

1. **`WEB_APP_BASE_URL` no Render está apontando para a API** em vez do frontend. O `baseURL` do better-auth deve ser a URL do **frontend** (onde o Next.js está hospedado), não da API.
2. O **cookie de state** pode não estar sendo enviado no callback (cross-domain). Por isso foi adicionada a configuração de cookies em `src/lib/auth.ts` para produção (`sameSite: "none"`, `secure`, `partitioned`).

## Checklist no Render (serviço da API)

| Variável | Valor correto | Errado (exemplo que gera o erro) |
|----------|----------------|-----------------------------------|
| `WEB_APP_BASE_URL` | URL do **frontend** (ex: `https://seu-app.vercel.app`) **sem barra no final** | `https://calisteni-ia.onrender.com` |
| `API_BASE_URL` | URL da API: `https://calisteni-ia.onrender.com` **sem barra no final** | `http://...` ou com barra no final |

- Depois de alterar, faça **redeploy** do serviço no Render.

## Google Cloud Console

1. Em **APIs e serviços** → **Credenciais** → seu cliente OAuth 2.0 → **URIs de redirecionamento autorizados**.
2. Adicione **exatamente** a URL que a API retorna em:
   ```text
   GET https://calisteni-ia.onrender.com/api/auth/expected-redirect-uri
   ```
   O campo `redirectUri` da resposta é o que deve estar no Google (ex: `https://SEU-FRONTEND/api/auth/callback/google`).

## Resumo

- **WEB_APP_BASE_URL** = URL do frontend (onde o usuário acessa o app).
- **API_BASE_URL** = URL da API no Render.
- Redirect URI no Google = valor de `redirectUri` retornado por `/api/auth/expected-redirect-uri`.

Com isso e a configuração de cookies em produção, o fluxo OAuth e o redirect de erro passam a funcionar corretamente.
