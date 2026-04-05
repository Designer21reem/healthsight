# Supabase Database Setup Instructions

## Update Profiles Table

You need to add a `governorate` column to your `profiles` table. Run the following SQL command in your Supabase SQL Editor:

```sql
ALTER TABLE public.profiles 
ADD COLUMN governorate text;
```

## Current Profiles Table Schema

After the update, your profiles table should look like this:

```sql
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade,
  full_name text,
  avatar_url text,
  role text default 'user', -- admin | user | student | analyst
  governorate text,
  created_at timestamp with time zone default now(),
  primary key (id)
);
```

## Iraqi Governorates (18 Available)

The registration form includes all 18 Iraqi governorates:

1. Baghdad
2. Al-Anbar
3. Al-Basra
4. Al-Muthanna
5. Al-Qadisiyyah
6. An-Najaf
7. Arbil
8. As-Sulaymaniyah
9. Dhi-Qar
10. Diyala
11. Halabjah
12. Karbala
13. Kirkuk
14. Maysan
15. Nineveh
16. Salah ad-Din
17. Wasit
18. Babil
