import test from 'node:test';
import assert from 'node:assert/strict';
import { decideTrieBuild } from '../src/utils/trieBuildPolicy.ts';

const snapshot = (overrides = {}) => ({
  deviceMemory: undefined,
  hasPreviousSuccess: false,
  hasSessionFailure: false,
  hasInterruptedBuild: false,
  ...overrides,
});

test('unknown device memory is allowed to prove capability', () => {
  assert.deepEqual(decideTrieBuild(snapshot()), {
    shouldBuild: true,
    reason: 'capable',
  });
});

test('an earlier successful build overrides the coarse low-memory hint', () => {
  assert.deepEqual(decideTrieBuild(snapshot({
    deviceMemory: 4,
    hasPreviousSuccess: true,
  })), {
    shouldBuild: true,
    reason: 'proven-capable',
  });
});

test('explicitly low memory remains protected until capability is proven', () => {
  assert.deepEqual(decideTrieBuild(snapshot({ deviceMemory: 4 })), {
    shouldBuild: false,
    reason: 'low-memory',
  });
});

test('a real failure disables retries only for the current session', () => {
  assert.deepEqual(decideTrieBuild(snapshot({ hasSessionFailure: true })), {
    shouldBuild: false,
    reason: 'session-failure',
  });
});

test('a current-session failure takes precedence over an older success', () => {
  assert.deepEqual(decideTrieBuild(snapshot({
    hasPreviousSuccess: true,
    hasSessionFailure: true,
  })), {
    shouldBuild: false,
    reason: 'session-failure',
  });
});

test('an uncleanly interrupted build is not treated as device incapability', () => {
  assert.deepEqual(decideTrieBuild(snapshot({ hasInterruptedBuild: true })), {
    shouldBuild: false,
    reason: 'interrupted-build',
  });
});
