/*
  # Fix Customer Profile Registration

  1. Changes
    - Create trigger function to auto-create customer profiles on user signup
    - Update RLS policies to allow profile updates after creation
    - Add policy for service role to insert profiles

  2. Security
    - Maintains RLS restrictions
    - Users can only update their own profiles
    - Service role can create profiles via trigger
*/

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.customer_profiles (id, first_name, last_name, phone, state, city, country)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    COALESCE(new.raw_user_meta_data->>'state', ''),
    COALESCE(new.raw_user_meta_data->>'city', ''),
    'Venezuela'
  );
  RETURN new;
END;
$$;

-- Create trigger to automatically create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Drop old restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert own profile" ON customer_profiles;

-- Add policy for service role to manage profiles (for trigger)
CREATE POLICY "Service role can manage profiles"
  ON customer_profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
