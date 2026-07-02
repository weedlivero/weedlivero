create extension if not exists "uuid-ossp";

create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  brand text,
  category text not null check (category in ('weed', 'hash', 'concentrate')),
  description text,
  image_url text,
  created_at timestamp with time zone default now()
);

alter table products enable row level security;

create policy "Public read products" on products
for select using (true);

create policy "Authenticated insert products" on products
for insert to authenticated with check (true);

create policy "Authenticated update products" on products
for update to authenticated using (true) with check (true);

create policy "Authenticated delete products" on products
for delete to authenticated using (true);
