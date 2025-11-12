-- Supabase Database Schema for Photo Blog with Membership

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Memberships table
create table public.memberships (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  email text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  role text not null default 'member' check (role in ('member', 'admin')),
  request_message text,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,

  unique(user_id),
  unique(email)
);

-- Enable Row Level Security
alter table public.memberships enable row level security;

-- RLS Policies for memberships table

-- Anyone can read their own membership
create policy "Users can read own membership"
  on public.memberships
  for select
  using (auth.uid() = user_id);

-- Anyone authenticated can insert their own membership request
create policy "Authenticated users can request membership"
  on public.memberships
  for insert
  with check (auth.uid() = user_id);

-- Admins can read all memberships
create policy "Admins can read all memberships"
  on public.memberships
  for select
  using (
    exists (
      select 1 from public.memberships
      where user_id = auth.uid()
      and role = 'admin'
      and status = 'approved'
    )
  );

-- Admins can update memberships
create policy "Admins can update memberships"
  on public.memberships
  for update
  using (
    exists (
      select 1 from public.memberships
      where user_id = auth.uid()
      and role = 'admin'
      and status = 'approved'
    )
  );

-- Create updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_memberships_updated_at
  before update on public.memberships
  for each row
  execute procedure public.handle_updated_at();

-- Invitation tokens table (for admin invitations)
create table public.invitation_tokens (
  id uuid default uuid_generate_v4() primary key,
  email text not null unique,
  token text not null unique,
  invited_by uuid references auth.users(id) not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz default now() not null
);

-- Enable RLS
alter table public.invitation_tokens enable row level security;

-- Admins can manage invitation tokens
create policy "Admins can manage invitations"
  on public.invitation_tokens
  for all
  using (
    exists (
      select 1 from public.memberships
      where user_id = auth.uid()
      and role = 'admin'
      and status = 'approved'
    )
  );

-- Anyone can read unused, non-expired invitations (for validation)
create policy "Anyone can validate invitations"
  on public.invitation_tokens
  for select
  using (
    used_at is null
    and expires_at > now()
  );

-- Insert first admin (optional - update the email to your admin email)
-- Run this after your first sign-in to make yourself an admin
-- insert into public.memberships (user_id, email, status, role, approved_at)
-- values (
--   (select id from auth.users where email = 'your-admin-email@example.com'),
--   'your-admin-email@example.com',
--   'approved',
--   'admin',
--   now()
-- );
