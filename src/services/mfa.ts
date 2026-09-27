import { supabase } from '../lib/supabase';

/**
 * Servicio de autenticación en dos pasos (MFA / TOTP) sobre Supabase Auth.
 * TOTP = códigos de tiempo tipo Google Authenticator / Authy.
 */

export interface EnrollResult {
  factorId: string;
  /** Imagen QR (data URI SVG) para escanear con la app autenticadora. */
  qrCode: string;
  /** Secreto en texto, por si el usuario prefiere ingresarlo manualmente. */
  secret: string;
}

/** Inicia la inscripción de un factor TOTP y devuelve el QR a escanear. */
export async function enrollTotp(): Promise<EnrollResult> {
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
  if (error) throw error;
  return {
    factorId: data.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
  };
}

/**
 * Confirma la inscripción verificando el primer código de 6 dígitos.
 * Tras esto, el factor queda activo.
 */
export async function verifyEnrollment(factorId: string, code: string): Promise<void> {
  const challenge = await supabase.auth.mfa.challenge({ factorId });
  if (challenge.error) throw challenge.error;

  const verify = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.data.id,
    code,
  });
  if (verify.error) throw verify.error;
}

/** Verifica el código durante el inicio de sesión (segundo factor). */
export async function verifyLoginCode(factorId: string, code: string): Promise<void> {
  const challenge = await supabase.auth.mfa.challenge({ factorId });
  if (challenge.error) throw challenge.error;

  const verify = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.data.id,
    code,
  });
  if (verify.error) throw verify.error;
}

/** Elimina (desactiva) un factor MFA del usuario actual. */
export async function unenrollTotp(factorId: string): Promise<void> {
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) throw error;
}

export interface TotpFactorInfo {
  id: string;
  status: 'verified' | 'unverified';
}

/** Lista los factores TOTP del usuario actual. */
export async function listTotpFactors(): Promise<TotpFactorInfo[]> {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw error;
  return (data.totp ?? []).map((f) => ({ id: f.id, status: f.status as 'verified' | 'unverified' }));
}

/** True si el usuario tiene al menos un factor TOTP verificado (2FA activo). */
export async function hasVerifiedTotp(): Promise<boolean> {
  const factors = await listTotpFactors();
  return factors.some((f) => f.status === 'verified');
}

/**
 * Devuelve el nivel de aseguramiento actual y el requerido.
 * Si current='aal1' y next='aal2', significa que falta introducir el código MFA.
 */
export async function getAssuranceLevel(): Promise<{ current: string | null; next: string | null }> {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) throw error;
  return { current: data.currentLevel, next: data.nextLevel };
}

/** Devuelve el primer factor TOTP verificado, o null. */
export async function getVerifiedFactorId(): Promise<string | null> {
  const factors = await listTotpFactors();
  return factors.find((f) => f.status === 'verified')?.id ?? null;
}
