import { supabase } from '../lib/supabase';
import type { BankAccount } from '../lib/types';

/** Lista las cuentas bancarias activas, ordenadas para el carrusel del checkout. */
export async function getActiveBankAccounts(): Promise<BankAccount[]> {
  const { data, error } = await supabase
    .from('bank_accounts')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data ?? [];
}
