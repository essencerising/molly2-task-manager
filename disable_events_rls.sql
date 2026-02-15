-- Ideiglenes megoldás: RLS kikapcsolása az events táblán a fejlesztés idejére
-- Mivel az Auth még nincs teljesen kész, és anonim módban fejlesztünk, a szigorú RLS blokkolja a kéréseket.

alter table public.events disable row level security;
