# 🪺 Brotinho — Guia de Deploy Completo

## Estrutura do projeto criada:

```
brotinho/
├── package.json
├── next.config.js
├── .env.local          ← suas chaves secretas
├── .env.example        ← template das chaves
├── middleware.ts        ← proteção de rotas
│
├── app/
│   ├── layout.tsx
│   ├── page.tsx         ← onboarding / splash
│   ├── globals.css
│   │
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   │
│   ├── (app)/
│   │   ├── layout.tsx   ← layout com nav
│   │   ├── home/page.tsx
│   │   ├── baby/page.tsx
│   │   ├── saude/page.tsx
│   │   ├── exames/page.tsx
│   │   ├── enxoval/page.tsx
│   │   ├── diario/page.tsx
│   │   └── notifs/page.tsx
│   │
│   └── api/
│       ├── ai/route.ts      ← IA Brotinho (seguro!)
│       └── auth/route.ts    ← login/registro
│
├── components/
│   ├── Logo.tsx
│   ├── BottomNav.tsx
│   ├── Card.tsx
│   └── Input.tsx
│
└── lib/
    ├── supabase.ts      ← cliente do banco
    ├── types.ts         ← tipos TypeScript
    └── utils.ts         ← funções utilitárias
```

## Passos para subir:

1. Criar conta em supabase.com
2. Criar conta em vercel.com
3. Seguir o guia abaixo
