-- Add unique constraint to prevent double bookings for the same barber at the same date/time
ALTER TABLE public.appointments 
ADD CONSTRAINT unique_barber_appointment 
UNIQUE (barber_id, appointment_date, appointment_time);