import {
    accountLinkNode,
    accountNode,
    constantDiscriminatorNode,
    constantNode,
    constantPdaSeedNode,
    constantValueNode,
    definedTypeLinkNode,
    definedTypeNode,
    errorNode,
    eventNode,
    fieldDiscriminatorNode,
    fixedSizeTransformNode,
    floatTypeNode,
    floatValueNode,
    instructionAccountLinkNode,
    instructionLinkNode,
    integerTypeNode,
    integerValueNode,
    pdaLinkNode,
    pdaNode,
    pluginNode,
    programIdValueNode,
    programLinkNode,
    publicKeyTypeNode,
    sizeDiscriminatorNode,
    stringTypeNode,
    structFieldTypeNode,
    structTypeNode,
    variablePdaSeedNode,
} from '@codama/nodes';
import { describe, expect, test } from 'vitest';

import type { v1 } from '../../src';
import {
    accountNodeFromV1,
    constantNodeFromV1,
    definedTypeNodeFromV1,
    discriminatorNodeFromV1,
    errorNodeFromV1,
    eventNodeFromV1,
    linkNodeFromV1,
    pdaNodeFromV1,
    pluginNodeFromV1,
} from '../../src/v1ToV2';

// A root without any defined types, since these tests do not follow links.
const root = {
    kind: 'rootNode',
    program: { kind: 'programNode', name: 'myProgram', publicKey: '1111', version: '1.0.0' },
    standard: 'codama',
    version: '1.9.0',
} as unknown as v1.RootNode;
const programPath = [root, root.program];

describe('definitions', () => {
    test('it converts accounts, including wrapped data', () => {
        const account = {
            data: {
                kind: 'fixedSizeTypeNode',
                size: 64,
                type: {
                    fields: [{ kind: 'structFieldTypeNode', name: 'owner', type: { kind: 'publicKeyTypeNode' } }],
                    kind: 'structTypeNode',
                },
            },
            discriminators: [{ kind: 'sizeDiscriminatorNode', size: 64 }],
            docs: ['A vault.'],
            kind: 'accountNode',
            name: 'vault',
            pda: { kind: 'pdaLinkNode', name: 'vault' },
            size: 64,
        } as v1.AccountNode;
        expect(accountNodeFromV1([...programPath, account])).toStrictEqual(
            accountNode({
                data: structTypeNode([structFieldTypeNode({ identifier: 'owner', type: publicKeyTypeNode() })], {
                    transforms: [fixedSizeTransformNode(64)],
                }),
                discriminators: [sizeDiscriminatorNode(64)],
                docs: 'A vault.',
                identifier: 'vault',
                pda: pdaLinkNode('vault'),
                size: 64,
            }),
        );
    });

    test('it converts constants, typing their values', () => {
        const constantNodeV1 = {
            kind: 'constantNode',
            name: 'ratio',
            type: { endian: 'le', format: 'f32', kind: 'numberTypeNode' },
            value: { kind: 'numberValueNode', number: 1 },
        } as v1.ConstantNode;
        expect(constantNodeFromV1([...programPath, constantNodeV1])).toStrictEqual(
            constantNode('ratio', floatTypeNode('f32'), floatValueNode('1')),
        );
    });

    test('it converts defined types, errors and events', () => {
        const definedType = {
            docs: ['An amount.'],
            kind: 'definedTypeNode',
            name: 'amount',
            type: { endian: 'le', format: 'u8', kind: 'numberTypeNode' },
        } as v1.DefinedTypeNode;
        const error: v1.ErrorNode = {
            code: 6000,
            docs: [],
            kind: 'errorNode',
            message: 'Too big',
            name: 'tooBig' as v1.CamelCaseString,
        };
        const event = {
            data: { fields: [], kind: 'structTypeNode' },
            discriminators: [
                {
                    constant: {
                        kind: 'constantValueNode',
                        type: { endian: 'le', format: 'u8', kind: 'numberTypeNode' },
                        value: { kind: 'numberValueNode', number: 1 },
                    },
                    kind: 'constantDiscriminatorNode',
                    offset: 0,
                },
            ],
            kind: 'eventNode',
            name: 'updated',
        } as unknown as v1.EventNode;
        expect(definedTypeNodeFromV1([...programPath, definedType])).toStrictEqual(
            definedTypeNode({ docs: 'An amount.', identifier: 'amount', type: integerTypeNode('u8') }),
        );
        expect(errorNodeFromV1(error)).toStrictEqual(
            errorNode({ code: 6000, identifier: 'tooBig', message: 'Too big' }),
        );
        expect(eventNodeFromV1([...programPath, event])).toStrictEqual(
            eventNode({
                data: structTypeNode([]),
                discriminators: [
                    constantDiscriminatorNode(constantValueNode(integerTypeNode('u8'), integerValueNode('1'))),
                ],
                identifier: 'updated',
            }),
        );
    });

    test('it converts plugins, carrying their payload as is', () => {
        const plugin = {
            kind: 'pluginNode',
            name: 'explorerHints',
            payload: { function: 'resolveOwner', nested: [1, 2] },
        } as v1.PluginNode;
        expect(pluginNodeFromV1(plugin)).toStrictEqual(
            pluginNode('explorerHints', { function: 'resolveOwner', nested: [1, 2] }),
        );
    });
});

