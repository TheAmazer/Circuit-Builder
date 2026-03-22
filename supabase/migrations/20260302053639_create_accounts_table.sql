-- Create an accounts table that links to Supabase's auth.users table
create table public.accounts (
  id uuid references auth.users(id) on delete cascade not null primary key,
  username text unique not null,
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.accounts enable row level security;

-- Create policies
create policy "Public accounts are viewable by everyone." on public.accounts
  for select using (true);

create policy "Users can insert their own account." on public.accounts
  for insert with check (auth.uid() = id);

create policy "Users can update their own account." on public.accounts
  for update using (auth.uid() = id);

-- Function to handle new user signups and automatically create an account
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.accounts (id, username, email)
  values (
    new.id,
    -- Try to get username from raw_user_meta_data, fallback to splitting email, or generating a random string
    coalesce(
      new.raw_user_meta_data->>'username', 
      split_part(new.email, '@', 1) || '_' || substr(md5(random()::text), 1, 4)
    ),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
