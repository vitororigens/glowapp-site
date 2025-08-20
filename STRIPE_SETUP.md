# Configuração do Stripe - GlowApp

Este documento explica como configurar o sistema de pagamentos do Stripe no site do GlowApp.

## Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env

```

## Produtos no Stripe

Certifique-se de que os seguintes produtos estão configurados no seu painel do Stripe:

### 1. Glow Start (Produto Gratuito)
- **ID do Produto**: `glow-start`
- **Preço**: R$ 0,00
- **Recorrência**: Não aplicável

### 2. Glow Pro
- **ID do Produto**: `glow-pro`
- **Preço**: R$ 29,90/mês
- **Recorrência**: Mensal

## Funcionalidades Implementadas

### 1. Página de Planos (`/planos`)
- Exibe os planos disponíveis
- Design responsivo similar ao app mobile
- Integração com Stripe Elements para pagamentos
- Botão "Restaurar Compras" para iOS/Android

### 2. Checkout Modal
- Modal de pagamento com Stripe Elements
- Validação de cartão de crédito
- Processamento seguro de pagamentos
- Feedback visual durante o processo

### 3. Gerenciamento de Assinaturas (`/dashboard/assinatura`)
- Visualização do plano atual
- Informações sobre limites e próximas cobranças
- Cancelamento de assinatura
- Alteração de plano

### 4. Serviços do Stripe
- `fetchStripeProducts()`: Busca produtos do Stripe
- `createPaymentIntent()`: Cria Payment Intent para pagamento
- `createStripeCustomer()`: Cria cliente no Stripe
- `findStripeCustomerByEmail()`: Busca cliente por email
- `getCustomerSubscriptions()`: Busca assinaturas do cliente
- `cancelSubscription()`: Cancela assinatura
- `cancelAllCustomerSubscriptions()`: Cancela todas as assinaturas

## Estrutura de Arquivos

```
src/
├── services/
│   └── stripeService.ts          # Serviços do Stripe
├── components/
│   └── CheckoutModal.tsx         # Modal de checkout
├── app/
│   ├── (public)/
│   │   └── planos/
│   │       └── page.tsx          # Página de planos
│   └── (private)/
│       └── dashboard/
│           └── assinatura/
│               └── page.tsx      # Gerenciamento de assinatura
```

## Como Usar

### 1. Acessar Planos
- Navegue para `/planos`
- Escolha entre Glow Start (gratuito) ou Glow Pro (pago)

### 2. Fazer Pagamento
- Clique em "Escolher este plano" no plano desejado
- Preencha as informações do cartão no modal
- Confirme o pagamento

### 3. Gerenciar Assinatura
- Acesse `/dashboard/assinatura` (após login)
- Visualize detalhes do plano atual
- Cancele ou altere o plano conforme necessário

## Segurança

- Chaves secretas do Stripe são usadas apenas no servidor
- Chaves públicas são expostas apenas no cliente
- Todos os pagamentos são processados pelo Stripe
- Dados de cartão não são armazenados localmente

## Próximos Passos

1. Configurar webhooks do Stripe para sincronização
2. Implementar integração com Firebase para armazenar dados de assinatura
3. Adicionar notificações de pagamento
4. Implementar sistema de trial gratuito
5. Adicionar relatórios financeiros

## Suporte

Para dúvidas sobre a implementação, consulte:
- [Documentação do Stripe](https://stripe.com/docs)
- [Stripe Elements](https://stripe.com/docs/stripe-js)
- [Stripe API Reference](https://stripe.com/docs/api)

