# ☕ Cuplock — app de mensagens para PC

App de verdade: contas com **e-mail e senha**, servidores, canais, amigos, mensagens diretas, convites, explorar comunidades, **“Jogando agora” (rich presence)** e um visual **todo personalizável** — tudo **em tempo real** entre PCs diferentes.

> **Atualizando de uma versão anterior?** Rode o `supabase/schema.sql` de novo no SQL Editor (sempre seguro — mantém contas e mensagens). A v3 precisa disso para **calls, fotos e upload de perfil** funcionarem.

## Novidades da v3
- 📞 **Calls de voz e 🎥 vídeo** — na DM o outro recebe uma chamada (atender/recusar); em canais de servidor vira uma sala onde todo mundo entra e sai.
- 🖥️ **Compartilhar tela** (até 60 fps), mudo, ensurdecer, tela cheia, indicador de quem está falando.
- 📷 **Enviar fotos** — botão **+**, **Ctrl+V** ou arrastar a imagem pro chat (até 10 MB, 10 por vez).
- 🪪 **Nome de exibição** (com espaço, acento, emoji) separado do @usuário.
- 🖼️ **Foto de perfil e banner do PC** (GIF animado também).
- 🚀 **Atualização automática** — você publica uma versão e os apps de todo mundo se atualizam sozinhos.

## Como lançar uma atualização (depois de instalado)
1. Envie suas mudanças pro GitHub (o repositório precisa ser **público** para os apps acharem a atualização).
2. Aba **Actions** → **Gerar app Windows** → **Run workflow** → em *Versão* digite um número maior que o atual (ex: `3.1.0`) → **Run**.
3. Em ~10 min o GitHub publica o Release. Todo app aberto avisa “Cuplock 3.1.0 disponível” e se atualiza sozinho em 10 s (ou o usuário clica em *Atualizar agora*). Nunca atualiza no meio de uma call.

> ⚠️ A atualização automática só funciona em apps gerados **pelo GitHub Actions** (é lá que ele aprende o endereço do seu repositório). Se você gerou com o `.bat`, preencha `UPDATE_REPO` no `client/config.js` com `seu-usuario/seu-repositorio`.

## Sobre as calls
As calls conectam **direto entre os PCs** (WebRTC), então são rápidas e não gastam nada do Supabase. Funciona na grande maioria das redes de casa. Em redes muito fechadas (empresa, faculdade, alguns 4G) pode não conectar — nesse caso dá para cadastrar um servidor TURN gratuito (ex: *metered.ca* → plano free) em `TURN` no `client/config.js`. Em grupo funciona bem até ~6 pessoas.

- **App de PC:** Tauri (Rust) → instalador `.exe` para Windows, abre numa janela própria (sem navegador, sem localhost).
- **Servidor:** Supabase (gratuito) — guarda contas e mensagens com segurança. Você não precisa hospedar nada.

---

## Passo 1 — Criar o banco no Supabase (5 min)

1. Entre em **https://supabase.com** → **New project**. Escolha um nome e uma senha do banco (guarde) e a região **South America (São Paulo)**.
2. Quando o projeto terminar de criar, vá em **SQL Editor** → **New query**.
3. Abra o arquivo `supabase/schema.sql` deste projeto, copie **tudo**, cole lá e clique em **Run**. Deve aparecer *Success*.
4. Desative a confirmação de e-mail: **Authentication** → **Sign In / Providers** → **Email** → desligue **Confirm email** → **Save**.
5. Pegue seus dados em **Project Settings** → **API** (ou **Data API / API Keys**):
   - **Project URL** (ex: `https://abcdefg.supabase.co`)
   - **anon public key** (um texto longo começando com `eyJ...`)

> A *anon key* é pública por design — a segurança está nas regras do banco (já incluídas no `schema.sql`). **Nunca** use a chave `service_role` no app.

## Passo 2 — Gerar o app `.exe`

