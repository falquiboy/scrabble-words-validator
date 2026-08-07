import { useCallback, useEffect, useState } from 'react';

export type TrainingMode = 'superuser' | 'production';

interface TrainingSession {
  sessionId: string;
  userId: string;
  mode: TrainingMode;
  queries: unknown[];
  corrections: unknown[];
  rulesCreated: unknown[];
  startedAt: string;
}

interface TrainingUser {
  id: string;
  email: string;
  role: 'admin' | 'trainer' | 'user';
  permissions: string[];
}

/**
 * The former demo authenticated privileged users entirely in browser code and
 * trusted localStorage. That cannot form a security boundary. Keep consumers
 * in production mode until a server-verified Supabase role flow is built.
 */
export const useTrainingMode = () => {
  const [mode, setMode] = useState<TrainingMode>('production');
  const user: TrainingUser | null = null;
  const session: TrainingSession | null = null;
  const isAuthenticated = false;

  useEffect(() => {
    localStorage.removeItem('training_session');
    localStorage.removeItem('training_mode');
  }, []);

  const authenticate = useCallback((_email: string, _password: string): boolean => false, []);
  const startTrainingSession = useCallback((_requestedMode: TrainingMode): null => null, []);
  const endTrainingSession = useCallback(() => {
    setMode('production');
    localStorage.removeItem('training_session');
    localStorage.removeItem('training_mode');
  }, []);
  const addQueryToSession = useCallback((_query: string, _response: unknown): void => {}, []);
  const addCorrectionToSession = useCallback(
    (_originalResponse: unknown, _correctedResponse: unknown, _feedback: string): void => {},
    []
  );
  const canAccessFeature = useCallback(
    (feature: string): boolean => mode === 'production' && ['query', 'view_results'].includes(feature),
    [mode]
  );

  return {
    mode,
    user,
    session,
    isAuthenticated,
    authenticate,
    startTrainingSession,
    endTrainingSession,
    addQueryToSession,
    addCorrectionToSession,
    canAccessFeature,
    setMode
  };
};
