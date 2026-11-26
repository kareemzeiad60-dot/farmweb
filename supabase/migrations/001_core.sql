-- Shared farm tables are partitioned by farm_id and protected by RLS.
-- Existing user records are backfilled into each user's initial farm.

create table if not exists public.farm_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  farm_name text not null default 'My farm',
  slug text not null default 'my-farm',
  unit text not null default 'Acres',
  farm_size numeric(12, 2),
  address text not null default '',
  location text not null default '',
  country text not null default 'Egypt',
  currency text not null default 'EGP',
  organic_farm boolean not null default false,
  default_hours_per_day numeric(4, 2) not null default 8,
  work_schedule jsonb not null default '{"Mon":8,"Tue":8,"Wed":8,"Thu":8,"Fri":8,"Sat":8,"Sun":8}'::jsonb,
  active_modules jsonb not null default '{"crops":true,"apiary":true,"livestock":true,"finance":true,"humanResources":true}'::jsonb,
  country_code text not null default 'EG',
  region_code text not null default 'EG-GH',
  region_name text not null default 'الغربية — طنطا (وسط الدلتا)',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.farm_profiles
  add column if not exists slug text not null default 'my-farm',
  add column if not exists unit text not null default 'Acres',
  add column if not exists farm_size numeric(12, 2),
  add column if not exists address text not null default '',
  add column if not exists location text not null default '',
  add column if not exists country text not null default 'Egypt',
  add column if not exists currency text not null default 'EGP',
  add column if not exists organic_farm boolean not null default false,
  add column if not exists default_hours_per_day numeric(4, 2) not null default 8,
  add column if not exists work_schedule jsonb not null default '{"Mon":8,"Tue":8,"Wed":8,"Thu":8,"Fri":8,"Sat":8,"Sun":8}'::jsonb,
  add column if not exists active_modules jsonb not null default '{"crops":true,"apiary":true,"livestock":true,"finance":true,"humanResources":true}'::jsonb,
  add column if not exists country_code text not null default 'EG',
  add column if not exists region_code text not null default 'EG-GH',
  add column if not exists region_name text not null default 'الغربية — طنطا (وسط الدلتا)',
  add column if not exists updated_at timestamptz not null default now();

update public.farm_profiles
set location = address
where nullif(trim(location), '') is null
  and nullif(trim(address), '') is not null;

update public.farm_profiles
set slug = coalesce(
  nullif(trim(both '-' from regexp_replace(lower(farm_name), '[^a-z0-9]+', '-', 'g')), ''),
  'farm'
)
where slug = 'my-farm';

create table if not exists public.farms (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 120),
  country_code text not null default 'EG',
  country_name text not null default 'Egypt',
  region_code text not null default 'EG-GH',
  region_name text not null default 'الغربية — طنطا (وسط الدلتا)',
  location_name text not null default 'الغربية — طنطا (وسط الدلتا)',
  latitude double precision not null default 30.7865,
  longitude double precision not null default 31.0004,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.farm_members (
  farm_id uuid not null references public.farms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'manager', 'worker', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (farm_id, user_id)
);

alter table public.farm_profiles
  add column if not exists farm_id uuid references public.farms (id) on delete set null;

create or replace function public.sync_farm_profile_name()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.farm_id is not null then
    update public.farms
    set name = new.farm_name, updated_at = now()
    where id = new.farm_id
      and created_by = new.id
      and name is distinct from new.farm_name;
  end if;
  return new;
end;
$$;

drop trigger if exists sync_farm_profile_name_to_farm on public.farm_profiles;
create trigger sync_farm_profile_name_to_farm
  after update of farm_name on public.farm_profiles
  for each row
  when (new.farm_name is distinct from old.farm_name)
  execute function public.sync_farm_profile_name();

alter table public.farms
  add column if not exists country_name text,
  add column if not exists location_name text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

