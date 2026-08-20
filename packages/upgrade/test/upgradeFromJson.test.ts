import {
    accountNode,
    CODAMA_VERSION,
    definedTypeNode,
    instructionAccountNode,
    instructionArgumentNode,
    instructionNode,
    numberTypeNode,
    pdaNode,
    programNode,
    publicKeyTypeNode,
    rootNode,
    structFieldTypeNode,
    structTypeNode,
    variablePdaSeedNode,
} from '@codama/nodes';
import { throwValidatorItemsVisitor, getValidationItemsVisitor } from '@codama/validators';
import { visit } from '@codama/visitors-core';
import { describe, expect, test } from 'vitest';

import { upgradeFromJson } from '../src';

/**
 * A representative v1 document carrying an older minor version stamp, the
 * way a historical IDL would arrive from disk or from the chain.
 */
const v1Json = JSON.stringify({
    ...rootNode(
        programNode({
            accounts: [
                accountNode({
                    data: structTypeNode([
                        structFieldTypeNode({ name: 'authority', type: publicKeyTypeNode() }),
                        structFieldTypeNode({ name: 'amount', type: numberTypeNode('u64') }),
                    ]),
                    name: 'counter',
                }),
            ],
            definedTypes: [definedTypeNode({ name: 'myType', type: numberTypeNode('u32') })],
            instructions: [
                instructionNode({
                    accounts: [instructionAccountNode({ isSigner: true, isWritable: true, name: 'authority' })],
                    arguments: [instructionArgumentNode({ name: 'amount', type: numberTypeNode('u64') })],
                    name: 'increment',
                }),
            ],
            name: 'myProgram',
            pdas: [pdaNode({ name: 'counter', seeds: [variablePdaSeedNode('authority', publicKeyTypeNode())] })],
            publicKey: '1111',
            version: '1.0.0',
        }),
    ),
    version: '1.2.0',
});

describe('upgradeFromJson', () => {
    test('it parses and upgrades a JSON-encoded document', () => {
        const upgraded = upgradeFromJson(v1Json);
        expect(upgraded.version).toBe(CODAMA_VERSION);
        expect(upgraded.program.name).toBe('myProgram');
        expect(upgraded.program.accounts).toHaveLength(1);
        expect(upgraded.program.instructions).toHaveLength(1);
    });

    test('it produces a document that passes the validators', () => {
        const upgraded = upgradeFromJson(v1Json);
        expect(() => visit(upgraded, throwValidatorItemsVisitor(getValidationItemsVisitor()))).not.toThrow();
    });
});
