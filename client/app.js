"use strict";
/* ============================================================
   Cuplock — cliente (app de PC via Tauri, ou navegador)
   Supabase: contas (e-mail + senha), banco e tempo real.
   ============================================================ */

const VERSION = "3.0.0";
const DEFAULT_PREFS = {
  theme: "meianoite", accent: "#a78bfa", accent2: "#f472b6", wallpaper: "aurora", wallUrl: "", wallBlur: 0, wallDim: 30, wallAnim: true,
  panelOpacity: 78, glass: true, radius: 20, gap: 10, font: "jakarta", fontSize: 15, msgStyle: "bubbles", avatarShape: "squircle",
  reduceMotion: false, sounds: true, enterSends: true, membersOpen: true, time24: true, customCss: "",
  showActivity: true, customGames: [], manualActivity: null,
};
const THEMES = {
  meianoite: { name: "Meia-noite", bg0: "#0c0a12", bg1: "#16131f", bg3: "#231f30", bg4: "#2e2940", fg: "#efeaf7", fg2: "#b0a9c2", fg3: "#736c85" },
  grafite: { name: "Grafite", bg0: "#0d0e10", bg1: "#17181b", bg3: "#212226", bg4: "#2c2e33", fg: "#ececee", fg2: "#a6a8ae", fg3: "#6b6e75" },
  amoled: { name: "AMOLED", bg0: "#000000", bg1: "#060606", bg3: "#121212", bg4: "#1e1e1e", fg: "#f2f2f2", fg2: "#a8a8a8", fg3: "#686868" },
  cafe: { name: "Café", bg0: "#130d09", bg1: "#1e1611", bg3: "#2a1f19", bg4: "#3a2c23", fg: "#f6ece2", fg2: "#cab6a2", fg3: "#8b7462" },
  oceano: { name: "Oceano", bg0: "#05111b", bg1: "#0b1b29", bg3: "#122737", bg4: "#1b3548", fg: "#e5f2fb", fg2: "#9dbbcf", fg3: "#5c7b90" },
  floresta: { name: "Floresta", bg0: "#07120d", bg1: "#0e1c15", bg3: "#16291f", bg4: "#20382b", fg: "#e7f4eb", fg2: "#a4c3af", fg3: "#62806c" },
  vinho: { name: "Vinho", bg0: "#12070b", bg1: "#1d0e14", bg3: "#2a151e", bg4: "#3a1e2a", fg: "#f8e9ef", fg2: "#cfa9b8", fg3: "#8e6878" },
  claro: { name: "Claro", light: true, bg0: "#e8e6ef", bg1: "#ffffff", bg3: "#f1eff6", bg4: "#e1deea", fg: "#17141f", fg2: "#55506a", fg3: "#8a859e" },
  sakura: { name: "Sakura", light: true, bg0: "#f6e7ee", bg1: "#fff8fb", bg3: "#fbeaf1", bg4: "#f1d5e1", fg: "#2a1620", fg2: "#7a5566", fg3: "#a8899a" },
  menta: { name: "Menta", light: true, bg0: "#e3f2ec", bg1: "#f8fffc", bg3: "#ebf7f2", bg4: "#d4ebe1", fg: "#10241c", fg2: "#4a6a5d", fg3: "#7f9b90" },
};
const FONTS = {
  jakarta: ["Plus Jakarta Sans", "Plus+Jakarta+Sans:wght@400;500;600;700;800"], grotesk: ["Space Grotesk", "Space+Grotesk:wght@400;500;600;700"],
  outfit: ["Outfit", "Outfit:wght@400;500;600;700;800"], nunito: ["Nunito", "Nunito:wght@400;600;700;800"],
  sora: ["Sora", "Sora:wght@400;500;600;700;800"], mono: ["JetBrains Mono", "JetBrains+Mono:wght@400;500;600;700;800"], sistema: ["system-ui", null],
};
const WALLPAPERS = {
  aurora: { name: "Aurora", anim: true, css: (p, t) => `radial-gradient(55% 45% at 12% 8%, ${p.accent}66, transparent 70%), radial-gradient(50% 50% at 92% 92%, ${p.accent2}55, transparent 70%), radial-gradient(35% 35% at 75% 15%, ${p.accent}33, transparent 70%), ${t.bg0}` },
  malha: { name: "Malha", anim: true, css: (p, t) => `conic-gradient(from 200deg at 30% 40%, ${p.accent}88, ${p.accent2}77, ${t.bg0}, ${p.accent}88)` },
  nebulosa: { name: "Nebulosa", anim: true, css: (p, t) => `radial-gradient(30% 40% at 30% 30%, #6d28d955, transparent), radial-gradient(35% 35% at 70% 60%, #0ea5e955, transparent), radial-gradient(25% 25% at 50% 90%, #ec489944, transparent), radial-gradient(#ffffff22 1px, transparent 1px) 0 0/40px 40px, #07051a` },
  porDoSol: { name: "Pôr do sol", css: () => `linear-gradient(165deg, #ff7e5f 0%, #feb47b 30%, #b06ab3 65%, #2d1b4e 100%)` },
  mar: { name: "Mar", css: () => `linear-gradient(170deg, #1cb5e0 0%, #0f4c75 50%, #0b1d33 100%)` },
  pontos: { name: "Pontilhado", css: (p, t) => `radial-gradient(${p.accent}55 1.2px, transparent 1.4px) 0 0/22px 22px, ${t.bg0}` },
  liso: { name: "Liso", css: (p, t) => t.bg0 },
  imagem: { name: "Imagem", css: (p, t) => /^https:\/\/[^\s"'()<>\\]+$/.test(p.wallUrl) ? `url("${p.wallUrl}") center/cover no-repeat, ${t.bg0}` : t.bg0 },
};
const ACT_LABEL = { playing: "Jogando", listening: "Ouvindo", watching: "Assistindo", coding: "Programando no", creating: "Criando no", streaming: "Transmitindo com", custom: "" };
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const h = (strings, ...vals) => strings.reduce((a, s, i) => a + s + (i < vals.length ? (Array.isArray(vals[i]) ? vals[i].join("") : vals[i] ?? "") : ""), "");
var S;
const isUuid = s => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
const ICON = {
  friends: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-3.3 0-7 1.7-7 4.5V20h14v-2.5C16 14.7 12.3 13 9 13Zm7.5-2a3.5 3.5 0 1 0-1.3-6.8 6 6 0 0 1 0 6.6c.4.1.9.2 1.3.2Zm1.6 2.1A5.9 5.9 0 0 1 20 17.5V20h3v-2.5c0-2.2-2.3-3.8-4.9-4.4Z"/></svg>',
  compass: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm3.9 6.1-2.3 5.5-5.5 2.3 2.3-5.5 5.5-2.3ZM12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.4 13a7.6 7.6 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.4 7.4 0 0 0-1.7-1L15 3.3h-4l-.4 2.6a7.4 7.4 0 0 0-1.7 1l-2.5-1-2 3.5L6.6 11a7.6 7.6 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1a7.4 7.4 0 0 0 1.7 1l.4 2.6h4l.4-2.6a7.4 7.4 0 0 0 1.7-1l2.5 1 2-3.5L19.4 13ZM13 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z" transform="translate(-1 0)"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 2c-2.7 0-6 1.3-6 3.5V19h12v-2.5C14 14.3 10.7 13 8 13Zm8 0c-.3 0-.7 0-1 .1 1.2.9 2 2 2 3.4V19h5v-2.5c0-2.2-3.3-3.5-6-3.5Z"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2Z" transform="translate(-1 -1)"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',
  chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg>',
  dev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 7-5 5 5 5M16 7l5 5-5 5M13.5 4l-3 16"/></svg>',
  dots: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>',
};
const fmtTime = ts => new Date(ts).toLocaleTimeString(S?.prefs?.time24 === false ? "en-US" : "pt-BR", { hour: "2-digit", minute: "2-digit" });
const fmtDay = ts => {
  const d = new Date(ts), t = new Date(), y = new Date(Date.now() - 864e5);
  if (d.toDateString() === t.toDateString()) return "Hoje";
  if (d.toDateString() === y.toDateString()) return "Ontem";
  return d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
};
const initials = n => esc((n || "?").slice(0, 1).toUpperCase());
const statusLabel = { online: "Online", idle: "Ausente", busy: "Não perturbe", invisible: "Invisível", offline: "Offline" };

function md(src) {
  let s = esc(src);
  const blocks = [];
  s = s.replace(/```(?:\w+\n)?([\s\S]*?)```/g, (_, c) => (blocks.push(`<pre>${c.replace(/^\n|\n$/g, "")}</pre>`), `\u0000${blocks.length - 1}\u0000`));
  s = s.replace(/`([^`\n]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*\n]+)\*\*/g, "<b>$1</b>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<i>$2</i>")
    .replace(/~~([^~\n]+)~~/g, "<s>$1</s>")
    .replace(/\bhttps?:\/\/[^\s<]+[^\s<.,;:!?)\]'"]/g, u => `<a href="${u}" target="_blank" rel="noopener noreferrer">${u}</a>`)
    .replace(/\bcuplock:([a-z0-9]{4,16})\b/g, '<a href="/invite/$1" data-link>🎟️ convite $1</a>')
    .replace(/(^|\s)@(\w{2,24})/g, (m, pre, n) => `${pre}<span class="mention">@${n}</span>`);
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => blocks[i]);
}

// ---------- configuração / Supabase ----------
function getCfg() {
  const saved = JSON.parse(localStorage.getItem("cl.cfg") || "null");
  const base = window.CUPLOCK_CONFIG || {};
  if (base.SUPABASE_URL && base.SUPABASE_ANON_KEY) return base;
  return saved;
}
let sb = null;
function initSupabase() {
  const c = getCfg();
  if (!c || !window.supabase) return false;
  sb = window.supabase.createClient(c.SUPABASE_URL.replace(/\/+$/, ""), c.SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: "cl.auth" },
    realtime: { params: { eventsPerSecond: 20 } },
  });
  return true;
}
function trErr(m) {
  m = String(m || "");
  const map = [
    [/Invalid login credentials/i, "E-mail ou senha incorretos."],
    [/already registered|already been registered/i, "Esse e-mail já tem uma conta. Faça login."],
    [/Password should be at least (\d+)/i, (x, n) => `A senha precisa ter pelo menos ${n} caracteres.`],
    [/Email not confirmed/i, "E-mail não confirmado. No Supabase, desative “Confirm email” (Authentication → Sign In / Providers → Email)."],
    [/Database error saving new user/i, "Esse nome de usuário já está em uso."],
    [/rate limit|too many/i, "Muitas tentativas. Espere um pouco e tente de novo."],
    [/valid email|invalid format/i, "Digite um e-mail válido."],
    [/Failed to fetch|NetworkError|Load failed/i, "Sem conexão com o servidor. Verifique sua internet."],
    [/row-level security|permission denied/i, "Você não tem permissão para isso."],
    [/duplicate key/i, "Isso já existe."],
    [/violates check constraint.*name/i, "Nome inválido."],
    [/violates check constraint/i, "Valor inválido."],
    [/JWT expired/i, "Sua sessão expirou. Entre novamente."],
    [/Could not find the function|schema cache/i, "Banco não configurado: rode o arquivo supabase/schema.sql no SQL Editor do Supabase."],
    [/Invalid API key|No API key/i, "Chave do Supabase inválida. Confira o config.js."],
  ];
  for (const [re, out] of map) { const mm = m.match(re); if (mm) return typeof out === "function" ? out(...mm) : out; }
  return m;
}
async function q(p) { const { data, error } = await p; if (error) throw new Error(trErr(error.message)); return data; }

// ---------- estado ----------
S = {
  session: null, me: null, users: {}, servers: [], friends: [],
  msgs: {}, more: {}, typing: {}, unread: new Set(), recentDms: JSON.parse(localStorage.getItem("cl.dms") || "[]"),
  lastChannel: JSON.parse(localStorage.getItem("cl.last") || "{}"),
  prefs: Object.assign({}, DEFAULT_PREFS, JSON.parse(localStorage.getItem("cl.prefs") || "{}")),
  online: {}, myActivity: null,
  route: { name: "", params: {} }, events: [], loaded: false, rtStatus: "desconectado",
};
const uid = () => S.session?.user?.id;
const dmId = (a, b) => "dm:" + [a, b].sort().join(":");
const cidFilter = cid => cid.startsWith("dm:") ? { dm_key: cid.slice(3) } : { channel_id: cid };
const norm = m => ({ id: m.id, channel: m.channel_id || "dm:" + m.dm_key, author: m.author, content: m.content, attachment: m.attachment || null, ts: Date.parse(m.created_at), created: m.created_at });
const normServer = s => ({ ...s, members: (s.members || []).map(m => m.user_id), channels: (s.channels || []).sort((a, b) => a.created_at.localeCompare(b.created_at)) });

function applyPrefs() {
  const r = document.documentElement, p = S.prefs, t = THEMES[p.theme] || THEMES.meianoite;
  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
  const vars = {
    "--bg0": t.bg0, "--bg1": t.bg1, "--bg2": t.bg1, "--bg3": t.bg3, "--bg4": t.bg4, "--fg": t.fg, "--fg2": t.fg2, "--fg3": t.fg3,
    "--panel": rgba(t.bg1, (p.glass ? p.panelOpacity : 100) / 100),
    "--line": t.light ? "rgba(0,0,0,.08)" : "rgba(255,255,255,.07)", "--hover": t.light ? "rgba(0,0,0,.045)" : "rgba(255,255,255,.05)",
    "--accent": p.accent, "--accent2": p.accent2, "--r": p.radius + "px", "--gap": p.gap + "px", "--fs": p.fontSize + "px",
    "--blur": p.glass ? "22px" : "0px", "--wall-blur": p.wallBlur + "px", "--wall-dim": (p.wallDim / 100).toFixed(2),
  };
  for (const k in vars) r.style.setProperty(k, vars[k]);
  r.classList.toggle("light", !!t.light);
  const f = FONTS[p.font] || FONTS.jakarta;
  r.style.setProperty("--font", `"${f[0]}", ui-sans-serif, system-ui, sans-serif`);
  const fl = document.getElementById("fontlink"), href = f[1] ? `https://fonts.googleapis.com/css2?family=${f[1]}&display=swap` : "";
  if (fl && fl.getAttribute("href") !== href) fl.setAttribute("href", href);
  const w = WALLPAPERS[p.wallpaper] || WALLPAPERS.aurora, wall = document.getElementById("wall");
  if (wall) { wall.style.background = w.css(p, t); wall.classList.toggle("anim", !!(w.anim && p.wallAnim && !p.reduceMotion)); }
  document.body.classList.toggle("compact", p.msgStyle === "compact");
  document.body.classList.toggle("reduce", p.reduceMotion);
  document.body.classList.toggle("noglass", !p.glass);
  document.body.classList.toggle("round", p.avatarShape === "round");
  const cc = document.getElementById("customcss"); if (cc) cc.textContent = p.customCss || "";
}
let prefTimer;
function setPref(k, v) {
  S.prefs[k] = v; localStorage.setItem("cl.prefs", JSON.stringify(S.prefs)); applyPrefs();
  clearTimeout(prefTimer); prefTimer = setTimeout(() => uid() && sb.from("profiles").update({ prefs: S.prefs }).eq("id", uid()).then(() => {}), 800);
}
applyPrefs();

