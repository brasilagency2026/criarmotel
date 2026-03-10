# 🏨 Motel Builder — Next.js + Supabase + Vercel

Site vitrine dinâmico para motéis com painel de gerenciamento, autenticação, banco de dados e deploy automático.

---

## 🏗️ Arquitetura

```
motel-builder/
├── app/
│   ├── page.tsx                        # Redireciona → /login ou /dashboard
│   ├── login/                          # Autenticação (email + senha)
│   ├── dashboard/                      # Painel do proprietário
│   │   ├── page.tsx                    # Lista de motéis
│   │   ├── novo/page.tsx               # Criar novo motel
│   │   └── editar/[slug]/page.tsx      # Editar motel existente
│   ├── moteis/[slug]/page.tsx          # Site vitrine público (ISR 60s)
│   └── api/auth/logout/route.ts        # Logout
│
├── components/
│   ├── Builder/                        # Formulário de criação/edição
│   └── MotelSite/                      # Site vitrine renderizado
│
├── lib/
│   ├── supabase.ts                     # Clientes Supabase (browser + server)
│   └── types.ts                        # Tipos TypeScript
│
├── supabase/
│   └── schema.sql                      # Schema SQL + RLS policies
│
├── middleware.ts                        # Proteção de rotas
├── next.config.ts
├── vercel.json
└── .env.example
```

---

## 🗄️ Banco de Dados (Supabase)

| Tabela | Descrição |
|---|---|
| `motels` | Dados do motel (nome, endereço, slug único…) |
| `suites` | Suítes vinculadas ao motel |
| `suite_photos` | Fotos de cada suíte (URL no Storage) |
| `suite_prices` | Tarifas por período de cada suíte |

**Storage bucket:** `motel-photos` (público, para fotos)

**Row Level Security:** cada proprietário acessa apenas os seus dados. Leitura pública apenas para motéis publicados.

---

## 🚀 Configuração e Deploy

### 1. Clonar o repositório

```bash
git clone https://github.com/SEU_USUARIO/motel-builder.git
cd motel-builder
npm install
```

### 2. Configurar o Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. No **SQL Editor**, execute o conteúdo de `supabase/schema.sql`
3. Em **Settings → API**, copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Rodar em desenvolvimento

```bash
npm run dev
# Abra http://localhost:3000
```

### 5. Deploy no Vercel

#### Via GitHub (recomendado — deploy automático)

1. Faça push do projeto para um repositório GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: initial motel builder"
   git remote add origin https://github.com/SEU_USUARIO/motel-builder.git
   git push -u origin main
   ```

2. Acesse [vercel.com](https://vercel.com) → **New Project** → importe o repositório

3. Em **Environment Variables**, adicione:
   ```
   NEXT_PUBLIC_SUPABASE_URL     = https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGci...
   NEXT_PUBLIC_APP_URL          = https://SEU-PROJETO.vercel.app
   ```

4. Clique em **Deploy** — a partir daí, cada `git push` na branch `main` faz deploy automático ✅

---

## 🌐 Como funciona o acesso ao site

Cada motel é acessível em:
```
https://SEU-PROJETO.vercel.app/moteis/[slug]
```

Exemplo: um motel chamado **"Motel Paraíso"** ficará em:
```
https://seu-projeto.vercel.app/moteis/motel-paraiso-a3f2
```

O slug é gerado automaticamente a partir do nome do motel + 4 caracteres aleatórios para garantir unicidade.

> **ISR (Incremental Static Regeneration):** as páginas públicas são geradas estaticamente e revalidadas a cada 60 segundos, garantindo performance máxima sem perder atualizações em tempo real.

---

## 🔐 Fluxo de autenticação

```
/                     → redireciona para /login ou /dashboard
/login                → formulário email + senha (Supabase Auth)
/dashboard            → protegido pelo middleware (redireciona se não autenticado)
/dashboard/novo       → criar novo motel
/dashboard/editar/[slug] → editar motel existente
```

---

## 📸 Armazenamento de fotos

As fotos são enviadas diretamente para o **Supabase Storage** (bucket `motel-photos`), eliminando o base64 do HTML original. As URLs públicas são salvas nas tabelas `motels.hero_photo` e `suite_photos.url`.

---

## 🛠️ Stack

| Tecnologia | Uso |
|---|---|
| **Next.js 15** (App Router) | Framework React com SSR/ISR |
| **Supabase** | Banco de dados PostgreSQL + Auth + Storage |
| **TypeScript** | Tipagem estática |
| **CSS Modules** | Estilos escopados por componente |
| **Vercel** | Deploy e CDN global |

---

## 📋 Scripts disponíveis

```bash
npm run dev      # Servidor de desenvolvimento (http://localhost:3000)
npm run build    # Build de produção
npm run start    # Servidor de produção local
npm run lint     # Verificação de código
```

---

## 🔄 Ciclo de vida de uma atualização

```
git push origin main
       ↓
  Vercel detecta push
       ↓
  Build automático (~1-2 min)
       ↓
  Deploy em produção
       ↓
  Site atualizado globalmente ✅
```
