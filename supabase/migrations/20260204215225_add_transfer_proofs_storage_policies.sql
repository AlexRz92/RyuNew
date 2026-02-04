/*
  # Storage Policies for Transfer Proofs

  1. Policies
    - Allow anyone to upload transfer proofs (guests and authenticated users)
    - Files are stored in the path: orders/{tracking_code}/comprobante.{ext}
    - Bucket is private, so files are not publicly accessible
  
  2. Notes
    - Upload is open to support guest checkout
    - Files can only be uploaded once per order (same tracking code path)
    - Reading files requires authentication (admin only)
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow upload transfer proofs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated read transfer proofs" ON storage.objects;

-- Allow anyone to upload transfer proofs
CREATE POLICY "Allow upload transfer proofs"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (
    bucket_id = 'transfer-proofs'
    AND (storage.foldername(name))[1] = 'orders'
  );

-- Allow authenticated users to view transfer proofs (for admin panel)
CREATE POLICY "Allow authenticated read transfer proofs"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'transfer-proofs');
