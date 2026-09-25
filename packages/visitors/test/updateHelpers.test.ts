import { CODAMA_ERROR__VISITORS__UNRECOGNIZED_UPDATE_KEYS, CodamaError } from '@codama/errors';
import {
    accountNode,
    assertIsNode,
    dataValueNode,
    definedTypeLinkNode,
    definedTypeNode,
    enumTypeNode,
    enumValueNode,
    enumVariantTypeNode,
    fieldDiscriminatorNode,
    identifierString,
    instructionAccountNode,
    instructionDisplayNode,
    instructionNode,
    integerTypeNode,
    integerValueNode,
    Node,
    programLinkNode,
    programNode,
    RootNode,
    rootNode,
    structFieldTypeNode,
    structTypeNode,
    textNode,
    tupleTypeNode,
} from '@codama/nodes';
import { getNodeSelectorFunction, LinkableDictionary, NodePath, visit } from '@codama/visitors-core';
import { describe, expect, test } from 'vitest';

import {
    applyDataUpdates,
    assertValidUpdateKeys,
    createUpdateResolver,
    getAppliedUpdate,
    getRenames,
    getUpdateVisitor,
    mergeUpdateRecords,
    parsePath,
    RenamePlan,
    toRenameMap,
} from '../src/updateHelpers';

const u8Field = (identifier: string) => structFieldTypeNode({ identifier, type: integerTypeNode('u8') });

/** Run the reference repointing alone, using the given rename plan. */
const repoint = (node: RootNode, renames: RenamePlan): RootNode => {
    const result = visit(node, getUpdateVisitor([], { linkables: new LinkableDictionary(), renames }));
    assertIsNode(result, 'rootNode');
    return result;
};

/** A rename plan entry returning `value` for the nodes matching `selector`. */
const renameAt =
    <T>(selector: string, value: T) =>
    (path: NodePath): T | undefined =>
        getNodeSelectorFunction(selector)(path as NodePath<Node>) ? value : undefined;

const renames = (entries: Record<string, string>) =>
    new Map(Object.entries(entries).map(([from, to]) => [from, identifierString(to)]));

describe('assertValidUpdateKeys', () => {
    test('it accepts allowed keys', () => {
        expect(() => assertValidUpdateKeys('myAccount', { identifier: 'a' }, ['identifier', 'docs'])).not.toThrow();
    });

    test('it throws on unrecognized keys', () => {
        expect(() => assertValidUpdateKeys('myAccount', { name: 'a', size: 1 }, ['identifier', 'size'])).toThrow(
            new CodamaError(CODAMA_ERROR__VISITORS__UNRECOGNIZED_UPDATE_KEYS, {
                allowedKeys: ['identifier', 'size'],
                selector: 'myAccount',
                unrecognizedKeys: ['name'],
            }),
        );
    });
});

describe('createUpdateResolver', () => {
    // Given a root with two programs sharing an account identifier.
    const programA = programNode({ accounts: [accountNode({ identifier: 'vault' })], identifier: 'a', publicKey: '1' });
    const programB = programNode({ accounts: [accountNode({ identifier: 'vault' })], identifier: 'b', publicKey: '2' });
    const root = rootNode(programA, { additionalPrograms: [programB] });
    const vaultA = [root, programA, programA.accounts![0]] as const;
    const vaultB = [root, programB, programB.accounts![0]] as const;
    type Updates = { docs?: string; identifier?: string };
    const merge = (previous: Updates, next: Updates): Updates => ({ ...previous, ...next });

    test('it merges the matching updates in declaration order', () => {
        const resolve = createUpdateResolver<Updates>(
            [
                { select: ['[accountNode]', 'vault'], updates: { docs: 'Any vault.', identifier: 'x' } },
                { select: ['[accountNode]', 'b.vault'], updates: { identifier: 'y' } },
            ],
            merge,
        );
        expect(resolve(vaultA)).toStrictEqual({ docs: 'Any vault.', identifier: 'x' });
        expect(resolve(vaultB)).toStrictEqual({ docs: 'Any vault.', identifier: 'y' });
        expect(resolve([root, programA])).toBeUndefined();
    });

    test('it lets deletions win over other updates', () => {
        const resolve = createUpdateResolver<Updates>(
            [
                { select: ['[accountNode]', 'vault'], updates: { delete: true } },
                { select: ['[accountNode]', 'vault'], updates: { identifier: 'x' } },
            ],
            merge,
        );
        expect(resolve(vaultA)).toStrictEqual({ delete: true });
    });

    test('it resolves shared node instances according to each of their paths', () => {
        // Given the same account instance used in two programs.
        const shared = accountNode({ identifier: 'vault' });
        const programC = programNode({ accounts: [shared], identifier: 'c', publicKey: '3' });
        const programD = programNode({ accounts: [shared], identifier: 'd', publicKey: '4' });
        const sharedRoot = rootNode(programC, { additionalPrograms: [programD] });

        // When we resolve an update scoped to the second program.
        const resolve = createUpdateResolver<Updates>(
            [{ select: ['[accountNode]', 'd.vault'], updates: { docs: 'd' } }],
            merge,
        );

        // Then only the path in that program is updated, whatever the resolution order.
        expect(resolve([sharedRoot, programC, shared])).toBeUndefined();
        expect(resolve([sharedRoot, programD, shared])).toStrictEqual({ docs: 'd' });
    });
});

