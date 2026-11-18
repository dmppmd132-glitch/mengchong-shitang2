-- 萌寵食堂：Supabase 雲端存檔與兩人共養資料表、RLS 安全規則與 RPC 函式
-- 請在 Supabase Dashboard -> SQL Editor 貼上並執行此腳本（支援重複執行）

-- 1. 個人雲端存檔資料表
create table if not exists public.pet_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  save_data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.pet_saves enable row level security;

drop policy if exists "Users can read own pet save" on public.pet_saves;
create policy "Users can read own pet save"
  on public.pet_saves
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own pet save" on public.pet_saves;
create policy "Users can insert own pet save"
  on public.pet_saves
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own pet save" on public.pet_saves;
create policy "Users can update own pet save"
  on public.pet_saves
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own pet save" on public.pet_saves;
create policy "Users can delete own pet save"
  on public.pet_saves
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- 2. 兩人共養小屋資料表（含 6 碼邀請碼）
create table if not exists public.shared_pets (
  id uuid primary key default gen_random_uuid(),
  invite_code text not null unique,
  owner_id uuid not null references auth.users(id) on delete cascade,
  owner_email text not null default '',
  partner_id uuid references auth.users(id) on delete set null,
  partner_email text,
  save_data jsonb not null,
  last_actor_id uuid references auth.users(id) on delete set null,
  last_actor_email text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.shared_pets enable row level security;

drop policy if exists "Shared pet members can read" on public.shared_pets;
create policy "Shared pet members can read"
  on public.shared_pets
  for select
  to authenticated
  using (auth.uid() = owner_id or auth.uid() = partner_id);

drop policy if exists "Shared pet owner can insert" on public.shared_pets;
create policy "Shared pet owner can insert"
  on public.shared_pets
  for insert
  to authenticated
  with check (auth.uid() = owner_id);

drop policy if exists "Shared pet members can update" on public.shared_pets;
create policy "Shared pet members can update"
  on public.shared_pets
  for update
  to authenticated
  using (auth.uid() = owner_id or auth.uid() = partner_id)
  with check (auth.uid() = owner_id or auth.uid() = partner_id);

drop policy if exists "Shared pet owner can delete" on public.shared_pets;
create policy "Shared pet owner can delete"
  on public.shared_pets
  for delete
  to authenticated
  using (auth.uid() = owner_id);

-- 開啟 Supabase Realtime 即時同步（供兩人共養使用）
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'shared_pets'
  ) then
    alter publication supabase_realtime add table public.shared_pets;
  end if;
end $$;

-- 3. 產生 6 碼大寫邀請碼（排除易混淆字元 0/O/1/I）
create or replace function public.generate_pet_invite_code()
returns text
language plpgsql
as $$
declare
  v_chars constant text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  v_code text := '';
  v_i int;
begin
  for v_i in 1..6 loop
    v_code := v_code || substr(v_chars, floor(random() * length(v_chars) + 1)::int, 1);
  end loop;
  return v_code;
end;
$$;

-- 4. 建立兩人共養小屋 RPC
create or replace function public.create_shared_pet(
  p_save_data jsonb,
  p_owner_email text default ''
)
returns public.shared_pets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_existing public.shared_pets;
  v_created public.shared_pets;
  v_code text;
  v_attempt int := 0;
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  select *
  into v_existing
  from public.shared_pets
  where owner_id = v_uid or partner_id = v_uid
  limit 1;

  if found then
    return v_existing;
  end if;

  loop
    v_attempt := v_attempt + 1;
    v_code := public.generate_pet_invite_code();
    begin
      insert into public.shared_pets (
        invite_code,
        owner_id,
        owner_email,
        save_data,
        last_actor_id,
        last_actor_email,
        updated_at
      )
      values (
        v_code,
        v_uid,
        coalesce(p_owner_email, ''),
        p_save_data,
        v_uid,
        coalesce(p_owner_email, ''),
        now()
      )
      returning * into v_created;

      return v_created;
    exception when unique_violation then
      if v_attempt >= 10 then
        raise exception 'INVITE_CODE_GENERATION_FAILED';
      end if;
    end;
  end loop;
end;
$$;

