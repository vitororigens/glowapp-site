# GlowApp Site - Sistema de Gerenciamento de Planos

Este é um projeto Next.js que implementa um sistema completo de gerenciamento de planos de assinatura integrado com Stripe, incluindo limitações automáticas baseadas no plano ativo do usuário.

## 🚀 Configuração Inicial

### Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env


# Firebase (já configurado)
```

### Produtos Stripe Necessários

Certifique-se de ter os seguintes produtos criados no Stripe:

- **Glow Start** (produto gratuito): `glow-start`
- **Glow Pro** (produto pago): `glow-pro`

## 📋 Funcionalidades Implementadas

### 1. Página de Planos (`/planos`)
- Exibe os planos disponíveis (Glow Start e Glow Pro)
- Integração com Stripe para checkout
- Badge dinâmico "PLANO ATUAL" baseado na assinatura real do usuário
- Botões de ação baseados no plano atual do usuário

### 2. Página de Gerenciamento de Assinatura (`/dashboard/assinatura`)
- Visualização do plano atual (pago ou gratuito)
- Informações sobre limites e próximas cobranças
- Opção de cancelamento de assinatura
- Exibição de planos gratuitos e pagos

### 3. Sistema de Limitações por Plano
- **Hook `usePlanLimitations`**: Gerencia automaticamente as limitações baseadas no plano ativo
- **Limitações de Clientes**: 
  - Glow Start: 10 clientes/mês
  - Glow Pro: 50 clientes/mês
- **Limitações de Imagens por Cliente**:
  - Glow Start: 4 imagens por cliente (2 antes + 2 depois)
  - Glow Pro: 8 imagens por cliente (4 antes + 4 depois)
- **Controle de Vencimento**: Mostra quando o plano vence e status de uso
- **Alertas Visuais**: Mostra quando o usuário atinge os limites
- **Botões Desabilitados**: Impede ações quando limites são atingidos
- **Links para Upgrade**: Direciona para página de planos quando necessário

### 4. Modal de Checkout
- Integração com Stripe Elements para pagamento
- Validação de cartão de crédito
- Processamento seguro de pagamentos

### 5. Navegação
- Link "Planos" adicionado ao header público
- Link "Minha Assinatura" movido para o dropdown do perfil no dashboard

## 🛠️ Como Usar

### Instalação

```bash
npm install
npm run dev
```

### Estrutura de Arquivos

```
src/
├── app/
│   ├── (public)/planos/page.tsx          # Página de planos
│   └── (private)/dashboard/
│       ├── assinatura/page.tsx           # Gerenciamento de assinatura
│       └── clientes/page.tsx             # Lista de clientes (com limitações)
├── components/
│   ├── CheckoutModal.tsx                 # Modal de pagamento
│   └── PlanLimitationAlert.tsx           # Componente de alerta de limitação
├── hooks/
│   └── usePlanLimitations.ts             # Hook para gerenciar limitações
└── services/
    └── stripeService.ts                  # Serviços do Stripe
```

### Implementando Limitações em Novas Páginas

Para adicionar limitações em uma nova página:

```typescript
import { usePlanLimitations } from '@/hooks/usePlanLimitations';

export default function MinhaPagina() {
  const { planLimits, canAddClient, canAddImage } = usePlanLimitations();
  
  // Verificar se pode adicionar cliente
  if (!canAddClient(currentClientCount)) {
    // Mostrar alerta ou desabilitar botão
  }
  
  // Verificar se pode adicionar imagem
  if (!canAddImage(currentImageCount)) {
    // Mostrar alerta ou desabilitar botão
  }
}
```

## 🔧 Tecnologias Utilizadas

- **Next.js 14** - Framework React
- **Stripe** - Processamento de pagamentos
- **Firebase** - Autenticação e banco de dados
- **Tailwind CSS** - Estilização
- **Shadcn UI** - Componentes de interface
- **TypeScript** - Tipagem estática

## 📝 Notas Importantes

- O sistema automaticamente detecta o plano ativo do usuário
- Planos gratuitos não criam assinaturas no Stripe, mas são reconhecidos pelo sistema
- As limitações são aplicadas em tempo real
- Usuários são direcionados para upgrade quando atingem os limites
