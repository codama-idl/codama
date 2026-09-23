import { CODAMA_ERROR__VISITORS__INVALID_PROVIDED_VALUE, CodamaError } from '@codama/errors';
import {
    accountBumpValueNode,
    accountValueNode,
    definedTypeLinkNode,
    definedTypeNode,
    identifierString,
    injectedValueNode,
    INSTRUCTION_INPUT_VALUE_NODES,
    InstructionNode,
    instructionAccountNode,
    instructionNode,
    integerTypeNode,
    pdaSeedValueNode,
    pdaValueNode,
    programNode,
    providedNode,
    publicKeyTypeNode,
    publicKeyValueNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import {
    getRecordLinkablesVisitor,
    getResolvedInstructionInputsVisitor,
    LinkableDictionary,
    NodeStack,
    ProvidedScope,
    visit,
} from '../src';

const resolve = (node: InstructionNode) => visit(node, getResolvedInstructionInputsVisitor(new LinkableDictionary()));

test('it returns all instruction accounts in order of resolution', () => {
    // Given an instruction node with an account that defaults to another account.
    const node = instructionNode({
        accounts: [
            instructionAccountNode({
                defaultValue: accountValueNode('authority'),
                identifier: 'owner',
                isSigner: true,
                isWritable: false,
            }),
            instructionAccountNode({
                identifier: 'authority',
                isSigner: true,
                isWritable: false,
            }),
        ],
        identifier: 'myInstruction',
    });

    // When we get its resolved inputs.
    const result = resolve(node);

    // Then we expect the accounts to be in order of resolution.
    expect(result).toEqual([
        {
            dependsOn: [],
            isPda: false,
            node: (node.accounts ?? [])[1],
            resolvedIsOptional: false,
            resolvedIsSigner: true,
        },
        {
            dependsOn: [accountValueNode('authority')],
            isPda: false,
            node: (node.accounts ?? [])[0],
            resolvedDefaultValue: accountValueNode('authority'),
            resolvedIsOptional: false,
            resolvedIsSigner: true,
        },
    ]);
});

test('it sets the resolved signer to either when a non signer defaults to a signer account', () => {
    // Given an instruction node such that a non signer account defaults to a signer account.
    const node = instructionNode({
        accounts: [
            instructionAccountNode({
                defaultValue: accountValueNode('authority'),
                identifier: 'owner',
                isSigner: false,
                isWritable: false,
            }),
            instructionAccountNode({
                identifier: 'authority',
                isSigner: true,
                isWritable: false,
            }),
        ],
        identifier: 'myInstruction',
    });

    // When we get its resolved inputs.
    const result = resolve(node);

    // Then we expect the resolved signer to be either for the non signer account.
    expect(result[1]).toEqual({
        dependsOn: [accountValueNode('authority')],
        isPda: false,
        node: (node.accounts ?? [])[0],
        resolvedDefaultValue: accountValueNode('authority'),
        resolvedIsOptional: false,
        resolvedIsSigner: 'either',
    });
});

test('it sets the resolved signer to either when a signer defaults to a non signer account', () => {
    // Given an instruction node such that a signer account defaults to a non signer account.
    const node = instructionNode({
        accounts: [
            instructionAccountNode({
                defaultValue: accountValueNode('authority'),
                identifier: 'owner',
                isSigner: true,
                isWritable: false,
            }),
            instructionAccountNode({
                identifier: 'authority',
                isSigner: false,
                isWritable: false,
            }),
        ],
        identifier: 'myInstruction',
    });

    // When we get its resolved inputs.
    const result = resolve(node);

    // Then we expect the resolved signer to be either for the signer account.
    expect(result[1]).toEqual({
        dependsOn: [accountValueNode('authority')],
        isPda: false,
        node: (node.accounts ?? [])[0],
        resolvedDefaultValue: accountValueNode('authority'),
        resolvedIsOptional: false,
        resolvedIsSigner: 'either',
    });
});

test('it includes instruction data fields with resolvable default values', () => {
    // Given an instruction whose data has two fields such that:
    // - The first field injects a value the instruction provides as an account reference.
    // - The second field has no default value.
    const node = instructionNode({
        accounts: [
            instructionAccountNode({
                identifier: 'owner',
                isSigner: true,
                isWritable: false,
            }),
        ],
        data: structTypeNode([
            structFieldTypeNode({
                defaultValue: injectedValueNode({ key: 'owner' }),
                identifier: 'ownerArg',
                type: publicKeyTypeNode(),
            }),
            structFieldTypeNode({
                identifier: 'argWithoutDefaults',
                type: integerTypeNode('u8'),
            }),
        ]),
        identifier: 'myInstruction',
        provides: [providedNode('owner', accountValueNode('owner'))],
    });
    const fields = (node.data as ReturnType<typeof structTypeNode>).fields ?? [];

    // When we get its resolved inputs.
    const result = resolve(node);

    // Then we expect the following inputs.
    expect(result).toEqual([
        {
            dependsOn: [],
            isPda: false,
            node: (node.accounts ?? [])[0],
            resolvedIsOptional: false,
            resolvedIsSigner: true,
        },
        {
            dependsOn: [accountValueNode('owner')],
            node: fields[0],
            path: 'ownerArg',
            resolvedDefaultValue: accountValueNode('owner'),
        },
    ]);

    // And the field without a default value is not included.
    expect(result.some(input => 'path' in input && input.path === 'argWithoutDefaults')).toBe(false);
});

test('it returns an empty array for empty instructions', () => {
    // Given an empty instruction node.
    const node = instructionNode({ identifier: 'myInstruction' });

    // When we get its resolved inputs.
    const result = resolve(node);

    // Then we expect an empty array.
    expect(result).toEqual([]);
});

test('it resolves the seeds of a PdaValueNode first', () => {
    // Given an instruction node with an account that defaults to a PDA whose seed is another account.
    const node = instructionNode({
        accounts: [
            instructionAccountNode({
                defaultValue: pdaValueNode('counter', {
                    seeds: [pdaSeedValueNode('authority', accountValueNode('payer'))],
                }),
                identifier: 'counter',
                isSigner: false,
                isWritable: false,
            }),
            instructionAccountNode({
                identifier: 'payer',
                isSigner: true,
                isWritable: false,
            }),
        ],
        identifier: 'myInstruction',
    });

    // When we get its resolved inputs.
    const result = resolve(node);

    // Then we expect the accounts to be in order of resolution.
    expect(result).toEqual([
        {
            dependsOn: [],
            isPda: false,
            node: (node.accounts ?? [])[1],
            resolvedIsOptional: false,
            resolvedIsSigner: true,
        },
        {
            dependsOn: [accountValueNode('payer')],
            isPda: false,
            node: (node.accounts ?? [])[0],
            resolvedDefaultValue: pdaValueNode('counter', {
                seeds: [pdaSeedValueNode('authority', accountValueNode('payer'))],
            }),
            resolvedIsOptional: false,
            resolvedIsSigner: false,
        },
    ]);
});

test('it resolves the program id of a PdaValueNode first', () => {
    // Given an instruction node with an account that defaults to a PDA whose program id is another account.
    const node = instructionNode({
        accounts: [
            instructionAccountNode({
                defaultValue: pdaValueNode('counter', { programId: accountValueNode('counterProgram') }),
                identifier: 'counter',
                isSigner: false,
                isWritable: false,
            }),
            instructionAccountNode({
                identifier: 'counterProgram',
                isSigner: false,
                isWritable: false,
            }),
        ],
        identifier: 'myInstruction',
    });

    // When we get its resolved inputs.
    const result = resolve(node);

    // Then we expect the accounts to be in order of resolution.
    expect(result).toEqual([
        {
            dependsOn: [],
            isPda: false,
            node: (node.accounts ?? [])[1],
            resolvedIsOptional: false,
            resolvedIsSigner: false,
        },
        {
            dependsOn: [accountValueNode('counterProgram')],
            isPda: false,
            node: (node.accounts ?? [])[0],
            resolvedDefaultValue: pdaValueNode('counter', { programId: accountValueNode('counterProgram') }),
            resolvedIsOptional: false,
            resolvedIsSigner: false,
        },
    ]);
});

test('it marks an account as a PDA when a data field resolves to its bump', () => {
    // Given an instruction whose data injects the bump of one of its accounts,
    // fulfilled by the instruction's own provides.
    const node = instructionNode({
        accounts: [
            instructionAccountNode({
                identifier: 'counter',
                isSigner: false,
                isWritable: true,
            }),
        ],
        data: structTypeNode([
            structFieldTypeNode({
                defaultValue: injectedValueNode({ key: 'counterBump' }),
                identifier: 'counterBump',
                type: integerTypeNode('u8'),
            }),
        ]),
        identifier: 'myInstruction',
        provides: [providedNode('counterBump', accountBumpValueNode('counter'))],
    });

    // When we get its resolved inputs.
    const result = resolve(node);

    // Then the counter account is marked as a PDA.
    const counter = result.find(input => input.node.kind === 'instructionAccountNode');
    expect(counter).toMatchObject({ isPda: true });
});

test('it throws when a provided value is not an instruction input value node', () => {
    // Given an instruction that provides a non-value node for an injected data-field default.
    const provider = providedNode('bogus', publicKeyTypeNode());
    const node = instructionNode({
        data: structTypeNode([
            structFieldTypeNode({
                defaultValue: injectedValueNode({ key: 'bogus' }),
                identifier: 'field',
                type: integerTypeNode('u8'),
            }),
        ]),
        identifier: 'myInstruction',
        provides: [provider],
    });

    // When we get its resolved inputs, then it throws.
    expect(() => resolve(node)).toThrow(
        new CodamaError(CODAMA_ERROR__VISITORS__INVALID_PROVIDED_VALUE, {
            expectedKinds: INSTRUCTION_INPUT_VALUE_NODES,
            key: identifierString('bogus'),
            providedKind: 'publicKeyTypeNode',
            provider,
        }),
    );
});

test('it resolves injections nested within a default value', () => {
    // Given an account defaulting to a PDA whose seed is injected.
    const node = instructionNode({
        accounts: [
            instructionAccountNode({
                defaultValue: pdaValueNode('counter', {
                    seeds: [pdaSeedValueNode('authority', injectedValueNode({ key: 'counterAuthority' }))],
                }),
                identifier: 'counter',
                isSigner: false,
                isWritable: true,
            }),
            instructionAccountNode({ identifier: 'payer', isSigner: true, isWritable: false }),
        ],
        identifier: 'myInstruction',
        provides: [providedNode('counterAuthority', accountValueNode('payer'))],
    });

    // When we get its resolved inputs.
    const result = resolve(node);

    // Then the seed is resolved, and the account it refers to is resolved first.
    expect(result.map(input => input.node.identifier)).toEqual(['payer', 'counter']);
    expect(result[1]).toMatchObject({
        dependsOn: [accountValueNode('payer')],
        resolvedDefaultValue: pdaValueNode('counter', {
            seeds: [pdaSeedValueNode('authority', accountValueNode('payer'))],
        }),
    });
});

test('it drops a default value with an unresolvable nested injection', () => {
    // Given an account defaulting to a PDA whose injected seed nothing provides.
    const node = instructionNode({
        accounts: [
            instructionAccountNode({
                defaultValue: pdaValueNode('counter', {
                    seeds: [pdaSeedValueNode('authority', injectedValueNode({ key: 'counterAuthority' }))],
                }),
                identifier: 'counter',
                isSigner: false,
                isWritable: true,
            }),
        ],
        identifier: 'myInstruction',
    });

    // When we get its resolved inputs.
    const result = resolve(node);

    // Then the account has no resolved default rather than a PDA missing a seed.
    expect(result).toEqual([
        {
            dependsOn: [],
            isPda: false,
            node: (node.accounts ?? [])[0],
            resolvedIsOptional: false,
            resolvedIsSigner: false,
        },
    ]);
});

test('it resolves injections against the parent instructions of a caller-supplied scope', () => {
    // Given a sub-instruction whose data injects a key provided by its parent.
    const subInstruction = instructionNode({
        accounts: [instructionAccountNode({ identifier: 'counter', isSigner: false, isWritable: true })],
        data: structTypeNode([
            structFieldTypeNode({
                defaultValue: injectedValueNode({ key: 'counterBump' }),
                identifier: 'bump',
                type: integerTypeNode('u8'),
            }),
        ]),
        identifier: 'subInstruction',
    });

    // And a scope already holding the parent instruction's frame.
    const scope = new ProvidedScope([providedNode('counterBump', accountBumpValueNode('counter'))]);

    // When we get its resolved inputs using that scope.
    const result = visit(subInstruction, getResolvedInstructionInputsVisitor(new LinkableDictionary(), { scope }));

    // Then the field resolves through the parent's provider.
    const field = result.find(input => 'path' in input && input.path === 'bump');
    expect(field).toMatchObject({ resolvedDefaultValue: accountBumpValueNode('counter') });
});

test('it lets an instruction shadow a key provided by its parent', () => {
    // Given an instruction providing a key its parent also provides.
    const node = instructionNode({
        accounts: [
            instructionAccountNode({ identifier: 'inner', isSigner: false, isWritable: false }),
            instructionAccountNode({ identifier: 'outer', isSigner: false, isWritable: false }),
        ],
        data: structTypeNode([
            structFieldTypeNode({
                defaultValue: injectedValueNode({ key: 'target' }),
                identifier: 'target',
                type: publicKeyTypeNode(),
            }),
        ]),
        identifier: 'myInstruction',
        provides: [providedNode('target', accountValueNode('inner'))],
    });
    const scope = new ProvidedScope([providedNode('target', accountValueNode('outer'))]);

    // When we get its resolved inputs.
    const result = visit(node, getResolvedInstructionInputsVisitor(new LinkableDictionary(), { scope }));

    // Then the instruction's own provider wins.
    const field = result.find(input => 'path' in input && input.path === 'target');
    expect(field).toMatchObject({ dependsOn: [accountValueNode('inner')] });
});

test('it collects data fields through a defined type link', () => {
    // Given an instruction whose data links to a program-level struct type.
    const instruction = instructionNode({
        accounts: [instructionAccountNode({ identifier: 'counter', isSigner: false, isWritable: true })],
        data: definedTypeLinkNode('counterArgs'),
        identifier: 'increment',
        provides: [providedNode('counterBump', accountBumpValueNode('counter'))],
    });
    const program = programNode({
        definedTypes: [
            definedTypeNode({
                identifier: 'counterArgs',
                type: structTypeNode([
                    structFieldTypeNode({
                        defaultValue: injectedValueNode({ key: 'counterBump' }),
                        identifier: 'bump',
                        type: integerTypeNode('u8'),
                    }),
                ]),
            }),
        ],
        identifier: 'counterProgram',
        instructions: [instruction],
        publicKey: '1111',
    });
    const linkables = new LinkableDictionary();
    visit(program, getRecordLinkablesVisitor(linkables));

    // When we get its resolved inputs from within its program.
    const stack = new NodeStack([program]);
    const result = visit(instruction, getResolvedInstructionInputsVisitor(linkables, { stack }));

    // Then the linked struct's fields are resolved, and the bump marks the account as a PDA.
    expect(result.find(input => 'path' in input && input.path === 'bump')).toMatchObject({
        resolvedDefaultValue: accountBumpValueNode('counter'),
    });
    expect(result.find(input => input.node.kind === 'instructionAccountNode')).toMatchObject({ isPda: true });
});

test('it resolves an injected data-field default through the instruction provides', () => {
    // Given an instruction that injects a value fulfilled by its own provides.
    const node = instructionNode({
        accounts: [
            instructionAccountNode({
                identifier: 'counter',
                isSigner: false,
                isWritable: true,
            }),
        ],
        data: structTypeNode([
            structFieldTypeNode({
                defaultValue: injectedValueNode({ key: 'counterBump' }),
                identifier: 'bump',
                type: integerTypeNode('u8'),
            }),
        ]),
        identifier: 'myInstruction',
        provides: [providedNode('counterBump', accountBumpValueNode('counter'))],
    });

    // When we get its resolved inputs.
    const result = resolve(node);

    // Then the field's resolved default is the provided contextual value.
    const field = result.find(input => 'path' in input && input.path === 'bump');
    expect(field).toMatchObject({
        dependsOn: [accountValueNode('counter')],
        resolvedDefaultValue: accountBumpValueNode('counter'),
    });
});

test('it falls back to the injected value fallback when no provider is found', () => {
    // Given an instruction whose injected data-field default has no matching provider but a static fallback.
    const fallback = publicKeyValueNode('11111111111111111111111111111111');
    const node = instructionNode({
        data: structTypeNode([
            structFieldTypeNode({
                defaultValue: injectedValueNode({ fallback, key: 'missing' }),
                identifier: 'signer',
                type: publicKeyTypeNode(),
            }),
        ]),
        identifier: 'myInstruction',
    });

    // When we get its resolved inputs, including fields with static defaults.
    const result = visit(
        node,
        getResolvedInstructionInputsVisitor(new LinkableDictionary(), { includeDataValueNodes: true }),
    );

    // Then the field resolves to the static fallback with no dependencies.
    const field = result.find(input => 'path' in input && input.path === 'signer');
    expect(field).toMatchObject({
        dependsOn: [],
        resolvedDefaultValue: fallback,
    });
});
