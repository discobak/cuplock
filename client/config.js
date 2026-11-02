// =====================================================================
//  CONFIGURAÇÃO DO CUPLOCK
//  Cole aqui os dados do seu projeto Supabase
//  (Supabase → Project Settings → API).
//  A "anon key" é pública por design — a segurança vem das regras do banco.
//
//  Se deixar em branco, o app pede esses dados na primeira vez que abrir.
// =====================================================================
window.CUPLOCK_CONFIG = {
  SUPABASE_URL: "https://mnvxzywusiiylbgapflk.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_YR2wdl5zkBv4kDmsdJSYMQ_XF0N37s8",

  // Atualização automática: "seu-usuario/seu-repositorio" no GitHub.
  // O build pelo GitHub Actions preenche isso sozinho.
  UPDATE_REPO: "",

  // (Opcional) servidor TURN para calls em redes muito restritas.
  // ex: { urls: "turn:seu.servidor:3478", username: "user", credential: "senha" }
  TURN: null,
};
