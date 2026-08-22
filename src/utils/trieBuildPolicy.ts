const POLICY_VERSION = '2026-08-21-v2';
const keySet = (scope: string) => {
  const prefix = `maslexico:full-trie:${POLICY_VERSION}:${scope}`;
  return {
    pending: `${prefix}:pending`,
    sessionFailure: `${prefix}:session-failure`,
    success: `${prefix}:success`,
  };
};

export const TRIE_BUILD_STALL_TIMEOUT_MS = 30_000;

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export type TrieBuildDecision =
  | { shouldBuild: true; reason: 'capable' | 'proven-capable' }
  | {
      shouldBuild: false;
      reason: 'low-memory' | 'session-failure' | 'interrupted-build';
    };

export interface TrieBuildSnapshot {
  deviceMemory?: number;
  hasPreviousSuccess: boolean;
  hasSessionFailure: boolean;
  hasInterruptedBuild: boolean;
}

export const decideTrieBuild = ({
  deviceMemory,
  hasPreviousSuccess,
  hasSessionFailure,
  hasInterruptedBuild,
}: TrieBuildSnapshot): TrieBuildDecision => {
  // A successful build on this browser is stronger evidence than a coarse
  // memory hint. The policy version changes whenever the Trie format changes.
  if (hasInterruptedBuild) return { shouldBuild: false, reason: 'interrupted-build' };
  if (hasSessionFailure) return { shouldBuild: false, reason: 'session-failure' };
  if (hasPreviousSuccess) return { shouldBuild: true, reason: 'proven-capable' };

  // Keep the explicit low-memory guard, but do not equate an unavailable hint
  // (notably on WebKit and iOS browsers) with an incapable device.
  if (deviceMemory !== undefined && deviceMemory <= 4) {
    return { shouldBuild: false, reason: 'low-memory' };
  }

  return { shouldBuild: true, reason: 'capable' };
};

const readTimestamp = (storage: StorageLike | undefined, key: string): number | null => {
  if (!storage) return null;
  try {
    const value = Number(storage.getItem(key));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
};

const writeTimestamp = (
  storage: StorageLike | undefined,
  key: string,
  value: number
): void => {
  if (!storage) return;
  try {
    storage.setItem(key, String(value));
  } catch {
    // Private browsing and locked-down webviews may reject storage writes.
  }
};

const removeKey = (storage: StorageLike | undefined, key: string): void => {
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch {
    // Storage is only a safety hint; the Trie can still be attempted without it.
  }
};

const getStorages = (): {
  local: StorageLike | undefined;
  session: StorageLike | undefined;
} => {
  if (typeof window === 'undefined') return { local: undefined, session: undefined };
  try {
    return { local: window.localStorage, session: window.sessionStorage };
  } catch {
    return { local: undefined, session: undefined };
  }
};

export const getTrieBuildDecision = (scope = '2017'): TrieBuildDecision => {
  const { local, session } = getStorages();
  const keys = keySet(scope);
  const navigatorWithMemory = navigator as Navigator & { deviceMemory?: number };

  const pendingSince = readTimestamp(session, keys.pending);
  removeKey(session, keys.pending);
  if (pendingSince !== null) {
    writeTimestamp(session, keys.sessionFailure, Date.now());
  }

  return decideTrieBuild({
    deviceMemory: navigatorWithMemory.deviceMemory,
    hasPreviousSuccess: readTimestamp(local, keys.success) !== null,
    hasSessionFailure: readTimestamp(session, keys.sessionFailure) !== null,
    hasInterruptedBuild: pendingSince !== null,
  });
};

export const markTrieBuildStarted = (scope = '2017'): void => {
  const { session } = getStorages();
  const keys = keySet(scope);
  writeTimestamp(session, keys.pending, Date.now());
};

export const markTrieBuildSucceeded = (scope = '2017'): void => {
  const { local, session } = getStorages();
  const keys = keySet(scope);
  removeKey(session, keys.pending);
  removeKey(session, keys.sessionFailure);
  writeTimestamp(local, keys.success, Date.now());
};

export const markTrieBuildFailed = (scope = '2017'): void => {
  const { local, session } = getStorages();
  const keys = keySet(scope);
  removeKey(session, keys.pending);
  removeKey(local, keys.success);
  writeTimestamp(session, keys.sessionFailure, Date.now());
};

export const markTrieBuildCancelled = (scope = '2017'): void => {
  const { session } = getStorages();
  removeKey(session, keySet(scope).pending);
};
