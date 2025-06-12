
-- Add visibility settings to fields table
ALTER TABLE public.fields 
ADD COLUMN visibility_setting text DEFAULT 'show_when_not_empty' 
CHECK (visibility_setting IN ('always_show', 'always_hide', 'show_when_not_empty'));

-- Add index for performance
CREATE INDEX idx_fields_visibility_setting ON public.fields(visibility_setting);

-- Update existing fields to use the default setting
UPDATE public.fields 
SET visibility_setting = 'show_when_not_empty' 
WHERE visibility_setting IS NULL;
