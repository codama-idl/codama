import {
    accountValueNode,
    argumentValueNode,
    constantPdaSeedNodeFromBytes,
    definedTypeLinkNode,
    instructionArgumentNode,
    numberTypeNode,
    pdaSeedValueNode,
    publicKeyTypeNode,
    sizePrefixTypeNode,
    stringTypeNode,
    structFieldTypeNode,
    structTypeNode,
    tupleTypeNode,
    variablePdaSeedNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { pdaSeedNodeFromAnchorV01 } from '../../src';

test('it creates a PdaSeedNode from a const Anchor seed', () => {
    const nodes = pdaSeedNodeFromAnchorV01({ kind: 'const', value: [11, 57, 246, 240] }, []);

    expect(nodes?.definition).toEqual(constantPdaSeedNodeFromBytes('base58', 'HeLLo'));
    expect(nodes?.value).toBeUndefined();
});

test('it creates a PdaSeedNode from an account Anchor seed', () => {
    const nodes = pdaSeedNodeFromAnchorV01({ kind: 'account', path: 'authority' }, []);

    expect(nodes?.definition).toEqual(variablePdaSeedNode('authority', publicKeyTypeNode()));
    expect(nodes?.value).toEqual(pdaSeedValueNode('authority', accountValueNode('authority')));
});

test('it creates a PdaSeedNode from an arg Anchor seed', () => {
    const nodes = pdaSeedNodeFromAnchorV01({ kind: 'arg', path: 'capacity' }, [
        instructionArgumentNode({ name: 'capacity', type: numberTypeNode('u64') }),
    ]);

    expect(nodes?.definition).toEqual(variablePdaSeedNode('capacity', numberTypeNode('u64')));
    expect(nodes?.value).toEqual(pdaSeedValueNode('capacity', argumentValueNode('capacity')));
});

test('it resolves nested arg path from inline struct type', () => {
    const nodes = pdaSeedNodeFromAnchorV01({ kind: 'arg', path: 'args.owner' }, [
        instructionArgumentNode({
            name: 'args',
            type: structTypeNode([
                structFieldTypeNode({ name: 'owner', type: publicKeyTypeNode() }),
                structFieldTypeNode({ name: 'amount', type: numberTypeNode('u64') }),
            ]),
        }),
    ]);

    expect(nodes?.definition).toEqual(variablePdaSeedNode('owner', publicKeyTypeNode()));
    expect(nodes?.value).toEqual(pdaSeedValueNode('owner', argumentValueNode('owner')));
});

test('it resolves nested arg path from defined type link', () => {
    const nodes = pdaSeedNodeFromAnchorV01(
        { kind: 'arg', path: 'args.amount' },
        [instructionArgumentNode({ name: 'args', type: definedTypeLinkNode('MyArgs') })],
        undefined,
        [{ name: 'MyArgs', type: { fields: [{ name: 'amount', type: 'u64' }], kind: 'struct' } }],
    );

    expect(nodes?.definition).toEqual(variablePdaSeedNode('amount', numberTypeNode('u64')));
    expect(nodes?.value).toEqual(pdaSeedValueNode('amount', argumentValueNode('amount')));
});

test('it uses full nested path to avoid name collisions for deeply nested arg seeds', () => {
    const instructionArgs = [
        instructionArgumentNode({
            name: 'input',
            type: structTypeNode([
                structFieldTypeNode({ name: 'seedEnum', type: numberTypeNode('u8') }),
                structFieldTypeNode({
                    name: 'innerStruct',
                    type: structTypeNode([structFieldTypeNode({ name: 'seedEnum', type: numberTypeNode('u8') })]),
                }),
            ]),
        }),
    ];

    const shallow = pdaSeedNodeFromAnchorV01({ kind: 'arg', path: 'input.seed_enum' }, instructionArgs);
    const deep = pdaSeedNodeFromAnchorV01({ kind: 'arg', path: 'input.inner_struct.seed_enum' }, instructionArgs);

    expect(shallow?.definition).toEqual(variablePdaSeedNode('seedEnum', numberTypeNode('u8')));
    expect(deep?.definition).toEqual(variablePdaSeedNode('innerStructSeedEnum', numberTypeNode('u8')));
});

test('it returns undefined for unresolvable nested arg type', () => {
    const result = pdaSeedNodeFromAnchorV01({ kind: 'arg', path: 'args.owner' }, [
        instructionArgumentNode({ name: 'args', type: definedTypeLinkNode('UnknownType') }),
    ]);

    expect(result).toBeUndefined();
});

test('it throws for nested arg path when root argument is missing', () => {
    expect(() => pdaSeedNodeFromAnchorV01({ kind: 'arg', path: 'args.owner' }, [])).toThrow();
});

test('it resolves nested account path from type def', () => {
    const nodes = pdaSeedNodeFromAnchorV01(
        { account: 'Mint', kind: 'account', path: 'mint.authority' },
        [],
        undefined,
        [{ name: 'Mint', type: { fields: [{ name: 'authority', type: 'pubkey' }], kind: 'struct' } }],
    );

    expect(nodes?.definition).toEqual(variablePdaSeedNode('mintAuthority', publicKeyTypeNode()));
    expect(nodes?.value).toEqual(pdaSeedValueNode('mintAuthority', accountValueNode('mint')));
});

test('it returns undefined for unresolvable nested account path', () => {
    const result = pdaSeedNodeFromAnchorV01(
        { account: 'UnknownType', kind: 'account', path: 'mint.authority' },
        [],
        undefined,
        [],
    );

    expect(result).toBeUndefined();
});

test('it resolves nested arg path through inline tuple type', () => {
    const nodes = pdaSeedNodeFromAnchorV01({ kind: 'arg', path: 'foo.0' }, [
        instructionArgumentNode({
            name: 'foo',
            type: tupleTypeNode([publicKeyTypeNode(), numberTypeNode('u64')]),
        }),
    ]);

    expect(nodes?.definition).toEqual(variablePdaSeedNode('0', publicKeyTypeNode()));
    expect(nodes?.value).toEqual(pdaSeedValueNode('0', argumentValueNode('0')));
});

test('it resolves nested path through tuple then struct (foo.0.bar)', () => {
    const nodes = pdaSeedNodeFromAnchorV01({ kind: 'arg', path: 'foo.0.bar' }, [
        instructionArgumentNode({
            name: 'foo',
            type: tupleTypeNode([structTypeNode([structFieldTypeNode({ name: 'bar', type: numberTypeNode('u8') })])]),
        }),
    ]);

    expect(nodes?.definition).toEqual(variablePdaSeedNode('0Bar', numberTypeNode('u8')));
    expect(nodes?.value).toEqual(pdaSeedValueNode('0Bar', argumentValueNode('0Bar')));
});

test('it returns undefined for out-of-bounds tuple index', () => {
    const result = pdaSeedNodeFromAnchorV01({ kind: 'arg', path: 'foo.5' }, [
        instructionArgumentNode({
            name: 'foo',
            type: tupleTypeNode([publicKeyTypeNode()]),
        }),
    ]);

    expect(result).toBeUndefined();
});

test('it resolves nested account path through IDL tuple type def', () => {
    const nodes = pdaSeedNodeFromAnchorV01({ account: 'Pair', kind: 'account', path: 'pair.0' }, [], undefined, [
        { name: 'Pair', type: { fields: ['pubkey', 'u64'], kind: 'struct' } },
    ]);

    expect(nodes?.definition).toEqual(variablePdaSeedNode('pair0', publicKeyTypeNode()));
    expect(nodes?.value).toEqual(pdaSeedValueNode('pair0', accountValueNode('pair')));
});

test('it removes the string prefix from arg Anchor seeds', () => {
    const nodes = pdaSeedNodeFromAnchorV01({ kind: 'arg', path: 'identifier' }, [
        instructionArgumentNode({
            name: 'identifier',
            type: sizePrefixTypeNode(stringTypeNode('utf8'), numberTypeNode('u32')),
        }),
    ]);

    expect(nodes?.definition).toEqual(variablePdaSeedNode('identifier', stringTypeNode('utf8')));
    expect(nodes?.value).toEqual(pdaSeedValueNode('identifier', argumentValueNode('identifier')));
});
