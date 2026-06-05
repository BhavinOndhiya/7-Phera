-- Remove unused gift registry / wishlist table (cash gifts use guest_contributions)

DROP POLICY IF EXISTS "Authenticated full access gifts" ON public.gifts;
DROP POLICY IF EXISTS "gifts_select" ON public.gifts;
DROP POLICY IF EXISTS "gifts_insert" ON public.gifts;
DROP POLICY IF EXISTS "gifts_update" ON public.gifts;
DROP POLICY IF EXISTS "gifts_delete" ON public.gifts;

DROP TABLE IF EXISTS public.gifts;