-- 5. 透過邀請碼加入兩人共養小屋 RPC
create or replace function public.join_shared_pet(
  p_invite_code text,
  p_partner_email text default ''
)
returns public.shared_pets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_code text := upper(trim(coalesce(p_invite_code, '')));
  v_current public.shared_pets;
  v_target public.shared_pets;
  v_updated public.shared_pets;
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  if length(v_code) <> 6 then
    raise exception 'INVALID_INVITE_CODE';
  end if;

  select *
  into v_current
  from public.shared_pets
  where owner_id = v_uid or partner_id = v_uid
  limit 1;

  if found then
    if v_current.invite_code = v_code then
      return v_current;
    end if;
    raise exception 'ALREADY_IN_SHARED_PET';
  end if;

  select *
  into v_target
  from public.shared_pets
  where invite_code = v_code
  limit 1;

  if not found then
    raise exception 'INVITE_NOT_FOUND';
  end if;

  if v_target.owner_id = v_uid then
    return v_target;
  end if;

  if v_target.partner_id is not null and v_target.partner_id <> v_uid then
    raise exception 'ROOM_FULL';
  end if;

  update public.shared_pets
  set
    partner_id = v_uid,
    partner_email = coalesce(p_partner_email, ''),
    updated_at = now()
  where id = v_target.id
  returning * into v_updated;

  return v_updated;
end;
$$;

-- 6. 重新產生邀請碼 RPC
create or replace function public.regenerate_invite_code(
  p_shared_pet_id uuid
)
returns public.shared_pets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_updated public.shared_pets;
  v_code text;
  v_attempt int := 0;
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  loop
    v_attempt := v_attempt + 1;
    v_code := public.generate_pet_invite_code();
    begin
      update public.shared_pets
      set
        invite_code = v_code,
        updated_at = now()
      where id = p_shared_pet_id
        and (owner_id = v_uid or partner_id = v_uid)
      returning * into v_updated;

      if not found then
        raise exception 'SHARED_PET_NOT_FOUND';
      end if;

      return v_updated;
    exception when unique_violation then
      if v_attempt >= 10 then
        raise exception 'INVITE_CODE_GENERATION_FAILED';
      end if;
    end;
  end loop;
end;
$$;

-- 7. 退出兩人共養小屋 RPC（若原本有夥伴，會自動將房主移交給對方）
create or replace function public.leave_shared_pet(
  p_shared_pet_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_room public.shared_pets;
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  select *
  into v_room
  from public.shared_pets
  where id = p_shared_pet_id
    and (owner_id = v_uid or partner_id = v_uid)
  limit 1;

  if not found then
    return false;
  end if;

  if v_room.partner_id = v_uid then
    update public.shared_pets
    set
      partner_id = null,
      partner_email = null,
      updated_at = now()
    where id = v_room.id;
    return true;
  end if;

  if v_room.owner_id = v_uid then
    if v_room.partner_id is not null then
      update public.shared_pets
      set
        owner_id = v_room.partner_id,
        owner_email = coalesce(v_room.partner_email, ''),
        partner_id = null,
        partner_email = null,
        updated_at = now()
      where id = v_room.id;
    else
      delete from public.shared_pets
      where id = v_room.id;
    end if;
    return true;
  end if;

  return false;
end;
$$;

-- 8. 兩人共養留言板與貼圖資料表
create table if not exists public.pet_messages (
  id uuid primary key default gen_random_uuid(),
  shared_pet_id uuid not null references public.shared_pets(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  author_email text not null default '',
  content text not null default '',
  sticker_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_pet_messages_room_created
  on public.pet_messages (shared_pet_id, created_at desc);

alter table public.pet_messages enable row level security;

drop policy if exists "Shared pet members can read messages" on public.pet_messages;
create policy "Shared pet members can read messages"
  on public.pet_messages
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.shared_pets sp
      where sp.id = shared_pet_id
        and (sp.owner_id = auth.uid() or sp.partner_id = auth.uid())
    )
  );

drop policy if exists "Shared pet members can insert messages" on public.pet_messages;
create policy "Shared pet members can insert messages"
  on public.pet_messages
  for insert
  to authenticated
  with check (
    auth.uid() = author_id
    and exists (
      select 1
      from public.shared_pets sp
      where sp.id = shared_pet_id
        and (sp.owner_id = auth.uid() or sp.partner_id = auth.uid())
    )
  );

drop policy if exists "Authors can delete own pet messages" on public.pet_messages;
create policy "Authors can delete own pet messages"
  on public.pet_messages
  for delete
  to authenticated
  using (auth.uid() = author_id);

-- 開啟留言板 Realtime 即時同步
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'pet_messages'
  ) then
    alter publication supabase_realtime add table public.pet_messages;
  end if;
end $$;

