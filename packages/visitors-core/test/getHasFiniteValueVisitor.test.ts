import {
    arrayTypeNode,
    definedTypeLinkNode,
    definedTypeNode,
    enumTypeNode,
    enumVariantTypeNode,
    fixedCountNode,
    integerTypeNode,
    mapTypeNode,
    optionTypeNode,
    prefixedCountNode,
    programNode,
    remainderCountNode,
    remainderOptionTypeNode,
    rootNode,
    setTypeNode,
    structFieldTypeNode,
    structTypeNode,
    tupleTypeNode,
    TypeNode,
    zeroableOptionTypeNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { getHasFiniteValueVisitor, getRecordLinkablesVisitor, LinkableDictionary, NodeStack, visit } from '../src';

const u8 = integerTypeNode('u8');
const self = definedTypeLinkNode('self');
const field = (type: TypeNode) => structTypeNode([structFieldTypeNode({ identifier: 'value', type })]);

test.each<[string, TypeNode]>([
    ['non-cyclic types', field(u8)],
    ['options', field(optionTypeNode(self, { prefix: u8 }))],
    ['remainder options', field(remainderOptionTypeNode(self))],
    ['zeroable options', field(zeroableOptionTypeNode(self))],
    ['prefixed arrays', arrayTypeNode(self, prefixedCountNode(u8))],
    ['remainder sets', setTypeNode(self, remainderCountNode())],
    ['empty fixed arrays', arrayTypeNode(self, fixedCountNode(0))],
    ['prefixed maps', mapTypeNode(u8, self, prefixedCountNode(u8))],
    [
        'enums with another variant',
        enumTypeNode([enumVariantTypeNode('nil'), enumVariantTypeNode('cons', { data: field(self) })]),
    ],
    ['links it cannot resolve', field(definedTypeLinkNode('missing'))],
])('it finds a finite value through %s', (_, type) => {
    // Given a defined type named `self` with the given type.
    const definedType = definedTypeNode({ identifier: 'self', type });
    const program = programNode({ definedTypes: [definedType], identifier: 'test', publicKey: '1111' });
    const root = rootNode(program);
    const linkables = new LinkableDictionary();
    visit(root, getRecordLinkablesVisitor(linkables));

    // When we visit it, then it has a finite value.
    const stack = new NodeStack();
    expect(stack.visitPath([root, program, definedType], getHasFiniteValueVisitor(linkables, { stack }))).toBe(true);
});

test.each<[string, TypeNode]>([
    ['aliases of themselves', self],
    ['struct fields', field(self)],
    ['tuple items', tupleTypeNode([u8, self])],
    ['fixed arrays', arrayTypeNode(self, fixedCountNode(2))],
    ['fixed maps', mapTypeNode(self, u8, fixedCountNode(1))],
    ['enums whose every variant recurses', enumTypeNode([enumVariantTypeNode('cons', { data: field(self) })])],
    ['enums without variants', field(enumTypeNode([]))],
])('it finds no finite value through %s', (_, type) => {
    // Given a defined type named `self` with the given type.
    const definedType = definedTypeNode({ identifier: 'self', type });
    const program = programNode({ definedTypes: [definedType], identifier: 'test', publicKey: '1111' });
    const root = rootNode(program);
    const linkables = new LinkableDictionary();
    visit(root, getRecordLinkablesVisitor(linkables));

    // When we visit it, then it has no finite value.
    const stack = new NodeStack();
    expect(stack.visitPath([root, program, definedType], getHasFiniteValueVisitor(linkables, { stack }))).toBe(false);
});

test('it finds no finite value through a type linking to one without', () => {
    // Given a type that is not cyclic itself, but links to a loop.
    const loop = definedTypeNode({
        identifier: 'loop',
        type: structTypeNode([structFieldTypeNode({ identifier: 'next', type: definedTypeLinkNode('loop') })]),
    });
    const usesLoop = definedTypeNode({ identifier: 'usesLoop', type: definedTypeLinkNode('loop') });
    const program = programNode({ definedTypes: [loop, usesLoop], identifier: 'test', publicKey: '1111' });
    const root = rootNode(program);
    const linkables = new LinkableDictionary();
    visit(root, getRecordLinkablesVisitor(linkables));

    // When we visit it, then it has no finite value.
    const stack = new NodeStack();
    expect(stack.visitPath([root, program, usesLoop], getHasFiniteValueVisitor(linkables, { stack }))).toBe(false);
});

test('it finds no finite value through a cycle across defined types without a way out', () => {
    // Given `a -> b -> a` through struct fields only.
    const a = definedTypeNode({ identifier: 'a', type: field(definedTypeLinkNode('b')) });
    const b = definedTypeNode({ identifier: 'b', type: field(definedTypeLinkNode('a')) });
    const program = programNode({ definedTypes: [a, b], identifier: 'test', publicKey: '1111' });
    const root = rootNode(program);
    const linkables = new LinkableDictionary();
    visit(root, getRecordLinkablesVisitor(linkables));

    // When we visit one of them, then it has no finite value.
    const stack = new NodeStack();
    expect(stack.visitPath([root, program, a], getHasFiniteValueVisitor(linkables, { stack }))).toBe(false);
});

test('it finds a finite value through another branch of a cycle across defined types', () => {
    // Given an enum whose first variant recurses through another type, and whose second ends.
    const tree = definedTypeNode({
        identifier: 'tree',
        type: enumTypeNode([
            enumVariantTypeNode('node', { data: field(definedTypeLinkNode('branch')) }),
            enumVariantTypeNode('leaf'),
        ]),
    });
    const branch = definedTypeNode({ identifier: 'branch', type: field(definedTypeLinkNode('tree')) });
    const program = programNode({ definedTypes: [tree, branch], identifier: 'test', publicKey: '1111' });
    const root = rootNode(program);
    const linkables = new LinkableDictionary();
    visit(root, getRecordLinkablesVisitor(linkables));

    // When we visit the type that only reaches the way out through the other one, then it has a finite value.
    const stack = new NodeStack();
    expect(stack.visitPath([root, program, branch], getHasFiniteValueVisitor(linkables, { stack }))).toBe(true);
});

test('it finds a finite value through types shared by sibling branches', () => {
    // Given a list whose two fields link to the same list type, each of them able to end.
    const list = definedTypeNode({
        identifier: 'list',
        type: structTypeNode([
            structFieldTypeNode({
                identifier: 'left',
                type: optionTypeNode(definedTypeLinkNode('list'), { prefix: u8 }),
            }),
            structFieldTypeNode({ identifier: 'right', type: definedTypeLinkNode('leaf') }),
        ]),
    });
    const leaf = definedTypeNode({
        identifier: 'leaf',
        type: structTypeNode([
            structFieldTypeNode({ identifier: 'a', type: definedTypeLinkNode('shared') }),
            structFieldTypeNode({ identifier: 'b', type: definedTypeLinkNode('shared') }),
        ]),
    });
    const shared = definedTypeNode({
        identifier: 'shared',
        type: optionTypeNode(definedTypeLinkNode('list'), { prefix: u8 }),
    });
    const program = programNode({ definedTypes: [list, leaf, shared], identifier: 'test', publicKey: '1111' });
    const root = rootNode(program);
    const linkables = new LinkableDictionary();
    visit(root, getRecordLinkablesVisitor(linkables));

    // When we visit the list, then it has a finite value.
    const stack = new NodeStack();
    expect(stack.visitPath([root, program, list], getHasFiniteValueVisitor(linkables, { stack }))).toBe(true);
});

test('it finds no finite value through types shared by sibling branches without a way out', () => {
    // Given a loop whose two fields link to the same type, which links back to the loop.
    const loop = definedTypeNode({
        identifier: 'loop',
        type: structTypeNode([
            structFieldTypeNode({ identifier: 'a', type: definedTypeLinkNode('shared') }),
            structFieldTypeNode({ identifier: 'b', type: definedTypeLinkNode('shared') }),
        ]),
    });
    const shared = definedTypeNode({ identifier: 'shared', type: field(definedTypeLinkNode('loop')) });
    const program = programNode({ definedTypes: [loop, shared], identifier: 'test', publicKey: '1111' });
    const root = rootNode(program);
    const linkables = new LinkableDictionary();
    visit(root, getRecordLinkablesVisitor(linkables));

    // When we visit the loop, then it has no finite value.
    const stack = new NodeStack();
    expect(stack.visitPath([root, program, loop], getHasFiniteValueVisitor(linkables, { stack }))).toBe(false);
});

test('it finds a finite value for a type first reached within a cycle it does not need', () => {
    // Given a tree whose recursive variant reaches a branch first, and a root using both.
    const tree = definedTypeNode({
        identifier: 'tree',
        type: enumTypeNode([
            enumVariantTypeNode('node', { data: field(definedTypeLinkNode('branch')) }),
            enumVariantTypeNode('leaf'),
        ]),
    });
    const branch = definedTypeNode({ identifier: 'branch', type: field(definedTypeLinkNode('tree')) });
    const forest = definedTypeNode({
        identifier: 'forest',
        type: structTypeNode([
            structFieldTypeNode({ identifier: 'tree', type: definedTypeLinkNode('tree') }),
            structFieldTypeNode({ identifier: 'branch', type: definedTypeLinkNode('branch') }),
        ]),
    });
    const program = programNode({ definedTypes: [tree, branch, forest], identifier: 'test', publicKey: '1111' });
    const root = rootNode(program);
    const linkables = new LinkableDictionary();
    visit(root, getRecordLinkablesVisitor(linkables));

    // When we visit the root, then the branch is not mistaken for having no finite value.
    const stack = new NodeStack();
    expect(stack.visitPath([root, program, forest], getHasFiniteValueVisitor(linkables, { stack }))).toBe(true);
});
