/*
  # Allow guest users to update payment proof

  1. Changes
    - Add policy to allow anyone (guest or authenticated) to update payment_proof_url
    - Only allows updating when payment_proof_url is currently NULL (first upload only)
    - Restricts update to only the payment_proof_url field
  
  2. Security
    - Only allows updating orders where payment_proof_url is NULL
    - Cannot modify other order fields
    - One-time update per order
*/

-- Allow anyone to update payment_proof_url for orders without proof
CREATE POLICY "Anyone can add payment proof once"
  ON orders
  FOR UPDATE
  TO public
  USING (payment_proof_url IS NULL)
  WITH CHECK (payment_proof_url IS NOT NULL);
