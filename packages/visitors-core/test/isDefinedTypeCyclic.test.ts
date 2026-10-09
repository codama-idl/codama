import { CODAMA_ERROR__NODE_PATH_PROGRAM_MISSING, CodamaError } from '@codama/errors';
import {
    arrayTypeNode,
    constantValueNode,
    definedTypeLinkNode,
    definedTypeNode,
    enumTypeNode,
    enumValueNode,
    enumVariantTypeNode,
    hiddenPrefixTransformNode,
    integerTypeNode,
    optionTypeNode,
    prefixedCountNode,
    programLinkNode,
    programNode,
    rootNode,
    stringTypeNode,
    stringValueNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { getRecordLinkablesVisitor, isDefinedTypeCyclic, LinkableDictionary, visit } from '../src';

test('it detects defined types linking to themselves', () => {
    // Given a linked list.
    const list = definedTypeNode({
        identifier: 'list',
        type: structTypeNode([
            structFieldTypeNode({ identifier: 'value', type: integerTypeNode('u8') }),
            structFieldTypeNode({
                identifier: 'next',
                type: optionTypeNode(definedTypeLinkNode('list'), { prefix: integerTypeNode('u8') }),
            }),
        ]),
    });
    const program = programNode({ definedTypes: [list], identifier: 'test', publicKey: '1111' });
    const root = rootNode(program);
    const linkables = new LinkableDictionary();
    visit(root, getRecordLinkablesVisitor(linkables));

    // When we check whether it is cyclic, then it is.
    expect(isDefinedTypeCyclic([root, program, list], linkables)).toBe(true);
});

test('it detects cycles through other defined types', () => {
    // Given a tree linking to a forest that links back to the tree.
    const tree = definedTypeNode({
        identifier: 'tree',
        type: structTypeNode([structFieldTypeNode({ identifier: 'children', type: definedTypeLinkNode('forest') })]),
    });
    const forest = definedTypeNode({
        identifier: 'forest',
        type: arrayTypeNode(definedTypeLinkNode('tree'), prefixedCountNode(integerTypeNode('u32'))),
    });
    const program = programNode({ definedTypes: [tree, forest], identifier: 'test', publicKey: '1111' });
    const root = rootNode(program);
    const linkables = new LinkableDictionary();
    visit(root, getRecordLinkablesVisitor(linkables));

    // When we check whether the tree is cyclic, then it is.
    expect(isDefinedTypeCyclic([root, program, tree], linkables)).toBe(true);
});

test('it does not mark types linking to a cycle as cyclic', () => {
    // Given a leaf linking to a list, which links to itself.
    const list = definedTypeNode({
        identifier: 'list',
        type: optionTypeNode(definedTypeLinkNode('list'), { prefix: integerTypeNode('u8') }),
    });
    const leaf = definedTypeNode({
        identifier: 'leaf',
        type: structTypeNode([structFieldTypeNode({ identifier: 'list', type: definedTypeLinkNode('list') })]),
    });
    const program = programNode({ definedTypes: [list, leaf], identifier: 'test', publicKey: '1111' });
    const root = rootNode(program);
    const linkables = new LinkableDictionary();
    visit(root, getRecordLinkablesVisitor(linkables));

    // When we check whether the leaf is cyclic, then it is not.
    expect(isDefinedTypeCyclic([root, program, leaf], linkables)).toBe(false);
});

test('it detects cycles through transforms', () => {
    // Given a string hiding a constant prefix of its own type.
    const tagged = definedTypeNode({
        identifier: 'tagged',
        type: stringTypeNode('utf8', {
            transforms: [
                hiddenPrefixTransformNode([constantValueNode(definedTypeLinkNode('tagged'), stringValueNode('x'))]),
            ],
        }),
    });
    const program = programNode({ definedTypes: [tagged], identifier: 'test', publicKey: '1111' });
    const root = rootNode(program);
    const linkables = new LinkableDictionary();
    visit(root, getRecordLinkablesVisitor(linkables));

    // When we check whether it is cyclic, then it is.
    expect(isDefinedTypeCyclic([root, program, tagged], linkables)).toBe(true);
});

test('it ignores links within values', () => {
    // Given an enum whose struct variant defaults to one of its own values.
    const direction = definedTypeNode({
        identifier: 'direction',
        type: enumTypeNode([
            enumVariantTypeNode('up'),
            enumVariantTypeNode('down', {
                data: structTypeNode([
                    structFieldTypeNode({
                        defaultValue: enumValueNode('direction', 'up'),
                        identifier: 'then',
                        type: integerTypeNode('u8'),
                    }),
                ]),
            }),
        ]),
    });
    const program = programNode({ definedTypes: [direction], identifier: 'test', publicKey: '1111' });
    const root = rootNode(program);
    const linkables = new LinkableDictionary();
    visit(root, getRecordLinkablesVisitor(linkables));

    // When we check whether it is cyclic, then it is not, since values do not shape the type.
    expect(isDefinedTypeCyclic([root, program, direction], linkables)).toBe(false);
});

test('it does not confuse same-named defined types of different programs', () => {
    // Given a type of program A linking to a same-named type of program B.
    const typeA = definedTypeNode({
        identifier: 'config',
        type: definedTypeLinkNode('config', { program: programLinkNode('b') }),
    });
    const typeB = definedTypeNode({ identifier: 'config', type: integerTypeNode('u32') });
    const programA = programNode({ definedTypes: [typeA], identifier: 'a', publicKey: '1111' });
    const programB = programNode({ definedTypes: [typeB], identifier: 'b', publicKey: '2222' });
    const root = rootNode(programA, { additionalPrograms: [programB] });
    const linkables = new LinkableDictionary();
    visit(root, getRecordLinkablesVisitor(linkables));

    // When we check whether the type of program A is cyclic, then it is not.
    expect(isDefinedTypeCyclic([root, programA, typeA], linkables)).toBe(false);
});

test('it ignores links it cannot resolve', () => {
    // Given a type linking to a missing type.
    const orphan = definedTypeNode({ identifier: 'orphan', type: definedTypeLinkNode('missing') });
    const program = programNode({ definedTypes: [orphan], identifier: 'test', publicKey: '1111' });
    const root = rootNode(program);
    const linkables = new LinkableDictionary();
    visit(root, getRecordLinkablesVisitor(linkables));

    // When we check whether it is cyclic, then it is not.
    expect(isDefinedTypeCyclic([root, program, orphan], linkables)).toBe(false);
});

test('it sees types recorded after a previous call', () => {
    // Given a type linking to a type that is not recorded yet.
    const a = definedTypeNode({ identifier: 'a', type: definedTypeLinkNode('b') });
    const b = definedTypeNode({ identifier: 'b', type: definedTypeLinkNode('a') });
    const program = programNode({ definedTypes: [a, b], identifier: 'test', publicKey: '1111' });
    const root = rootNode(program);
    const linkables = new LinkableDictionary();
    linkables.recordPath([root, program, a]);
    expect(isDefinedTypeCyclic([root, program, a], linkables)).toBe(false);

    // When we record the missing type.
    linkables.recordPath([root, program, b]);

    // Then the cycle is found.
    expect(isDefinedTypeCyclic([root, program, a], linkables)).toBe(true);
});

test('it throws when the path has no program', () => {
    // Given a cyclic type whose program is recorded.
    const list = definedTypeNode({
        identifier: 'list',
        type: optionTypeNode(definedTypeLinkNode('list'), { prefix: integerTypeNode('u8') }),
    });
    const program = programNode({ definedTypes: [list], identifier: 'test', publicKey: '1111' });
    const linkables = new LinkableDictionary();
    visit(rootNode(program), getRecordLinkablesVisitor(linkables));

    // When we check it from a path without its program, then it throws rather than missing the cycle.
    expect(() => isDefinedTypeCyclic([list], linkables)).toThrow(
        new CodamaError(CODAMA_ERROR__NODE_PATH_PROGRAM_MISSING, { path: [list] }),
    );
});