// ---------- dados ----------
async function ensureUsers(ids) {
  const miss = [...new Set(ids)].filter(i => i && !S.users[i]);
  if (!miss.length) return;
  for (const u of await q(sb.from("profiles").select("*").in("id", miss))) S.users[u.id] = u;
}
async function loadServer(sid) {
  const s = normServer(await q(sb.from("servers").select("*, channels(*), members(user_id)").eq("id", sid).single()));
  await ensureUsers(s.members);
  const i = S.servers.findIndex(x => x.id === sid);
  if (i >= 0) S.servers[i] = s; else S.servers.push(s);
  return s;
}
async function bootstrap() {
  const me = uid();
  const [profile, mem, fr] = await Promise.all([
    q(sb.from("profiles").select("*").eq("id", me).single()),
    q(sb.from("members").select("server_id, joined_at").eq("user_id", me).order("joined_at")),
    q(sb.from("friends").select("friend_id").eq("user_id", me)),
  ]);
  S.me = profile; S.users[me] = profile;
  const ids = mem.map(m => m.server_id);
  const servers = ids.length ? await q(sb.from("servers").select("*, channels(*), members(user_id)").in("id", ids)) : [];
  S.servers = servers.map(normServer).sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
  S.friends = fr.map(f => f.friend_id);
  await ensureUsers([...S.servers.flatMap(s => s.members), ...S.friends, ...S.recentDms]);
  if (profile.prefs) { S.prefs = Object.assign(S.prefs, profile.prefs); localStorage.setItem("cl.prefs", JSON.stringify(S.prefs)); applyPrefs(); }
  S.loaded = true;
}
async function resync() {
  try { await bootstrap(); S.msgs = {}; render(); } catch {}
}

// ---------- tempo real ----------
let rt, rtEverUp = false;
// ---------- presença (quem está online + o que está fazendo) ----------
let presenceCh = null;
function effStatus(u) {
  if (!u) return "offline";
  if (u.id === uid()) return S.me?.status === "invisible" ? "offline" : S.me?.status || "online";
  if (u.status === "invisible" || !S.online[u.id]) return "offline";
  return u.status;
}
const activityOf = u => u && effStatus(u) !== "offline" ? (u.id === uid() ? S.myActivity : S.online[u.id]?.activity) : null;
function sinceTxt(ts) {
  const m = Math.max(0, Math.floor((Date.now() - ts) / 60000));
  return m < 1 ? "agora" : m < 60 ? `há ${m} min` : `há ${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, "0") : ""}`;
}
function activityLine(u) {
  const a = activityOf(u);
  if (a) return `<span class="activity">${esc(a.icon || "🎮")} ${a.type === "custom" ? `<b>${esc(a.name)}</b>` : `${ACT_LABEL[a.type] || "Jogando"} <b>${esc(a.name)}</b>`}</span>`;
  if (u?.custom_status || u?.status_emoji) return `<span class="activity">${esc(u.status_emoji || "")} ${esc(u.custom_status || "")}</span>`;
  return "";
}
function activityCard(u) {
  const a = activityOf(u); if (!a) return "";
  return `<div class="act-card"><div class="act-ico">${esc(a.icon || "🎮")}</div><div style="min-width:0"><small>${a.type === "custom" ? "Status" : ACT_LABEL[a.type] || "Jogando"}</small>
    <b style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(a.name)}</b><span class="muted small">${a.since ? sinceTxt(a.since) : ""}</span></div><span class="pulse" style="margin-left:auto"></span></div>`;
}
function connectPresence() {
  if (presenceCh) sb.removeChannel(presenceCh);
  presenceCh = sb.channel("cuplock-online", { config: { presence: { key: uid() } } })
    .on("presence", { event: "sync" }, () => {
      const st = presenceCh.presenceState(), next = {};
      for (const id in st) next[id] = st[id][0] || {};
      const sig = o => JSON.stringify(Object.keys(o).sort().map(k => [k, o[k].activity?.name, o[k].call]));
      const changed = sig(next) !== sig(S.online);
      S.online = next;
      ensureUsers(Object.keys(next)).catch(() => {});
      if (changed) refreshPresenceUI();
    })
    .subscribe(st => { if (st === "SUBSCRIBED") trackPresence(); });
}
function trackPresence() {
  if (!presenceCh) return;
  if (S.me?.status === "invisible") return presenceCh.untrack();
  presenceCh.track({ activity: S.prefs.showActivity ? S.myActivity : null, call: typeof call !== "undefined" && call ? call.cid : null, at: Date.now() });
}
let presenceUiT;
function refreshPresenceUI() {
  clearTimeout(presenceUiT);
  presenceUiT = setTimeout(() => {
    renderChrome(); renderMembers();
    if (S.route.name === "friends") renderFriends($(".main"));
    if (S.route.name === "dm") { const top = $(".top .topic"); if (top) top.innerHTML = activityLine(S.users[S.route.params.uid]) || esc(S.users[S.route.params.uid]?.bio || ""); }
    refreshCallHeader();
  }, 150);
}
// detecção de jogos (só no app de PC)
const invoke = window.__TAURI__?.core?.invoke;
let detectT = null;
async function detectActivity() {
  clearTimeout(detectT);
  let found = null;
  if (invoke && S.prefs.showActivity) {
    try {
      const procs = await invoke("running_processes");
      const custom = Object.fromEntries((S.prefs.customGames || []).map(g => [g.exe.toLowerCase(), [g.name, g.icon || "🎮", "playing"]]));
      for (const p of procs) {
        const hit = custom[p] || (window.CUPLOCK_GAMES || {})[p] && [...window.CUPLOCK_GAMES[p], "playing"];
        if (hit) { found = { type: hit[2], name: hit[0], icon: hit[1] }; break; }
      }
      if (!found) for (const p of procs) { const a = (window.CUPLOCK_APPS || {})[p]; if (a) { found = { type: a[2], name: a[0], icon: a[1] }; break; } }
      S.detected = procs.length;
    } catch { S.detected = -1; }
  }
  const man = S.prefs.manualActivity;
  if (!found && man?.name) found = { type: man.type || "playing", name: man.name, icon: man.icon || "🎮" };
  const prev = S.myActivity;
  if ((found?.name || null) !== (prev?.name || null) || (found?.type || null) !== (prev?.type || null)) {
    S.myActivity = found ? { ...found, since: Date.now() } : null;
    trackPresence(); renderChrome();
    if (S.route.name === "settings") renderSettings();
  }
  detectT = setTimeout(detectActivity, 15000);
}
setInterval(() => { if (Object.values(S.online).some(o => o.activity) || S.myActivity) { renderMembers(); } }, 60000);

function connect() {
  if (rt) sb.removeChannel(rt);
  const me = uid();
  rt = sb.channel("cuplock-db")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, p => onEvent({ type: "message", message: norm(p.new) }))
    .on("postgres_changes", { event: "DELETE", schema: "public", table: "messages" }, p => onEvent({ type: "message_delete", id: p.old.id }))
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "channels" }, p => onEvent({ type: "channel_create", channel: p.new }))
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "members" }, p => onEvent({ type: "member_join", ...p.new }))
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" }, p => onEvent({ type: "user_update", user: p.new }))
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "friends", filter: `user_id=eq.${me}` }, p => onEvent({ type: "friend_added", id: p.new.friend_id }))
    .on("postgres_changes", { event: "DELETE", schema: "public", table: "friends" }, p => p.old.user_id === me && onEvent({ type: "friend_removed", id: p.old.friend_id }))
    .subscribe(status => {
      S.rtStatus = status;
      if (status === "SUBSCRIBED" && !presenceCh) { connectPresence(); detectActivity(); connectInbox(); startUpdateChecks(); }
      const up = status === "SUBSCRIBED";
      $("#conn").classList.toggle("show", !up && rtEverUp);
      if (up) { if (rtEverUp) resync(); rtEverUp = true; }
    });
}
async function onEvent(ev) {
  S.events.unshift({ t: Date.now(), ev }); S.events.length = Math.min(S.events.length, 100);
  const me = uid();
  switch (ev.type) {
    case "message": {
      const m = ev.message, list = S.msgs[m.channel];
      if (m.channel.startsWith("dm:")) {
        const other = m.channel.slice(3).split(":").find(x => x !== me);
        await ensureUsers([other]).catch(() => {});
        if (other && !S.recentDms.includes(other)) { S.recentDms.unshift(other); saveDms(); }
      } else await ensureUsers([m.author]).catch(() => {});
      if (list) {
        const pend = list.findIndex(x => x.pending && x.author === m.author && x.content === m.content);
        if (pend >= 0) list[pend] = m; else if (!list.some(x => x.id === m.id)) list.push(m);
      }
      if (S.typing[m.channel]) delete S.typing[m.channel][m.author];
      if (currentChannel() === m.channel && document.visibilityState === "visible") appendMessage(m);
      else if (m.author !== me) { S.unread.add(m.channel); notify(m); renderChrome(); }
      break;
    }
    case "message_delete": {
      for (const c in S.msgs) { const i = S.msgs[c].findIndex(x => x.id === ev.id); if (i >= 0) { S.msgs[c].splice(i, 1); if (currentChannel() === c) appendMessage(); } }
      break;
    }
    case "channel_create": {
      const s = S.servers.find(x => x.id === ev.channel.server_id);
      if (s && !s.channels.some(c => c.id === ev.channel.id)) { s.channels.push(ev.channel); renderChrome(); }
      break;
    }
    case "member_join": {
      const s = S.servers.find(x => x.id === ev.server_id);
      if (s) { if (!s.members.includes(ev.user_id)) { s.members.push(ev.user_id); await ensureUsers([ev.user_id]); renderMembers(); } }
      else if (ev.user_id === me) { await loadServer(ev.server_id); renderChrome(); }
      break;
    }
    case "user_update": {
      S.users[ev.user.id] = ev.user;
      if (ev.user.id === me) S.me = ev.user;
      renderChrome(); renderMembers();
      break;
    }
    case "friend_added": {
      if (S.friends.includes(ev.id)) break;
      S.friends.push(ev.id); await ensureUsers([ev.id]);
      toast(`Você e ${S.users[ev.id]?.username} agora são amigos 🎉`);
      if (S.route.name === "friends") render();
      break;
    }
    case "friend_removed": S.friends = S.friends.filter(f => f !== ev.id); if (S.route.name === "friends") render(); break;
  }
}
function saveDms() { S.recentDms = S.recentDms.slice(0, 30); localStorage.setItem("cl.dms", JSON.stringify(S.recentDms)); }

// digitação: um canal de broadcast por conversa
let typingCh = null, typingCid = null;
function joinTyping(cid) {
  if (typingCid === cid) return;
  if (typingCh) sb.removeChannel(typingCh);
  typingCid = cid;
  typingCh = sb.channel("typing-" + cid.replace(/[^a-z0-9-]/gi, "_"), { config: { broadcast: { self: false } } })
    .on("broadcast", { event: "typing" }, ({ payload }) => {
      if (!payload?.user || payload.user === uid()) return;
      (S.typing[cid] ||= {})[payload.user] = Date.now() + 4000;
      ensureUsers([payload.user]).then(() => currentChannel() === cid && renderTyping());
    }).subscribe();
}
setInterval(() => {
  const now = Date.now(); let changed = false;
  for (const c in S.typing) for (const u in S.typing[c]) if (S.typing[c][u] < now) { delete S.typing[c][u]; changed = true; }
  if (changed) renderTyping();
}, 1000);

let audioCtx;
function notify(m) {
  if (!S.prefs.sounds || S.me?.status === "busy") return;
  try {
    audioCtx ||= new AudioContext();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.frequency.value = 880; g.gain.setValueAtTime(.06, audioCtx.currentTime); g.gain.exponentialRampToValueAtTime(.0001, audioCtx.currentTime + .25);
    o.connect(g).connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + .25);
  } catch {}
  try { if (document.hidden && Notification.permission === "granted") new Notification(dname(S.users[m.author]) || "Cuplock", { body: (m.content || "📷 Foto").slice(0, 120), tag: m.channel }); } catch {}
}

async function logout() {
  await leaveCall(true); stopRinging(); if (inboxCh) { sb.removeChannel(inboxCh); inboxCh = null; }
  try { await sb.auth.signOut(); } catch {}
  if (rt) sb.removeChannel(rt); if (typingCh) sb.removeChannel(typingCh); if (presenceCh) sb.removeChannel(presenceCh);
  clearTimeout(detectT);
  rt = typingCh = typingCid = presenceCh = null; rtEverUp = false; S.online = {}; S.myActivity = null;
  S.session = null; S.loaded = false; S.me = null; S.msgs = {}; S.servers = []; S.friends = [];
  $(".settings")?.remove();
  navigate("/login", true);
}

