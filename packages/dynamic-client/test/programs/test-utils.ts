import { readFileSync } from 'node:fs';
import path from 'node:path';

import { CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE } from '@codama/errors';
import { createFromJson, type NodeKind, type RootNode } from 'codama';
import { expect } from 'vitest';

import type { IdlInput, ProgramClient } from '../../src';
import { createProgramClient } from '../../src';

export function loadIdl(idlFileName: string, baseDir?: string): IdlInput {
    const basePath = baseDir ?? path.resolve(__dirname, 'idls');
    const idlPath = path.resolve(basePath, idlFileName);
    const idlJson: unknown = JSON.parse(readFileSync(idlPath, 'utf8'));
    if (typeof idlJson !== 'object' || idlJson === null) {
        throw new Error(`Invalid IDL json: ${idlFileName}`);
    }
    return idlJson as IdlInput;
}

/**
 * Creates a program client for tests. Pass a generated client type for full type safety:
 * ```ts
 * import type { SystemProgramClient } from '../generated/system-program-idl-types';
 * const client = createTestProgramClient<SystemProgramClient>('system-program-idl.json');
 * // client.methods.advanceNonceAccount etc. are now typed, no non-null assertions needed
 * ```
 */
export function createTestProgramClient<T = ProgramClient>(idlFileName: string): T {
    const idl = loadIdl(idlFileName);
    // Test programs read no account data, so their clients need no `fetchAccounts`.
    return createProgramClient<ProgramClient>(idl) as T;
}

export function loadRoot(idlFileName: string): RootNode {
    const idl = loadIdl(idlFileName);
    const json = JSON.stringify(idl);
    return createFromJson(json).getRoot();
}

/**
 * Matches the error raised when a node of the given kind cannot encode the
 * value it was given, e.g. a missing field, within the given node of its path,
 * e.g. the data field, defined type or instruction it belongs to. The path of
 * the error must end at a node of that kind and contain the given node.
 *
 * @example
 * ```ts
 * await expect(promise).rejects.toThrow(
 *     valueTypeError({ identifier: 'name', kind: 'structFieldTypeNode' }, { actualType: 'undefined', nodeKind: 'stringTypeNode' }),
 * );
 * ```
 */
export function valueTypeError(
    within: { identifier: string; kind: NodeKind },
    context: { actualType: string; nodeKind: NodeKind },
): unknown {
    const { nodeKind, ...rest } = context;
    return expect.objectContaining({
        context: expect.objectContaining({
            __code: CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE,
            ...rest,
            path: pathMatching(within, nodeKind),
        }),
    });
}

/** Matches a node path ending at a node of the given kind and containing the given node. */
function pathMatching(within: { identifier: string; kind: NodeKind }, lastKind: NodeKind) {
    const containsWithin = expect.arrayContaining([expect.objectContaining(within)]) as {
        asymmetricMatch: (other: unknown) => boolean;
    };
    return {
        asymmetricMatch: (path: unknown) =>
            Array.isArray(path) &&
            (path.at(-1) as { kind?: unknown } | undefined)?.kind === lastKind &&
            containsWithin.asymmetricMatch(path),
        toAsymmetricMatcher: () => `PathMatching<containing ${within.identifier}, ending at ${lastKind}>`,
    };
}

export { SvmTestContext, type EncodedAccount } from '../svm-test-context';
