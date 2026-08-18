const POLICY_VERSION = '2026-08-06-v1';
const keySet = (scope: string) => {
  const prefix = `maslexico:full-trie:${POLICY_VERSION}:${scope}`;
  return {
    pending: `${prefix}:pending`,
    failureUntil: `${prefix}:failure-until`,
    success: `${prefix}:success`,
  };
};

export const TRIE_BUILD_TIMEOUT_MS = 45_000;
const FAILURE_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const RECENT_PENDING_MS = 10 * 60 * 1000;

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export type TrieBuildDecision =
  | { shouldBuild: true; reason: 'capable' }
  | {
      shouldBuild: false;
      reason: 'low-memory' | 'unknown-memory' | 'recent-failure' | 'interrupted-build';
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
  const now = Date.now();
  const { local, session } = getStorages();
  const keys = keySet(scope);
  const navigatorWithMemory = navigator as Navigator & { deviceMemory?: number };

  // Chromium exposes this hint. WebKit does not, and building the full trie
  // duplicates the dictionary in memory while users are trying to search.
  if (
    navigatorWithMemory.deviceMemory !== undefined &&
    navigatorWithMemory.deviceMemory <= 4
  ) {
    return { shouldBuild: false, reason: 'low-memory' };
  }

  const isWebKit = /AppleWebKit/i.test(navigator.userAgent) &&
    !/(Chrome|Chromium|Edg)/i.test(navigator.userAgent);
  if (navigatorWithMemory.deviceMemory === undefined && isWebKit) {
    return { shouldBuild: false, reason: 'unknown-memory' };
  }

  const pendingSince = readTimestamp(session, keys.pending);
  removeKey(session, keys.pending);
  if (pendingSince !== null && now - pendingSince <= RECENT_PENDING_MS) {
    writeTimestamp(local, keys.failureUntil, now + FAILURE_COOLDOWN_MS);
    return { shouldBuild: false, reason: 'interrupted-build' };
  }

  const failureUntil = readTimestamp(local, keys.failureUntil);
  if (failureUntil !== null && failureUntil > now) {
    return { shouldBuild: false, reason: 'recent-failure' };
  }
  removeKey(local, keys.failureUntil);

  return { shouldBuild: true, reason: 'capable' };
};

export const markTrieBuildStarted = (scope = '2017'): void => {
  const { local, session } = getStorages();
  const keys = keySet(scope);
  removeKey(local, keys.success);
  writeTimestamp(session, keys.pending, Date.now());
};

export const markTrieBuildSucceeded = (scope = '2017'): void => {
  const { local, session } = getStorages();
  const keys = keySet(scope);
  removeKey(session, keys.pending);
  removeKey(local, keys.failureUntil);
  writeTimestamp(local, keys.success, Date.now());
};

export const markTrieBuildFailed = (scope = '2017'): void => {
  const { local, session } = getStorages();
  const keys = keySet(scope);
  removeKey(session, keys.pending);
  removeKey(local, keys.success);
  writeTimestamp(local, keys.failureUntil, Date.now() + FAILURE_COOLDOWN_MS);
};