describe('getAppliedUpdate', () => {
    test('it excludes deletions and missing updates', () => {
        expect(getAppliedUpdate({ identifier: 'x' })).toStrictEqual({ identifier: 'x' });
        expect(getAppliedUpdate({ delete: true })).toBeUndefined();
        expect(getAppliedUpdate(undefined)).toBeUndefined();
    });
});

describe('mergeUpdateRecords', () => {
    test('it merges the updates stored under the same key', () => {
        expect(
            mergeUpdateRecords<object>({ a: { isWritable: true }, b: { docs: 'b' } }, { a: { identifier: 'x' } }),
        ).toStrictEqual({ a: { identifier: 'x', isWritable: true }, b: { docs: 'b' } });
        expect(mergeUpdateRecords(undefined, { a: {} })).toStrictEqual({ a: {} });
        expect(mergeUpdateRecords({ a: {} }, undefined)).toStrictEqual({ a: {} });
    });
});

describe('getRenames and toRenameMap', () => {
    test('they build rename maps, or undefined when there is nothing to rename', () => {
        expect(getRenames({ a: { identifier: 'x' }, b: {} })).toStrictEqual(renames({ a: 'x' }));
        expect(getRenames({ b: {} })).toBeUndefined();
        expect(toRenameMap({ a: 'x' })).toStrictEqual(renames({ a: 'x' }));
        expect(toRenameMap({})).toBeUndefined();
        expect(toRenameMap(undefined)).toBeUndefined();
    });
});

describe('applyDataUpdates', () => {
    const data = structTypeNode([
        structFieldTypeNode({
            identifier: 'args',
            type: structTypeNode([
                u8Field('amount'),
                structFieldTypeNode({
                    identifier: 'pair',
                    type: tupleTypeNode([u8Field('x').type, structTypeNode([u8Field('y')])]),
                }),
            ]),
        }),
        structFieldTypeNode({ identifier: 'linked', type: definedTypeLinkNode('other') }),
    ]);

    test('it renames a field and its nested fields in any order', () => {
        const { type, unusedPaths } = applyDataUpdates(data, {
            args: { identifier: 'params' },
            'args.amount': { identifier: 'lamports' },
            'args.pair[1].y': { type: integerTypeNode('u16') },
        });
        expect(unusedPaths).toStrictEqual([]);
        expect(type).toStrictEqual(
            structTypeNode([
                structFieldTypeNode({
                    identifier: 'params',
                    type: structTypeNode([
                        u8Field('lamports'),
                        structFieldTypeNode({
                            identifier: 'pair',
                            type: tupleTypeNode([
                                integerTypeNode('u8'),
                                structTypeNode([
                                    structFieldTypeNode({ identifier: 'y', type: integerTypeNode('u16') }),
                                ]),
                            ]),
                        }),
                    ]),
                }),
                data.fields![1],
            ]),
        );
    });

    test('it reports paths matching no field, including tuple indices and links', () => {
        const { type, unusedPaths } = applyDataUpdates(data, {
            'args.missing': { docs: 'x' },
            'args.pair[5].y': { docs: 'x' },
            'linked.field': { docs: 'x' },
        });
        expect(unusedPaths).toStrictEqual(['args.missing', 'args.pair[5].y', 'linked.field']);
        expect(type).toStrictEqual(data);
    });

    test('it reports nested paths under a field whose type is replaced', () => {
        // When we replace the type of a field and also update one of its original nested fields.
        const newArgs = structTypeNode([u8Field('other')]);
        const { type, unusedPaths } = applyDataUpdates(data, {
            args: { type: newArgs },
            'args.amount': { identifier: 'lamports' },
        });

        // Then the nested path is reported since that field no longer exists.
        expect(unusedPaths).toStrictEqual(['args.amount']);
        expect(type).toStrictEqual(
            structTypeNode([structFieldTypeNode({ identifier: 'args', type: newArgs }), data.fields![1]]),
        );
    });

    test('it removes default values and their strategies', () => {
        const withDefault = structTypeNode([
            structFieldTypeNode({
                defaultValue: integerValueNode('1'),
                defaultValueStrategy: 'optional',
                identifier: 'a',
                type: integerTypeNode('u8'),
            }),
        ]);
        expect(applyDataUpdates(withDefault, { a: { defaultValue: null } }).type).toStrictEqual(
            structTypeNode([u8Field('a')]),
        );
    });
});

