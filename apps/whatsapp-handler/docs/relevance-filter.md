# Relevance Filter - Dinio WhatsApp Handler

## Propósito

O filtro de relevância garante que apenas mensagens relacionadas ao contexto do Dinio (controle de despesas, consulta de saldo, etc.) sejam enviadas para processamento pelo LLM. Mensagens completamente irrelevantes são rejeitadas rapidamente com uma resposta educada.

## Ubicação

- **Implementação**: `src/contexts/messaging/relevance-filter.ts`
- **Integração**: `src/contexts/messaging/message-router.ts`
- **Testes**: `test/contexts/relevance-filter.test.ts`

## Como Funciona

### Fluxo de Filtragem

1. **Normalização**: Mensagem é convertida para minúsculas e trimada
2. **Rejeição Rápida**: Verifica se contém palavras-chave negativas (saudações, filler words, etc)
3. **Aceitação por Palavra-chave**: Verifica se contém palavras-chave positivas do Dinio
4. **Detecção de Números**: Se nenhuma palavra-chave matchear, verifica se há números (potencial valor de despesa)

### Palavras-Chave Positivas

Divididas em categorias:

- **Finanças Gerais**: gast*, despesa, renda, saldo, mês, orçamento, limite, etc
- **Ações de Transação**: paguei, comprei, transferência, débito, crédito, etc
- **Categorias de Despesa**: alimentação, transporte, saúde, lazer, moradia, educação, vestuário
- **Ações Dinio Comuns**: check daily allowance, check balance, register expense, simulate expense

### Palavras-Chave Negativas

- Saudações: "oi tudo bem", "como você está", "qual é seu nome"
- Agradecimentos: "obrigado", "thanks", "de nada"
- Fillers: "ok", "tá bom", "certo", "blz", "beleza"
- Casual/Piadas: "haha", "rsrs", "que piada"

## Vantagens

✅ **Economia de Recursos**: Reduz chamadas desnecessárias ao LLM  
✅ **UX Rápida**: Resposta imediata para mensagens irrelevantes  
✅ **Segurança**: Evita que o LLM seja usado para contextos fora do escopo  
✅ **Escalabilidade**: Filtro leve (regex + substring matching) não afeta performance  

## Limitações da Abordagem Baseada em Palavras-Chave

O filtro usa uma abordagem conservadora: **se há dúvida, deixa passar para o LLM**. Isso significa:

- Mensagens com números mas sem contexto financeiro claro são aceitas (ex: "xyz 999")
- O LLM ainda fará a classificação final e retornará `intent: "unknown"` se for irrelevante
- Esse design garante que nenhuma intenção financeira legítima seja bloqueada erroneamente

### Exemplo de Fluxo

```
Mensagem: "quanto posso gastar hoje?"
  ↓
Contém "posso gastar"? ✅ SIM
  ↓
Resultado: RELEVANTE → segue para parseIntent()

---

Mensagem: "qual é a capital da França?"
  ↓
Contém palavras negativas? ❌ NÃO
Contém palavras positivas? ❌ NÃO
Contém números? ❌ NÃO
  ↓
Resultado: IRRELEVANTE → responde mensagem padrão e retorna
```

## Resposta para Mensagens Irrelevantes

Quando uma mensagem não passa no filtro, o sistema responde com:

```
Oi! Sou o assistente financeiro do Dinio 💰

Eu sou especializado em ajudar você a controlar gastos, checar seu saldo diário e registrar despesas.

Tente me enviar algo como:
• "Gastei 50 no uber"
• "Quanto posso gastar hoje?"
• "Qual meu saldo?"
```

Essa resposta segue a brand voice do Dinio: direta, humana e acolhedora.

## Estender o Filtro

Para adicionar novas palavras-chave:

1. Abra `src/contexts/messaging/relevance-filter.ts`
2. Adicione à array `DINIO_KEYWORDS` ou `NON_DINIO_KEYWORDS` conforme apropriado
3. Certifique-se de usar prefixos de palavras parciais (ex: "gast" para "gastei", "gastos", "gastar")
4. Atualize os testes em `test/contexts/relevance-filter.test.ts`

## Considerações Futuras

- **LLM-based pre-filter**: Em produção com volume alto, considere um LLM leve (tipo de classifier) antes do parser completo
- **Metrics**: Monitorar quantas mensagens são bloqueadas e ajustar keywords conforme dados reais
- **User feedback**: Se muitas mensagens legítimas forem bloqueadas, expandir keywords