// ---------- rotas (hash, funciona no app de PC) ----------
const ROUTES = [
  ["/setup", "setup"], ["/login", "login"], ["/pwa", "pwa"], ["/dev", "dev"],
  ["/invite/:code", "invite"], ["/bot/:id", "bot"], ["/user/:id", "bot"],
  ["/discover", "discover"], ["/settings", "settings"], ["/settings/:tab", "settings"],
  ["/friends", "friends"], ["/dm/:uid", "dm"],
  ["/server/:sid/channel/:cid", "channel"], ["/server/:sid", "server"], ["/", "home"],
];
const PUBLIC = new Set(["setup", "login", "pwa", "dev", "invite"]);
const curPath = () => (location.hash.slice(1) || "/").split("?")[0];
const curQuery = () => new URLSearchParams((location.hash.split("?")[1]) || "");
function match(path) {
  for (const [pat, name] of ROUTES) {
    const a = pat.split("/").filter(Boolean), b = path.split("/").filter(Boolean);
    if (a.length !== b.length) continue;
    const params = {};
    if (a.every((seg, i) => seg[0] === ":" ? (params[seg.slice(1)] = decodeURIComponent(b[i]), true) : seg === b[i])) return { name, params };
  }
  return { name: "notfound", params: {} };
}
let routing = false;
function navigate(to, replace) {
  routing = true;
  history[replace ? "replaceState" : "pushState"]({}, "", "#" + to);
  routing = false;
  route();
}
window.addEventListener("hashchange", () => { if (!routing) route(); });
document.addEventListener("click", e => {
  const a = e.target.closest("a[data-link],[data-href]");
  if (!a || e.metaKey || e.ctrlKey || e.button) return;
  e.preventDefault(); navigate(a.getAttribute("href") || a.dataset.href);
});

let settingsBack = "/friends";
async function route() {
  const r = match(curPath());
  if (!sb) {
    if (r.name !== "setup") return navigate("/setup", true);
    S.route = r; return render();
  }
  if (!S.session && !PUBLIC.has(r.name)) return navigate("/login?next=" + encodeURIComponent(curPath()), true);
  if (S.session && !S.loaded) {
    app.innerHTML = `<div class="center"><div style="text-align:center"><img src="icon.svg" width="72" style="animation:pop .6s infinite alternate"><p class="muted" style="margin-top:12px">Carregando…</p></div></div>`;
    try { await bootstrap(); connect(); }
    catch (e) {
      app.innerHTML = `<div class="center"><div class="panel"><h1>Não foi possível conectar</h1><p class="sub">${esc(e.message)}</p><br>
        <button class="btn" onclick="location.reload()">Tentar de novo</button> <button class="btn ghost" onclick="logout()">Sair</button></div></div>`;
      return;
    }
  }
  if (r.name === "login" && S.session) return navigate(curQuery().get("next") || "/", true);
  if (r.name === "home") return navigate(S.lastChannel._ || "/friends", true);
  if (r.name === "server") {
    const s = S.servers.find(x => x.id === r.params.sid);
    if (!s) return navigate("/discover", true);
    const c = s.channels.find(x => x.id === S.lastChannel[s.id]) || s.channels[0];
    return navigate(c ? `/server/${s.id}/channel/${c.id}` : "/friends", true);
  }
  if (r.name !== "settings") settingsBack = curPath();
  S.route = r;
  closeLayer();
  render();
}

// ---------- renderização ----------
const app = $("#app");
function currentChannel() {
  const r = S.route;
  if (r.name === "channel") return r.params.cid;
  if (r.name === "dm" && uid()) return dmId(uid(), r.params.uid);
  return null;
}
function avatar(u, size = "", dot = true) {
  if (!u) u = { username: "?", color: "#666" };
  const img = u.avatar_url && /^https:\/\/[^\s"'()<>\\]+$/.test(u.avatar_url) ? `background:url('${u.avatar_url}') center/cover,${esc(u.color)}` : `background:${esc(u.color)}`;
  return `<div class="avatar ${size}" style="${img}">${u.avatar_url ? "" : initials(u.username)}${dot ? `<span class="dot ${effStatus(u)}"></span>` : ""}</div>`;
}
function uname(u) { return esc(dname(u)); }

function render() {
  const r = S.route.name;
  document.title = "Cuplock";
  if (r === "setup") return renderSetup();
  if (r === "login") return renderLogin();
  if (r === "pwa") return renderPwa();
  if (r === "invite") return renderInvite();
  if (r === "dev") return renderDev();
  if (r === "notfound") { app.innerHTML = `<div class="center"><div class="panel" style="text-align:center"><div style="font-size:64px">🫖</div><h1>Nada por aqui</h1><p class="sub">Essa página não existe.</p><br><a class="btn" href="/" data-link>Voltar ao início</a></div></div>`; return; }
  renderShell();
}

function renderShell() {
  const r = S.route;
  if (!$(".rail", app)) app.innerHTML = `<nav class="rail isle"></nav><aside class="side isle"></aside><main class="main isle"></main>`;
  renderChrome();
  const main = $(".main", app);
  if (r.name === "friends") renderFriends(main);
  else if (r.name === "discover") renderDiscover(main);
  else if (r.name === "bot") renderProfile(main);
  else if (r.name === "channel" || r.name === "dm") renderChat(main);
  else if (r.name === "settings" && !main.innerHTML) renderFriends(main);
  if (r.name === "settings") renderSettings(); else $(".settings")?.remove();
}

function renderChrome() {
  if (!$(".rail", app) || !S.me) return;
  const r = S.route, sid = r.params.sid, me = uid();
  const homeOn = ["friends", "dm", "bot", "settings"].includes(r.name);
  const dmUnread = [...S.unread].filter(c => c.startsWith("dm:")).length;
  $(".rail", app).innerHTML = h`
    <a class="pill logo ${homeOn ? "on" : ""}" href="/friends" data-link data-tip="Início"><img src="icon.svg" width="30" alt="Cuplock">${dmUnread ? '<span class="badge"></span>' : ""}</a>
    <div class="sep"></div>
    ${S.servers.map(s => `<a class="pill ${sid === s.id ? "on" : ""}" href="/server/${s.id}" data-link data-tip="${esc(s.name)}" oncontextmenu="serverMenu(event,'${s.id}')" style="${sid === s.id ? `background:${esc(s.banner)}` : ""}">${esc(s.icon)}${s.channels.some(c => S.unread.has(c.id)) && sid !== s.id ? '<span class="badge" style="background:var(--accent)"></span>' : ""}</a>`)}
    <button class="pill ghost" onclick="createServerModal()" data-tip="Criar ou entrar em servidor">${ICON.plus.replace("<svg", '<svg width="22"')}</button>
    <a class="pill ghost ${r.name === "discover" ? "on" : ""}" href="/discover" data-link data-tip="Explorar comunidades">${ICON.compass.replace("<svg", '<svg width="24"')}</a>
    <div style="flex:1"></div>
    <a class="pill ghost" href="/settings/appearance" data-link data-tip="Personalizar">🎨</a>`;

  const side = $(".side", app);
  const s = S.servers.find(x => x.id === sid);
  if (s) {
    const owner = s.owner === me;
    side.innerHTML = h`
      <div class="srv-banner" style="background:${esc(s.banner)}" onclick="serverMenu(event,'${s.id}')">
        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(s.icon)} ${esc(s.name)}</span><span>${ICON.chev.replace("<svg", '<svg width="18"')}</span></div>
      <div class="side-scroll">
        <div class="item" onclick="inviteModal('${s.id}')"><span class="hash" style="color:var(--accent)">${ICON.link.replace("<svg", '<svg width="16"')}</span><span class="grow" style="color:var(--accent)">Convidar pessoas</span></div>
        <div class="side-label"><span>Canais</span>${owner ? `<button class="icon-btn" style="width:22px;height:22px" title="Criar canal" onclick="createChannelModal('${s.id}')">${ICON.plus.replace("<svg", '<svg width="14"')}</button>` : ""}</div>
        ${s.channels.map(c => { const inc = inCallUsers(c.id); return `<a class="item ${r.params.cid === c.id ? "on" : ""} ${S.unread.has(c.id) && r.params.cid !== c.id ? "unread" : ""}" href="/server/${s.id}/channel/${c.id}" data-link onclick="closeNav()"><span class="hash">#</span><span class="grow">${esc(c.name)}</span>${inc.length ? `<span class="incall" title="${inc.length} na call">🔊${inc.length}</span>` : ""}</a>${inc.length ? `<div class="voice-users">${inc.map(id => `<span data-voice="${id}" title="${esc(dname(S.users[id]))}">${avatar(S.users[id], "", false)}</span>`).join("")}</div>` : ""}`; })}
      </div>${meBar()}`;
  } else {
    const unreadDms = [...S.unread].filter(c => c.startsWith("dm:")).map(c => c.slice(3).split(":").find(x => x !== me));
    const dmList = [...new Set([...unreadDms, ...S.recentDms])].filter(id => S.users[id]);
    side.innerHTML = h`
      <div class="side-head"><button class="input" style="text-align:left;color:var(--fg3);padding:8px 12px;font-size:13.5px" onclick="quickSwitcher()">🔎 Buscar… <span style="float:right;opacity:.6">Ctrl K</span></button></div>
      <div class="side-scroll">
        <a class="item ${r.name === "friends" ? "on" : ""}" href="/friends" data-link onclick="closeNav()"><span class="hash">${ICON.friends.replace("<svg", '<svg width="19"')}</span><span class="grow">Amigos</span></a>
        <a class="item ${r.name === "discover" ? "on" : ""}" href="/discover" data-link onclick="closeNav()"><span class="hash">${ICON.compass.replace("<svg", '<svg width="19"')}</span><span class="grow">Explorar</span></a>
        <div class="side-label"><span>Conversas</span></div>
        ${dmList.length ? dmList.map(id => { const u = S.users[id], c = dmId(me, id); return `<a class="item ${r.params.uid === id ? "on" : ""} ${S.unread.has(c) && r.params.uid !== id ? "unread" : ""}" href="/dm/${id}" data-link onclick="closeNav()">${avatar(u)}<span class="grow">${uname(u)}<span class="sub">${activityLine(u) || statusLabel[effStatus(u)]}</span></span></a>`; })
        : `<p class="muted small" style="padding:6px 10px">Suas conversas aparecem aqui. Comece pela lista de amigos.</p>`}
      </div>${meBar()}`;
  }
  updateCallBar();
}
function meBar() {
  const u = S.me;
  return `<div class="me-bar">${avatar(u)}<div class="who" onclick="statusMenu(event)"><b>${esc(u.username)}</b><small>${activityLine(u) || statusLabel[u.status] || "Online"}</small></div>
    <a class="icon-btn" href="/settings" data-link title="Configurações">${ICON.gear}</a></div>`;
}
const navBtn = () => `<button class="icon-btn mobile-only" onclick="openNav()">${ICON.menu}</button>`;
function openNav() { app.classList.remove("nav-closed"); }
function closeNav() { if (matchMedia("(max-width:820px)").matches) app.classList.add("nav-closed"); }
if (matchMedia("(max-width:820px)").matches) app.classList.add("nav-closed");

// ---------- chat ----------
async function renderChat(main) {
  const r = S.route, me = uid();
  let cid, title, topic, icon, members = null, welcome, placeholder;
  if (r.name === "channel") {
    const s = S.servers.find(x => x.id === r.params.sid);
    const c = s?.channels.find(x => x.id === r.params.cid);
    if (!c) return navigate(s ? `/server/${s.id}` : "/discover", true);
    cid = c.id; title = esc(c.name); topic = c.topic; icon = '<span class="hash" style="font-size:22px;color:var(--fg3)">#</span>';
    members = s.members; placeholder = "Conversar em #" + c.name;
    welcome = `<div class="big">#</div><h2>Bem-vindo a #${esc(c.name)}!</h2><p>Este é o começo do canal #${esc(c.name)}${c.topic ? " — " + esc(c.topic) : ""}.</p>`;
    S.lastChannel[s.id] = c.id;
    document.title = `#${c.name} · ${s.name} — Cuplock`;
  } else {
    let u = S.users[r.params.uid];
    if (!u && isUuid(r.params.uid)) { await ensureUsers([r.params.uid]).catch(() => {}); u = S.users[r.params.uid]; }
    if (!u || u.id === me) return navigate("/friends", true);
    cid = dmId(me, u.id); title = esc(u.username); topic = null; S.dmTopic = activityLine(u) || esc(u.bio || ""); icon = avatar(u, "", true);
    placeholder = "Conversar com " + dname(u);
    welcome = `${avatar(u, "xl")}<h2 style="margin-top:8px">${uname(u)}</h2>${u.pronouns ? `<div class="pronouns">${esc(u.pronouns)}</div>` : ""}<p>Este é o começo da sua conversa com <b>${esc(u.username)}</b>.</p>`;
    if (S.recentDms[0] !== u.id) { S.recentDms = [u.id, ...S.recentDms.filter(x => x !== u.id)]; saveDms(); renderChrome(); }
    document.title = `${dname(u)} — Cuplock`;
  }
  S.lastChannel._ = curPath();
  localStorage.setItem("cl.last", JSON.stringify(S.lastChannel));
  S.unread.delete(cid);
  joinTyping(cid);
  const showMembers = members && S.prefs.membersOpen;
  main.innerHTML = h`
    <div class="top">${navBtn()}${icon}<h1>${title}</h1>${topic ? `<div class="topic">${esc(topic)}</div>` : r.name === "dm" ? `<div class="topic">${S.dmTopic || ""}</div>` : '<div class="spacer"></div>'}
      <span id="callbtns" style="display:flex;gap:4px;align-items:center">${callHeaderButtons(cid)}</span>
      ${members ? `<button class="icon-btn ${S.prefs.membersOpen ? "on" : ""}" title="Membros" onclick="setPref('membersOpen',!S.prefs.membersOpen);render()">${ICON.users}</button>` : ""}</div>
    <div class="body"><div style="flex:1;display:flex;flex-direction:column;min-width:0" id="chatcol">
      <div id="callslot"></div>
      <div class="content" id="scroller"><div class="chat" id="chat" data-cid="${esc(cid)}"><div class="empty"><div class="muted">Carregando mensagens…</div></div></div></div>
      <div class="composer"><div id="pending" class="pending" style="display:none"></div><div class="composer-box">
        <button class="icon-btn attach-btn" title="Enviar fotos" onclick="pickFile('image/png,image/jpeg,image/webp,image/gif',true).then(addFiles)">${ICON.plus}</button>
        <textarea id="input" rows="1" maxlength="2000" placeholder="${esc(placeholder)}" autocomplete="off"></textarea>
        <button class="send-btn" id="sendBtn" title="Enviar">${ICON.send}</button></div>
        <div class="typing" id="typing"></div></div>
    </div>${showMembers ? '<aside class="members" id="members"></aside>' : ""}</div>`;
  renderMembers();
  bindComposer(cid);
  bindDropAndPaste($("#chatcol"));
  if (pendingFiles.length) renderPendingFiles();
  mountCallPanel();
  if (!S.msgs[cid]) {
    try { await loadMessages(cid); }
    catch (e) { if ($("#chat")) $("#chat").innerHTML = `<div class="empty"><div class="e">🔒</div><div>${esc(e.message)}</div></div>`; return; }
  }
  if ($("#chat")?.dataset.cid !== cid) return;
  $("#chat").innerHTML = `${S.more[cid] ? `<button class="load-more" onclick="loadOlder('${esc(cid)}')">Carregar mensagens antigas</button>` : `<div class="welcome">${welcome}</div>`}<div id="list">${renderMessages(S.msgs[cid])}</div>`;
  renderTyping();
  scrollBottom(true);
  $("#input")?.focus();
}
async function loadMessages(cid, before) {
  let qb = sb.from("messages").select("*").match(cidFilter(cid)).order("created_at", { ascending: false }).limit(51);
  if (before) qb = qb.lt("created_at", before);
  const rows = await q(qb);
  const page = rows.slice(0, 50).reverse().map(norm);
  await ensureUsers(page.map(m => m.author));
  const old = S.msgs[cid] || [];
  S.msgs[cid] = before ? [...page.filter(m => !old.some(o => o.id === m.id)), ...old] : page;
  S.more[cid] = rows.length > 50;
}
function renderMessages(list) {
  if (S.prefs.msgStyle === "bubbles") return renderBubbles(list);
  let out = "", prev = null;
  for (const m of list) {
    const newDay = !prev || new Date(prev.ts).toDateString() !== new Date(m.ts).toDateString();
    const cont = prev && !newDay && prev.author === m.author && m.ts - prev.ts < 5 * 60e3;
    if (newDay) out += `<div class="daysep"><span>${fmtDay(m.ts)}</span></div>`;
    out += messageHtml(m, cont);
    prev = m;
  }
  return out;
}
function renderBubbles(list) {
  let out = "", i = 0;
  const me = uid();
  while (i < list.length) {
    const first = list[i];
    if (i === 0 || new Date(list[i - 1].ts).toDateString() !== new Date(first.ts).toDateString()) out += `<div class="daysep"><span>${fmtDay(first.ts)}</span></div>`;
    const run = [first];
    while (i + run.length < list.length) {
      const n = list[i + run.length], p = run[run.length - 1];
      if (n.author !== first.author || n.ts - p.ts > 5 * 60e3 || new Date(n.ts).toDateString() !== new Date(p.ts).toDateString()) break;
      run.push(n);
    }
    const u = S.users[first.author], mine = first.author === me;
    out += `<div class="bgroup ${mine ? "mine" : ""}">${mine ? "" : `<div onclick="profilePopout(event,'${first.author}')" style="cursor:pointer">${avatar(u, "", false)}</div>`}
      <div class="bcol">${mine ? "" : `<div class="bname" style="color:${esc(u?.color)}" onclick="profilePopout(event,'${first.author}')">${uname(u)}<time>${fmtTime(first.ts)}</time></div>`}
      ${run.map(m => `<div class="bubble ${m.attachment ? "photo" : ""} ${m.attachment && !m.content ? "only" : ""} ${m.pending ? "pending" : ""} ${m.failed ? "failed msg" : ""}" data-id="${m.id}" title="${fmtDay(m.ts)} ${fmtTime(m.ts)}"${mine && !m.pending && !m.failed ? ` oncontextmenu="msgMenu(event,'${m.id}')"` : ""}>${m.attachment ? attachHtml(m.attachment) : ""}${m.content ? `<div class="text">${md(m.content)}</div>` : ""}</div>`).join("")}
      </div></div>`;
    i += run.length;
  }
  return out;
}
function messageHtml(m, cont) {
  const u = S.users[m.author], cls = `${m.pending ? "pending" : ""} ${m.failed ? "failed" : ""}`;
  const mine = m.author === uid() && !m.pending && !m.failed;
  const ctx = mine ? ` oncontextmenu="msgMenu(event,'${m.id}')"` : "";
  const body = `${m.attachment ? attachHtml(m.attachment) : ""}${m.content ? `<div class="text">${md(m.content)}${m.failed ? ' <small>— falhou, clique para reenviar</small>' : ""}</div>` : m.failed ? '<div class="text"><small>Foto falhou — clique para reenviar</small></div>' : ""}`;
  if (cont) return `<div class="msg cont ${cls}" data-id="${m.id}"${ctx}><span class="hover-time">${fmtTime(m.ts)}</span><div class="msg-body">${body}</div></div>`;
  const day = fmtDay(m.ts);
  return `<div class="group"><div class="msg ${cls}" data-id="${m.id}"${ctx}>
    <div onclick="profilePopout(event,'${m.author}')" style="cursor:pointer">${avatar(u, "lg", false)}</div>
    <div class="msg-body"><span class="name" style="color:${esc(u?.color)}" onclick="profilePopout(event,'${m.author}')">${uname(u)}</span><time>${day === "Hoje" ? "Hoje às " : day + " "}${fmtTime(m.ts)}</time>
    ${body}</div></div></div>`;
}
function appendMessage(m) {
  const list = $("#list"); if (!list) return;
  const cid = currentChannel();
  const near = isNearBottom();
  list.innerHTML = renderMessages(S.msgs[cid] || []);
  renderTyping();
  if (near || m?.author === uid()) scrollBottom();
}
async function loadOlder(cid) {
  const first = S.msgs[cid]?.[0]; if (!first) return;
  const h0 = $("#scroller").scrollHeight;
  try { await loadMessages(cid, first.created); } catch (e) { return toast(e.message); }
  await renderChat($(".main"));
  $("#scroller").scrollTop = $("#scroller").scrollHeight - h0;
}
const isNearBottom = () => { const s = $("#scroller"); return s && s.scrollHeight - s.scrollTop - s.clientHeight < 140; };
const scrollBottom = instant => { const s = $("#scroller"); if (s) s.scrollTo({ top: s.scrollHeight, behavior: instant || S.prefs.reduceMotion ? "auto" : "smooth" }); };

async function sendMessage(cid, content) {
  const temp = { id: "tmp" + Math.random(), channel: cid, author: uid(), content, ts: Date.now(), pending: true };
  (S.msgs[cid] ||= []).push(temp);
  if (currentChannel() === cid) appendMessage(temp);
  try {
    const m = norm(await q(sb.from("messages").insert({ ...cidFilter(cid), content }).select().single()));
    const l = S.msgs[cid], i = l.indexOf(temp);
    if (i >= 0) { if (l.some(x => x.id === m.id)) l.splice(i, 1); else l[i] = m; }
  } catch (e) { temp.pending = false; temp.failed = true; toast(e.message); }
  if (currentChannel() === cid) appendMessage(S.msgs[cid].at(-1));
}
function bindComposer(cid) {
  const ta = $("#input"); let lastTyping = 0;
  const grow = () => { ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 200) + "px"; };
  const draftKey = "cl.draft." + cid;
  ta.value = sessionStorage.getItem(draftKey) || ""; grow();
  ta.addEventListener("input", () => {
    grow(); sessionStorage.setItem(draftKey, ta.value);
    if (ta.value && Date.now() - lastTyping > 2500 && typingCh) { lastTyping = Date.now(); typingCh.send({ type: "broadcast", event: "typing", payload: { user: uid() } }); }
  });
  const send = () => {
    const content = ta.value.trim();
    if (!content && !pendingFiles.length) return;
    ta.value = ""; sessionStorage.removeItem(draftKey); grow();
    if (pendingFiles.length) sendWithFiles(cid, content); else sendMessage(cid, content);
  };
  ta.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey && S.prefs.enterSends && !e.isComposing) { e.preventDefault(); send(); }
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); send(); }
    if (e.key === "Escape") ta.blur();
  });
  $("#sendBtn").onclick = send;
}
document.addEventListener("click", e => {
  const f = e.target.closest(".msg.failed"); if (!f) return;
  const cid = currentChannel(), l = S.msgs[cid], m = l?.find(x => x.id === f.dataset.id); if (!m) return;
  l.splice(l.indexOf(m), 1);
  if (m.retry) { pendingFiles.push({ file: m.retry.file, url: URL.createObjectURL(m.retry.file) }); sendWithFiles(cid, m.retry.caption); }
  else sendMessage(cid, m.content);
});
function msgMenu(e, id) {
  showCtx(e, `<button onclick="copy(S.msgs[currentChannel()].find(m=>m.id==='${id}').content||'');closeLayer()">Copiar texto</button><button class="danger" onclick="deleteMessage('${id}')">Apagar mensagem</button>`);
}
async function deleteMessage(id) {
  closeLayer();
  try { await q(sb.from("messages").delete().eq("id", id)); onEvent({ type: "message_delete", id }); } catch (e) { toast(e.message); }
}
function renderTyping() {
  const el = $("#typing"); if (!el) return;
  const who = Object.keys(S.typing[currentChannel()] || {}).map(id => S.users[id]?.username).filter(Boolean);
  el.innerHTML = who.length ? `<i><b></b><b></b><b></b></i><span><b>${esc(who.slice(0, 3).join(", "))}</b> ${who.length > 1 ? "estão digitando" : "está digitando"}…</span>` : "";
}
function renderMembers() {
  const el = $("#members"); if (!el) return;
  const s = S.servers.find(x => x.id === S.route.params.sid); if (!s) return;
  const us = s.members.map(id => S.users[id]).filter(Boolean);
  const on = us.filter(u => effStatus(u) !== "offline").sort((a, b) => !!activityOf(b) - !!activityOf(a)), off = us.filter(u => effStatus(u) === "offline");
  const row = u => `<div class="item" onclick="profilePopout(event,'${u.id}')" style="${effStatus(u) === "offline" ? "opacity:.45" : ""}"><span data-voice="${u.id}" class="vwrap">${avatar(u)}</span><span class="grow"><span style="color:${esc(u.color)};font-weight:700">${uname(u)}</span>${s.owner === u.id ? ' <span title="Dono do servidor">👑</span>' : ""}${(u.id === uid() ? call?.cid : S.online[u.id]?.call) ? ' <span title="Em call">🔊</span>' : ""}<span class="sub">${activityLine(u)}</span></span></div>`;
  el.innerHTML = `<div class="side-label">Online — ${on.length}</div>${on.map(row).join("")}${off.length ? `<div class="side-label">Offline — ${off.length}</div>${off.map(row).join("")}` : ""}`;
}

