const POLICY_VERSION = '2026-08-06-v1';
const KEY_PREFIX = `maslexico:full-trie:${POLICY_VERSION}`;
const PENDING_KEY = `${KEY_PREFIX}:pending`;
const FAILURE_UNTIL_KEY = `${KEY_PREFIX}:failure-until`;
const SUCCESS_KEY = `${KEY_PREFIX}:success`;

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

export const getTrieBuildDecision = (): TrieBuildDecision => {
  const now = Date.now();
  const { local, session } = getStorages();
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

  const pendingSince = readTimestamp(session, PENDING_KEY);
  removeKey(session, PENDING_KEY);
  if (pendingSince !== null && now - pendingSince <= RECENT_PENDING_MS) {
    writeTimestamp(local, FAILURE_UNTIL_KEY, now + FAILURE_COOLDOWN_MS);
    return { shouldBuild: false, reason: 'interrupted-build' };
  }

  const failureUntil = readTimestamp(local, FAILURE_UNTIL_KEY);
  if (failureUntil !== null && failureUntil > now) {
    return { shouldBuild: false, reason: 'recent-failure' };
  }
  removeKey(local, FAILURE_UNTIL_KEY);

  return { shouldBuild: true, reason: 'capable' };
};

export const markTrieBuildStarted = (): void => {
  const { local, session } = getStorages();
  removeKey(local, SUCCESS_KEY);
  writeTimestamp(session, PENDING_KEY, Date.now());
};

export const markTrieBuildSucceeded = (): void => {
  const { local, session } = getStorages();
  removeKey(session, PENDING_KEY);
  removeKey(local, FAILURE_UNTIL_KEY);
  writeTimestamp(local, SUCCESS_KEY, Date.now());
};

export const markTrieBuildFailed = (): void => {
  const { local, session } = getStorages();
  removeKey(session, PENDING_KEY);
  removeKey(local, SUCCESS_KEY);
  writeTimestamp(local, FAILURE_UNTIL_KEY, Date.now() + FAILURE_COOLDOWN_MS);
};
