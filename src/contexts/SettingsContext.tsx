import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getStoreSettings, DEFAULT_SETTINGS } from '../services/settings';
import type { StoreSettings } from '../lib/types';

interface SettingsContextType {
  settings: StoreSettings;
  loading: boolean;
  reload: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getStoreSettings()
      .then(setSettings)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, reload: load }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings debe ser usado dentro de SettingsProvider');
  }
  return context;
}
