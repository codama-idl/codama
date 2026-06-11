import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { type NodeKind, REGISTERED_NODE_KINDS } from '@codama/nodes';
import { describe, expect, test } from 'vitest';

import { NODE_TEST_PATHS } from '../../src/generated/nodeTestPaths';

/**
 * Drift gate: every spec-registered node kind must have a corresponding
 * `test/nodes/<path>.test.ts` fixture file. The {@link NODE_TEST_PATHS}
 * map is generated from the spec — when a new node kind ships, this
 * test fails until a matching fixture file exists.
 *
 * Runs under the `node` vitest project only (it touches `node:fs`); a
 * no-op under `browser` and `react-native`.
 */
describe.runIf(__NODEJS__)('per-node test fixture coverage', () => {
    test('NODE_TEST_PATHS lists every registered node kind', () => {
        const mappedKinds = new Set(Object.keys(NODE_TEST_PATHS));
        const missing = REGISTERED_NODE_KINDS.filter(kind => !mappedKinds.has(kind));
        const extra = [...mappedKinds].filter(kind => !(REGISTERED_NODE_KINDS as readonly string[]).includes(kind));
        expect({ extra, missing }).toEqual({ extra: [], missing: [] });
    });

    // `__filename` is provided by vitest under the `node` project; the
    // surrounding `runIf(__NODEJS__)` guards out browser/RN runs where
    // `node:fs` and `node:path` are unavailable.
    const testNodesDir = dirname(__filename);
    test.for(Object.entries(NODE_TEST_PATHS))('has a fixture file for %s', ([kind, relativePath]) => {
        const fixturePath = resolve(testNodesDir, `${relativePath}.test.ts`);
        expect(
            existsSync(fixturePath),
            `${kind as NodeKind} → ${relativePath}.test.ts is missing (resolved to ${fixturePath})`,
        ).toBe(true);
    });
});
