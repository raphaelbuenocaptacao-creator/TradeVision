# TradeVision

PWA de diário e análise de performance para operações de mini contratos.

## MVP
- Login restrito ao e-mail autorizado
- Lançamento rápido de operações
- Resultado diário e acumulado
- Assertividade, Profit Factor, Payoff, Expectativa e Drawdown
- Stop diário e alerta de limite
- Regra automática de contratos (+1 por faixa de lucro configurável)
- Performance por dia, horário e setup
- Heatmap dia × horário
- Curva de resultado
- PWA responsiva e suporte offline

## Segurança / sincronização
A versão inicial usa armazenamento local do navegador para validar a experiência sem custo. Para sincronização real entre celular e computador, a próxima etapa é conectar Supabase Auth + banco com RLS. Não colocar chaves privadas no repositório público.

## Acesso
E-mail autorizado: `Biahmah.santos@gmail.com`

> O TradeVision é uma ferramenta de registro e análise. Não executa ordens e não constitui recomendação de investimento.