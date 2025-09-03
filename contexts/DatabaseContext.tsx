import React, { createContext, useContext, useEffect, useState } from 'react';

interface DatabaseContextType {
  isReady: boolean;
  error: string | null;
}

const DatabaseContext = createContext<DatabaseContextType>({
  isReady: false,
  error: null,
});

export const useDatabaseContext = () => useContext(DatabaseContext);

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initDatabase = async () => {
      try {
        const { databaseService } = await import('../services/database');
        await databaseService.init();
        setIsReady(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Database initialization failed');
      }
    };

    initDatabase();
  }, []);

  return (
    <DatabaseContext.Provider value={{ isReady, error }}>
      {children}
    </DatabaseContext.Provider>
  );
};