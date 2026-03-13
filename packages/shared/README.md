# Dinio Shared Package - Publishing & Deployment Guide

## Overview

`dinio-shared` é um pacote compartilhado entre `dinio-web-app` e `dinio-whatsapp-handler`. Ele é publicado em **GitHub Packages** para uso em produção (Vercel + Render).

## Local Development

**Durante desenvolvimento local, use `file://` (sem publicação necessária):**

```json
// dinio-web-app/package.json
"dependencies": {
  "dinio-shared": "file:../dinio-shared"
}

// dinio-whatsapp-handler/package.json
"dependencies": {
  "dinio-shared": "file:../dinio-shared"
}
```

Qualquer mudança em `dinio-shared/src/` é imediatamente refletida.

### Workflow de Desenvolvimento Local

```bash
# Start watch mode em dinio-shared para auto-compilar
cd dinio-shared
npm run build  # Ou tsc --watch

# Em outro terminal, desenvolva normalmente
cd dinio-web-app
npm test
npm run dev

# Ou
cd dinio-whatsapp-handler
npm test
npm run dev
```

---

## Production Release

### 1. Bump Version & Create Tag

Quando suas mudanças estão prontas para produção:

```bash
cd /home/solon97/Documents/projects/dinio/dinio-shared

# Escolha uma das opções:
npm version patch   # 0.1.0 → 0.1.1 (bug fixes)
npm version minor   # 0.1.0 → 0.2.0 (novas features)
npm version major   # 0.1.0 → 1.0.0 (breaking changes)

# Isso:
# - Atualiza dinio-shared/package.json
# - Cria commit automático
# - Cria tag localmente (v0.2.0)

# IMPORTANTE: Push da tag para disparar GitHub Actions
git push origin master  # ou main, dependendo da branch
git push --tags

# Ou combine em um comando:
git push origin master --tags
```

### 2. GitHub Actions Auto-Publishes

Quando um push com tag é feito:

- GitHub Actions workflow (`.github/workflows/publish-dinio-shared.yml`) detecta a tag
- Executa `npm run build` em `dinio-shared/`
- Publica em GitHub Packages automaticamente
- Disponível em ~1 minuto

```bash
# Você verá no GitHub:
# https://github.com/Solon97/dinio/pkgs/npm/dinio-shared
```

### 3. Update Packages (Vercel & Render)

Atualize referências nos projetos:

```bash
# Em dinio-web-app
npm install @solon97/dinio-shared@^0.2.0

# Em dinio-whatsapp-handler
npm install @solon97/dinio-shared@^0.2.0

# Commit & push
git add package.json package-lock.json
git commit -m "chore: upgrade dinio-shared to 0.2.0"
git push
```

---

## Environment Setup for Vercel & Render

### Vercel Setup

1. Vá para **Project Settings** → **Environment Variables**
2. Adicione:
   ```
   GITHUB_TOKEN: <seu_token_pessoal>
   ```

**Como obter token:**
- GitHub → Settings → Developer Settings → Personal Access Tokens → Tokens (classic)
- Gere novo token com escopo `read:packages`

3. Redeploy projeto

### Render Setup

1. Vá para seu serviço WhatsApp Handler
2. **Settings** → **Environment** → **Add Environment Variable**
3. Adicione:
   ```
   GITHUB_TOKEN: <seu_token_pessoal>
   ```

4. Redeploy

---

## Checklist para Nova Release

```bash
# 1. Verificar mudanças compilam localmente
cd dinio-shared && npm run build
cd ../dinio-web-app && npm test
cd ../dinio-whatsapp-handler && npm test

# 2. Bumpar versão
cd dinio-shared
npm version minor

# 3. Push da tag para disparar GitHub Actions
git push origin master --tags
# ⏳ Aguarde ~1 minuto para GitHub Actions completar
# Verifique em: GitHub → Actions → "Publish dinio-shared to GitHub Packages"

# 4. Após publicação bem-sucedida, atualizar ambos os projetos
cd ../dinio-web-app
npm install @solon97/dinio-shared@^0.2.0
git add package.json package-lock.json
git commit -m "chore: upgrade dinio-shared to 0.2.0"
git push

cd ../dinio-whatsapp-handler
npm install @solon97/dinio-shared@^0.2.0
git add package.json package-lock.json
git commit -m "chore: upgrade dinio-shared to 0.2.0"
git push

# 5. Vercel e Render detectam mudança e deployam automaticamente
```

---

## Troubleshooting

### "GitHub Actions não dispara após npm version"

**Causa:** Tags locais não foram enviadas para GitHub

**Solução:**
```bash
git push origin master --tags
# ou simplesmente
git push --tags
```

---

### "Cannot find module '@solon97/dinio-shared'" em Vercel/Render

**Causa:** `GITHUB_TOKEN` não configurado

**Solução:**
1. Gere novo token em GitHub
2. Adicione em variáveis de ambiente (Vercel/Render)
3. Redeploy

---

### GitHub Actions falha ao publicar

**Verificar:**
1. Vá para GitHub → Actions → "Publish dinio-shared"
2. Clique no workflow que falhou
3. Veja logs para identificar erro

Erros comuns:
- `package.json` não tem `"name": "@solon97/dinio-shared"`
- `publishConfig.registry` está incorreto
- TypeScript build falhou (`npm run build`)

---

## Referências

- [GitHub Packages Documentation](https://docs.github.com/en/packages)
- [GitHub Actions Workflows](https://docs.github.com/en/actions/using-workflows)
