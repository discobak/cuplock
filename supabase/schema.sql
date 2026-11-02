-- =====================================================================
--  CUPLOCK — banco de dados Supabase
--  Cole TUDO isto no Supabase: SQL Editor → New query → Run.
--  Pode rodar de novo sem problema — rodar de novo também ATUALIZA um banco antigo.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- tabelas ----------
create table if not exists public.profiles (
  id uuid primary key,
  username text not null check (username ~ '^[A-Za-z0-9_.]{2,24}$'),
  status text not null default 'online' check (status in ('online','idle','busy','invisible')),
  bio text not null default '' check (char_length(bio) <= 190),
  color text not null default '#8b6cff' check (color ~ '^#[0-9a-fA-F]{6}$'),
  bot boolean not null default false,
  prefs jsonb,
  created_at timestamptz not null default now()
);
create unique index if not exists profiles_username_lower on public.profiles (lower(username));

-- campos de personalização do perfil (v2)
alter table public.profiles add column if not exists avatar_url text
  check (avatar_url is null or (avatar_url ~ '^https://[^\s"''()<>\\]+$' and char_length(avatar_url) <= 500));
alter table public.profiles add column if not exists banner text
  check (banner is null or banner ~ '^#[0-9a-fA-F]{6},#[0-9a-fA-F]{6}$');
alter table public.profiles add column if not exists pronouns text check (pronouns is null or char_length(pronouns) <= 24);
alter table public.profiles add column if not exists custom_status text check (custom_status is null or char_length(custom_status) <= 60);
alter table public.profiles add column if not exists status_emoji text check (status_emoji is null or char_length(status_emoji) <= 8);

create table if not exists public.servers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40),
  icon text not null default '💬' check (char_length(icon) between 1 and 8),
  description text not null default '' check (char_length(description) <= 160),
  banner text not null default 'linear-gradient(135deg,#7c5cff,#ff6bcb)',
  discoverable boolean not null default false,
  owner uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  invite text not null unique default substr(md5(gen_random_uuid()::text), 1, 8),
  created_at timestamptz not null default now()
);

alter table public.servers drop constraint if exists servers_banner_safe;
alter table public.servers add constraint servers_banner_safe
  check (banner ~ '^linear-gradient\(135deg,#[0-9a-fA-F]{6},#[0-9a-fA-F]{6}\)$');

create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  server_id uuid not null references public.servers(id) on delete cascade,
  name text not null check (name ~ '^[a-z0-9_-]{1,32}$'),
  topic text not null default '' check (char_length(topic) <= 120),
  created_at timestamptz not null default now()
);

create table if not exists public.members (
  server_id uuid not null references public.servers(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (server_id, user_id)
);

create table if not exists public.friends (
  user_id uuid not null references public.profiles(id) on delete cascade,
  friend_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id)
);

-- Mensagens de canal têm channel_id; DMs têm dm_key = "<uuid menor>:<uuid maior>".
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid references public.channels(id) on delete cascade,
  dm_key text,
  author uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default clock_timestamp(),
  check ((channel_id is null) <> (dm_key is null))
);
create index if not exists messages_channel_idx on public.messages (channel_id, created_at desc);
create index if not exists messages_dm_idx on public.messages (dm_key, created_at desc);

-- ---------- v3: nome de exibição, banner com imagem, anexos ----------
alter table public.profiles add column if not exists display_name text
  check (display_name is null or char_length(btrim(display_name)) between 1 and 32);
alter table public.profiles add column if not exists banner_url text
  check (banner_url is null or (banner_url ~ '^https://[^\s"''()<>\\]+$' and char_length(banner_url) <= 500));
alter table public.messages add column if not exists attachment jsonb
  check (attachment is null or (jsonb_typeof(attachment) = 'object'
    and attachment->>'url' ~ '^https://[^\s"''()<>\\]+/storage/v1/object/public/attachments/[^\s"''()<>\\]+$'
    and pg_column_size(attachment) < 2000));
-- mensagem pode ser só uma foto (texto vazio)
alter table public.messages drop constraint if exists messages_content_check;
alter table public.messages add constraint messages_content_check
  check (char_length(content) <= 2000 and (char_length(content) >= 1 or attachment is not null));

-- Permissões explícitas (projetos novos do Supabase não liberam tabelas automaticamente).
-- O que cada usuário pode ver/alterar de fato é decidido pelas regras RLS abaixo.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.profiles, public.servers, public.channels,
  public.members, public.friends, public.messages to authenticated;
revoke all on public.profiles, public.servers, public.channels, public.members, public.friends, public.messages from anon;

-- ---------- funções auxiliares (security definer evita recursão no RLS) ----------
create or replace function public.is_member(s uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from members where server_id = s and user_id = auth.uid())
$$;

