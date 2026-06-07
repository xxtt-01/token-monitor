'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  affectedComponentNames,
  agoBucket
} = require('../../src/electron/renderer/serviceStatusPresentation');

test('affectedComponentNames splits names into a visible slice and overflow count', () => {
  const issues = [
    { name: 'claude.ai' },
    { name: 'Claude API' },
    { name: 'Claude Code' },
    { name: 'Claude Cowork' }
  ];

  assert.deepEqual(affectedComponentNames(issues, 2), {
    all: ['claude.ai', 'Claude API', 'Claude Code', 'Claude Cowork'],
    visible: ['claude.ai', 'Claude API'],
    overflow: 2
  });
});

test('affectedComponentNames has no overflow when names fit within the limit', () => {
  const issues = [{ name: 'API' }, { name: 'Search' }];

  assert.deepEqual(affectedComponentNames(issues, 2), {
    all: ['API', 'Search'],
    visible: ['API', 'Search'],
    overflow: 0
  });
});

test('affectedComponentNames ignores blank names and tolerates bad input', () => {
  assert.deepEqual(affectedComponentNames([], 2), { all: [], visible: [], overflow: 0 });
  assert.deepEqual(affectedComponentNames(null, 2), { all: [], visible: [], overflow: 0 });
  assert.deepEqual(affectedComponentNames([{ name: '  ' }, { name: 'Search' }], 2), {
    all: ['Search'],
    visible: ['Search'],
    overflow: 0
  });
});

test('agoBucket buckets into seconds, minutes, and hours', () => {
  assert.deepEqual(agoBucket(0), { unit: 'seconds', value: 0 });
  assert.deepEqual(agoBucket(5_000), { unit: 'seconds', value: 5 });
  assert.deepEqual(agoBucket(65_000), { unit: 'minutes', value: 1 });
  assert.deepEqual(agoBucket(3_600_000), { unit: 'hours', value: 1 });
  assert.deepEqual(agoBucket(7_500_000), { unit: 'hours', value: 2 });
});
