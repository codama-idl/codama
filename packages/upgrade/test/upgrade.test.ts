import {
    CODAMA_ERROR__UNEXPECTED_NODE_KIND,
    CODAMA_ERROR__UNSUPPORTED_VERSION,
    CODAMA_ERROR__VERSION_MISMATCH,
    CodamaError,
} from '@codama/errors';
import { CODAMA_VERSION, CodamaVersion, programNode, rootNode } from '@codama/nodes';
import { describe, expect, test } from 'vitest';

import { upgrade, UpgradableRootNode } from '../src';

const program = programNode({ identifier: 'myProgram', publicKey: '1111', version: '1.0.0' });

function rootNodeWithVersion(version: string) {
    return { ...rootNode(program), version: version as CodamaVersion };
}

describe('upgrade', () => {
    test('it restamps IDLs of the latest major with the latest spec version', () => {
        const upgraded = upgrade(rootNodeWithVersion('2.0.0'));
        expect(upgraded.version).toBe(CODAMA_VERSION);
    });

    test('it preserves the IDL content', () => {
        const upgraded = upgrade(rootNodeWithVersion('2.4.2'));
        expect(upgraded).toEqual({ ...rootNode(program), version: CODAMA_VERSION });
    });

    test('it returns a frozen IDL', () => {
        expect(Object.isFrozen(upgrade(rootNode(program)))).toBe(true);
    });

    test('it refuses pre-1.0 IDLs', () => {
        expect(() => upgrade(rootNodeWithVersion('0.21.3'))).toThrow(
            new CodamaError(CODAMA_ERROR__UNSUPPORTED_VERSION, { version: '0.21.3' }),
        );
    });

    test('it refuses IDLs with unparsable versions', () => {
        expect(() => upgrade(rootNodeWithVersion('not-a-version'))).toThrow(
            new CodamaError(CODAMA_ERROR__UNSUPPORTED_VERSION, { version: 'not-a-version' }),
        );
    });

    test('it refuses IDLs with no version', () => {
        const versionlessRoot: Record<string, unknown> = { ...rootNode(program) };
        delete versionlessRoot.version;
        expect(() => upgrade(versionlessRoot as unknown as UpgradableRootNode)).toThrow(
            new CodamaError(CODAMA_ERROR__UNSUPPORTED_VERSION, { version: '' }),
        );
    });

    test('it refuses IDLs from a future major', () => {
        expect(() => upgrade(rootNodeWithVersion('3.4.2'))).toThrow(
            new CodamaError(CODAMA_ERROR__VERSION_MISMATCH, { codamaVersion: CODAMA_VERSION, rootVersion: '3.4.2' }),
        );
    });

    test('it refuses inputs that are not root nodes', () => {
        expect(() => upgrade(program as unknown as UpgradableRootNode)).toThrow(
            new CodamaError(CODAMA_ERROR__UNEXPECTED_NODE_KIND, {
                expectedKinds: ['rootNode'],
                kind: 'programNode',
                node: program,
            }),
        );
    });
});
