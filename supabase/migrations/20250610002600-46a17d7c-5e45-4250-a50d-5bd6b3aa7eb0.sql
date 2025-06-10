
-- Create storage bucket for image uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'planna_uploads', 
  'planna_uploads', 
  false, 
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- Create RLS policies for the bucket
-- Policy to allow authenticated users to upload files
CREATE POLICY "Users can upload images" ON storage.objects
FOR INSERT 
WITH CHECK (
  bucket_id = 'planna_uploads' 
  AND auth.role() = 'authenticated'
);

-- Policy to allow users to view their own uploaded files
CREATE POLICY "Users can view images" ON storage.objects
FOR SELECT 
USING (
  bucket_id = 'planna_uploads' 
  AND auth.role() = 'authenticated'
);

-- Policy to allow users to delete their own uploaded files
CREATE POLICY "Users can delete their own images" ON storage.objects
FOR DELETE 
USING (
  bucket_id = 'planna_uploads' 
  AND auth.role() = 'authenticated'
);
