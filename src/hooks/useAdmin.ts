import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { checkIsAdmin } from '../services/admin';

/**
 * Determina si el usuario autenticado es administrador.
 * `loading` es true mientras se resuelve la sesión o la comprobación.
 */
export function useAdmin() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    if (authLoading) return;

    if (!user) {
      setIsAdmin(false);
      setChecking(false);
      return;
    }

    setChecking(true);
    checkIsAdmin(user.id)
      .then((result) => {
        if (active) setIsAdmin(result);
      })
      .catch(() => {
        if (active) setIsAdmin(false);
      })
      .finally(() => {
        if (active) setChecking(false);
      });

    return () => {
      active = false;
    };
  }, [user, authLoading]);

  return { isAdmin, loading: authLoading || checking, user };
}