create table if not exists public.farm_records (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid,
  user_id uuid not null references auth.users (id) on delete cascade,
  record_type text not null,
  record_id text,
  title text not null,
  status text not null default 'active',
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object'),
  related_record_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.farm_records
  add column if not exists farm_id uuid,
  add column if not exists record_id text,
  add column if not exists updated_at timestamptz not null default now();

insert into public.farms (
  id, name, country_code, country_name, region_code, region_name, location_name,
  latitude, longitude, created_by, created_at, updated_at
)
select p.id, coalesce(nullif(trim(p.farm_name), ''), 'My farm'),
       p.country_code, case when p.country_code = 'EG' then 'Egypt' else p.country_code end,
       p.region_code, p.region_name, coalesce(nullif(p.region_name, ''), 'My farm'),
       case p.region_code
         when 'EG-DK' then 31.0364 when 'EG-BH' then 31.0341
         when 'EG-KFS' then 31.1107 when 'EG-MNF' then 30.5526
         when 'EG-KB' then 30.4667 when 'EG-SHR' then 30.5877
         when 'EG-DT' then 31.4175 else 30.7865 end,
       case p.region_code
         when 'EG-DK' then 31.3807 when 'EG-BH' then 30.4682
         when 'EG-KFS' then 30.9399 when 'EG-MNF' then 31.0105
         when 'EG-KB' then 31.1833 when 'EG-SHR' then 31.5020
         when 'EG-DT' then 31.8144 else 31.0004 end,
       p.id, p.created_at, p.updated_at
from public.farm_profiles p
where p.farm_id is null
on conflict (id) do nothing;

update public.farms
set country_name = coalesce(nullif(country_name, ''), case when country_code = 'EG' then 'Egypt' else country_code end),
    location_name = coalesce(nullif(location_name, ''), nullif(region_name, ''), 'My farm'),
    latitude = coalesce(latitude, case region_code
      when 'EG-DK' then 31.0364
      when 'EG-BH' then 31.0341
      when 'EG-KFS' then 31.1107
      when 'EG-MNF' then 30.5526
      when 'EG-KB' then 30.4667
      when 'EG-SHR' then 30.5877
      when 'EG-DT' then 31.4175
      else 30.7865 end),
    longitude = coalesce(longitude, case region_code
      when 'EG-DK' then 31.3807
      when 'EG-BH' then 30.4682
      when 'EG-KFS' then 30.9399
      when 'EG-MNF' then 31.0105
      when 'EG-KB' then 31.1833
      when 'EG-SHR' then 31.5020
      when 'EG-DT' then 31.8144
      else 31.0004 end)
where country_name is null or location_name is null or latitude is null or longitude is null;

alter table public.farms
  alter column country_name set default 'Egypt',
  alter column country_name set not null,
  alter column location_name set default 'الغربية — طنطا (وسط الدلتا)',
  alter column location_name set not null,
  alter column latitude set default 30.7865,
  alter column latitude set not null,
  alter column longitude set default 31.0004,
  alter column longitude set not null;

update public.farm_profiles
set farm_id = id
where farm_id is null;

insert into public.farms (id, name, created_by)
select distinct r.user_id, 'My farm', r.user_id
from public.farm_records r
left join public.farms f on f.id = r.user_id
where f.id is null
on conflict (id) do nothing;

insert into public.farm_members (farm_id, user_id, role)
select f.id, f.created_by, 'owner'
from public.farms f
on conflict (farm_id, user_id) do nothing;

update public.farm_records r
set farm_id = p.farm_id
from public.farm_profiles p
where r.user_id = p.id and r.farm_id is null;

update public.farm_records
set farm_id = user_id
where farm_id is null;

update public.farm_records
set record_id = coalesce(nullif(data ->> 'id', ''), id::text)
where record_id is null or record_id = '';

alter table public.farm_records
  alter column farm_id set not null,
  alter column record_id set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'farm_records_farm_id_fkey'
      and conrelid = 'public.farm_records'::regclass
  ) then
    alter table public.farm_records
      add constraint farm_records_farm_id_fkey
      foreign key (farm_id) references public.farms (id) on delete cascade;
  end if;
end;
$$;

drop index if exists public.farm_records_owner_type_record_unique;
create unique index if not exists farm_records_farm_type_record_unique
  on public.farm_records (farm_id, record_type, record_id);
create index if not exists farm_records_farm_type_created_idx
  on public.farm_records (farm_id, record_type, created_at desc);
create index if not exists farm_members_user_farm_idx
  on public.farm_members (user_id, farm_id);

create or replace function public.is_farm_member(p_farm_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.farm_members m
    where m.farm_id = p_farm_id
      and m.user_id = (select auth.uid())
  );
$$;

create or replace function public.is_farm_manager(p_farm_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.farm_members m
    where m.farm_id = p_farm_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner', 'manager')
  );
$$;

create or replace function public.create_farm(p_name text)
returns public.farms
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  created_farm public.farms;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to create a farm.';
  end if;
  if char_length(trim(coalesce(p_name, ''))) not between 1 and 120 then
    raise exception 'Farm name must contain between 1 and 120 characters.';
  end if;

  insert into public.farms (name, created_by)
  values (trim(p_name), (select auth.uid()))
  returning * into created_farm;

  insert into public.farm_members (farm_id, user_id, role)
  values (created_farm.id, (select auth.uid()), 'owner');

  return created_farm;