// ---------- amigos ----------
let friendTab = "online";
function renderFriends(main) {
  document.title = "Amigos — Cuplock";
  const fr = S.friends.map(id => S.users[id]).filter(Boolean).sort((a, b) => dname(a).localeCompare(dname(b)));
  const list = friendTab === "online" ? fr.filter(u => effStatus(u) !== "offline") : fr;
  const playing = fr.filter(u => activityOf(u));
  const tabs = [["online", "Online"], ["all", "Todos"]];
  main.innerHTML = h`
    <div class="top">${navBtn()}<span class="hash" style="color:var(--fg3)">${ICON.friends}</span><h1>Amigos</h1>
      <div class="tabs" style="margin-left:12px;padding-left:12px;border-left:1px solid var(--line)">
        ${tabs.map(([t, n]) => `<button class="tab ${friendTab === t ? "on" : ""}" onclick="friendTab='${t}';render()">${n}</button>`)}
        <button class="tab add ${friendTab === "add" ? "on" : ""}" onclick="friendTab='add';render()">Adicionar amigo</button></div></div>
    <div class="content"><div class="page">
    ${!S.servers.length && friendTab !== "add" ? h`<div class="card" style="padding:22px;margin-bottom:20px;display:flex;gap:18px;align-items:center;flex-wrap:wrap;background:var(--grad);color:#fff;border:0">
      <div style="font-size:44px">👋</div><div style="flex:1;min-width:200px"><b style="font-size:18px">Bem-vindo ao Cuplock, ${esc(S.me.username)}!</b><div style="opacity:.9">Crie seu servidor, entre com um convite ou adicione seus amigos pelo nome.</div></div>
      <button class="btn ghost" onclick="createServerModal()">Criar servidor</button><button class="btn ghost" onclick="joinByCodeModal()">Tenho um convite</button></div>` : ""}
    ${playing.length && friendTab !== "add" ? h`<div class="side-label" style="padding-left:0">Jogando agora</div><div class="now-playing">${playing.map(u => `<div class="card" style="padding:12px;cursor:pointer" data-href="/dm/${u.id}"><div style="display:flex;gap:10px;align-items:center">${avatar(u)}<b>${uname(u)}</b></div>${activityCard(u)}</div>`)}</div>` : ""}
    ${friendTab === "add" ? h`
      <h2 style="font-size:17px;text-transform:uppercase;letter-spacing:.02em">Adicionar amigo</h2>
      <p class="muted" style="margin:6px 0 14px">Adicione amigos pelo nome de usuário do Cuplock.</p>
      <form id="addf" style="display:flex;gap:8px"><input class="input" name="u" placeholder="Digite um nome de usuário" autocomplete="off" autofocus><button class="btn">Adicionar</button></form>
      <div class="err" id="addErr"></div>
      <div class="card" style="margin-top:24px;padding:20px;display:flex;gap:16px;align-items:center;cursor:pointer" data-href="/discover">
        <div style="font-size:36px">🧭</div><div style="flex:1"><b>Procurando uma comunidade?</b><div class="muted small">Veja os servidores públicos na aba Explorar.</div></div><span class="btn ghost sm">Explorar</span></div>`
    : list.length ? h`<div class="side-label" style="padding-left:0">${friendTab === "online" ? "Online" : "Todos os amigos"} — ${list.length}</div>
      ${list.map(u => `<div class="friend-row" data-href="/dm/${u.id}">${avatar(u)}<div class="grow"><b>${uname(u)}</b> <span class="pronouns">@${esc(u.username)}</span><div class="muted small">${activityLine(u) || statusLabel[effStatus(u)]}</div></div>
        <div class="acts"><a class="icon-btn" href="/dm/${u.id}" data-link title="Mensagem">${ICON.chat}</a><button class="icon-btn" title="Mais" onclick="event.stopPropagation();friendMenu(event,'${u.id}')">${ICON.dots}</button></div></div>`)}`
    : `<div class="empty"><div class="e">🫂</div><div>${friendTab === "online" ? "Ninguém online agora." : "Nenhum amigo ainda — adicione alguém!"}</div><button class="btn sm" onclick="friendTab='add';render()">Adicionar amigo</button></div>`}
    </div></div>`;
  $("#addf")?.addEventListener("submit", async e => {
    e.preventDefault(); const u = e.target.u.value.trim(); if (!u) return;
    try { await addFriend(u); friendTab = "all"; render(); } catch (err) { $("#addErr").textContent = err.message; }
  });
}
async function addFriend(name) {
  const f = await q(sb.rpc("add_friend", { name }));
  S.users[f.id] = f; if (!S.friends.includes(f.id)) S.friends.push(f.id);
  toast(`Você e ${f.username} agora são amigos 🎉`);
  return f;
}

