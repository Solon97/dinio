# Feature Spec: Bidirectional History in Session Context

**ID:** FEAT-BDH  
**Status:** Implemented  
**Scope:** Medium  
**Component:** `apps/whatsapp-handler/src/contexts/session/`

---

## Problem

O histórico da sessão armazena **somente mensagens do usuário** — as respostas do bot nunca são persistidas. Isso cria um contexto incompleto enviado à LLM para detecção de intents.

### Diagnóstico técnico

| Ponto | Estado atual | Impacto |
|---|---|---|
| `HistoryMessage` | sem campo `role` | impossível distinguir quem falou |
| `appendToHistory(session, text)` | sem parâmetro de papel | só aceita um tipo de mensagem |
| `message-router.ts` | só chama `appendToHistory(session, message.text)` | respostas do bot descartadas |
| `formatContextForPrompt` | mapeia `.text` sem prefixo | LLM não sabe se a linha é do user ou do bot |

### Consequências para a LLM

- **Follow-ups ambíguos falham:** se o usuário diz "explica melhor", o modelo não sabe o que foi explicado antes.
- **Contexto de fluxo multi-turno incompleto:** mesmo com `state`/`operation`, sem as respostas anteriores do bot a LLM não consegue inferir o que foi pedido ao usuário.
- **Intenções dependentes de resposta anterior não são resolvidas:** ex. "qual foi a última que você registrou?" — a LLM não tem como saber.
- **Perda de coerência após 24 h de conversas longas:** o histórico de 15 posições contém apenas metade do diálogo real.

> **Nota:** o arquivo `AGENTS.md` já documenta o comportamento correto (`appendToHistory(session, 'user', text)` e `appendToHistory(session, 'assistant', response)`), mas a implementação nunca chegou a contemplar isso. Esta spec corrige o gap.

---

## Goal

Tornar o histórico **bidirecional** — cada entrada registra explicitamente quem falou e o que disse — e garantir que `formatContextForPrompt` projete esse histórico com rótulos de papel para que a LLM receba um diálogo completo e legível.

---

## Requirements

### REQ-BDH-01 — Campo `role` em `HistoryMessage`

- `HistoryMessage` deve incluir o campo `role: 'user' | 'assistant'`.
- O campo é **obrigatório** em novas entradas.
- Sessões existentes sem `role` (legadas) devem ter `role` inferido como `'user'` em runtime para retrocompatibilidade, sem migração de dados.

### REQ-BDH-02 — `appendToHistory` com papel obrigatório

- A assinatura muda para `appendToHistory(session, role: 'user' | 'assistant', text: string)`.
- O comportamento do sliding window (`MAX_HISTORY_SIZE`) **não muda** — a janela conta entradas individuais (não turnos).

### REQ-BDH-03 — Captura das respostas do bot no `message-router`

- A função `reply` em `routeMessage` deve ser envolvida para acumular todos os textos enviados durante um turno.
- Após `dispatchIntent`, o roteador deve persistir no histórico:
  1. A mensagem do usuário com `role: 'user'`.
  2. Cada resposta acumulada com `role: 'assistant'` (pode haver mais de uma por turno — ex. botões seguidos de texto).
- A ordem de inserção deve ser: mensagem do usuário → respostas do bot (reflete a cronologia real).
- Respostas de controle (irrelevância, erro de conta) **não** são armazenadas no histórico porque a sessão retorna antecipadamente antes da persistência.

### REQ-BDH-04 — Truncagem de respostas longas do bot

- Respostas do bot com mais de **400 caracteres** são truncadas para os primeiros 400 caracteres antes de serem armazenadas no histórico.
- O texto exibido ao usuário no WhatsApp **não é afetado** — apenas a cópia armazenada no Redis é truncada.
- Isso evita que respostas longas (ex.: `check_agenda` com lista de vencimentos) consumam desproporcionalmente a janela de contexto.

### REQ-BDH-05 — `MAX_HISTORY_SIZE` ajustado

- `MAX_HISTORY_SIZE` sobe de **15** para **20**.
- Com mensagens bidirecionais, 20 entradas representam ~10 turnos completos — cobertura suficiente para fluxos multi-step e follow-ups recentes sem exceder o orçamento de tokens.

### REQ-BDH-06 — `formatContextForPrompt` com rótulos de papel

- Cada linha do histórico deve ser prefixada com o papel em português:
  - `user: <texto>`
  - `dinio: <texto>`
- O cabeçalho da seção continua `[Histórico da conversa]`.
- A legibilidade e o tamanho do prompt são os critérios de qualidade: não adicionar timestamps nem metadados extras.

---

## Out of Scope

- Migração de sessões existentes no Redis — `role` ausente é tratado como `'user'` em runtime.
- Compressão ou sumarização automática do histórico — solução futura se necessário.
- Armazenamento de mensagens de mídia (áudio, imagem) — fora do escopo atual do bot.
- Mudanças no `IntentDetectionContext` — a interface permanece igual; a melhoria é na qualidade dos dados injetados.

---

## Affected Files

| Arquivo | Mudança |
|---|---|
| `src/contexts/session/types.ts` | Adicionar `role` em `HistoryMessage`; atualizar `MAX_HISTORY_SIZE` |
| `src/contexts/session/chatSessionStore.ts` | Atualizar `appendToHistory` — nova assinatura com `role`; adicionar `normalizeHistoryRole` para retrocompatibilidade |
| `src/contexts/session/contextBuilder.ts` | Atualizar `formatContextForPrompt` — prefixar linhas com `user:` / `dinio:` |
| `src/contexts/messaging/message-router.ts` | Envolver `reply` para capturar respostas; persistir user + assistant no histórico |

---

## Verification Criteria

- [x] A LLM recebe no prompt linhas prefixadas com `user:` e `dinio:`.
- [x] Após um turno completo, o histórico contém pelo menos uma entrada `user` e uma `assistant`.
- [x] Mensagens do bot com >400 chars são truncadas na cópia armazenada; o texto enviado ao WhatsApp permanece intacto.
- [x] Sessões antigas (sem `role`) não causam erro — `role` é normalizado para `'user'` em runtime.
- [x] `MAX_HISTORY_SIZE = 20` é respeitado; entradas mais antigas são descartadas primeiro.
- [x] Testes unitários de `appendToHistory`, `formatContextForPrompt` e do wrapper de `reply` cobrem os novos caminhos.
