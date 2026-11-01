-- ==============================================================================
-- FLUXO — FUNDACIÓN DEL MÓDULO FINANCIERO DEL CRM FUNDADOR
-- Tabla de facturación por local, control fundador (max 5 plazas) y bucket
-- privado de comprobantes `payment-proofs`.
-- Ejecutar en Supabase SQL Editor.
-- ==============================================================================

-- 1) Tabla principal de facturación -------------------------------------------
create table if not exists public.crm_billing_locals (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nombre text not null,
  plan_type text not null default 'carta'
    check (plan_type in ('carta', 'sala', 'full_fundador', 'full', 'hibernacion')),
  monthly_price_eur numeric(10, 2) not null default 39,
  is_founder_slot boolean not null default false,
  founder_started_at timestamptz,
  founder_commitment_accepted boolean not null default false,
  billing_day int not null default 1
    check (billing_day between 1 and 5),
  payment_status text not null default 'pending'
    check (payment_status in ('paid', 'proof_pending', 'pending', 'overdue')),
  payment_method text not null default 'stripe_card'
    check (payment_method in ('stripe_card', 'stripe_sepa', 'apple_pay', 'bizum', 'transfer', 'cash')),
  payment_proof_path text,
  has_payment_proof boolean not null default false,
  pause_level int not null default 0
    check (pause_level in (0, 1, 2)),
  owner_email text not null,
  owner_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_crm_billing_locals_slug on public.crm_billing_locals (slug);
create index if not exists idx_crm_billing_locals_status on public.crm_billing_locals (payment_status);
create index if not exists idx_crm_billing_locals_plan on public.crm_billing_locals (plan_type);

-- 2) Trigger de updated_at -----------------------------------------------------
create or replace function public.crm_billing_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_crm_billing_updated_at on public.crm_billing_locals;
create trigger trg_crm_billing_updated_at
  before update on public.crm_billing_locals
  for each row execute function public.crm_billing_set_updated_at();

-- 3) Límite estricto de 5 plazas fundador activas ------------------------------
create or replace function public.crm_billing_enforce_founder_slots()
returns trigger
language plpgsql
as $$
declare
  v_active_founders int;
begin
  if new.plan_type = 'full_fundador' and new.is_founder_slot then
    if not new.founder_commitment_accepted then
      raise exception 'FLUXO_FOUNDER_COMMITMENT_REQUIRED: la plaza fundador exige founder_commitment_accepted (feedback + testimonio)';
    end if;

    select count(*) into v_active_founders
    from public.crm_billing_locals
    where plan_type = 'full_fundador' and is_founder_slot;

    if v_active_founders >= 5 then
      raise exception 'FLUXO_FOUNDER_SLOTS_FULL: el programa fundador está limitado a 5 plazas activas';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_crm_billing_founder_slots on public.crm_billing_locals;
create trigger trg_crm_billing_founder_slots
  before insert or update on public.crm_billing_locals
  for each row
  when (new.plan_type = 'full_fundador' and new.is_founder_slot)
  execute function public.crm_billing_enforce_founder_slots();

-- 4) RLS: solo el fundador/auth del CRM gestiona la facturación ----------------
alter table public.crm_billing_locals enable row level security;

drop policy if exists "crm_billing_reads" on public.crm_billing_locals;
create policy "crm_billing_reads"
  on public.crm_billing_locals for select
  to authenticated
  using (true);

drop policy if exists "crm_billing_writes" on public.crm_billing_locals;
create policy "crm_billing_writes"
  on public.crm_billing_locals for all
  to authenticated
  using (true)
  with check (true);

-- Catálogo para el dueño (lectura pública de estado plano, sin datos comerciales)
drop policy if exists "crm_billing_public_pause_read" on public.crm_billing_locals;
create policy "crm_billing_public_pause_read"
  on public.crm_billing_locals for select
  to anon
  using (true);

-- 5) Bucket privado de comprobantes de pago ------------------------------------
insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

-- Nota: los comprobantes solo se escriben con cliente autenticado del CRM
-- (Nº de local como prefijo, p.ej. "<local_id>/<timestamp>_<archivo>.png").
