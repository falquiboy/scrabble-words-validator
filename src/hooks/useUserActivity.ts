/**
 * Hook para detectar actividad del usuario y evitar interrupciones
 * durante escritura o búsquedas activas
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface UserActivityState {
  isTyping: boolean;
  isSearching: boolean;
  lastActivity: number;
}

const TYPING_TIMEOUT = 1500; // 1.5s sin actividad para considerar que dejó de escribir
const SEARCH_TIMEOUT = 3000; // 3s sin búsquedas para considerar inactivo

export const useUserActivity = () => {
  const [activityState, setActivityState] = useState<UserActivityState>({
    isTyping: false,
    isSearching: false,
    lastActivity: Date.now()
  });
  
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Señalar que el usuario está escribiendo
  const signalTyping = useCallback(() => {
    setActivityState(prev => ({
      ...prev,
      isTyping: true,
      lastActivity: Date.now()
    }));

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setActivityState(prev => ({
        ...prev,
        isTyping: false
      }));
    }, TYPING_TIMEOUT);
  }, []);

  // Señalar que hay una búsqueda en proceso
  const signalSearching = useCallback(() => {
    setActivityState(prev => ({
      ...prev,
      isSearching: true,
      lastActivity: Date.now()
    }));

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout
    searchTimeoutRef.current = setTimeout(() => {
      setActivityState(prev => ({
        ...prev,
        isSearching: false
      }));
    }, SEARCH_TIMEOUT);
  }, []);

  // Verificar si el usuario está activo (escribiendo o buscando)
  const isUserActive = useCallback(() => {
    return activityState.isTyping || activityState.isSearching;
  }, [activityState.isTyping, activityState.isSearching]);

  // Verificar si es seguro hacer hot upgrade
  const isSafeForUpgrade = useCallback(() => {
    const timeSinceLastActivity = Date.now() - activityState.lastActivity;
    return !isUserActive() && timeSinceLastActivity > 2000; // 2s de gracia
  }, [activityState.lastActivity, isUserActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return {
    signalTyping,
    signalSearching,
    isUserActive,
    isSafeForUpgrade,
    activityState // For debugging
  };
};