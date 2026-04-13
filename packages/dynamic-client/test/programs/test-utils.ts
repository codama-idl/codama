import { readFileSync } from 'node:fs';
import path from 'node:path';

import { createFromJson, type RootNode } from 'codama';

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
    return createProgramClient<T>(idl);
}

export function loadRoot(idlFileName: string): RootNode {
    const idl = loadIdl(idlFileName);
    const json = JSON.stringify(idl);
    return createFromJson(json).getRoot();
}

export { SvmTestContext, type EncodedAccount } from '../svm-test-context';
