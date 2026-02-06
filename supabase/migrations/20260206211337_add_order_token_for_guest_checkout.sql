/*
  # Add order_token for guest checkout security

  1. Changes
    - Add `order_token` column to `orders` table
      - Type: uuid with default gen_random_uuid()
      - Used to validate guest requests securely
      - Allows guests to upload payment proofs without authentication
  
  2. Security
    - Token is generated automatically for each order
    - Only users with the token can upload payment proof
    - Prevents unauthorized access to other orders
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'order_token'
  ) THEN
    ALTER TABLE orders ADD COLUMN order_token uuid DEFAULT gen_random_uuid() NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_orders_order_token ON orders(order_token);
  END IF;
END $$;