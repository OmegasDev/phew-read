// contexts/DatabaseContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '@/services/database';

type DatabaseContextType = {
  isReady: boolean;
  error: string | null;
};

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        await db.init();
        if (mounted) setIsReady(true);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Database initialization failed');
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <DatabaseContext.Provider value={{ isReady, error }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export const useDatabase = () => {
  const ctx = useContext(DatabaseContext);
  if (!ctx) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return ctx;
};
