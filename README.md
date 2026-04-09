# Matilha OS

**Plataforma operacional B2B para pet shops e clínicas veterinárias.**

Matilha OS é um sistema de gestão completo que centraliza as operações de um negócio pet: creche, hotel, escola, banho & tosa, financeiro, CRM, agenda e planos de assinatura. Projetado para substituir planilhas e WhatsApp por uma plataforma operacional profissional.

---

## Stack Técnica

| Camada | Tecnologia |
|--------|-----------|
| Framework | [Next.js 14](https://nextjs.org/) (App Router) |
| Linguagem | TypeScript 5 (strict mode) |
| Estilização | Tailwind CSS + Radix UI primitives |
| Gráficos | Recharts |
| Animações | Framer Motion |
| Ícones | Lucide React |
| Armazenamento | LocalStorage (dev) → REST/Supabase-ready |
| Billing externo | [Asaas](https://asaas.com/) (API brasileira) |
| Exportações | XLSX, jsPDF, CSV |

---

## Arquitetura

```
matilha-os/
├── app/                          # Next.js App Router
│   ├── (app)/                    # Grupo de rotas protegidas
│   │   ├── dashboard/            # Centro de operações
│   │   ├── agenda/               # Agendamentos
│   │   ├── checkin/              # Recepção (check-in / check-out)
│   │   ├── crm/                  # Gestão de clientes (tutores)
│   │   ├── financeiro/           # Fluxo de caixa e cobranças
│   │   ├── planos/               # Assinaturas e planos
│   │   ├── hotel/                # Reservas do hotel
│   │   ├── creche/               # Gestão de grupos da creche
│   │   ├── escola/               # Sessões de treinamento
│   │   ├── banho-tosa/           # Serviços de grooming
│   │   ├── equipe/               # Colaboradores
│   │   ├── loja/                 # Estoque e vendas
│   │   ├── comunicacao/          # Mensagens e notificações
│   │   ├── relatorios/           # Business Intelligence
│   │   └── configuracoes/        # Configurações do sistema
│   ├── api/                      # Route Handlers (Next.js)
│   │   ├── partners/             # CRUD de parceiros/franqueados
│   │   └── webhooks/asaas/       # Processamento de webhooks de cobrança
│   └── login/                    # Autenticação
│
├── components/
│   ├── charts/                   # Componentes de visualização de dados
│   ├── layout/                   # Sidebar, Topbar, CommandPalette
│   ├── modals/                   # Modais de criação/edição por entidade
│   └── ui/                       # Componentes base (Button, Modal, Input...)
│
├── lib/
│   ├── billing/                  # Integração Asaas (client, mappers, provider)
│   ├── db/                       # Primitivas de armazenamento (read/write/emit)
│   ├── integration-log/          # Log auditável de integrações externas
│   ├── partners/                 # Domínio de parceiros (repository + service)
│   ├── repositories/             # Acesso a dados por entidade
│   ├── services/                 # Lógica de aplicação (regras de negócio)
│   ├── db.ts                     # Re-exports dos repositórios (compat)
│   ├── hooks.ts                  # React hooks utilitários
│   ├── logger.ts                 # Logger estruturado
│   ├── mock-data.ts              # Snapshots computados (para exportações)
│   ├── seed.ts                   # Seed de dados de demonstração
│   ├── store.ts                  # Estado global (modais, toasts)
│   └── utils.ts                  # Funções utilitárias
│
└── types/
    ├── domain/                   # Tipos organizados por domínio
    │   ├── dog.ts                # Dog, Vaccine, DogSize, EnergyLevel...
    │   ├── tutor.ts              # Tutor, ContactPreference
    │   ├── appointment.ts        # Appointment, AppointmentStatus, ServiceType
    │   ├── plan.ts               # Plan, PlanStatus, PlanCategory
    │   ├── transaction.ts        # Transaction, PaymentStatus, PaymentMethod
    │   ├── hotel.ts              # HotelReservation, ReservationStatus, Occurrence
    │   ├── daycare.ts            # DaycareGroup, DaycareSession
    │   ├── training.ts           # TrainingSession, BehaviorProfile
    │   ├── team.ts               # TeamMember, UserRole
    │   ├── product.ts            # Product, ProductCategory
    │   ├── alert.ts              # Alert, AlertSeverity
    │   └── metrics.ts            # DashboardMetrics
    └── index.ts                  # Re-exports de todos os domínios
```

---

## Como Rodar

### Pré-requisitos

- Node.js 18+
- npm ou yarn

### Instalação

```bash
git clone https://github.com/guilherme4741-byte/Matilha-OS.git
cd Matilha-OS
npm install
```

### Variáveis de Ambiente

```bash
cp .env.local.example .env.local
```

Preencha `.env.local` com suas credenciais. Para rodar sem billing, os campos `ASAAS_*` podem ser deixados em branco — o módulo de billing não será ativado em desenvolvimento.

### Desenvolvimento

```bash
npm run dev        # http://localhost:3000
```

### Build de Produção

```bash
npm run build
npm start
```

---

## Módulos Principais

### Camada de Dados (`lib/db.ts` → `lib/repositories/`)

O sistema usa LocalStorage com cache em memória (`Map`) e write-through. A arquitetura foi desenhada para swap sem fricção para qualquer backend REST ou Supabase — basta substituir as funções `read()` e `write()` em `lib/db/storage.ts`.

- **Cache write-through**: leituras são O(1) após a primeira hidratação
- **Eventos com debounce**: coalesce writes rápidos em um único re-render
- **Key-scoped subscriptions**: `useDB(fetcher, KEYS.appointments)` só re-renderiza quando aquela coleção específica muda

### Billing (`lib/billing/`)

Integração com Asaas usando provider pattern — trocar para Stripe requer apenas implementar `BillingProvider` e apontar o singleton.

- Client HTTP com retry exponencial e timeout (15s)
- Criação idempotente de clientes (CPF/CNPJ como chave natural)
- Webhook validado por token, eventos normalizados
- Log auditável append-only (JSONL)

### Estado Global (`lib/store.ts`)

Observer pattern simples sem dependências externas. Gerencia modais e toasts. Componentes consomem via `useStore()`.

---

## Padrões de Código

- **Repositórios**: acesso a dados somente — sem lógica de negócio
- **Services**: orquestram repositórios, aplicam regras de negócio
- **Componentes**: somente UI — sem lógica de dados embutida
- **Hooks**: ponte entre dados reativos e componentes
- **Tipos**: organizados por domínio em `types/domain/`

---

## Segurança

- Credenciais de API exclusivamente em variáveis de ambiente server-side
- Webhooks validados por token antes de processar qualquer payload
- LocalStorage não armazena dados sensíveis (apenas operacionais)
- `APP_SECRET` com mínimo de 32 caracteres obrigatório

---

## Roadmap

- [ ] Autenticação com NextAuth.js
- [ ] Migração de LocalStorage para Supabase/PostgreSQL
- [ ] Notificações WhatsApp via Twilio/Z-API
- [ ] Multi-tenancy para franquias
- [ ] App mobile (React Native)

---

## Contribuição

1. Fork o repositório
2. Crie uma branch: `git checkout -b feat/nome-da-feature`
3. Commit com mensagem clara: `git commit -m "feat: descrição"`
4. Abra um Pull Request

---

*Matilha OS — Operações profissionais para quem cuida de pets.*
