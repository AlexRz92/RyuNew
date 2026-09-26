import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (active) setUser(data.user ?? null);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      // Solo actualizamos si cambió el usuario (id distinto). Eventos como
      // TOKEN_REFRESHED al volver a la pestaña traen el mismo usuario; evitar
      // el setState previene re-renders que desmontarían formularios abiertos.
      setUser((prev) => {
        if (prev?.id === nextUser?.id) return prev;
        return nextUser;
      });
    });

    return () => {
      active = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
}