create or replace function public.can_read_channel(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from channels ch join members m on m.server_id = ch.server_id
                 where ch.id = c and m.user_id = auth.uid())
$$;

create or replace function public.valid_dm(k text) returns boolean
language sql stable security definer set search_path = public as $$
  select k ~ '^[0-9a-f-]{36}:[0-9a-f-]{36}$'
     and split_part(k, ':', 1) collate "C" < split_part(k, ':', 2) collate "C"
     and auth.uid()::text in (split_part(k, ':', 1), split_part(k, ':', 2))
     and (select count(*) from profiles where id::text in (split_part(k, ':', 1), split_part(k, ':', 2))) = 2
$$;

-- ---------- segurança (Row Level Security) ----------
alter table public.profiles enable row level security;
alter table public.servers  enable row level security;
alter table public.channels enable row level security;
alter table public.members  enable row level security;
alter table public.friends  enable row level security;
alter table public.messages enable row level security;

drop policy if exists "profiles read"   on public.profiles;
drop policy if exists "profiles update" on public.profiles;
create policy "profiles read"   on public.profiles for select to authenticated using (true);
create policy "profiles update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
-- só estas colunas podem ser editadas pelo próprio usuário
revoke update on public.profiles from authenticated, anon;
grant update (status, bio, color, prefs, avatar_url, banner, pronouns, custom_status, status_emoji, display_name, banner_url) on public.profiles to authenticated;

drop policy if exists "servers read"   on public.servers;
drop policy if exists "servers insert" on public.servers;
drop policy if exists "servers update" on public.servers;
drop policy if exists "servers delete" on public.servers;
create policy "servers read"   on public.servers for select to authenticated using (discoverable or public.is_member(id));
create policy "servers insert" on public.servers for insert to authenticated with check (owner = auth.uid());
create policy "servers update" on public.servers for update to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
create policy "servers delete" on public.servers for delete to authenticated using (owner = auth.uid());

drop policy if exists "channels read"   on public.channels;
drop policy if exists "channels insert" on public.channels;
drop policy if exists "channels delete" on public.channels;
create policy "channels read"   on public.channels for select to authenticated using (public.is_member(server_id));
create policy "channels insert" on public.channels for insert to authenticated
  with check (exists (select 1 from public.servers s where s.id = server_id and s.owner = auth.uid()));
create policy "channels delete" on public.channels for delete to authenticated
  using (exists (select 1 from public.servers s where s.id = server_id and s.owner = auth.uid()));

drop policy if exists "members read"  on public.members;
drop policy if exists "members leave" on public.members;
create policy "members read"  on public.members for select to authenticated using (public.is_member(server_id));
create policy "members leave" on public.members for delete to authenticated
  using (user_id = auth.uid() and not exists (select 1 from public.servers s where s.id = server_id and s.owner = auth.uid()));

drop policy if exists "friends read" on public.friends;
create policy "friends read" on public.friends for select to authenticated using (user_id = auth.uid());

drop policy if exists "messages read"   on public.messages;
drop policy if exists "messages insert" on public.messages;
drop policy if exists "messages delete" on public.messages;
create policy "messages read" on public.messages for select to authenticated using (
  (channel_id is not null and public.can_read_channel(channel_id)) or (dm_key is not null and public.valid_dm(dm_key)));
create policy "messages insert" on public.messages for insert to authenticated with check (
  author = auth.uid() and (
    (channel_id is not null and public.can_read_channel(channel_id)) or (dm_key is not null and public.valid_dm(dm_key))));
create policy "messages delete" on public.messages for delete to authenticated using (author = auth.uid());

-- ---------- gatilhos ----------
-- Ao criar servidor: dono vira membro + canal #geral
create or replace function public.on_server_created() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into members (server_id, user_id) values (new.id, new.owner) on conflict do nothing;
  insert into channels (server_id, name, topic) values (new.id, 'geral', 'Comece a conversar!');
  return new;
end $$;
drop trigger if exists server_created on public.servers;
create trigger server_created after insert on public.servers for each row execute function public.on_server_created();

-- Ao criar conta (auth): cria o perfil
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  uname text := coalesce(nullif(new.raw_user_meta_data->>'username', ''), 'user' || substr(new.id::text, 1, 6));
  palette text[] := array['#ff6b6b','#ffa94d','#51cf66','#339af0','#845ef7','#f06595','#20c997','#fcc419'];
begin
  insert into profiles (id, username, color) values (new.id, uname, palette[1 + floor(random() * 8)::int]);
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ---------- limpeza da versão 1 (CupBot e Cuplock Lounge) ----------
drop trigger if exists cupbot on public.messages;
drop function if exists public.cupbot_reply();
delete from public.servers  where id = '00000000-0000-0000-0000-0000000c0ffe';
delete from public.profiles where id = '00000000-0000-0000-0000-00000000c0b0';

