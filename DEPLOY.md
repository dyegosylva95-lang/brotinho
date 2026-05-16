# 🚀 Guia de Deploy do Brotinho
## Do zero ao app publicado em ~1 hora

---

## PASSO 1 — Supabase (banco de dados + login)
**Tempo: ~15 minutos | Custo: Grátis**

### 1.1 Criar conta e projeto
1. Acesse **supabase.com** e clique em "Start your project"
2. Entre com o GitHub (recomendado) ou crie conta com email
3. Clique em **"New Project"**
4. Preencha:
   - **Name:** brotinho
   - **Database Password:** crie uma senha forte e guarde!
   - **Region:** South America (São Paulo)
5. Aguarde ~2 minutos para o projeto ser criado

### 1.2 Criar as tabelas
1. No menu lateral, clique em **"SQL Editor"**
2. Clique em **"New Query"**
3. Copie TODO o conteúdo do arquivo `supabase-schema.sql`
4. Cole no editor e clique em **"Run"** (▶)
5. Deve aparecer "Success" em verde

### 1.3 Pegar as chaves
1. No menu lateral, clique em **"Settings" → "API"**
2. Copie:
   - **Project URL** → vai no `.env.local` como `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → vai como `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## PASSO 2 — Anthropic (chave da IA)
**Tempo: ~5 minutos | Custo: Pague pelo uso**

1. Acesse **console.anthropic.com**
2. Crie uma conta (ou entre)
3. Vá em **"API Keys"** → **"Create Key"**
4. Copie a chave → vai como `ANTHROPIC_API_KEY`

> 💡 Adicione crédito inicial de $5 (~R$27) — dura meses com uso normal

---

## PASSO 3 — Configurar o projeto localmente
**Tempo: ~10 minutos**

### 3.1 Requisitos
- Node.js 18+ instalado (nodejs.org)
- Git instalado (git-scm.com)

### 3.2 Instalar o projeto
Abra o Terminal e execute:

```bash
# Navegar para a pasta do projeto
cd brotinho

# Instalar dependências
npm install

# Criar arquivo de variáveis locais
cp .env.example .env.local
```

### 3.3 Preencher as variáveis
Abra o arquivo `.env.local` e preencha com suas chaves:

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxxx...
ANTHROPIC_API_KEY=sk-ant-xxxxxx...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3.4 Testar localmente
```bash
npm run dev
```
Abra **http://localhost:3000** no navegador.
Se aparecer o Brotinho, está funcionando! ✅

---

## PASSO 4 — Vercel (publicar na internet)
**Tempo: ~10 minutos | Custo: Grátis**

### 4.1 Criar conta na Vercel
1. Acesse **vercel.com**
2. Clique em **"Sign Up"** → entre com GitHub

### 4.2 Subir o código para o GitHub
```bash
# Inicializar repositório Git
git init
git add .
git commit -m "🌱 Brotinho — primeiro deploy"

# Criar repositório no GitHub (github.com/new)
# Depois execute:
git remote add origin https://github.com/SEU_USUARIO/brotinho.git
git push -u origin main
```

### 4.3 Fazer o deploy
1. Na Vercel, clique em **"Add New Project"**
2. Selecione o repositório **brotinho** do GitHub
3. Clique em **"Environment Variables"** e adicione:
   ```
   NEXT_PUBLIC_SUPABASE_URL      = sua URL do Supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY = sua chave anon
   ANTHROPIC_API_KEY             = sua chave da Anthropic
   NEXT_PUBLIC_APP_URL           = https://brotinho.vercel.app
   ```
4. Clique em **"Deploy"**
5. Aguarde ~2 minutos

**Seu app estará em: `https://brotinho.vercel.app` 🎉**

---

## PASSO 5 — Domínio personalizado (opcional)
**Tempo: ~10 minutos | Custo: ~R$60/ano**

1. Compre um domínio em **registro.br** ou **namecheap.com**
   - Sugestões: `brotinho.app`, `usebrotinho.com.br`, `appbrotinho.com`
2. Na Vercel → seu projeto → **"Settings" → "Domains"**
3. Adicione seu domínio e siga as instruções de DNS
4. Em ~24h estará ativo com HTTPS automático ✅

---

## PASSO 6 — Atualizações futuras

Sempre que quiser atualizar o app:

```bash
# Fazer mudanças nos arquivos
# Depois:
git add .
git commit -m "✨ nova funcionalidade"
git push
```

A Vercel detecta automaticamente e faz o deploy em ~2 minutos! 🚀

---

## Resumo de custos

| Item              | Custo        |
|-------------------|-------------|
| Supabase          | Grátis (até 50k usuários) |
| Vercel            | Grátis (até 100GB/mês) |
| Anthropic IA      | ~$0.01 por conversa |
| Domínio           | ~R$60/ano (opcional) |
| **Total inicial** | **R$0** |

---

## Suporte

Se travar em algum passo, me manda uma mensagem descrevendo o erro
e eu te ajudo a resolver! 💪
