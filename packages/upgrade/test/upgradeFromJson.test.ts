import {
    accountNode,
    CODAMA_VERSION,
    definedTypeNode,
    instructionAccountNode,
    instructionNode,
    integerTypeNode,
    pdaNode,
    programNode,
    publicKeyTypeNode,
    rootNode,
    structFieldTypeNode,
    structTypeNode,
    variablePdaSeedNode,
} from '@codama/nodes';
import { getValidationItemsVisitor, throwValidatorItemsVisitor } from '@codama/validators';
import { visit } from '@codama/visitors-core';
import { describe, expect, test } from 'vitest';

import { upgradeFromJson } from '../src';

/**
 * A representative IDL of the latest major carrying an older minor version
 * stamp, the way it would arrive from disk or from the chain.
 */
const json = JSON.stringify({
    ...rootNode(
        programNode({
            accounts: [
                accountNode({
                    data: structTypeNode([
                        structFieldTypeNode({ identifier: 'authority', type: publicKeyTypeNode() }),
                        structFieldTypeNode({ identifier: 'amount', type: integerTypeNode('u64') }),
                    ]),
                    identifier: 'counter',
                }),
            ],
            definedTypes: [definedTypeNode({ identifier: 'myType', type: integerTypeNode('u32') })],
            identifier: 'myProgram',
            instructions: [
                instructionNode({
                    accounts: [instructionAccountNode({ identifier: 'authority', isSigner: true, isWritable: true })],
                    data: structTypeNode([structFieldTypeNode({ identifier: 'amount', type: integerTypeNode('u64') })]),
                    identifier: 'increment',
                }),
            ],
            pdas: [pdaNode({ identifier: 'counter', seeds: [variablePdaSeedNode('authority', publicKeyTypeNode())] })],
            publicKey: '1111',
            version: '1.0.0',
        }),
    ),
    version: '2.0.0',
});

describe('upgradeFromJson', () => {
    test('it parses and upgrades a JSON-encoded IDL', () => {
        const upgraded = upgradeFromJson(json);
        expect(upgraded.version).toBe(CODAMA_VERSION);
        expect(upgraded.program.identifier).toBe('myProgram');
        expect(upgraded.program.accounts).toHaveLength(1);
        expect(upgraded.program.instructions).toHaveLength(1);
    });

    test('it produces an IDL that passes the validators', () => {
        const upgraded = upgradeFromJson(json);
        expect(() => visit(upgraded, throwValidatorItemsVisitor(getValidationItemsVisitor()))).not.toThrow();
    });
});
