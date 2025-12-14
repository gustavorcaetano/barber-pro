-- Drop existing SELECT policies on appointments table
DROP POLICY IF EXISTS "Clients can view own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Barbers can view all appointments" ON public.appointments;

-- Recreate SELECT policies with explicit role targeting to authenticated users only
-- This prevents anonymous users from accessing appointment data

CREATE POLICY "Clients can view own appointments" 
ON public.appointments 
FOR SELECT 
TO authenticated
USING (client_id = auth.uid());

CREATE POLICY "Barbers can view all appointments" 
ON public.appointments 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'barber'::app_role));