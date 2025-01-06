import { camelCase, instructionNode, rootNode } from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { test } from 'vitest';

import { getRenderMapVisitor } from '../src';
import { codeContains } from './_setup';

test('it renders instructions parsers', () => {
    // Given the following program with 1 instruction.
    const node = rootNode({
        instructions: [
            instructionNode({
                name: 'createAccount',
                arguments: [
                    {
                        kind: 'instructionArgumentNode',
                        name: camelCase('discriminator'),
                        type: {
                            kind: 'numberTypeNode',
                            format: 'u32',
                            endian: 'le',
                        },
                        docs: [],
                        defaultValue: { kind: 'numberValueNode', number: 0 },
                        defaultValueStrategy: 'omitted',
                    },
                    {
                        kind: 'instructionArgumentNode',
                        name: camelCase('lamports'),
                        type: {
                            kind: 'numberTypeNode',
                            format: 'u64',
                            endian: 'le',
                        },
                        docs: [],
                    },
                    {
                        kind: 'instructionArgumentNode',
                        name: camelCase('space'),
                        type: {
                            kind: 'numberTypeNode',
                            format: 'u64',
                            endian: 'le',
                        },
                        docs: [],
                    },
                    {
                        kind: 'instructionArgumentNode',
                        name: camelCase('programAddress'),
                        type: { kind: 'publicKeyTypeNode' },
                        docs: [],
                    },
                ],
                accounts: [
                    {
                        kind: 'instructionAccountNode',
                        name: camelCase('payer'),
                        isWritable: true,
                        isSigner: true,
                        isOptional: false,
                        docs: [],
                        defaultValue: { kind: 'payerValueNode' },
                    },
                    {
                        kind: 'instructionAccountNode',
                        name: camelCase('newAccount'),
                        isWritable: true,
                        isSigner: true,
                        isOptional: false,
                        docs: [],
                    },
                ],
            }),
            instructionNode({
                name: camelCase('assign'),
                arguments: [
                    {
                        kind: 'instructionArgumentNode',
                        name: camelCase('discriminator'),
                        type: {
                            kind: 'numberTypeNode',
                            format: 'u32',
                            endian: 'le',
                        },
                        docs: [],
                        defaultValue: { kind: 'numberValueNode', number: 1 },
                        defaultValueStrategy: 'omitted',
                    },
                    {
                        kind: 'instructionArgumentNode',
                        name: camelCase('programAddress'),
                        type: { kind: 'publicKeyTypeNode' },
                        docs: [],
                    },
                ],
                accounts: [
                    {
                        kind: 'instructionAccountNode',
                        name: camelCase('account'),
                        isWritable: true,
                        isSigner: true,
                        isOptional: false,
                        docs: [],
                    },
                ],
            }),
        ],
        name: camelCase('test'),
        publicKey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        kind: 'programNode',
        version: '0.0.0',
        docs: [],
        accounts: [],
        definedTypes: [],
        pdas: [],
        errors: [],
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // // Then we expect the following pub struct.
    // codeContains(renderMap.get('instructions/mint_tokens.rs'), [`pub struct MintTokensInstructionData`, `pub fn new(`]);
    codeContains(renderMap.get('instructions_parser.rs'), [
        'pub enum TestProgramIx',
        'CreateAccount(CreateAccountIxAccounts, CreateAccountIxData)',
        'Assign(AssignIxAccounts, AssignIxData)',
        'pub struct InstructionParser',
        'impl yellowstone_vixen_core::Parser for InstructionParser',
        'type Input = yellowstone_vixen_core::instruction::InstructionUpdate',
        'type Output = TestProgramIx',
        'fn prefilter(&self) -> yellowstone_vixen_core::Prefilter',
        'async fn parse(&self, ix_update: &yellowstone_vixen_core::instruction::InstructionUpdate) -> yellowstone_vixen_core::ParseResult<Self::Output>',
    ]);
});
