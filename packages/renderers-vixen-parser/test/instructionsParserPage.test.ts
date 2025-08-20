import { camelCase, instructionNode, rootNode } from '@codama/nodes';
import { getFromRenderMap } from '@codama/renderers-core';
import { visit } from '@codama/visitors-core';
import { test } from 'vitest';

import { getRenderMapVisitor } from '../src';
import { codeContains } from './_setup';

test('it renders instructions parsers', () => {
    // Given the following program with 1 instruction.
    const node = rootNode({
        accounts: [],
        definedTypes: [],
        docs: [],
        errors: [],
        instructions: [
            instructionNode({
                accounts: [
                    {
                        defaultValue: { kind: 'payerValueNode' },
                        docs: [],
                        isOptional: false,
                        isSigner: true,
                        isWritable: true,
                        kind: 'instructionAccountNode',
                        name: camelCase('payer'),
                    },
                    {
                        docs: [],
                        isOptional: false,
                        isSigner: true,
                        isWritable: true,
                        kind: 'instructionAccountNode',
                        name: camelCase('newAccount'),
                    },
                ],
                arguments: [
                    {
                        defaultValue: {
                            data: (1).toString(16),
                            encoding: 'base16',
                            kind: 'bytesValueNode',
                        },
                        defaultValueStrategy: 'omitted',
                        docs: [],
                        kind: 'instructionArgumentNode',
                        name: camelCase('discriminator'),
                        type: {
                            kind: 'fixedSizeTypeNode',
                            size: 1,
                            type: { kind: 'bytesTypeNode' },
                        },
                    },
                    {
                        docs: [],
                        kind: 'instructionArgumentNode',
                        name: camelCase('lamports'),
                        type: {
                            endian: 'le',
                            format: 'u64',
                            kind: 'numberTypeNode',
                        },
                    },
                    {
                        docs: [],
                        kind: 'instructionArgumentNode',
                        name: camelCase('space'),
                        type: {
                            endian: 'le',
                            format: 'u64',
                            kind: 'numberTypeNode',
                        },
                    },
                    {
                        docs: [],
                        kind: 'instructionArgumentNode',
                        name: camelCase('programAddress'),
                        type: { kind: 'publicKeyTypeNode' },
                    },
                ],
                discriminators: [
                    {
                        kind: 'fieldDiscriminatorNode',
                        name: camelCase('discriminator'),
                        offset: 0,
                    },
                ],
                name: 'createAccount',
            }),
            instructionNode({
                accounts: [
                    {
                        docs: [],
                        isOptional: false,
                        isSigner: true,
                        isWritable: true,
                        kind: 'instructionAccountNode',
                        name: camelCase('account'),
                    },
                ],
                arguments: [
                    {
                        defaultValue: {
                            data: (1).toString(16),
                            encoding: 'base16',
                            kind: 'bytesValueNode',
                        },
                        defaultValueStrategy: 'omitted',
                        docs: [],
                        kind: 'instructionArgumentNode',
                        name: camelCase('discriminator'),
                        type: {
                            kind: 'fixedSizeTypeNode',
                            size: 1,
                            type: { kind: 'bytesTypeNode' },
                        },
                    },
                    {
                        docs: [],
                        kind: 'instructionArgumentNode',
                        name: camelCase('programAddress'),
                        type: { kind: 'publicKeyTypeNode' },
                    },
                ],
                discriminators: [
                    {
                        kind: 'fieldDiscriminatorNode',
                        name: camelCase('discriminator'),
                        offset: 0,
                    },
                ],
                name: camelCase('assign'),
            }),
        ],
        kind: 'programNode',
        name: camelCase('test'),
        origin: 'shank',
        pdas: [],
        publicKey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        version: '0.0.0',
    });

    // When we render it.
    const renderMap = visit(
        node,
        getRenderMapVisitor({
            projectFolder: 'test',
            projectName: 'test',
        }),
    );

    // // Then we expect the following pub struct.
    // codeContains(getFromRenderMap(renderMap, 'instructions/mint_tokens.rs'), [`pub struct MintTokensInstructionData`, `pub fn new(`]);
    codeContains(getFromRenderMap(renderMap, 'src/generated_parser/instructions_parser.rs'), [
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
