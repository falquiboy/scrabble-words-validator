/**
 * Contexto global para estado de actividad del usuario
 * Permite que el sistema de Trie detecte cuándo es seguro hacer hot upgrade
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useUserActivity } from '@/hooks/useUserActivity';

interface UserActivityContextType {
  signalTyping: () => void;
  signalSearching: () => void;
  isUserActive: () => boolean;
  isSafeForUpgrade: () => boolean;
  activityState: {
    isTyping: boolean;
    isSearching: boolean;
    lastActivity: number;
  };
}

const UserActivityContext = createContext<UserActivityContextType | null>(null);

export const UserActivityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const userActivity = useUserActivity();
  
  return (
    <UserActivityContext.Provider value={userActivity}>
      {children}
    </UserActivityContext.Provider>
  );
};

export const useUserActivityContext = () => {
  const context = useContext(UserActivityContext);
  if (!context) {
    throw new Error('useUserActivityContext must be used within UserActivityProvider');
  }
  return context;
};