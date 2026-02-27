# Tarefas sugeridas após revisão da base

## 1) Correção de erro de digitação
**Problema encontrado:** em `README.md`, a seção de licença usa `Propriétário`, grafia incorreta em português.

**Tarefa sugerida:**
- Ajustar para `Proprietário` na seção **Licença**.
- Fazer uma passada rápida por termos similares no README para garantir consistência ortográfica.

**Critério de aceite:**
- O termo aparece corrigido no README e sem regressões de formatação markdown.

---

## 2) Correção de bug (controle de acesso)
**Problema encontrado:** a rota de planos aplica apenas autenticação (`router.use(authMiddleware)`), mas o próprio arquivo indica que deveria ser restrita a ADMIN.

**Tarefa sugerida:**
- Implementar checagem de autorização por perfil (ex.: `ADMIN`) nas rotas de `server/routes/plans.js`.
- Retornar `403 Forbidden` para usuários autenticados sem permissão.
- Garantir que apenas usuários autorizados possam criar/editar/desativar planos.

**Critério de aceite:**
- Usuário comum autenticado recebe `403` em `POST/PUT/DELETE /api/plans`.
- Usuário ADMIN mantém acesso funcional.

---

## 3) Ajuste de comentário/documentação discrepante
**Problema encontrado:** em `server/routes/plans.js`, o comentário `Only ADMIN should access this (TODO: Add role check)` descreve uma regra que ainda não é aplicada no código, criando discrepância entre documentação inline e comportamento real.

**Tarefa sugerida:**
- Após implementar a autorização, atualizar o comentário para refletir o estado real (removendo o TODO pendente).
- Opcionalmente, documentar no README quais endpoints de planos exigem perfil ADMIN.

**Critério de aceite:**
- Comentário inline sem TODO obsoleto e alinhado ao comportamento implementado.
- (Opcional) documentação externa dos requisitos de autorização atualizada.

---

## 4) Melhoria de teste
**Problema encontrado:** `server/package.json` define `"test": "echo \"Error: no test specified\" && exit 1"`, impedindo uma esteira mínima de validação automatizada.

**Tarefa sugerida:**
- Criar testes de integração para as rotas de planos cobrindo:
  - acesso negado para não ADMIN,
  - acesso permitido para ADMIN,
  - resposta adequada para erros internos.
- Atualizar `npm test` do backend para executar esses testes (ex.: Jest + Supertest).

**Critério de aceite:**
- `cd server && npm test` executa com sucesso localmente.
- Casos de permissão e fluxo feliz das rotas de planos ficam cobertos.
