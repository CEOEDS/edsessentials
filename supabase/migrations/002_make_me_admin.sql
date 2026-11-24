-- =====================================================================
-- ED'S ESSENTIALS - make yourself an admin (002)
-- Run this AFTER 001_phase3_orders.sql, and AFTER you have created an
-- account on the website with the email below.
--
-- Change the email on the line that says YOUR_EMAIL_HERE, keep the quote
-- marks, then Run. Run it once.
-- =====================================================================

insert into public.admins (user_id)
select id
from auth.users
where email = 'YOUR_EMAIL_HERE'
on conflict (user_id) do nothing;

-- Check it worked: this should return exactly one row with your email.
select u.email, a.created_at
from public.admins a
join auth.users u on u.id = a.user_id;
