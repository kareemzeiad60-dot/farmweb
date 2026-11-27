-- 004 - Team management: invitations, member roles and linking workers to accounts.
-- Run after 001-003. Safe to run more than once.
--
-- Who can do what
--   owner    invite managers / workers / viewers, change roles, remove anyone except owners
--   manager  invite workers / viewers, remove workers / viewers
--   worker, viewer  no team management; any non-owner can leave a farm
--   (viewers are read-only on all farm data; owners, managers and workers can edit)
--
-- How an invitation works
--   1. A manager invites an email address with a role (invite_member).
--   2. The person signs up or signs in with that email. The address must be confirmed
--      (Supabase "Confirm email" must be on, which is the default); otherwise anyone could
--      claim an invitation by registering someone else's address.
--   3. They see the invitation in the app and accept it (accept_invitation), which adds them
--      to the farm. Invitations expire after 14 days.
-- All membership changes go through the functions below (security definer); the tables
-- themselves are read-only for the app.

-- ---------------------------------------------------------------- worker <-> account link
-- A farm_workers row can be linked to the login of a farm member, so that worker sees
-- "My tasks". The composite FK guarantees the user is a member of the same farm and unlinks
-- the worker automatically if the member is removed. The app never writes this column
-- directly; it is set by accept_invitation() and set_worker_account().
alter table public.farm_workers add column if not exists user_id uuid;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'farm_workers_user_id_fkey') then
    alter table public.farm_workers
      add constraint farm_workers_user_id_fkey
      foreign key (farm_id, user_id) references public.farm_members (farm_id, user_id)
      on delete set null (user_id);
  end if;
end;
$$;

create unique index if not exists farm_workers_farm_user_key
  on public.farm_workers (farm_id, user_id) where user_id is not null;

-- ---------------------------------------------------------------- invitations table
create table if not exists public.farm_invitations (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms (id) on delete cascade,
  email text not null
    check (email = lower(email) and char_length(email) between 3 and 254 and position('@' in email) > 1),
  role text not null check (role in ('manager', 'worker', 'viewer')),
  name text not null default '' check (char_length(name) <= 120),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'revoked')),
  invited_by uuid references auth.users (id) on delete set null,
  accepted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '14 days',
  responded_at timestamptz
);

create unique index if not exists farm_invitations_pending_key
  on public.farm_invitations (farm_id, email) where status = 'pending';
create index if not exists farm_invitations_pending_email_idx
  on public.farm_invitations (email) where status = 'pending';

alter table public.farm_invitations enable row level security;
revoke all on public.farm_invitations from anon, public;
grant select on public.farm_invitations to authenticated;

-- Managers can list their farm's invitations; everything else goes through the functions.
drop policy if exists "Farm managers can view invitations" on public.farm_invitations;
create policy "Farm managers can view invitations"
  on public.farm_invitations for select to authenticated
  using (public.is_farm_manager(farm_id));

-- ---------------------------------------------------------------- helpers
-- The signed-in user's email, only if it has been confirmed.
create or replace function public.fw_verified_email()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select lower(u.email)
  from auth.users u
  where u.id = (select auth.uid())
    and u.email_confirmed_at is not null;
$$;

-- The signed-in user's role in a farm (null when not a member).
create or replace function public.fw_farm_role(p_farm_id uuid)
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select m.role
  from public.farm_members m
  where m.farm_id = p_farm_id
    and m.user_id = (select auth.uid());
$$;

-- ---------------------------------------------------------------- inviting
create or replace function public.invite_member(
  p_farm_id uuid,
  p_email text,
  p_role text,
  p_name text default ''
)
returns public.farm_invitations
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_caller_role text := public.fw_farm_role(p_farm_id);
  v_email text := lower(trim(coalesce(p_email, '')));
  v_name text := left(trim(coalesce(p_name, '')), 120);
  v_invitation public.farm_invitations;
begin
  if (select auth.uid()) is null then
    raise exception 'You must be signed in.';
  end if;
  if v_caller_role is null or v_caller_role not in ('owner', 'manager') then
    raise exception 'Only farm owners and managers can invite people.';
  end if;
  if p_role is null or p_role not in ('manager', 'worker', 'viewer') then
    raise exception 'Choose a role: manager, worker or viewer.';
  end if;
  if v_caller_role = 'manager' and p_role = 'manager' then
    raise exception 'Only the farm owner can invite managers.';
  end if;
  if char_length(v_email) > 254 or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Enter a valid email address.';
  end if;
  if exists (
    select 1
    from auth.users u
    join public.farm_members m on m.user_id = u.id
    where m.farm_id = p_farm_id and lower(u.email) = v_email
  ) then
    raise exception 'That person is already a member of this farm.';
  end if;
  if (select count(*) from public.farm_invitations
      where farm_id = p_farm_id and status = 'pending') >= 100 then
    raise exception 'Too many pending invitations. Revoke some before inviting more people.';
  end if;

  insert into public.farm_invitations (farm_id, email, role, name, invited_by)
  values (p_farm_id, v_email, p_role, v_name, (select auth.uid()))
  on conflict (farm_id, email) where status = 'pending'
  do update set
    role = excluded.role,
    name = excluded.name,
    invited_by = excluded.invited_by,
    created_at = now(),
    expires_at = now() + interval '14 days'
  returning * into v_invitation;

  return v_invitation;
