import { CODAMA_ERROR__NODE_PATH_PROGRAM_MISSING, CodamaError } from '@codama/errors';
import {
    definedTypeLinkNode,
    definedTypeNode,
    integerTypeNode,
    optionTypeNode,
    programNode,
    rootNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { getRecordLinkablesVisitor, hasDefinedTypeFiniteValue, LinkableDictionary, visit } from '../src';

test('it finds a finite value for types whose recursion may stop', () => {
    // Given a list that may end with `None`.
    const list = definedTypeNode({
        identifier: 'list',
        type: structTypeNode([
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

    // When we check whether it has a finite value, then it does.
    expect(hasDefinedTypeFiniteValue([root, program, list], linkables)).toBe(true);
});

test('it finds no finite value for types whose recursion never stops', () => {
    // Given a loop whose every value nests another one.
    const loop = definedTypeNode({
        identifier: 'loop',
        type: structTypeNode([structFieldTypeNode({ identifier: 'next', type: definedTypeLinkNode('loop') })]),
    });
    const program = programNode({ definedTypes: [loop], identifier: 'test', publicKey: '1111' });
    const root = rootNode(program);
    const linkables = new LinkableDictionary();
    visit(root, getRecordLinkablesVisitor(linkables));

    // When we check whether it has a finite value, then it does not.
    expect(hasDefinedTypeFiniteValue([root, program, loop], linkables)).toBe(false);
});

test('it sees types recorded after a previous call', () => {
    // Given a type linking to a loop that is not recorded yet.
    const usesLoop = definedTypeNode({ identifier: 'usesLoop', type: definedTypeLinkNode('loop') });
    const loop = definedTypeNode({ identifier: 'loop', type: definedTypeLinkNode('loop') });
    const program = programNode({ definedTypes: [usesLoop, loop], identifier: 'test', publicKey: '1111' });
    const root = rootNode(program);
    const linkables = new LinkableDictionary();
    linkables.recordPath([root, program, usesLoop]);
    expect(hasDefinedTypeFiniteValue([root, program, usesLoop], linkables)).toBe(true);

    // When we record the loop.
    linkables.recordPath([root, program, loop]);

    // Then it no longer has a finite value.
    expect(hasDefinedTypeFiniteValue([root, program, usesLoop], linkables)).toBe(false);
});

test('it throws when the path has no program', () => {
    // Given a loop whose program is recorded.
    const loop = definedTypeNode({ identifier: 'loop', type: definedTypeLinkNode('loop') });
    const program = programNode({ definedTypes: [loop], identifier: 'test', publicKey: '1111' });
    const linkables = new LinkableDictionary();
    visit(rootNode(program), getRecordLinkablesVisitor(linkables));

    // When we check it from a path without its program, then it throws rather than missing the loop.
    expect(() => hasDefinedTypeFiniteValue([loop], linkables)).toThrow(
        new CodamaError(CODAMA_ERROR__NODE_PATH_PROGRAM_MISSING, { path: [loop] }),
    );
});