-- ---------- funções chamadas pelo app ----------
create or replace function public.username_available(name text) returns boolean
language sql stable security definer set search_path = public as $$
  select name ~ '^[A-Za-z0-9_.]{2,24}$' and not exists (select 1 from profiles where lower(username) = lower(name))
$$;

create or replace function public.invite_preview(code text) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object('id', s.id, 'name', s.name, 'icon', s.icon, 'description', s.description, 'banner', s.banner,
    'members', (select count(*) from members m where m.server_id = s.id), 'invite', s.invite,
    'inviter', (select username from profiles p where p.id = s.owner))
  from servers s where s.invite = code
$$;

create or replace function public.join_invite(code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare sid uuid;
begin
  if auth.uid() is null then raise exception 'Faça login primeiro'; end if;
  select id into sid from servers where invite = code;
  if sid is null then raise exception 'Este convite é inválido ou expirou.'; end if;
  insert into members (server_id, user_id) values (sid, auth.uid()) on conflict do nothing;
  return sid;
end $$;

create or replace function public.discover() returns table (id uuid, name text, icon text, description text, banner text, members bigint, invite text)
language sql stable security definer set search_path = public as $$
  select s.id, s.name, s.icon, s.description, s.banner, (select count(*) from members m where m.server_id = s.id), s.invite
  from servers s where s.discoverable order by 6 desc, s.created_at limit 100
$$;

create or replace function public.add_friend(name text) returns public.profiles
language plpgsql security definer set search_path = public as $$
declare f profiles;
begin
  select * into f from profiles where lower(username) = lower(trim(name));
  if f.id is null then raise exception 'Nenhum usuário com esse nome.'; end if;
  if f.id = auth.uid() then raise exception 'Você não pode adicionar a si mesmo.'; end if;
  insert into friends (user_id, friend_id) values (auth.uid(), f.id), (f.id, auth.uid()) on conflict do nothing;
  return f;
end $$;

create or replace function public.remove_friend(fid uuid) returns void
language sql security definer set search_path = public as $$
  delete from friends where (user_id = auth.uid() and friend_id = fid) or (user_id = fid and friend_id = auth.uid())
$$;

revoke execute on function public.add_friend(text), public.remove_friend(uuid), public.join_invite(text), public.discover() from anon, public;
grant execute on function public.add_friend(text), public.remove_friend(uuid), public.join_invite(text), public.discover() to authenticated;
grant execute on function public.username_available(text), public.invite_preview(text) to anon, authenticated;

-- ---------- arquivos (fotos de perfil, banners e fotos enviadas) ----------
-- Buckets públicos com nomes aleatórios; cada usuário só envia/apaga na própria pasta.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('avatars', 'avatars', true, 4194304, array['image/png','image/jpeg','image/webp','image/gif']),
  ('attachments', 'attachments', true, 10485760, array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "cuplock upload" on storage.objects;
drop policy if exists "cuplock delete" on storage.objects;
create policy "cuplock upload" on storage.objects for insert to authenticated
  with check (bucket_id in ('avatars', 'attachments') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "cuplock delete" on storage.objects for delete to authenticated
  using (bucket_id in ('avatars', 'attachments') and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- calls: canais privados do Realtime ----------
-- "call:<canal ou dm>" → só quem pode ler aquele canal/DM entra na call
-- "inbox:<usuário>"   → campainha: qualquer um logado toca, só o dono escuta
create or replace function public.can_use_topic(t text, sending boolean) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare rest text;
begin
  if auth.uid() is null or t is null then return false; end if;
  if t like 'inbox:%' then
    return sending or t = 'inbox:' || auth.uid()::text;
  elsif t like 'call:dm:%' then
    return public.valid_dm(substr(t, 9));
  elsif t like 'call:%' then
    rest := substr(t, 6);
    if rest !~ '^[0-9a-f-]{36}$' then return false; end if;
    return public.can_read_channel(rest::uuid);
  end if;
  return false;
end $$;

do $$ begin
  if exists (select 1 from information_schema.tables where table_schema = 'realtime' and table_name = 'messages') then
    execute 'alter table realtime.messages enable row level security';
    execute 'drop policy if exists "cuplock calls read" on realtime.messages';
    execute 'drop policy if exists "cuplock calls send" on realtime.messages';
    execute 'create policy "cuplock calls read" on realtime.messages for select to authenticated using (public.can_use_topic(realtime.topic(), false))';
    execute 'create policy "cuplock calls send" on realtime.messages for insert to authenticated with check (public.can_use_topic(realtime.topic(), true))';
  end if;
end $$;

-- ---------- tempo real ----------
alter table public.messages replica identity full;
do $$
declare t text;
begin
  foreach t in array array['messages','channels','members','profiles','friends','servers'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