end;
$$;

alter table public.farm_profiles enable row level security;
alter table public.farms enable row level security;
alter table public.farm_members enable row level security;
alter table public.farm_records enable row level security;

revoke all on public.farm_profiles, public.farms, public.farm_members, public.farm_records from anon, public;

drop policy if exists "Users can view their farm profile" on public.farm_profiles;
create policy "Users can view their farm profile"
  on public.farm_profiles for select to authenticated
  using (id = (select auth.uid()));

drop policy if exists "Users can create their farm profile" on public.farm_profiles;
create policy "Users can create their farm profile"
  on public.farm_profiles for insert to authenticated
  with check (id = (select auth.uid()));

drop policy if exists "Users can update their farm profile" on public.farm_profiles;
create policy "Users can update their farm profile"
  on public.farm_profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

drop policy if exists "Fieldwise profile owner guard" on public.farm_profiles;
create policy "Fieldwise profile owner guard"
  on public.farm_profiles as restrictive for all to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

drop policy if exists "Farm members can view their farms" on public.farms;
create policy "Farm members can view their farms"
  on public.farms for select to authenticated
  using (public.is_farm_member(id));

drop policy if exists "Farm managers can update their farms" on public.farms;
create policy "Farm managers can update their farms"
  on public.farms for update to authenticated
  using (public.is_farm_manager(id))
  with check (public.is_farm_manager(id));

drop policy if exists "Farm members can view membership" on public.farm_members;
create policy "Farm members can view membership"
  on public.farm_members for select to authenticated
  using (user_id = (select auth.uid()) or public.is_farm_member(farm_id));

drop policy if exists "Farm members can view their farm records" on public.farm_records;
create policy "Farm members can view their farm records"
  on public.farm_records for select to authenticated
  using (public.is_farm_member(farm_id));

drop policy if exists "Farm members can create farm records" on public.farm_records;
create policy "Farm members can create farm records"
  on public.farm_records for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_farm_member(farm_id));

drop policy if exists "Farm members can update farm records" on public.farm_records;
create policy "Farm members can update farm records"
  on public.farm_records for update to authenticated
  using (public.is_farm_member(farm_id))
  with check (public.is_farm_member(farm_id));

drop policy if exists "Farm members can delete farm records" on public.farm_records;
create policy "Farm members can delete farm records"
  on public.farm_records for delete to authenticated
  using (public.is_farm_member(farm_id));

drop policy if exists "Users can view their farm records" on public.farm_records;
drop policy if exists "Users can create their farm records" on public.farm_records;
drop policy if exists "Users can update their farm records" on public.farm_records;
drop policy if exists "Users can delete their farm records" on public.farm_records;
drop policy if exists "Fieldwise record owner guard" on public.farm_records;

revoke all on public.farm_profiles, public.farms, public.farm_members, public.farm_records from anon, public;
grant select, insert, update on public.farm_profiles to authenticated;
grant select, update on public.farms to authenticated;
grant select on public.farm_members to authenticated;
grant select, insert, update, delete on public.farm_records to authenticated;

revoke all on function public.is_farm_member(uuid) from public, anon;
grant execute on function public.is_farm_member(uuid) to authenticated;
revoke all on function public.is_farm_manager(uuid) from public, anon;
grant execute on function public.is_farm_manager(uuid) to authenticated;
revoke all on function public.create_farm(text) from public, anon;
grant execute on function public.create_farm(text) to authenticated;

create or replace function public.create_farm_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  created_farm public.farms;
begin
  insert into public.farms (name, created_by)
  values (
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'farm_name'), ''), 'My farm'),
    new.id
  )
  returning * into created_farm;

  insert into public.farm_members (farm_id, user_id, role)
  values (created_farm.id, new.id, 'owner')
  on conflict (farm_id, user_id) do nothing;

  insert into public.farm_profiles (id, farm_id, farm_name, country_code, region_code, region_name)
  values (new.id, created_farm.id, created_farm.name, created_farm.country_code, created_farm.region_code, created_farm.region_name)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_fieldwise on auth.users;
create trigger on_auth_user_created_fieldwise
  after insert on auth.users
  for each row execute procedure public.create_farm_profile_for_new_user();

revoke all on function public.create_farm_profile_for_new_user() from public, anon;
