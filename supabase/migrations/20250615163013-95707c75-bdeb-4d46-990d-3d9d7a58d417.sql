
-- Move the 'Marketing Planning' database to the correct workspace
UPDATE public.databases
SET workspace_id = '7f0dfe2d-3389-41ab-88fe-af5baef0d714'
WHERE name = 'Marketing Planning';
