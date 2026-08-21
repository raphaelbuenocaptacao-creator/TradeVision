# TradeVision

PWA de diário e análise de performance para operações de mini contratos, conectado à Aureon Base.

## Produção
- Backend: `https://aureonbase.vercel.app`
- Projeto SaaS: `tradevision`
- Banco: PostgreSQL/Neon via Aureon Base
- Trial padrão: 7 dias
- Plano de referência: TradeVision Pro — R$ 39,90/mês

## Recursos
- Cadastro e login com sessão segura
- Sincronização entre celular e computador
- Lançamento e exclusão de operações
- Resultado diário e acumulado
- Assertividade, Profit Factor, Payoff, Expectativa e Drawdown
- Stop diário e alerta de limite
- Regra automática de contratos (+1 por faixa de lucro configurável)
- Performance por dia, horário e setup
- Heatmap dia × horário
- Curva de resultado
- PWA instalável e cache do app para abertura offline
- Trial/assinatura controlados pela Aureon Base

## Acesso inicial
E-mail autorizado para o primeiro teste: `Biahmah.santos@gmail.com`.

A autorização de e-mails é controlada no backend pela variável `ALLOWED_EMAILS`. Para comercialização pública, essa allowlist deve ser removida ou ampliada conforme a política de cadastro.

## Segurança
O frontend não contém senha de banco, JWT secret ou credenciais privadas. Operações e configurações são isoladas por usuário/projeto no backend. Tokens de sessão ficam no navegador e a Aureon Base faz renovação do access token.

> O TradeVision é uma ferramenta de registro e análise. Não executa ordens, não se conecta à corretora para enviar ordens e não constitui recomendação de investimento.
