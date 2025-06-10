
-- Enable pg_cron and pg_net extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the cleanup function to run every 30 seconds
SELECT cron.schedule(
  'cleanup-presence-records',
  '*/30 * * * * *', -- every 30 seconds
  $$
  SELECT
    net.http_post(
        url:='https://vwntvuhhplzkbvogggkg.supabase.co/functions/v1/cleanup-presence',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3bnR2dWhocGx6a2J2b2dnZ2tnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MDg4MTQsImV4cCI6MjA2NTA4NDgxNH0.bJHYbDiNAFwD2y7i9ERPKob3DJfIVvNH4zYh5bv2K_M"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);