describe('discriminators', () => {
    test('it references fields by path', () => {
        const discriminator = {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 8,
        } as v1.FieldDiscriminatorNode;
        expect(discriminatorNodeFromV1([...programPath, discriminator])).toStrictEqual(
            fieldDiscriminatorNode('discriminator', { offset: 8 }),
        );
    });
});

describe('PDAs', () => {
    test('it converts PDAs and their seeds', () => {
        const pda = {
            docs: ['The vault.'],
            kind: 'pdaNode',
            name: 'vault',
            programId: '2222',
            seeds: [
                {
                    kind: 'constantPdaSeedNode',
                    type: { encoding: 'utf8', kind: 'stringTypeNode' },
                    value: { kind: 'stringValueNode', string: 'vault' },
                },
                {
                    kind: 'constantPdaSeedNode',
                    type: { kind: 'publicKeyTypeNode' },
                    value: { kind: 'programIdValueNode' },
                },
                {
                    kind: 'constantPdaSeedNode',
                    type: { endian: 'le', format: 'u16', kind: 'numberTypeNode' },
                    value: { kind: 'numberValueNode', number: 7 },
                },
                {
                    docs: ['The owner.'],
                    kind: 'variablePdaSeedNode',
                    name: 'owner',
                    type: { kind: 'publicKeyTypeNode' },
                },
            ],
        } as v1.PdaNode;
        expect(pdaNodeFromV1([...programPath, pda])).toStrictEqual(
            pdaNode({
                docs: 'The vault.',
                identifier: 'vault',
                programId: '2222',
                seeds: [
                    constantPdaSeedNode(stringTypeNode('utf8'), { kind: 'stringValueNode', string: 'vault' }),
                    constantPdaSeedNode(publicKeyTypeNode(), programIdValueNode()),
                    constantPdaSeedNode(integerTypeNode('u16'), integerValueNode('7')),
                    variablePdaSeedNode('owner', publicKeyTypeNode(), { docs: 'The owner.' }),
                ],
            }),
        );
    });
});

describe('links', () => {
    test('it converts every kind of link, along with the links they hold', () => {
        const token = { kind: 'programLinkNode', name: 'token' } as v1.ProgramLinkNode;
        const accountLink = { kind: 'accountLinkNode', name: 'mint', program: token } as v1.AccountLinkNode;
        const definedTypeLink = { kind: 'definedTypeLinkNode', name: 'config' } as v1.DefinedTypeLinkNode;
        const instructionLink = {
            kind: 'instructionLinkNode',
            name: 'transfer',
            program: token,
        } as v1.InstructionLinkNode;
        const instructionAccountLink = {
            instruction: { kind: 'instructionLinkNode', name: 'transfer', program: token },
            kind: 'instructionAccountLinkNode',
            name: 'source',
        } as v1.InstructionAccountLinkNode;
        const pdaLink = { kind: 'pdaLinkNode', name: 'vault', program: token } as v1.PdaLinkNode;

        expect(linkNodeFromV1(token)).toStrictEqual(programLinkNode('token'));
        expect(linkNodeFromV1(accountLink)).toStrictEqual(
            accountLinkNode('mint', { program: programLinkNode('token') }),
        );
        expect(linkNodeFromV1(definedTypeLink)).toStrictEqual(definedTypeLinkNode('config'));
        expect(linkNodeFromV1(instructionLink)).toStrictEqual(
            instructionLinkNode('transfer', { program: programLinkNode('token') }),
        );
        expect(linkNodeFromV1(instructionAccountLink)).toStrictEqual(
            instructionAccountLinkNode('source', {
                instruction: instructionLinkNode('transfer', { program: programLinkNode('token') }),
            }),
        );
        expect(linkNodeFromV1(pdaLink)).toStrictEqual(pdaLinkNode('vault', { program: programLinkNode('token') }));
    });
});
