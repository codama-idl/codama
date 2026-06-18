import { constantPdaSeedNodeFromString, pdaNode, programNode, rootNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { generateTypes } from '../../src/codegen/generate-types';
import { makeRoot } from '../test-utils';

describe('generateTypes', () => {
    test('should omit ProgramDerivedAddress from the header when there are no PDAs', () => {
        const root = makeRoot([]);
        const output = generateTypes(root);

        expect(output).toContain("import type { Address } from '@solana/addresses';");
        expect(output).not.toContain('ProgramDerivedAddress');
    });

    test('should include ProgramDerivedAddress in the header when PDAs are present', () => {
        const root = rootNode(
            programNode({
                instructions: [],
                name: 'p',
                pdas: [pdaNode({ name: 'cfg', seeds: [constantPdaSeedNodeFromString('utf8', 'cfg')] })],
                publicKey: '11111111111111111111111111111111',
            }),
        );

        const output = generateTypes(root);
        expect(output).toContain("import type { Address, ProgramDerivedAddress } from '@solana/addresses';");
    });
});