// ---------- explorar ----------
let discoverCache = null, discoverQuery = "";
async function renderDiscover(main) {
  document.title = "Explorar — Cuplock";
  main.innerHTML = h`<div class="top">${navBtn()}<span class="hash" style="color:var(--fg3)">${ICON.compass}</span><h1>Explorar</h1></div>
    <div class="content"><div class="hero"><h1>Encontre sua comunidade no Cuplock</h1><p>De games a música, de estudo a papo furado — tem lugar pra você.</p>
      <input class="input" id="dq" placeholder="Buscar comunidades…" value="${esc(discoverQuery)}"></div><div class="grid" id="dgrid"></div></div>`;
  const draw = () => {
    const g = $("#dgrid"); if (!g) return;
    const qq = discoverQuery.toLowerCase();
    const items = (discoverCache || []).filter(s => !qq || (s.name + s.description).toLowerCase().includes(qq));
    g.innerHTML = !discoverCache ? `<div class="muted">Carregando…</div>` : items.length ? items.map(s => {
      const joined = S.servers.some(x => x.id === s.id);
      return `<div class="card srv-card" data-href="/invite/${esc(s.invite)}"><div class="b" style="background:${esc(s.banner)}"></div><div class="i">${esc(s.icon)}</div>
        <div class="c"><h3>${esc(s.name)}</h3><p>${esc(s.description || "Sem descrição.")}</p><div class="meta"><span>● ${s.members} membro${s.members == 1 ? "" : "s"}</span>
        ${joined ? `<span class="btn ghost sm">Você está aqui</span>` : `<button class="btn sm" onclick="event.stopPropagation();joinInvite('${esc(s.invite)}')">Entrar</button>`}</div></div></div>`;
    }).join("") : `<div class="empty" style="grid-column:1/-1"><div class="e">🔍</div>${discoverQuery ? `Nada encontrado para “${esc(discoverQuery)}”.` : "Nenhuma comunidade pública ainda. Crie a primeira!"}</div>`;
  };
  draw();
  $("#dq").addEventListener("input", e => { discoverQuery = e.target.value; draw(); });
  try { discoverCache = await q(sb.rpc("discover")); } catch (e) { toast(e.message); discoverCache = []; }
  if (S.route.name === "discover") draw();
}
async function joinInvite(code) {
  try {
    const sid = await q(sb.rpc("join_invite", { code }));
    const s = await loadServer(sid);
    toast(`Bem-vindo a ${s.name}! 🎉`);
    navigate(`/server/${s.id}`);
  } catch (e) { toast(e.message); }
}

