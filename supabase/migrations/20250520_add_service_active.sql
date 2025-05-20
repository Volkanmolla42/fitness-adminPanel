-- Add active column to services table
ALTER TABLE services 
ADD COLUMN active BOOLEAN NOT NULL DEFAULT true;

-- Update existing services to be active by default
UPDATE services 
SET active = true;

-- Add RLS policies for active status
CREATE POLICY "Enable read access for active services" ON "services"
FOR SELECT
TO authenticated
USING (active = true OR role = 'admin');

CREATE POLICY "Enable update service status for admins" ON "services"
FOR UPDATE
TO authenticated
USING (role = 'admin')
WITH CHECK (role = 'admin');
