import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { checkIsAdmin } from '../services/admin';

/**
 * Determina si el usuario autenticado es administrador.
 * `loading` es true mientras se resuelve la sesión o la comprobación.
 *
 * Solo re-verifica cuando cambia el id del usuario (no en cada refresh de
 * token), para no desmontar la vista de admin mientras se trabaja.
 */
export function useAdmin() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const checkedUserId = useRef<string | null>(null);

  useEffect(() => {
    let active = true;

    if (authLoading) return;

    if (!user) {
      checkedUserId.current = null;
      setIsAdmin(false);
      setChecking(false);
      return;
    }

    // Si ya verificamos a este mismo usuario, no repetimos (evita el parpadeo
    // de "Verificando acceso..." al cambiar de pestaña).
    if (checkedUserId.current === user.id) {
      setChecking(false);
      return;
    }

    setChecking(true);
    checkIsAdmin(user.id)
      .then((result) => {
        if (!active) return;
        checkedUserId.current = user.id;
        setIsAdmin(result);
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
