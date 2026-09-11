# 🚀 Envie uma mensagem para o Andry

Site interativo para enviar mensagens anônimas (shippar, segredo, confissão,
pergunta, fofoca, opinião, crush, conselho, desafio, especial, alerta ou
"algo além") para o Andry, com painel administrativo protegido por senha.

## O que já vem pronto

- Fluxo completo: nome → categoria → mensagem → animação de envio → confirmação
- Limite de 1 mensagem a cada 60s **controlado no servidor** (por IP), não só no navegador
- Painel `/admin` protegido por senha, com filtros, busca, resposta e arquivamento
- Atualização quase em tempo real no painel (busca novas mensagens a cada 4s)
- Fundo animado com partículas que reagem ao mouse/toque
- Tag animada "👨‍💻 Programador Andry" com glow e brilho
- 100% responsivo, pensado primeiro para celular

## Senha do painel

A senha padrão já está configurada no código: **`pybHjWU/T3nv&jE`**

Recomendo trocá-la depois de publicar, definindo a variável de ambiente
`ADMIN_PASSWORD` na Vercel (veja o passo 4 abaixo) — assim a senha não fica
só no código-fonte.

---

## Passo a passo: subir no GitHub e publicar na Vercel

### 1. Crie o repositório no GitHub

1. Entre em [github.com/new](https://github.com/new)
2. Dê um nome (ex: `mensagem-para-andry`) e crie o repositório (pode ser privado)
3. No seu computador, dentro da pasta deste projeto, rode:

```bash
git init
git add .
git commit -m "Site: envie uma mensagem para o Andry"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/mensagem-para-andry.git
git push -u origin main
```

### 2. Importe o projeto na Vercel

1. Entre em [vercel.com/new](https://vercel.com/new)
2. Clique em **Import** no repositório que você acabou de criar
3. O framework é detectado automaticamente como **Next.js** — não precisa mudar nada
4. Clique em **Deploy**

Nesse primeiro deploy o site já funciona, mas as mensagens ficam guardadas
apenas na memória do servidor (elas somem quando a função "dorme" ou reinicia).
Para guardar as mensagens de verdade, siga o passo 3.

### 3. Ative um banco de dados (Vercel KV) — recomendado

1. No painel do seu projeto na Vercel, vá em **Storage**
2. Clique em **Create Database** → escolha **KV** (Redis, tem plano gratuito)
3. Depois de criar, clique em **Connect Project** e selecione este projeto
4. A Vercel adiciona sozinha as variáveis `KV_REST_API_URL` e `KV_REST_API_TOKEN`
5. Vá em **Deployments** → nos três pontinhos do último deploy → **Redeploy**

Pronto — agora as mensagens ficam salvas de verdade, e o limite de 60s
funciona corretamente mesmo se a pessoa atualizar a página.

### 4. (Opcional, mas recomendado) Troque a senha do painel

1. No projeto na Vercel, vá em **Settings → Environment Variables**
2. Adicione:
   - `ADMIN_PASSWORD` → a senha que você quiser usar
   - `ADMIN_SESSION_SECRET` → qualquer texto aleatório longo (só para assinar o login)
3. Faça um **Redeploy**

### 5. Acesse

- Site principal: `https://seu-projeto.vercel.app`
- Painel do Andry: `https://seu-projeto.vercel.app/admin`

---

## Rodando localmente (opcional, para testar antes de publicar)

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`. Sem configurar o Vercel KV, o site funciona
localmente guardando as mensagens em memória (elas somem ao reiniciar o
servidor) — ótimo para testar o fluxo e o painel.

## Estrutura do projeto

```
app/
  page.tsx                     → página principal (fluxo de mensagens)
  admin/page.tsx                → tela de login do painel
  admin/dashboard/page.tsx      → painel do Andry
  api/messages/route.ts         → criar mensagem (público) / listar (admin)
  api/messages/[id]/route.ts    → responder / arquivar mensagem (admin)
  api/admin/login/route.ts      → login do painel
  api/admin/logout/route.ts     → logout do painel
components/
  AmbientBackground.tsx          → fundo animado com partículas
  AndryTag.tsx                   → selo "Programador Andry"
  MessageFlow.tsx                → toda a experiência de envio
lib/
  categories.ts                  → as 12 categorias de mensagem
  store.ts                       → acesso ao banco (Vercel KV) + rate limit
  auth.ts                        → login e cookie de sessão do admin
  sanitize.ts                    → validação e limpeza das mensagens
```

## Segurança

- O painel (`/admin/dashboard`) e as rotas de leitura/resposta exigem um
  cookie de sessão assinado, criado só depois do login com a senha correta
- O limite de 1 mensagem por minuto é checado no servidor por IP, não dá
  para burlar só atualizando a página
- Mensagens passam por limpeza (remoção de HTML e caracteres de controle)
  e têm tamanho máximo antes de serem salvas
