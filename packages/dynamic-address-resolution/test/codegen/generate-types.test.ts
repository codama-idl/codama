import {
    constantPdaSeedNodeFromString,
    definedTypeLinkNode,
    definedTypeNode,
    instructionNode,
    optionTypeNode,
    pdaNode,
    programNode,
    rootNode,
    structFieldTypeNode,
    structTypeNode,
} from 'codama';
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
                identifier: 'p',
                instructions: [],
                pdas: [pdaNode({ identifier: 'cfg', seeds: [constantPdaSeedNodeFromString('utf8', 'cfg')] })],
                publicKey: '11111111111111111111111111111111',
            }),
        );

        const output = generateTypes(root);
        expect(output).toContain("import type { Address, ProgramDerivedAddress } from '@solana/addresses';");
    });

    test('it emits the aliases of the recursive types it references', () => {
        const node = definedTypeNode({
            identifier: 'node',
            type: structTypeNode([
                structFieldTypeNode({ identifier: 'next', type: optionTypeNode(definedTypeLinkNode('node')) }),
            ]),
        });
        const push = instructionNode({ data: definedTypeLinkNode('node'), identifier: 'push' });
        const root = rootNode(
            programNode({ definedTypes: [node], identifier: 'p', instructions: [push], publicKey: '1111' }),
        );

        const output = generateTypes(root);
        expect(output).toContain('export type NodeArgs = { next?: NodeArgs | null };');
        expect(output).toContain('export type PushInstructionDataArgs = { next?: NodeArgs | null };');
    });
});
