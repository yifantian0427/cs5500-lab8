import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyRepair, parseRepair } from './autoHeal.js';

test('accepts an exact repair and preserves literal dollar replacement syntax', (): void => {
  const repair = parseRepair({
    explanation: 'Correct comparison',
    edits: [{ before: '$gt', after: '$lt' }],
  });
  assert.equal(
    applyRepair('startTime: { $gt: endTime }', repair),
    'startTime: { $lt: endTime }',
  );
  assert.equal(
    applyRepair(
      'old',
      parseRepair({ explanation: '', edits: [{ before: 'old', after: '$&' }] }),
    ),
    '$&',
  );
});
test('rejects ambiguous, absent, malformed, and empty edits', (): void => {
  const repair = parseRepair({
    explanation: 'fix',
    edits: [{ before: 'old', after: 'new' }],
  });
  assert.throws((): string => applyRepair('old old', repair));
  assert.throws((): string => applyRepair('missing', repair));
  for (const value of [
    null,
    {},
    { explanation: '', edits: [] },
    { explanation: '', edits: [{ before: '', after: 'x' }] },
  ])
    assert.throws((): unknown => parseRepair(value));
});