// ---------- perfis ----------
async function fetchProfile(key) {
  if (isUuid(key)) { await ensureUsers([key]); return S.users[key]; }
  const rows = await q(sb.from("profiles").select("*").ilike("username", key).limit(1));
  if (rows[0]) S.users[rows[0].id] = rows[0];
  return rows[0];
}
async function renderProfile(main) {
  main.innerHTML = `<div class="top">${navBtn()}<h1>Perfil</h1></div><div class="content"><div class="page" id="prof"><div class="muted">Carregando…</div></div></div>`;
  try {
    const u = await fetchProfile(S.route.params.id);
    if (!u) throw new Error("Usuário não encontrado.");
    $("#prof").innerHTML = profileCard(u, true); document.title = u.username + " — Cuplock";
  } catch (e) { $("#prof").innerHTML = `<div class="empty"><div class="e">🤖</div>${esc(e.message)}</div>`; }
}
function bannerCss(u) {
  if (u.banner_url && SAFE_URL.test(u.banner_url)) return `background:url('${u.banner_url}') center/cover`;
  if (u.banner && /^#[0-9a-f]{6},#[0-9a-f]{6}$/i.test(u.banner)) { const [a, b] = u.banner.split(","); return `background:linear-gradient(135deg,${a},${b})`; }
  return `background:linear-gradient(135deg,${esc(u.color)},var(--accent2))`;
}
function profileCard(u, actions) {
  const me = u.id === uid();
  const shared = S.servers.filter(s => s.members.includes(u.id) && !me);
  return h`<div class="profile-card" style="max-width:600px"><div class="b" style="${bannerCss(u)}"></div><div class="c">
    <div style="display:flex;justify-content:space-between;align-items:flex-end">${avatar(u, "xl")}
      ${actions && !me ? `<div style="display:flex;gap:8px;padding-bottom:6px">${S.friends.includes(u.id) ? "" : `<button class="btn ghost sm" onclick="addFriend('${esc(u.username)}').then(render).catch(e=>toast(e.message))">Adicionar amigo</button>`}<a class="btn sm" href="/dm/${u.id}" data-link>Mensagem</a></div>` : ""}</div>
    <h2 style="margin-top:8px">${uname(u)}</h2><div class="pronouns">@${esc(u.username)}${u.pronouns ? ` · ${esc(u.pronouns)}` : ""}</div>
    <div class="muted small">${statusLabel[effStatus(u)]}</div>
    ${u.custom_status || u.status_emoji ? `<div class="cstatus">${esc(u.status_emoji || "")} ${esc(u.custom_status || "")}</div>` : ""}
    ${activityCard(u)}
    ${u.bio ? `<div class="side-label" style="padding-left:0">Sobre mim</div><div class="text">${md(u.bio)}</div>` : ""}
    ${shared.length ? `<div class="side-label" style="padding-left:0">Servidores em comum — ${shared.length}</div><div style="display:flex;gap:8px;flex-wrap:wrap">${shared.map(s => `<a class="btn ghost sm" href="/server/${s.id}" data-link>${esc(s.icon)} ${esc(s.name)}</a>`).join("")}</div>` : ""}
  </div></div>`;
}
function profilePopout(e, id) {
  e.stopPropagation();
  const u = S.users[id]; if (!u) return;
  const me = u.id === uid();
  showCtx(e, `<div style="width:300px;margin:-6px"><div class="profile-card" style="border:0"><div class="b" style="height:70px;${bannerCss(u)}"></div><div class="c" style="padding:0 14px 14px">
    ${avatar(u, "xl")}<h3 style="margin-top:6px">${uname(u)}</h3><div class="pronouns">@${esc(u.username)}${u.pronouns ? ` · ${esc(u.pronouns)}` : ""}</div>
    ${u.custom_status || u.status_emoji ? `<div class="cstatus small">${esc(u.status_emoji || "")} ${esc(u.custom_status || "")}</div>` : `<div class="muted small">${statusLabel[effStatus(u)]}</div>`}
    ${activityCard(u)}${u.bio ? `<p class="small text" style="margin-top:10px">${md(u.bio)}</p>` : ""}
    <div style="display:flex;gap:6px;margin-top:12px">${me ? `<a class="btn sm ghost" style="flex:1" href="/settings/profile" data-link>Editar perfil</a>` : `<a class="btn sm" style="flex:1" href="/dm/${u.id}" data-link>Mensagem</a><a class="btn sm ghost" href="/user/${u.id}" data-link>Perfil</a>`}</div>
  </div></div></div>`);
}

// ---------- configurações ----------
let settingsTab = "account";
function renderSettings() {
  if (S.route.params.tab) { settingsTab = S.route.params.tab; S.route.params.tab = null; }
  document.title = "Configurações — Cuplock";
  const tabs = [["account", "👤 Minha conta"], ["profile", "🪪 Perfil"], ["activity", "🎮 Atividade"], ["appearance", "🎨 Aparência"], ["voice", "🎙️ Voz e vídeo"], ["chat", "💬 Chat"], ["notifications", "🔔 Notificações"], ["about", "☕ Sobre"]];
  let el = $(".settings");
  const keepScroll = el?.querySelector("section")?.scrollTop || 0;
  if (!el) el = document.body.appendChild(Object.assign(document.createElement("div"), { className: "settings" }));
  const u = S.me, p = S.prefs, t = THEMES[p.theme] || THEMES.meianoite;
  const toggle = (k, label, sub) => `<div class="row"><div class="l"><b>${label}</b><span>${sub}</span></div><button class="toggle ${p[k] ? "on" : ""}" onclick="setPref('${k}',!S.prefs.${k});renderSettings()"></button></div>`;
  const slider = (k, label, min, max, unit, step = 1) => `<div class="row"><div class="l" style="flex:1"><b>${label} <span class="muted" id="v-${k}">${p[k]}${unit}</span></b>
    <input type="range" min="${min}" max="${max}" step="${step}" value="${p[k]}" oninput="setPref('${k}',+this.value);document.getElementById('v-${k}').textContent=this.value+'${unit}'" style="margin-top:8px"></div></div>`;
  const seg = (k, opts) => `<div class="seg">${opts.map(([v, n]) => `<button class="${p[k] === v ? "on" : ""}" onclick="setPref('${k}','${v}');renderSettings()">${n}</button>`).join("")}</div>`;
  const banner = (u.banner || `${u.color},${p.accent2}`).split(",");
  const games = S.prefs.customGames || [];
  const sections = {
    account: h`<h2>Minha conta</h2><p>Login, segurança e status.</p>${profileCard(u, false)}
      <div class="row"><div class="l"><b>Nome de usuário</b><span>${esc(u.username)}</span></div></div>
      <div class="row"><div class="l"><b>E-mail</b><span>${esc(S.session.user.email)}</span></div></div>
      <div class="row"><div class="l"><b>Status</b><span>Como os outros te veem</span></div>
        <select class="input" style="width:auto" onchange="saveProfile({status:this.value}).then(trackPresence)">${["online", "idle", "busy", "invisible"].map(k => `<option value="${k}" ${u.status === k ? "selected" : ""}>${statusLabel[k]}</option>`)}</select></div>
      <label class="f" style="margin-top:22px">Trocar senha</label>
      <form id="pwf" style="display:flex;gap:8px;flex-wrap:wrap"><input class="input" type="password" name="p1" minlength="6" placeholder="Nova senha" autocomplete="new-password" style="flex:1;min-width:180px" required>
        <input class="input" type="password" name="p2" placeholder="Repita a nova senha" autocomplete="new-password" style="flex:1;min-width:180px" required><button class="btn">Salvar senha</button></form><div class="err" id="pwerr"></div>
      <div class="row"><div class="l"><b>Sair</b><span>Desconectar deste computador</span></div><button class="btn danger sm" onclick="logout()">Sair</button></div>`,
    profile: h`<h2>Perfil</h2><p>Como as pessoas te veem no Cuplock.</p>
      <div style="display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:24px;align-items:start" class="prof-grid"><div>
      <label class="f">Nome de exibição</label><input class="input" id="pf-dn" maxlength="32" placeholder="${esc(u.username)}" value="${esc(u.display_name || "")}">
      <p class="muted small" style="margin-top:6px">É o nome que aparece nas conversas. Pode ter espaço, acento e emoji. Seu @${esc(u.username)} continua o mesmo.</p>
      <label class="f">Foto de perfil</label>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">${avatar(u, "lg", false)}<button class="btn sm" onclick="uploadAvatar()">📁 Escolher do PC</button>${u.avatar_url ? `<button class="btn ghost sm" onclick="saveProfile({avatar_url:null})">Remover</button>` : ""}<span class="muted small">PNG, JPG, WEBP ou GIF animado · até 4 MB</span></div>
      <input type="hidden" id="pf-avatar" value="${esc(u.avatar_url || "")}">
      <label class="f">Banner</label>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><button class="btn sm" onclick="uploadBanner()">🖼️ Imagem do PC</button>${u.banner_url ? `<button class="btn ghost sm" onclick="saveProfile({banner_url:null})">Remover imagem</button>` : ""}<span class="muted small">${u.banner_url ? "Usando imagem" : "ou use um degradê:"}</span></div>
      <label class="f">Cor do perfil</label><div class="swatches">${["#ff6b6b", "#ffa94d", "#fcc419", "#51cf66", "#20c997", "#339af0", "#845ef7", "#f06595", "#e8590c", "#868e96"].map(c => `<button class="sw ${u.color === c ? "on" : ""}" style="background:${c}" onclick="saveProfile({color:'${c}'})"></button>`)}</div>
      <div style="display:flex;gap:10px;align-items:center;margin-top:10px">
        <input type="color" id="pf-b1" value="${banner[0]}" style="width:48px;height:36px;border:0;background:none"> → <input type="color" id="pf-b2" value="${banner[1]}" style="width:48px;height:36px;border:0;background:none">
        <div style="flex:1;height:36px;border-radius:10px;background:linear-gradient(135deg,${banner[0]},${banner[1]})" id="pf-bprev"></div></div>
      <label class="f">Pronomes</label><input class="input" id="pf-pron" maxlength="24" placeholder="ex: ele/dele, ela/dela" value="${esc(u.pronouns || "")}">
      <label class="f">Status personalizado</label><div style="display:flex;gap:8px"><input class="input" id="pf-emoji" maxlength="4" placeholder="😎" style="width:64px;text-align:center" value="${esc(u.status_emoji || "")}"><input class="input" id="pf-cs" maxlength="60" placeholder="O que está rolando?" value="${esc(u.custom_status || "")}"></div>
      <label class="f">Sobre mim</label><textarea class="input" id="bio" rows="4" maxlength="190" placeholder="Conte um pouco sobre você">${esc(u.bio)}</textarea>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px"><span class="muted small">Aceita **negrito**, *itálico* e \`código\`.</span><button class="btn" onclick="saveProfileForm()">Salvar perfil</button></div>
      <div class="err" id="pferr"></div></div>
      <div><label class="f">Prévia</label>${profileCard(u, false)}</div></div>`,
    activity: h`<h2>Atividade</h2><p>Mostre para seus amigos o que você está jogando — tipo rich presence.</p>
      ${toggle("showActivity", "Mostrar minha atividade", "Seus amigos veem “Jogando VALORANT · há 12 min” no seu perfil e na lista")}
      <div class="row"><div class="l"><b>Detecção automática de jogos</b><span>${invoke ? (S.detected > 0 ? `Ativa — verificando ${S.detected} programas a cada 15 s` : S.detected === -1 ? "Erro ao ler programas" : "Ativa") : "Disponível só no app de PC"}</span></div>
        ${invoke ? `<button class="btn ghost sm" onclick="detectActivity().then(()=>toast('Verificado'))">Verificar agora</button>` : ""}</div>
      <label class="f">Agora</label>${S.myActivity ? activityCard(S.me) : `<div class="game-row muted">Nada detectado no momento.</div>`}
      <label class="f" style="margin-top:24px">Atividade manual</label><p class="muted small" style="margin-bottom:8px">Aparece quando nenhum jogo for detectado (ou se você estiver no navegador).</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><select class="input" id="ma-type" style="width:auto">${Object.entries(ACT_LABEL).map(([k, v]) => `<option value="${k}" ${p.manualActivity?.type === k ? "selected" : ""}>${v || "Texto livre"}</option>`)}</select>
        <input class="input" id="ma-icon" maxlength="4" placeholder="🎮" style="width:64px;text-align:center" value="${esc(p.manualActivity?.icon || "")}">
        <input class="input" id="ma-name" maxlength="40" placeholder="ex: Xadrez com o vô" style="flex:1;min-width:160px" value="${esc(p.manualActivity?.name || "")}">
        <button class="btn sm" onclick="setPref('manualActivity',{type:$('#ma-type').value,icon:$('#ma-icon').value.trim(),name:$('#ma-name').value.trim()});detectActivity();toast('Atividade salva')">Salvar</button>
        <button class="btn ghost sm" onclick="setPref('manualActivity',null);detectActivity();renderSettings()">Limpar</button></div>
      <label class="f" style="margin-top:24px">Meus jogos</label><p class="muted small" style="margin-bottom:8px">Jogo não reconhecido? Adicione pelo nome do executável (veja no Gerenciador de Tarefas → Detalhes). Já conhecemos ${Object.keys(window.CUPLOCK_GAMES || {}).length} jogos.</p>
      ${games.map((g, i) => `<div class="game-row"><span style="font-size:20px">${esc(g.icon || "🎮")}</span><b style="flex:1">${esc(g.name)}</b><code class="muted small">${esc(g.exe)}</code><button class="icon-btn" onclick="S.prefs.customGames.splice(${i},1);setPref('customGames',S.prefs.customGames);renderSettings()">${ICON.x}</button></div>`).join("")}
      <form id="gf" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><input class="input" name="icon" maxlength="4" placeholder="🎮" style="width:64px;text-align:center">
        <input class="input" name="name" required maxlength="40" placeholder="Nome do jogo" style="flex:1;min-width:140px"><input class="input" name="exe" required maxlength="80" placeholder="jogo.exe" style="flex:1;min-width:140px"><button class="btn sm">Adicionar</button></form>`,
    appearance: h`<h2>Aparência</h2><p>Deixe o Cuplock com a sua cara. Tudo muda na hora.</p>
      <label class="f">Tema</label><div class="choice-grid">${Object.entries(THEMES).map(([k, th]) => `<button class="choice ${p.theme === k ? "on" : ""}" onclick="setPref('theme','${k}');renderSettings()"><div class="pv" style="background:linear-gradient(135deg,${th.bg0} 50%,${th.bg3} 50%)"><span style="position:absolute;left:10px;top:10px;width:40%;height:10px;border-radius:5px;background:${th.fg2}"></span><span style="position:absolute;right:10px;bottom:10px;width:30px;height:16px;border-radius:8px;background:linear-gradient(135deg,${p.accent},${p.accent2})"></span></div>${th.name}</button>`)}</div>
      <label class="f">Cores de destaque</label>
      <div class="swatches">${[["#a78bfa", "#f472b6"], ["#60a5fa", "#a78bfa"], ["#34d399", "#22d3ee"], ["#fb923c", "#f43f5e"], ["#facc15", "#fb923c"], ["#f472b6", "#fb7185"], ["#22d3ee", "#818cf8"], ["#e2e8f0", "#94a3b8"]].map(([a, b]) => `<button class="sw ${p.accent === a && p.accent2 === b ? "on" : ""}" style="background:linear-gradient(135deg,${a},${b})" onclick="setPref('accent','${a}');setPref('accent2','${b}');renderSettings()"></button>`)}
        <span class="muted small" style="margin-left:8px">ou escolha:</span><input type="color" value="${p.accent}" oninput="setPref('accent',this.value)" style="width:40px;height:34px;border:0;background:none"><input type="color" value="${p.accent2}" oninput="setPref('accent2',this.value)" style="width:40px;height:34px;border:0;background:none"></div>
      <label class="f">Papel de parede</label><div class="choice-grid">${Object.entries(WALLPAPERS).map(([k, w]) => `<button class="choice ${p.wallpaper === k ? "on" : ""}" onclick="setPref('wallpaper','${k}');renderSettings()"><div class="pv" style="background:${k === "imagem" && !p.wallUrl ? t.bg3 : w.css(p, t)}">${k === "imagem" && !p.wallUrl ? '<span style="position:absolute;inset:0;display:grid;place-items:center;font-size:24px">🖼️</span>' : ""}</div>${w.name}</button>`)}</div>
      ${p.wallpaper === "imagem" ? `<div style="display:flex;gap:8px;margin-top:10px"><input class="input" id="wurl" placeholder="https://… link direto da imagem" value="${esc(p.wallUrl)}"><button class="btn sm" onclick="const v=$('#wurl').value.trim();if(v&&!/^https:\\/\\/[^\\s&quot;'()<>]+$/.test(v))return toast('Use um link https:// direto para a imagem');setPref('wallUrl',v);renderSettings()">Aplicar</button></div>` : ""}
      ${slider("wallBlur", "Desfoque do fundo", 0, 30, "px")}${slider("wallDim", "Escurecer fundo", 0, 90, "%")}
      ${toggle("wallAnim", "Fundo animado", "Movimento suave nos fundos Aurora, Malha e Nebulosa")}
      <label class="f" style="margin-top:24px">Painéis</label>
      ${toggle("glass", "Efeito vidro", "Painéis translúcidos com desfoque")}${p.glass ? slider("panelOpacity", "Opacidade dos painéis", 40, 100, "%") : ""}
      ${slider("radius", "Arredondamento", 0, 32, "px")}${slider("gap", "Espaço entre painéis", 0, 24, "px")}
      <label class="f" style="margin-top:24px">Texto</label>
      <div class="seg">${Object.entries(FONTS).map(([k, f]) => `<button class="${p.font === k ? "on" : ""}" style="font-family:'${f[0]}',system-ui" onclick="setPref('font','${k}');renderSettings()">${k === "sistema" ? "Sistema" : f[0]}</button>`).join("")}</div>
      ${slider("fontSize", "Tamanho da fonte", 12, 20, "px")}
      <label class="f" style="margin-top:24px">Mensagens</label>${seg("msgStyle", [["bubbles", "💬 Balões"], ["classic", "📜 Clássico"], ["compact", "📏 Compacto"]])}
      <label class="f">Formato dos avatares</label>${seg("avatarShape", [["squircle", "▢ Arredondado"], ["round", "◯ Círculo"]])}
      ${toggle("reduceMotion", "Reduzir animações", "Desliga animações e rolagem suave")}
      <label class="f" style="margin-top:24px">CSS personalizado <span class="muted" style="text-transform:none;letter-spacing:0;font-weight:500">— para quem quer ir além</span></label>
      <textarea class="input" id="ccss" rows="5" spellcheck="false" style="font-family:ui-monospace,monospace;font-size:13px" placeholder=".bubble { border-radius: 4px; }">${esc(p.customCss)}</textarea>
      <div style="display:flex;gap:8px;margin-top:8px"><button class="btn sm" onclick="setPref('customCss',$('#ccss').value);toast('CSS aplicado')">Aplicar CSS</button>
        <button class="btn ghost sm" style="margin-left:auto" onclick="if(confirm('Voltar toda a aparência ao padrão?')){const keep={showActivity:S.prefs.showActivity,customGames:S.prefs.customGames,manualActivity:S.prefs.manualActivity,sounds:S.prefs.sounds,enterSends:S.prefs.enterSends};S.prefs=Object.assign({},DEFAULT_PREFS,keep);setPref('theme',S.prefs.theme);renderSettings()}">Restaurar padrão</button></div>`,
    voice: voiceSettingsHtml(),
    chat: h`<h2>Chat</h2><p>Como as conversas funcionam.</p>
      ${toggle("enterSends", "Enter envia a mensagem", "Desligado: use Ctrl + Enter para enviar")}${toggle("membersOpen", "Mostrar lista de membros", "Exibe os membros ao lado dos canais")}
      ${toggle("time24", "Relógio de 24 horas", "Mostra 18:30 em vez de 06:30 PM")}
      <div class="row"><div class="l"><b>Limpar cache</b><span>Recarrega as mensagens do servidor</span></div><button class="btn ghost sm" onclick="S.msgs={};toast('Cache limpo')">Limpar</button></div>`,
    notifications: h`<h2>Notificações</h2><p>Sons e avisos.</p>${toggle("sounds", "Sons de notificação", "Toca um som suave em novas mensagens")}
      <div class="row"><div class="l"><b>Notificações na área de trabalho</b><span>${"Notification" in window ? "Atual: " + ({ granted: "permitidas", denied: "bloqueadas", default: "não definidas" }[Notification.permission] || Notification.permission) : "Não suportado"}</span></div>
      <button class="btn ghost sm" onclick="Notification.requestPermission().then(renderSettings)">Ativar</button></div>
      <p class="muted small" style="margin-top:12px">Com o status <b>Não perturbe</b>, nenhum som toca.</p>`,
    about: h`<h2>Sobre</h2><p>Cuplock <span id="appver">${VERSION}</span></p>
      <div class="row"><div class="l"><b>Atualizações</b><span>${window.__TAURI__ ? (window.CUPLOCK_CONFIG?.UPDATE_REPO ? "Verifica sozinho ao abrir e a cada 3 horas" : "Não configurado (gere o app pelo GitHub Actions)") : "Só no app de PC"}</span></div><button class="btn ghost sm" onclick="checkUpdate(true)">Procurar atualização</button></div>
      <div class="row"><div class="l"><b>Instalar atualizações automaticamente</b><span>Baixa e reinicia sozinho (avisa 10 s antes; nunca durante uma call)</span></div><button class="toggle ${S.prefs.autoUpdate !== false ? "on" : ""}" onclick="setPref('autoUpdate',S.prefs.autoUpdate===false);renderSettings()"></button></div><div class="card" style="padding:20px;display:flex;gap:16px;align-items:center"><img src="icon.svg" width="56"><div><b style="font-size:18px">Cuplock</b><div class="muted small">App de mensagens feito em Rust (Tauri) + Supabase.</div></div></div>
      <div class="row"><div class="l"><b>Ferramentas de desenvolvedor</b><span>Conexão, rotas e eventos ao vivo</span></div><a class="btn ghost sm" href="/dev" data-link>Abrir</a></div>
      <div class="row"><div class="l"><b>Atalhos</b><span><code>Ctrl K</code> busca rápida · <code>Esc</code> fechar · <code>Shift+Enter</code> nova linha</span></div></div>`,
  };
  el.innerHTML = h`<nav><div class="side-label">Configurações</div>${tabs.map(([k, n]) => `<button class="item ${settingsTab === k ? "on" : ""}" style="width:100%" onclick="settingsTab='${k}';history.replaceState({},'','#/settings/${k}');renderSettings();$('.settings section').scrollTop=0">${n}</button>`)}
    <div style="height:1px;background:var(--line);margin:10px 8px"></div><button class="item" style="width:100%;color:var(--busy)" onclick="logout()">↩ Sair</button></nav>
    <section><div><div class="mtabs tabs" style="flex-wrap:wrap;margin-bottom:16px;width:auto">${tabs.map(([k, n]) => `<button class="tab ${settingsTab === k ? "on" : ""}" onclick="settingsTab='${k}';renderSettings()">${n}</button>`)}</div>${sections[settingsTab] || sections.account}</div></section>
    <div class="close-x"><button class="icon-btn" onclick="closeSettings()" aria-label="Fechar" style="background:var(--bg3)">${ICON.x}</button></div>`;
  el.querySelector("section").scrollTop = keepScroll;
  if (settingsTab === "about") appVersion().then(v => { const a = document.getElementById("appver"); if (a) a.textContent = v; });
  if (settingsTab === "voice" && !S.devices) listDevices(false);
  $("#pwf")?.addEventListener("submit", async e => {
    e.preventDefault(); const f = e.target;
    if (f.p1.value !== f.p2.value) return ($("#pwerr").textContent = "As senhas não são iguais.");
    try { await q(sb.auth.updateUser({ password: f.p1.value })); f.reset(); $("#pwerr").textContent = ""; toast("Senha alterada ✓"); }
    catch (err) { $("#pwerr").textContent = err.message; }
  });
  const bp = () => { const pv = $("#pf-bprev"); if (pv) pv.style.background = `linear-gradient(135deg,${$("#pf-b1").value},${$("#pf-b2").value})`; };
  $("#pf-b1")?.addEventListener("input", bp); $("#pf-b2")?.addEventListener("input", bp);
  $("#gf")?.addEventListener("submit", e => {
    e.preventDefault(); const f = e.target;
    const g = { name: f.name.value.trim(), exe: f.exe.value.trim().toLowerCase(), icon: f.icon.value.trim() || "🎮" };
    if (!g.exe.includes(".")) g.exe += ".exe";
    setPref("customGames", [...(S.prefs.customGames || []), g]); detectActivity(); renderSettings(); toast(`${g.name} adicionado`);
  });
}
async function saveProfileForm() {
  const av = $("#pf-avatar").value.trim();
  if (av && !/^https:\/\/[^\s"'()<>\\]+$/.test(av)) return ($("#pferr").textContent = "O link da foto precisa começar com https:// e não pode ter espaços.");
  await saveProfile({
    display_name: $("#pf-dn").value.trim() || null,
    avatar_url: av || null, banner: `${$("#pf-b1").value},${$("#pf-b2").value}`, pronouns: $("#pf-pron").value.trim() || null,
    status_emoji: $("#pf-emoji").value.trim() || null, custom_status: $("#pf-cs").value.trim() || null, bio: $("#bio").value,
  });
}
function closeSettings() { navigate(settingsBack && !settingsBack.startsWith("/settings") ? settingsBack : "/friends"); }
async function saveProfile(patch) {
  try {
    const u = await q(sb.from("profiles").update(patch).eq("id", uid()).select().single());
    S.me = u; S.users[u.id] = u; toast("Salvo ✓");
    if (S.route.name === "settings") renderSettings();
    renderChrome(); renderMembers();
  } catch (e) { toast(e.message); }
}

// ---------- primeira configuração ----------
function renderSetup() {
  document.title = "Configurar — Cuplock";
  const noLib = !window.supabase;
  app.innerHTML = h`<div class="center"><div class="panel">
    <div class="brand"><img src="icon.svg" alt="">Cuplock</div>
    <h1>Conectar ao Supabase</h1><p class="sub">Só precisa fazer isso uma vez. Pegue os dados em <b>Supabase → Project Settings → API</b>.</p>
    ${noLib ? `<div class="err">Não foi possível carregar a biblioteca do Supabase. Verifique sua internet e reabra o app.</div>` : ""}
    <form id="sf"><label class="f">Project URL</label><input class="input" name="url" placeholder="https://xxxxxxxx.supabase.co" required>
      <label class="f">anon public key</label><input class="input" name="key" placeholder="eyJhbGciOi…" required>
      <div class="err" id="serr"></div><button class="btn grad" style="width:100%;padding:12px" ${noLib ? "disabled" : ""}>Conectar</button></form></div></div>`;
  $("#sf").addEventListener("submit", async e => {
    e.preventDefault(); const f = e.target, btn = f.querySelector("button"); btn.disabled = true;
    const cfg = { SUPABASE_URL: f.url.value.trim(), SUPABASE_ANON_KEY: f.key.value.trim() };
    try {
      if (!/^https:\/\/.+/.test(cfg.SUPABASE_URL)) throw new Error("A URL precisa começar com https://");
      const test = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, { auth: { persistSession: false } });
      const { error } = await test.rpc("username_available", { name: "teste" });
      if (error) throw new Error(/function|not find|schema cache/i.test(error.message) ? "Conectou, mas o banco não está pronto. Rode o arquivo supabase/schema.sql no SQL Editor." : trErr(error.message));
      localStorage.setItem("cl.cfg", JSON.stringify(cfg));
      location.hash = "#/login"; location.reload();
    } catch (err) { $("#serr").textContent = err.message; btn.disabled = false; }
  });
}

// ---------- login / cadastro ----------
let authMode = "login";
function renderLogin() {
  document.title = (authMode === "login" ? "Entrar" : "Criar conta") + " — Cuplock";
  const next = curQuery().get("next") || "";
  const inviting = next.startsWith("/invite/");
  const reg = authMode === "register";
  app.innerHTML = h`<div class="center"><div class="panel">
    <div class="brand"><img src="icon.svg" alt="">Cuplock</div>
    <h1>${inviting ? "Você foi convidado!" : reg ? "Criar sua conta" : "Bem-vindo de volta!"}</h1>
    <p class="sub">${inviting ? "Entre ou crie uma conta para aceitar o convite." : reg ? "É rapidinho. Bora conversar ☕" : "Que bom te ver de novo."}</p>
    <div class="tabs" style="margin-top:18px"><button class="tab ${!reg ? "on" : ""}" onclick="authMode='login';renderLogin()">Entrar</button><button class="tab ${reg ? "on" : ""}" onclick="authMode='register';renderLogin()">Criar conta</button></div>
    <form id="af" autocomplete="on">
      ${reg ? `<label class="f" for="un">Nome de usuário</label><input class="input" id="un" name="username" maxlength="24" autocomplete="username" required placeholder="ex: paulo_dev"><div class="small" id="unhint" style="min-height:18px;margin-top:4px"></div>` : ""}
      <label class="f" for="em">E-mail</label><input class="input" id="em" name="email" type="email" autocomplete="email" required placeholder="voce@email.com" value="${esc(localStorage.getItem("cl.lastEmail") || "")}">
      <label class="f" for="pw">Senha</label><input class="input" id="pw" name="password" type="password" minlength="6" autocomplete="${reg ? "new-password" : "current-password"}" required placeholder="${reg ? "Mínimo 6 caracteres" : "Sua senha"}">
      ${reg ? `<label class="f" for="pw2">Confirmar senha</label><input class="input" id="pw2" name="password2" type="password" autocomplete="new-password" required>` : ""}
      <div class="err" id="aerr"></div>
      <button class="btn grad" style="width:100%;padding:12px">${reg ? "Criar conta" : "Entrar"}</button></form>
    <p class="muted small" style="margin-top:18px;text-align:center"><a href="#" onclick="event.preventDefault();localStorage.removeItem('cl.cfg');location.hash='#/setup';location.reload()">Trocar servidor</a> · <a href="/dev" data-link>Desenvolvedor</a></p>
  </div></div>`;
  (reg ? $("#un") : $("#em").value ? $("#pw") : $("#em")).focus();
  let t;
  $("#un")?.addEventListener("input", e => {
    clearTimeout(t); const v = e.target.value.trim(), hint = $("#unhint");
    if (!v) return (hint.textContent = "");
    if (!/^[A-Za-z0-9_.]{2,24}$/.test(v)) { hint.style.color = "var(--busy)"; hint.textContent = "Use 2–24 letras, números, _ ou ."; return; }
    t = setTimeout(async () => {
      const { data, error } = await sb.rpc("username_available", { name: v });
      if (error) {
        hint.style.color = "var(--idle)";
        hint.textContent = /function|schema cache|not find|404/i.test(error.message + error.code)
          ? "⚠ Banco não configurado: rode o schema.sql no Supabase (SQL Editor)."
          : "⚠ Não deu para verificar: " + trErr(error.message);
        return;
      }
      hint.style.color = data ? "var(--ok)" : "var(--busy)"; hint.textContent = data ? "✓ Disponível" : "✗ Já está em uso";
    }, 350);
  });
  $("#af").addEventListener("submit", async e => {
    e.preventDefault(); const f = e.target, btn = f.querySelector("button"), err = $("#aerr");
    err.textContent = ""; btn.disabled = true;
    try {
      const email = f.email.value.trim(), password = f.password.value;
      let session;
      if (reg) {
        const username = f.username.value.trim();
        if (!/^[A-Za-z0-9_.]{2,24}$/.test(username)) throw new Error("Nome de usuário: 2–24 letras, números, _ ou .");
        if (password !== f.password2.value) throw new Error("As senhas não são iguais.");
        if (!(await q(sb.rpc("username_available", { name: username })))) throw new Error("Esse nome de usuário já está em uso.");
        const d = await q(sb.auth.signUp({ email, password, options: { data: { username } } }));
        if (!d.session) throw new Error("Conta criada, mas o Supabase está pedindo confirmação de e-mail. Desative em Authentication → Sign In / Providers → Email → “Confirm email”.");
        session = d.session;
      } else {
        session = (await q(sb.auth.signInWithPassword({ email, password }))).session;
      }
      localStorage.setItem("cl.lastEmail", email);
      S.session = session; S.loaded = false;
      navigate(next || "/", true);
    } catch (x) { err.textContent = x.message; btn.disabled = false; }
  });
}

// ---------- convite ----------
async function renderInvite() {
  const code = S.route.params.code;
  app.innerHTML = `<div class="center"><div class="panel" id="inv" style="text-align:center"><div class="muted">Verificando convite…</div></div></div>`;
  try {
    const s = await q(sb.rpc("invite_preview", { code }));
    if (!s) throw new Error("Este convite é inválido ou expirou.");
    const joined = S.servers.some(x => x.id === s.id);
    document.title = `Entrar em ${s.name} — Cuplock`;
    $("#inv").innerHTML = h`<p class="muted small">${s.inviter ? `<b>${esc(s.inviter)}</b> convidou você para` : "Você foi convidado para"}</p>
      <div class="invite-srv"><div class="i" style="background:${esc(s.banner)}">${esc(s.icon)}</div><h1>${esc(s.name)}</h1>
      <p class="sub">${esc(s.description)}</p><p class="small"><span style="color:var(--ok)">●</span> ${s.members} membro${s.members == 1 ? "" : "s"}</p></div>
      ${!S.session ? `<a class="btn grad" style="width:100%;padding:12px" href="/login?next=${encodeURIComponent(curPath())}" data-link>Entrar para aceitar</a>`
        : joined ? `<a class="btn ok" style="width:100%;padding:12px" href="/server/${s.id}" data-link>Você já participa — abrir servidor</a>`
        : `<button class="btn grad" style="width:100%;padding:12px" onclick="joinInvite('${esc(code)}')">Aceitar convite</button>`}
      ${S.session ? `<a class="muted small" style="display:block;margin-top:14px" href="/friends" data-link>Agora não</a>` : ""}`;
  } catch (e) {
    $("#inv").innerHTML = `<div style="font-size:56px">🥀</div><h1>Convite inválido</h1><p class="sub">${esc(e.message)}</p><br><a class="btn" href="${S.session ? "/discover" : "/login"}" data-link>${S.session ? "Explorar comunidades" : "Entrar"}</a>`;
  }
}

// ---------- entrada do app (PWA / desktop) ----------
const IS_DESKTOP = !!(window.__TAURI__ || window.__TAURI_INTERNALS__) || /tauri/.test(location.host + location.protocol);
function renderPwa() {
  if (IS_DESKTOP) return navigate(S.session ? "/" : "/login", true);
  app.innerHTML = h`<div class="center"><div class="panel" style="text-align:center">
    <img src="icon.svg" width="88" style="margin-bottom:14px"><h1>Cuplock para PC</h1>
    <p class="sub">Você está usando a versão de navegador. Instale o app de PC (instalador .exe) para uma janela própria, notificações e inicialização rápida.</p><br>
    <a class="btn ghost" style="width:100%" href="${S.session ? "/" : "/login"}" data-link>Continuar no navegador</a></div></div>`;
}

// ---------- desenvolvedor ----------
async function renderDev() {
  document.title = "Desenvolvedor — Cuplock";
  const c = getCfg() || {};
  app.innerHTML = h`<div style="flex:1;overflow-y:auto;background:var(--bg2)" class="dev"><div class="page" style="margin:0 auto">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:6px"><div class="brand" style="margin:0"><img src="icon.svg">Cuplock <span class="tag">DEV</span></div>
    <a class="btn ghost sm" href="${S.session ? "/" : "/login"}" data-link>Voltar ao app</a></div>
    <div class="stats" id="stats"></div>
    <div class="side-label" style="padding-left:0">Conexão</div>
    <div class="card" style="padding:14px 16px;line-height:1.8">
      Servidor: <code>${esc(c.SUPABASE_URL || "não configurado")}</code><br>
      Chave: <code>${esc((c.SUPABASE_ANON_KEY || "").slice(0, 12))}…</code><br>
      Modo: <b>${IS_DESKTOP ? "App de PC (Tauri)" : "Navegador"}</b> · Versão ${VERSION}<br>
      Sessão: ${S.session ? `<b>${esc(S.me?.username || S.session.user.email)}</b> · <button class="btn ghost sm" onclick="logout()">Sair</button>` : `não logado · <a href="/login?next=/dev" data-link>Entrar</a>`}<br>
      Tempo real: <b id="rts">${esc(S.rtStatus)}</b></div>
    <div class="side-label" style="padding-left:0">Rotas do app</div>
    <div>${[["/login", "Entrar / criar conta"], ["/friends", "Amigos (início)"], ["/discover", "Explorar"], ["/settings", "Configurações"], ["/invite/:code", "Convite"], ["/bot/:id", "Perfil (bots e usuários)"], ["/server/:sid", "Servidor"], ["/server/:sid/channel/:cid", "Canal"], ["/dm/:uid", "Mensagem direta"], ["/pwa", "Entrada do app"], ["/setup", "Configurar servidor"], ["/dev", "Esta página"]]
      .map(([p, n]) => `<div class="route"><a href="${devExample(p)}" data-link>${p}</a><span class="muted">${n}</span></div>`)}</div>
    <div class="side-label" style="padding-left:0">Testar consulta</div>
    <form id="qf" style="display:flex;gap:8px;flex-wrap:wrap"><select class="input" name="t" style="width:auto">${["profiles", "servers", "channels", "members", "friends", "messages"].map(t => `<option>${t}</option>`)}</select><button class="btn">Consultar (5 linhas)</button></form>
    <pre id="qout" style="margin-top:10px">—</pre>
    <div class="side-label" style="padding-left:0">Eventos ao vivo</div>
    <pre id="evlog">${S.events.length ? "" : "Aguardando eventos…"}</pre></div></div>`;
  $("#qf").addEventListener("submit", async e => {
    e.preventDefault();
    if (!sb || !S.session) return ($("#qout").textContent = "Entre na sua conta primeiro.");
    const t0 = performance.now();
    try { const d = await q(sb.from(e.target.t.value).select("*").limit(5)); $("#qout").textContent = `OK · ${(performance.now() - t0).toFixed(0)}ms\n` + JSON.stringify(d, null, 2); }
    catch (err) { $("#qout").textContent = "Erro · " + err.message; }
  });
  const tick = async () => {
    if (S.route.name !== "dev") return;
    if (sb && S.session) {
      const counts = await Promise.all(["servers", "channels", "friends"].map(t => sb.from(t).select("*", { count: "exact", head: true }).then(r => [t, r.count ?? "—"])));
      const lbl = { servers: "servidores visíveis", channels: "canais acessíveis", friends: "amizades" };
      const st = $("#stats"); if (st) st.innerHTML = [...counts.map(([t, n]) => [lbl[t], n]), ["usuários carregados", Object.keys(S.users).length]].map(([k, v]) => `<div class="card stat"><b>${esc(v)}</b><span>${esc(k)}</span></div>`).join("");
    }
    const rts = $("#rts"); if (rts) rts.textContent = S.rtStatus;
    const log = $("#evlog"); if (log && S.events.length) log.textContent = S.events.slice(0, 40).map(x => new Date(x.t).toLocaleTimeString("pt-BR") + "  " + JSON.stringify(x.ev)).join("\n");
    setTimeout(tick, 3000);
  };
  tick();
}
function devExample(p) {
  const s = S.servers?.[0], me = uid() || "x", fr = S.friends?.[0] || me;
  return p.replace(":sid", s?.id || "x").replace(":cid", s?.channels[0]?.id || "x").replace(":code", s?.invite || "codigo").replace(":id", me).replace(":uid", fr);
}

// ---------- modais, menus, avisos ----------
const layer = $("#layer");
function closeLayer() { layer.innerHTML = ""; }
function modal(html, onMount) {
  layer.innerHTML = `<div class="modal-bg" onmousedown="if(event.target===this)closeLayer()"><div class="modal" role="dialog" aria-modal="true">${html}</div></div>`;
  onMount?.(layer.querySelector(".modal")); layer.querySelector("input,textarea")?.focus();
}
function createServerModal() {
  modal(h`<h2>Crie seu servidor</h2><p class="sub">Seu servidor é onde você e seus amigos se encontram.</p>
    <form id="csf"><label class="f">Nome do servidor</label><input class="input" name="name" maxlength="40" required value="Servidor de ${esc(S.me.username)}">
    <label class="f">Ícone (emoji)</label><input class="input" name="icon" maxlength="4" placeholder="☕">
    <label class="f">Descrição</label><input class="input" name="description" maxlength="160" placeholder="Sobre o que é?">
    <div class="row" style="border:0"><div class="l"><b>Mostrar no Explorar</b><span>Qualquer pessoa pode encontrar e entrar</span></div><input type="checkbox" name="disc" style="width:20px;height:20px;accent-color:var(--accent)"></div>
    <div class="err" id="cserr"></div>
    <div class="acts"><button type="button" class="btn ghost" onclick="closeLayer()">Cancelar</button><button class="btn">Criar</button></div></form>
    <div style="text-align:center;margin-top:8px" class="small muted">Já tem um convite? <a href="#" onclick="event.preventDefault();joinByCodeModal()">Entrar em um servidor</a></div>`, m => {
    $("#csf", m).addEventListener("submit", async e => {
      e.preventDefault(); const f = e.target, btn = f.querySelector(".btn:not(.ghost)"); btn.disabled = true;
      const banners = ["#7c5cff,#ff6bcb", "#12b886,#3bc9db", "#f76707,#fab005", "#4263eb,#9775fa", "#e03131,#9c36b5"];
      try {
        const row = await q(sb.from("servers").insert({ name: f.name.value.trim(), icon: f.icon.value.trim() || f.name.value.trim()[0].toUpperCase(), description: f.description.value.trim(),
          discoverable: f.disc.checked, banner: `linear-gradient(135deg,${banners[Math.floor(Math.random() * banners.length)]})` }).select("id").single());
        const s = await loadServer(row.id);
        closeLayer(); navigate(`/server/${s.id}`); setTimeout(() => inviteModal(s.id), 300);
      } catch (err) { $("#cserr").textContent = err.message; btn.disabled = false; }
    });
  });
}
function joinByCodeModal() {
  modal(h`<h2>Entrar em um servidor</h2><p class="sub">Digite o código de convite.</p>
    <form id="jf"><label class="f">Convite</label><input class="input" name="c" required placeholder="ex: cuplock ou a1b2c3d4">
    <div class="err" id="jerr"></div><div class="acts"><button type="button" class="btn ghost" onclick="createServerModal()">Voltar</button><button class="btn">Continuar</button></div></form>`, m => {
    $("#jf", m).addEventListener("submit", e => { e.preventDefault(); const code = e.target.c.value.trim().replace(/^cuplock:/i, "").split("/").filter(Boolean).pop(); closeLayer(); navigate("/invite/" + encodeURIComponent(code)); });
  });
}
function inviteModal(sid) {
  const s = S.servers.find(x => x.id === sid); if (!s) return;
  const share = `cuplock:${s.invite}`;
  const fr = S.friends.map(id => S.users[id]).filter(u => u && !s.members.includes(u.id));
  modal(h`<h2>Convidar para ${esc(s.name)}</h2><p class="sub">Mande para um amigo ou compartilhe o código.</p>
    ${fr.length ? `<div style="max-height:220px;overflow-y:auto;margin-top:14px">${fr.map(u => `<div class="item" style="cursor:default">${avatar(u)}<span class="grow">${uname(u)}</span><button class="btn ghost sm" onclick="sendInvite('${u.id}','${esc(share)}',this)">Convidar</button></div>`).join("")}</div>` : ""}
    <label class="f">Código de convite</label><div class="copy-row"><input readonly value="${esc(s.invite)}" onclick="this.select()"><button class="btn sm" onclick="copy('${esc(s.invite)}');this.textContent='Copiado!'">Copiar</button></div>
    <p class="muted small" style="margin-top:10px">Seu amigo clica em <b>+</b> → “Entrar em um servidor” e cola o código.</p>`);
}
async function sendInvite(friendId, share, btn) {
  btn.disabled = true;
  try { await q(sb.from("messages").insert({ dm_key: dmId(uid(), friendId).slice(3), content: `Bora pro meu servidor! ${share}` })); btn.textContent = "Enviado ✓"; }
  catch (e) { toast(e.message); btn.disabled = false; }
}
function createChannelModal(sid) {
  modal(h`<h2>Criar canal</h2><form id="ccf"><label class="f">Nome do canal</label>
    <div class="copy-row"><span class="muted" style="font-size:18px">#</span><input name="name" maxlength="32" required placeholder="novo-canal"></div>
    <label class="f">Tópico (opcional)</label><input class="input" name="topic" maxlength="120">
    <div class="err" id="ccerr"></div><div class="acts"><button type="button" class="btn ghost" onclick="closeLayer()">Cancelar</button><button class="btn">Criar canal</button></div></form>`, m => {
    $("#ccf", m).addEventListener("submit", async e => {
      e.preventDefault();
      const name = e.target.name.value.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "-").replace(/[^a-z0-9_-]/g, "").slice(0, 32);
      if (!name) return ($("#ccerr").textContent = "Use letras, números, - ou _.");
      try {
        const c = await q(sb.from("channels").insert({ server_id: sid, name, topic: e.target.topic.value.trim() }).select().single());
        const s = S.servers.find(x => x.id === sid); if (!s.channels.some(x => x.id === c.id)) s.channels.push(c);
        closeLayer(); navigate(`/server/${sid}/channel/${c.id}`);
      } catch (err) { $("#ccerr").textContent = err.message; }
    });
  });
}
function showCtx(e, html) {
  e.preventDefault(); e.stopPropagation();
  layer.innerHTML = `<div class="ctx">${html}</div>`;
  const c = layer.firstChild, r = c.getBoundingClientRect();
  c.style.left = Math.max(8, Math.min(e.clientX, innerWidth - r.width - 8)) + "px";
  c.style.top = Math.max(8, Math.min(e.clientY, innerHeight - r.height - 8)) + "px";
}
document.addEventListener("mousedown", e => { if (layer.querySelector(".ctx") && !e.target.closest(".ctx")) closeLayer(); });
function serverMenu(e, sid) {
  const s = S.servers.find(x => x.id === sid), owner = s.owner === uid();
  showCtx(e, `<button onclick="inviteModal('${sid}')">Convidar pessoas</button>${owner ? `<button onclick="createChannelModal('${sid}')">Criar canal</button>` : ""}
    <button onclick="copy('${esc(s.invite)}');closeLayer()">Copiar código de convite</button>
    ${owner ? `<button class="danger" onclick="deleteServer('${sid}')">Excluir servidor</button>` : `<button class="danger" onclick="leaveServer('${sid}')">Sair do servidor</button>`}`);
}
async function leaveServer(sid) {
  const s = S.servers.find(x => x.id === sid); closeLayer();
  if (!confirm(`Sair de ${s.name}? Você vai precisar de um convite para voltar.`)) return;
  try { await q(sb.from("members").delete().eq("server_id", sid).eq("user_id", uid())); S.servers = S.servers.filter(x => x.id !== sid); S.lastChannel._ = "/friends"; navigate("/friends"); }
  catch (e) { toast(e.message); }
}
async function deleteServer(sid) {
  const s = S.servers.find(x => x.id === sid); closeLayer();
  if (prompt(`Isso apaga ${s.name} e todas as mensagens para sempre.\nDigite o nome do servidor para confirmar:`) !== s.name) return;
  try { await q(sb.from("servers").delete().eq("id", sid)); S.servers = S.servers.filter(x => x.id !== sid); S.lastChannel._ = "/friends"; toast("Servidor excluído"); navigate("/friends"); }
  catch (e) { toast(e.message); }
}
function friendMenu(e, id) {
  showCtx(e, `<button onclick="navigate('/user/${id}')">Ver perfil</button><button onclick="navigate('/dm/${id}')">Mensagem</button><button class="danger" onclick="removeFriend('${id}')">Remover amigo</button>`);
}
async function removeFriend(id) {
  closeLayer();
  try { await q(sb.rpc("remove_friend", { fid: id })); S.friends = S.friends.filter(f => f !== id); render(); toast("Amigo removido"); } catch (e) { toast(e.message); }
}
function statusMenu(e) {
  showCtx(e, ["online", "idle", "busy", "invisible"].map(k => `<button onclick="closeLayer();saveProfile({status:'${k}'}).then(trackPresence)"><span class="dot ${k}" style="position:static;display:inline-block;width:10px;height:10px;border-radius:50%;margin:5px 10px 0 0;background:var(--fg3)"></span>${statusLabel[k]}</button>`).join(""));
}
function quickSwitcher() {
  const items = [
    ...S.servers.flatMap(s => s.channels.map(c => ({ label: `# ${c.name}`, sub: s.name, href: `/server/${s.id}/channel/${c.id}` }))),
    ...S.friends.map(id => S.users[id]).filter(Boolean).map(u => ({ label: `@ ${dname(u)}`, sub: "@" + u.username, href: `/dm/${u.id}` })),
    { label: "🧭 Explorar", sub: "Encontrar comunidades", href: "/discover" }, { label: "⚙️ Configurações", sub: "", href: "/settings" }, { label: "🎨 Aparência", sub: "Personalizar", href: "/settings/appearance" }, { label: "🛠 Desenvolvedor", sub: "", href: "/dev" },
  ];
  modal(`<input class="input" id="qs" placeholder="Para onde você quer ir?" style="font-size:17px;padding:14px"><div id="qsl" style="margin-top:10px;max-height:340px;overflow-y:auto"></div>`, m => {
    let sel = 0, cur = items;
    const draw = () => { $("#qsl").innerHTML = cur.slice(0, 30).map((it, i) => `<div class="item ${i === sel ? "on" : ""}" data-href="${it.href}"><span class="grow">${esc(it.label)}</span><span class="muted small">${esc(it.sub)}</span></div>`).join("") || `<p class="muted" style="padding:10px">Nada encontrado</p>`; };
    const inp = $("#qs", m); draw();
    inp.addEventListener("input", () => { const qq = inp.value.toLowerCase().replace(/^[#@]\s*/, ""); cur = items.filter(i => (i.label + i.sub).toLowerCase().includes(qq)); sel = 0; draw(); });
    inp.addEventListener("keydown", e => {
      if (e.key === "ArrowDown") { sel = Math.min(sel + 1, cur.length - 1); draw(); e.preventDefault(); }
      if (e.key === "ArrowUp") { sel = Math.max(sel - 1, 0); draw(); e.preventDefault(); }
      if (e.key === "Enter" && cur[sel]) navigate(cur[sel].href);
    });
  });
}
let toastT;
function toast(msg) {
  document.querySelector(".toast")?.remove();
  const t = Object.assign(document.createElement("div"), { className: "toast", textContent: msg });
  document.body.appendChild(t); clearTimeout(toastT); toastT = setTimeout(() => t.remove(), 3200);
}
function copy(text) {
  (navigator.clipboard?.writeText(text) || Promise.reject()).then(() => toast("Copiado!")).catch(() => {
    const ta = Object.assign(document.createElement("textarea"), { value: text }); document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); toast("Copiado!"); } catch { toast(text); } ta.remove();
  });
}

document.addEventListener("click", () => document.querySelector(".tip")?.remove(), true);
document.addEventListener("mouseover", e => {
  const t = e.target.closest("[data-tip]"); document.querySelector(".tip")?.remove(); if (!t) return;
  const r = t.getBoundingClientRect(), tip = Object.assign(document.createElement("div"), { className: "tip", textContent: t.dataset.tip });
  document.body.appendChild(tip); tip.style.left = r.right + 14 + "px"; tip.style.top = r.top + r.height / 2 - tip.offsetHeight / 2 + "px";
});
document.addEventListener("keydown", e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k" && S.session) { e.preventDefault(); quickSwitcher(); }
  if (e.key === "Escape") { if (layer.innerHTML) closeLayer(); else if (S.route.name === "settings") closeSettings(); }
});
document.addEventListener("visibilitychange", () => {
  const c = currentChannel();
  if (document.visibilityState === "visible" && c && S.unread.has(c)) { S.unread.delete(c); appendMessage(); renderChrome(); }
});

// ---------- início ----------
(async () => {
  if (initSupabase()) {
    const { data } = await sb.auth.getSession();
    S.session = data.session;
    sb.auth.onAuthStateChange((event, session) => {
      S.session = session;
      if (event === "SIGNED_OUT" && S.loaded) { S.loaded = false; navigate("/login", true); }
    });
  }
  route();
})();