### Opção A — pelo GitHub (não precisa instalar nada) ✅ recomendado
1. Crie um repositório no GitHub e envie esta pasta inteira (pode ser pelo site: **Add file → Upload files**).
2. (Opcional, mas recomendado) Em **Settings → Secrets and variables → Actions → New repository secret**, crie:
   - `SUPABASE_URL` = sua Project URL
   - `SUPABASE_ANON_KEY` = sua anon key
   Assim o app já sai configurado e seus amigos só instalam e usam.
3. Vá na aba **Actions** → **Gerar app Windows** → **Run workflow**. Em ~10 minutos aparece o artefato **Cuplock-Windows** para baixar, com o instalador `Cuplock_1.0.0_x64-setup.exe`.

### Opção B — no seu PC
1. Instale o **Rust** (https://rustup.rs) e o **Node.js LTS** (https://nodejs.org).
2. (Opcional) Cole sua URL e chave em `client/config.js`.
3. Dê dois cliques em **`GERAR-APP-NO-PC.bat`**. No fim abre a pasta com o instalador.

## Passo 3 — Usar
Instale o `.exe`, abra o **Cuplock** e:
- Se você não embutiu a URL/chave, o app pede na primeira vez (só uma vez).
- Clique em **Criar conta** (usuário, e-mail, senha), crie seu servidor ou adicione amigos pelo nome.
- Mande o instalador pros seus amigos. Para chamá-los pro seu servidor: menu do servidor → **Convidar pessoas** → copie o código (ou envie direto pela DM).

---

## O que tem
| Tela | O que faz |
|---|---|
| Entrar / Criar conta | E-mail + senha, checa se o nome de usuário está livre |
| Amigos | Online / Todos / Adicionar amigo, abrir DM |
| Mensagens diretas | Conversa privada 1-a-1 |
| Servidor / Canal | Chat em tempo real, lista de membros, "está digitando…", apagar suas mensagens |
| Convite | Ver e aceitar convite por código |
| Explorar | Comunidades públicas com busca |
| Perfil | Foto (link), banner em degradê, pronomes, status personalizado com emoji, bio, “Jogando agora” |
| Atividade | Detecta automaticamente ~70 jogos (e Spotify, VS Code, OBS…) no app de PC, atividade manual, adicionar seus próprios jogos pelo .exe |
| Aparência | 10 temas, cores de destaque em degradê, 8 papéis de parede (ou sua imagem) com desfoque/escurecer, efeito vidro, arredondamento, espaçamento, 7 fontes, mensagens em balões/clássico/compacto, avatar redondo ou arredondado, CSS personalizado |
| Configurações | Conta, trocar senha, status, relógio 24h, sons, notificações |
| Desenvolvedor | Status da conexão, rotas, consultas de teste, eventos ao vivo |

Atalhos: `Ctrl+K` busca rápida · `Esc` fecha · `Shift+Enter` nova linha · clique direito em servidor/mensagem para mais opções.

## Segurança (já configurada no `schema.sql`)
- Senhas guardadas com hash pelo Supabase Auth (nunca em texto).
- Ninguém lê DMs de outros, nem canais de servidores onde não entrou.
- Ninguém consegue mandar mensagem se passando por outra pessoa, mudar o nome de usuário depois de criado, ou mexer em servidores que não são seus.

## Estrutura
```
client/               interface do app (HTML/CSS/JS)
  config.js           ← URL e chave do Supabase (opcional)
desktop/src-tauri/    app de PC em Rust (Tauri)
supabase/schema.sql   banco, regras de segurança, bot
.github/workflows/    gera o .exe automaticamente
```

## Problemas comuns
- **"Conta criada, mas pedindo confirmação de e-mail"** → faça o item 4 do Passo 1.
- **"Conectou, mas o banco não está pronto"** → rode o `schema.sql` (Passo 1, item 3).
- **Mensagens não chegam na hora** → confira se o `schema.sql` rodou até o fim (ele liga o tempo real).
- **Erro ao compilar** → copie a mensagem e mande para o Claude.
- **Plano grátis do Supabase** pausa o projeto após 7 dias sem nenhum uso; é só entrar no painel e clicar em *Restore*.