end;
$$;

create or replace function public.revoke_invitation(p_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_invitation public.farm_invitations;
  v_caller_role text;
begin
  select * into v_invitation
  from public.farm_invitations
  where id = p_invitation_id and status = 'pending'
  for update;
  if not found then
    raise exception 'That invitation is no longer pending.';
  end if;

  v_caller_role := public.fw_farm_role(v_invitation.farm_id);
  if v_caller_role is null
     or v_caller_role not in ('owner', 'manager')
     or (v_caller_role = 'manager' and v_invitation.role = 'manager') then
    raise exception 'You are not allowed to revoke this invitation.';
  end if;

  update public.farm_invitations
  set status = 'revoked', responded_at = now()
  where id = p_invitation_id;
end;
$$;

-- ---------------------------------------------------------------- responding (invited person)
create or replace function public.my_pending_invitations()
returns table (
  id uuid,
  farm_id uuid,
  farm_name text,
  role text,
  invited_by_email text,
  created_at timestamptz,
  expires_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select i.id, i.farm_id, f.name, i.role, u.email::text, i.created_at, i.expires_at
  from public.farm_invitations i
  join public.farms f on f.id = i.farm_id
  left join auth.users u on u.id = i.invited_by
  where i.status = 'pending'
    and i.expires_at > now()
    and i.email = public.fw_verified_email()
  order by i.created_at desc;
$$;

create or replace function public.accept_invitation(p_invitation_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := (select auth.uid());
  v_email text := public.fw_verified_email();
  v_invitation public.farm_invitations;
  v_worker_id uuid;
begin
  if v_user is null then
    raise exception 'You must be signed in.';
  end if;
  if v_email is null then
    raise exception 'Confirm your email address before accepting an invitation.';
  end if;

  select * into v_invitation
  from public.farm_invitations
  where id = p_invitation_id
  for update;
  if not found or v_invitation.email <> v_email or v_invitation.status <> 'pending' then
    raise exception 'This invitation is no longer available.';
  end if;
  if v_invitation.expires_at <= now() then
    raise exception 'This invitation has expired. Ask the farm owner to send a new one.';
  end if;

  -- Never changes the role of someone who is already a member (an owner stays an owner).
  insert into public.farm_members (farm_id, user_id, role)
  values (v_invitation.farm_id, v_user, v_invitation.role)
  on conflict (farm_id, user_id) do nothing;

  -- Link the account to a worker record: an existing one with the same email, or a new one
  -- when the person joins as a worker.
  if not exists (
    select 1 from public.farm_workers w
    where w.farm_id = v_invitation.farm_id and w.user_id = v_user
  ) then
    select w.id into v_worker_id
    from public.farm_workers w
    where w.farm_id = v_invitation.farm_id
      and w.user_id is null
      and lower(w.email) = v_email
    order by w.created_at
    limit 1;

    if v_worker_id is not null then
      update public.farm_workers set user_id = v_user where id = v_worker_id;
    elsif v_invitation.role = 'worker' then
      insert into public.farm_workers (farm_id, created_by, name, email, status, user_id)
      values (
        v_invitation.farm_id, v_user,
        coalesce(nullif(v_invitation.name, ''), split_part(v_email, '@', 1)),
        v_email, 'Active', v_user
      );
    end if;
  end if;

  update public.farm_invitations
  set status = 'accepted', accepted_by = v_user, responded_at = now()
  where id = p_invitation_id;

  return v_invitation.farm_id;
end;
$$;

create or replace function public.decline_invitation(p_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text := public.fw_verified_email();
begin
  update public.farm_invitations
  set status = 'declined', responded_at = now()
  where id = p_invitation_id
    and status = 'pending'
    and email = v_email;
  if not found then
    raise exception 'This invitation is no longer available.';
  end if;
end;
$$;

-- ---------------------------------------------------------------- members
create or replace function public.list_farm_members(p_farm_id uuid)
returns table (
  user_id uuid,
  email text,
  role text,
  joined_at timestamptz,
  worker_id uuid,
  worker_name text,
  is_self boolean
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if public.fw_farm_role(p_farm_id) is null
     or public.fw_farm_role(p_farm_id) not in ('owner', 'manager') then
    raise exception 'Only farm owners and managers can see the team.';
  end if;

  return query
  select m.user_id, u.email::text, m.role, m.created_at, w.id, w.name,
         m.user_id = (select auth.uid())
  from public.farm_members m
  join auth.users u on u.id = m.user_id
  left join public.farm_workers w on w.farm_id = m.farm_id and w.user_id = m.user_id
  where m.farm_id = p_farm_id
  order by case m.role when 'owner' then 0 when 'manager' then 1 when 'worker' then 2 else 3 end,
           u.email;
end;
$$;

create or replace function public.update_member_role(p_farm_id uuid, p_user_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_target_role text;
begin
  if public.fw_farm_role(p_farm_id) is distinct from 'owner' then
    raise exception 'Only the farm owner can change roles.';
  end if;
  if p_role is null or p_role not in ('manager', 'worker', 'viewer') then
    raise exception 'Choose a role: manager, worker or viewer.';
  end if;
  if p_user_id = (select auth.uid()) then
    raise exception 'You cannot change your own role.';
  end if;

  select m.role into v_target_role
  from public.farm_members m
  where m.farm_id = p_farm_id and m.user_id = p_user_id;
  if not found then
    raise exception 'That person is not a member of this farm.';
  end if;
  if v_target_role = 'owner' then
    raise exception 'The role of a farm owner cannot be changed.';
  end if;

  update public.farm_members set role = p_role
  where farm_id = p_farm_id and user_id = p_user_id;
end;
$$;

-- Remove a member, or leave a farm yourself (p_user_id = your own id).
create or replace function public.remove_member(p_farm_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_caller_role text := public.fw_farm_role(p_farm_id);
  v_target_role text;
begin
  if v_caller_role is null then
    raise exception 'You are not a member of this farm.';
  end if;

  select m.role into v_target_role
  from public.farm_members m
  where m.farm_id = p_farm_id and m.user_id = p_user_id;
  if not found then
    raise exception 'That person is not a member of this farm.';
  end if;
  if v_target_role = 'owner' then
    raise exception 'A farm owner cannot be removed or leave the farm.';
  end if;

  if p_user_id <> (select auth.uid()) then
    if v_caller_role = 'manager' and v_target_role not in ('worker', 'viewer') then
      raise exception 'Managers can only remove workers and viewers.';
    elsif v_caller_role not in ('owner', 'manager') then
      raise exception 'You are not allowed to remove members.';
    end if;
  end if;

  delete from public.farm_members where farm_id = p_farm_id and user_id = p_user_id;
end;
$$;

-- Link a worker record to a member's account (or unlink with p_user_id = null).
create or replace function public.set_worker_account(p_worker_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_farm_id uuid;
begin
  select w.farm_id into v_farm_id from public.farm_workers w where w.id = p_worker_id;
  if not found then
    raise exception 'That worker record no longer exists.';
  end if;
  if public.fw_farm_role(v_farm_id) is null
     or public.fw_farm_role(v_farm_id) not in ('owner', 'manager') then
    raise exception 'Only farm owners and managers can link accounts.';
  end if;

  if p_user_id is not null then
    if not exists (
      select 1 from public.farm_members m
      where m.farm_id = v_farm_id and m.user_id = p_user_id
    ) then
      raise exception 'That person is not a member of this farm.';
    end if;
    update public.farm_workers set user_id = null
    where farm_id = v_farm_id and user_id = p_user_id and id <> p_worker_id;
  end if;

  update public.farm_workers set user_id = p_user_id where id = p_worker_id;
end;
$$;

-- ---------------------------------------------------------------- privileges
revoke all on function
  public.fw_verified_email(),
  public.fw_farm_role(uuid),
  public.invite_member(uuid, text, text, text),
  public.revoke_invitation(uuid),
  public.my_pending_invitations(),
  public.accept_invitation(uuid),
  public.decline_invitation(uuid),
  public.list_farm_members(uuid),
  public.update_member_role(uuid, uuid, text),
  public.remove_member(uuid, uuid),
  public.set_worker_account(uuid, uuid)
from public, anon;

grant execute on function
  public.fw_verified_email(),
  public.fw_farm_role(uuid),
  public.invite_member(uuid, text, text, text),
  public.revoke_invitation(uuid),
  public.my_pending_invitations(),
  public.accept_invitation(uuid),
  public.decline_invitation(uuid),
  public.list_farm_members(uuid),
  public.update_member_role(uuid, uuid, text),
  public.remove_member(uuid, uuid),
  public.set_worker_account(uuid, uuid)
to authenticated;