describe('parsePath', () => {
    test('it parses field and index segments', () => {
        expect(parsePath('config.fees[0].amount')).toStrictEqual([
            { identifier: 'config', kind: 'field' },
            { identifier: 'fees', kind: 'field' },
            { index: 0, kind: 'index' },
            { identifier: 'amount', kind: 'field' },
        ]);
        expect(parsePath('[12]')).toStrictEqual([{ index: 12, kind: 'index' }]);
    });
});

describe('getUpdateVisitor path resolution', () => {
    test('it repoints nested paths and tuple indices of inline instruction data', () => {
        // Given an instruction referencing a field nested in a tuple within its data.
        const instruction = instructionNode({
            accounts: [
                instructionAccountNode({
                    defaultValue: dataValueNode('pair[1].amount'),
                    identifier: 'meta',
                    isSigner: false,
                    isWritable: false,
                }),
            ],
            data: structTypeNode([
                structFieldTypeNode({
                    identifier: 'pair',
                    type: tupleTypeNode([integerTypeNode('u8'), structTypeNode([u8Field('amount')])]),
                }),
            ]),
            identifier: 'ix',
        });
        const root = rootNode(programNode({ identifier: 'p', instructions: [instruction], publicKey: '1' }));

        // When we rename the nested field (keyed by its full path).
        const result = repoint(root, {
            instructionFields: renameAt('[instructionNode]ix', renames({ 'pair[1].amount': 'lamports' })),
        });

        // Then the path is rewritten.
        expect(result.program.instructions?.[0].accounts?.[0].defaultValue).toStrictEqual(
            dataValueNode('pair[1].lamports'),
        );
    });

    test('it leaves paths that do not go through a renamed field untouched', () => {
        // Given an instruction referencing two fields.
        const instruction = instructionNode({
            data: structTypeNode([u8Field('a'), u8Field('b')]),
            discriminators: [fieldDiscriminatorNode('a'), fieldDiscriminatorNode('b')],
            identifier: 'ix',
        });
        const root = rootNode(programNode({ identifier: 'p', instructions: [instruction], publicKey: '1' }));

        // When we rename one of them, then only the matching discriminator is repointed.
        const result = repoint(root, { instructionFields: renameAt('[instructionNode]ix', renames({ b: 'c' })) });
        expect(result.program.instructions?.[0].discriminators).toStrictEqual([
            fieldDiscriminatorNode('a'),
            fieldDiscriminatorNode('c'),
        ]);
    });

    test('it follows defined type links and applies defined type member renames', () => {
        // Given an instruction whose data links to a struct that links to another struct.
        const outer = definedTypeNode({
            identifier: 'outer',
            type: structTypeNode([structFieldTypeNode({ identifier: 'inner', type: definedTypeLinkNode('inner') })]),
        });
        const inner = definedTypeNode({ identifier: 'inner', type: structTypeNode([u8Field('amount')]) });
        const instruction = instructionNode({
            data: definedTypeLinkNode('outer'),
            discriminators: [fieldDiscriminatorNode('inner.amount')],
            identifier: 'ix',
        });
        const root = rootNode(
            programNode({ definedTypes: [outer, inner], identifier: 'p', instructions: [instruction], publicKey: '1' }),
        );

        // When we rename members of both defined types.
        const outerRenames = renameAt('[definedTypeNode]outer', renames({ inner: 'nested' }));
        const innerRenames = renameAt('[definedTypeNode]inner', renames({ amount: 'lamports' }));
        const result = repoint(root, { definedTypeMembers: path => outerRenames(path) ?? innerRenames(path) });

        // Then both segments of the path are rewritten.
        expect(result.program.instructions?.[0].discriminators).toStrictEqual([
            fieldDiscriminatorNode('nested.lamports'),
        ]);
    });

    test('it stops following self-referencing defined types', () => {
        // Given an account whose data is a self-referencing linked struct.
        const list = definedTypeNode({
            identifier: 'list',
            type: structTypeNode([structFieldTypeNode({ identifier: 'next', type: definedTypeLinkNode('list') })]),
        });
        const account = accountNode({
            data: definedTypeLinkNode('list'),
            discriminators: [fieldDiscriminatorNode('next.next.next')],
            identifier: 'node',
        });
        const root = rootNode(
            programNode({ accounts: [account], definedTypes: [list], identifier: 'p', publicKey: '1' }),
        );

        // When we rename the recursive field.
        const result = repoint(root, {
            definedTypeMembers: renameAt('[definedTypeNode]list', renames({ next: 'tail' })),
        });

        // Then only the segment reached before the cycle is rewritten.
        expect(result.program.accounts?.[0].discriminators).toStrictEqual([fieldDiscriminatorNode('tail.next.next')]);
    });

    test('it repoints interpolated intent placeholders, including text nodes', () => {
        // Given instructions whose intents reference an account and a nested data field.
        const makeInstruction = (identifier: string, intent: string | ReturnType<typeof textNode>) =>
            instructionNode({
                accounts: [instructionAccountNode({ identifier: 'source', isSigner: true, isWritable: true })],
                data: structTypeNode([
                    structFieldTypeNode({ identifier: 'args', type: structTypeNode([u8Field('amount')]) }),
                ]),
                display: instructionDisplayNode({ interpolatedIntent: intent }),
                identifier,
            });
        const plain = makeInstruction('plain', 'Send ${data.args.amount} from ${accounts.source} (${data.other})');
        const rich = makeInstruction('rich', textNode({ content: 'Send ${data.args.amount}' }));
        const root = rootNode(programNode({ identifier: 'p', instructions: [plain, rich], publicKey: '1' }));

        // When we rename the account and the nested field in both instructions.
        const result = repoint(root, {
            instructionAccounts: renameAt('[instructionNode]', renames({ source: 'from' })),
            instructionFields: renameAt('[instructionNode]', renames({ 'args.amount': 'lamports' })),
        });

        // Then matching placeholders are rewritten and others are kept.
        const [newPlain, newRich] = result.program.instructions!;
        expect(newPlain.display).toStrictEqual(
            instructionDisplayNode({
                interpolatedIntent: 'Send ${data.args.lamports} from ${accounts.from} (${data.other})',
            }),
        );
        expect(newRich.display).toStrictEqual(
            instructionDisplayNode({ interpolatedIntent: textNode({ content: 'Send ${data.args.lamports}' }) }),
        );
    });

    test('it repoints enum values of renamed variants only for the matching enum', () => {
        // Given two enums sharing a variant identifier, used as default values.
        const account = accountNode({
            data: structTypeNode(
                ['a', 'b'].map(enumName =>
                    structFieldTypeNode({
                        defaultValue: enumValueNode(definedTypeLinkNode(enumName), 'on'),
                        identifier: `${enumName}Field`,
                        type: definedTypeLinkNode(enumName),
                    }),
                ),
            ),
            identifier: 'myAccount',
        });
        const enumType = enumTypeNode([enumVariantTypeNode('on')]);
        const root = rootNode(
            programNode({
                accounts: [account],
                definedTypes: [
                    definedTypeNode({ identifier: 'a', type: enumType }),
                    definedTypeNode({ identifier: 'b', type: enumType }),
                ],
                identifier: 'p',
                publicKey: '1',
            }),
        );

        // When we rename the variant of the first enum.
        const result = repoint(root, {
            definedTypeMembers: renameAt('[definedTypeNode]a', renames({ on: 'enabled' })),
        });

        // Then only the value of the first enum is repointed.
        const data = result.program.accounts?.[0].data;
        assertIsNode(data, 'structTypeNode');
        expect(data.fields?.map(field => field.defaultValue)).toStrictEqual([
            enumValueNode(definedTypeLinkNode('a'), 'enabled'),
            enumValueNode(definedTypeLinkNode('b'), 'on'),
        ]);
    });

    test('it resolves links to their targets rather than matching identifiers', () => {
        // Given two programs defining the same type identifier, each linked from an account of program a.
        const programA = programNode({
            accounts: [
                accountNode({ data: definedTypeLinkNode('shared'), identifier: 'local' }),
                accountNode({
                    data: definedTypeLinkNode('shared', { program: programLinkNode('b') }),
                    identifier: 'remote',
                }),
            ],
            definedTypes: [definedTypeNode({ identifier: 'shared', type: integerTypeNode('u8') })],
            identifier: 'a',
            publicKey: '1',
        });
        const programB = programNode({
            definedTypes: [definedTypeNode({ identifier: 'shared', type: integerTypeNode('u16') })],
            identifier: 'b',
            publicKey: '2',
        });

        // When we rename the defined type of program b.
        const result = repoint(rootNode(programA, { additionalPrograms: [programB] }), {
            definedTypes: renameAt('b.[definedTypeNode]shared', identifierString('renamed')),
            programs: renameAt('[programNode]b', identifierString('newB')),
        });

        // Then only the link resolving to it is renamed, along with its program link.
        expect(result.program.accounts?.map(account => account.data)).toStrictEqual([
            definedTypeLinkNode('shared'),
            definedTypeLinkNode('renamed', { program: programLinkNode('newB') }),
        ]);
    });
});
