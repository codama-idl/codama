import {
    accountValueNode,
    argumentValueNode,
    constantDiscriminatorNode,
    constantPdaSeedNodeFromString,
    constantValueNodeFromBytes,
    fieldDiscriminatorNode,
    instructionAccountNode,
    instructionArgumentNode,
    instructionNode,
    numberTypeNode,
    numberValueNode,
    pdaNode,
    pdaSeedValueNode,
    pdaValueNode,
    programNode,
    publicKeyTypeNode,
    resolverValueNode,
    variablePdaSeedNode,
} from '@kinobi-so/nodes';
import { visit } from '@kinobi-so/visitors-core';
import { test } from 'vitest';

import { getRenderMapVisitor } from '../src';
import { codeContains, codeDoesNotContain, renderMapContains, renderMapContainsImports } from './_setup';

test('it renders instruction accounts that can either be signer or non-signer', async () => {
    // Given the following instruction with a signer or non-signer account.
    const node = programNode({
        instructions: [
            instructionNode({
                accounts: [instructionAccountNode({ isSigner: 'either', isWritable: false, name: 'myAccount' })],
                name: 'myInstruction',
            }),
        ],
        name: 'myProgram',
        publicKey: '1111',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the input to be rendered as either a signer or non-signer.
    await renderMapContains(renderMap, 'instructions/myInstruction.ts', [
        'myAccount: Address<TAccountMyAccount> | TransactionSigner<TAccountMyAccount>;',
    ]);
});

test('it renders extra arguments that default on each other', async () => {
    // Given the following instruction with two extra arguments
    // such that one defaults to the other.
    const node = programNode({
        instructions: [
            instructionNode({
                extraArguments: [
                    instructionArgumentNode({
                        defaultValue: argumentValueNode('bar'),
                        name: 'foo',
                        type: numberTypeNode('u64'),
                    }),
                    instructionArgumentNode({
                        name: 'bar',
                        type: numberTypeNode('u64'),
                    }),
                ],
                name: 'create',
            }),
        ],
        name: 'myProgram',
        publicKey: '1111',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following code to be rendered.
    await renderMapContains(renderMap, 'instructions/create.ts', [
        'const args = { ...input }',
        'if (!args.foo) { args.foo = expectSome(args.bar); }',
    ]);
});

test('it renders the args variable on the async function only if the extra argument has an async default value', async () => {
    // Given the following instruction with an async resolver and an extra argument.
    const node = programNode({
        instructions: [
            instructionNode({
                extraArguments: [
                    instructionArgumentNode({
                        defaultValue: resolverValueNode('myAsyncResolver'),
                        name: 'foo',
                        type: numberTypeNode('u64'),
                    }),
                ],
                name: 'create',
            }),
        ],
        name: 'myProgram',
        publicKey: '1111',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor({ asyncResolvers: ['myAsyncResolver'] }));

    // And split the async and sync functions.
    const [asyncFunction, syncFunction] = renderMap
        .get('instructions/create.ts')
        .split(/export\s+function\s+getCreateInstruction/);

    // Then we expect only the async function to contain the args variable.
    await codeContains(asyncFunction, ['// Original args.', 'const args = { ...input }']);
    await codeDoesNotContain(syncFunction, ['// Original args.', 'const args = { ...input }']);
});

test('it only renders the args variable on the async function if the extra argument is used in an async default value', async () => {
    // Given the following instruction with an async resolver depending on
    // an extra argument such that the instruction has no data arguments.
    const node = programNode({
        instructions: [
            instructionNode({
                accounts: [
                    instructionAccountNode({
                        defaultValue: resolverValueNode('myAsyncResolver', { dependsOn: [argumentValueNode('bar')] }),
                        isSigner: false,
                        isWritable: false,
                        name: 'foo',
                    }),
                ],
                extraArguments: [
                    instructionArgumentNode({
                        name: 'bar',
                        type: numberTypeNode('u64'),
                    }),
                ],
                name: 'create',
            }),
        ],
        name: 'myProgram',
        publicKey: '1111',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor({ asyncResolvers: ['myAsyncResolver'] }));

    // And split the async and sync functions.
    const [asyncFunction, syncFunction] = renderMap
        .get('instructions/create.ts')
        .split(/export\s+function\s+getCreateInstruction/);

    // Then we expect only the async function to contain the args variable.
    await codeContains(asyncFunction, ['// Original args.', 'const args = { ...input }']);
    await codeDoesNotContain(syncFunction, ['// Original args.', 'const args = { ...input }']);
});

test('it renders instruction accounts with linked PDAs as default value', async () => {
    // Given the following program with a PDA node and an instruction account using it as default value.
    const node = programNode({
        instructions: [
            instructionNode({
                accounts: [
                    instructionAccountNode({ isSigner: true, isWritable: false, name: 'authority' }),
                    instructionAccountNode({
                        defaultValue: pdaValueNode('counter', [
                            pdaSeedValueNode('authority', accountValueNode('authority')),
                        ]),
                        isSigner: false,
                        isWritable: false,
                        name: 'counter',
                    }),
                ],
                name: 'increment',
            }),
        ],
        name: 'counter',
        pdas: [
            pdaNode({
                name: 'counter',
                seeds: [
                    constantPdaSeedNodeFromString('utf8', 'counter'),
                    variablePdaSeedNode('authority', publicKeyTypeNode()),
                ],
            }),
        ],
        publicKey: '1111',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following default value to be rendered.
    await renderMapContains(renderMap, 'instructions/increment.ts', [
        'if (!accounts.counter.value) { ' +
            'accounts.counter.value = await findCounterPda( { authority: expectAddress ( accounts.authority.value ) } ); ' +
            '}',
    ]);
    renderMapContainsImports(renderMap, 'instructions/increment.ts', { '../pdas': ['findCounterPda'] });
});

test('it renders instruction accounts with inlined PDAs as default value', async () => {
    // Given the following instruction with an inlined PDA default value.
    const node = programNode({
        instructions: [
            instructionNode({
                accounts: [
                    instructionAccountNode({ isSigner: true, isWritable: false, name: 'authority' }),
                    instructionAccountNode({
                        defaultValue: pdaValueNode(
                            pdaNode({
                                name: 'counter',
                                seeds: [
                                    constantPdaSeedNodeFromString('utf8', 'counter'),
                                    variablePdaSeedNode('authority', publicKeyTypeNode()),
                                ],
                            }),
                            [pdaSeedValueNode('authority', accountValueNode('authority'))],
                        ),
                        isSigner: false,
                        isWritable: false,
                        name: 'counter',
                    }),
                ],
                name: 'increment',
            }),
        ],
        name: 'counter',
        publicKey: '1111',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following default value to be rendered.
    await renderMapContains(renderMap, 'instructions/increment.ts', [
        'if (!accounts.counter.value) { ' +
            'accounts.counter.value = await getProgramDerivedAddress( { ' +
            '  programAddress, ' +
            '  seeds: [ ' +
            "    getUtf8Encoder().encode('counter'), " +
            '    getAddressEncoder().encode(expectAddress(accounts.authority.value)) ' +
            '  ] ' +
            '} ); ' +
            '}',
    ]);
    renderMapContainsImports(renderMap, 'instructions/increment.ts', {
        '@solana/web3.js': ['getProgramDerivedAddress'],
    });
});

test('it renders instruction accounts with inlined PDAs from another program as default value', async () => {
    // Given the following instruction with an inlined PDA default value from another program.
    const node = programNode({
        instructions: [
            instructionNode({
                accounts: [
                    instructionAccountNode({ isSigner: true, isWritable: false, name: 'authority' }),
                    instructionAccountNode({
                        defaultValue: pdaValueNode(
                            pdaNode({
                                name: 'counter',
                                programId: '2222',
                                seeds: [
                                    constantPdaSeedNodeFromString('utf8', 'counter'),
                                    variablePdaSeedNode('authority', publicKeyTypeNode()),
                                ],
                            }),
                            [pdaSeedValueNode('authority', accountValueNode('authority'))],
                        ),
                        isSigner: false,
                        isWritable: false,
                        name: 'counter',
                    }),
                ],
                name: 'increment',
            }),
        ],
        name: 'counter',
        publicKey: '1111',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following default value to be rendered.
    await renderMapContains(renderMap, 'instructions/increment.ts', [
        'if (!accounts.counter.value) { ' +
            'accounts.counter.value = await getProgramDerivedAddress( { ' +
            "  programAddress: '2222' as Address<'2222'>, " +
            '  seeds: [ ' +
            "    getUtf8Encoder().encode('counter'), " +
            '    getAddressEncoder().encode(expectAddress(accounts.authority.value)) ' +
            '  ] ' +
            '} ); ' +
            '}',
    ]);
    renderMapContainsImports(renderMap, 'instructions/increment.ts', {
        '@solana/web3.js': ['Address', 'getProgramDerivedAddress'],
    });
});

test('it renders constants for instruction field discriminators', async () => {
    // Given the following instruction with a field discriminator.
    const node = programNode({
        instructions: [
            instructionNode({
                arguments: [
                    instructionArgumentNode({
                        defaultValue: numberValueNode(42),
                        defaultValueStrategy: 'omitted',
                        name: 'myDiscriminator',
                        type: numberTypeNode('u64'),
                    }),
                ],
                discriminators: [fieldDiscriminatorNode('myDiscriminator')],
                name: 'myInstruction',
            }),
        ],
        name: 'myProgram',
        publicKey: '1111',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following constant and function to be rendered
    // And we expect the field default value to use that constant.
    await renderMapContains(renderMap, 'instructions/myInstruction.ts', [
        'export const MY_INSTRUCTION_MY_DISCRIMINATOR = 42;',
        'export function getMyInstructionMyDiscriminatorBytes() { return getU64Encoder().encode(MY_INSTRUCTION_MY_DISCRIMINATOR); }',
        '(value) => ({ ...value, myDiscriminator: MY_INSTRUCTION_MY_DISCRIMINATOR })',
    ]);
});

test('it renders constants for instruction constant discriminators', async () => {
    // Given the following instruction with two constant discriminators.
    const node = programNode({
        instructions: [
            instructionNode({
                discriminators: [
                    constantDiscriminatorNode(constantValueNodeFromBytes('base16', '1111')),
                    constantDiscriminatorNode(constantValueNodeFromBytes('base16', '2222'), 2),
                ],
                name: 'myInstruction',
            }),
        ],
        name: 'myProgram',
        publicKey: '1111',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following constants and functions to be rendered.
    await renderMapContains(renderMap, 'instructions/myInstruction.ts', [
        'export const MY_INSTRUCTION_DISCRIMINATOR = new Uint8Array([ 17, 17 ]);',
        'export function getMyInstructionDiscriminatorBytes() { return getBytesEncoder().encode(MY_INSTRUCTION_DISCRIMINATOR); }',
        'export const MY_INSTRUCTION_DISCRIMINATOR2 = new Uint8Array([ 34, 34 ]);',
        'export function getMyInstructionDiscriminator2Bytes() { return getBytesEncoder().encode(MY_INSTRUCTION_DISCRIMINATOR2); }',
    ]);
});

test('it can override the import of a resolver value node', async () => {
    // Given the following node with a resolver value node.
    const node = programNode({
        instructions: [
            instructionNode({
                accounts: [
                    instructionAccountNode({
                        defaultValue: resolverValueNode('myResolver'),
                        isSigner: false,
                        isWritable: false,
                        name: 'myAccount',
                    }),
                ],
                name: 'myInstruction',
            }),
        ],
        name: 'myProgram',
        pdas: [pdaNode({ name: 'counter', seeds: [] })],
        publicKey: '1111',
    });

    // When we render it using a custom import.
    const renderMap = visit(
        node,
        getRenderMapVisitor({
            linkOverrides: {
                resolvers: { myResolver: 'someModule' },
            },
        }),
    );

    // Then we expect the resolver to be exported.
    await renderMapContains(renderMap, 'instructions/myInstruction.ts', ['myResolver(resolverScope)']);

    // And its import path to be overridden.
    await renderMapContainsImports(renderMap, 'instructions/myInstruction.ts', {
        someModule: ['myResolver'],
    });
});
