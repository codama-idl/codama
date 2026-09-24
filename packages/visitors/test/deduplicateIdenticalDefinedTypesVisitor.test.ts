import {
    accountNode,
    definedTypeLinkNode,
    definedTypeNode,
    integerTypeNode,
    programLinkNode,
    programNode,
    rootNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { deduplicateIdenticalDefinedTypesVisitor } from '../src';

test('it removes identical defined types from later programs', () => {
    // Given two programs defining the same type, with different docs.
    const programA = programNode({
        definedTypes: [definedTypeNode({ docs: 'In A.', identifier: 'myType', type: integerTypeNode('u8') })],
        identifier: 'programA',
        publicKey: '1111',
    });
    const programB = programNode({
        definedTypes: [definedTypeNode({ docs: 'In B.', identifier: 'myType', type: integerTypeNode('u8') })],
        identifier: 'programB',
        publicKey: '2222',
    });

    // When we deduplicate identical defined types.
    const result = visit(
        rootNode(programA, { additionalPrograms: [programB] }),
        deduplicateIdenticalDefinedTypesVisitor(),
    );

    // Then only the first copy is kept.
    expect(result).toStrictEqual(
        rootNode(programA, { additionalPrograms: [programNode({ identifier: 'programB', publicKey: '2222' })] }),
    );
});

test('it keeps same-named defined types that differ', () => {
    // Given two programs defining different types under the same name.
    const programA = programNode({
        definedTypes: [definedTypeNode({ identifier: 'myType', type: integerTypeNode('u8') })],
        identifier: 'programA',
        publicKey: '1111',
    });
    const programB = programNode({
        definedTypes: [definedTypeNode({ identifier: 'myType', type: integerTypeNode('u16') })],
        identifier: 'programB',
        publicKey: '2222',
    });
    const node = rootNode(programA, { additionalPrograms: [programB] });

    // When we deduplicate identical defined types, then nothing changes.
    expect(visit(node, deduplicateIdenticalDefinedTypesVisitor())).toStrictEqual(node);
});

test('it repoints links to removed types at the kept ones', () => {
    // Given two programs defining the same type, used by an account of the second program.
    const programA = programNode({
        definedTypes: [definedTypeNode({ identifier: 'myType', type: integerTypeNode('u8') })],
        identifier: 'programA',
        publicKey: '1111',
    });
    const programB = programNode({
        accounts: [accountNode({ data: definedTypeLinkNode('myType'), identifier: 'myAccount' })],
        definedTypes: [definedTypeNode({ identifier: 'myType', type: integerTypeNode('u8') })],
        identifier: 'programB',
        publicKey: '2222',
    });

    // When we deduplicate identical defined types.
    const result = visit(
        rootNode(programA, { additionalPrograms: [programB] }),
        deduplicateIdenticalDefinedTypesVisitor(),
    );

    // Then the account now links to the type of the first program.
    expect(result).toStrictEqual(
        rootNode(programA, {
            additionalPrograms: [
                programNode({
                    accounts: [
                        accountNode({
                            data: definedTypeLinkNode('myType', { program: programLinkNode('programA') }),
                            identifier: 'myAccount',
                        }),
                    ],
                    identifier: 'programB',
                    publicKey: '2222',
                }),
            ],
        }),
    );
});

test('it keeps identical types whose unqualified links resolve to different types', () => {
    // Given two programs defining a "wrapper" type that links to their own, different, "inner" type.
    const wrapper = definedTypeNode({
        identifier: 'wrapper',
        type: structTypeNode([structFieldTypeNode({ identifier: 'inner', type: definedTypeLinkNode('inner') })]),
    });
    const programA = programNode({
        definedTypes: [wrapper, definedTypeNode({ identifier: 'inner', type: integerTypeNode('u8') })],
        identifier: 'programA',
        publicKey: '1111',
    });
    const programB = programNode({
        definedTypes: [wrapper, definedTypeNode({ identifier: 'inner', type: integerTypeNode('u16') })],
        identifier: 'programB',
        publicKey: '2222',
    });
    const node = rootNode(programA, { additionalPrograms: [programB] });

    // When we deduplicate identical defined types, then nothing changes.
    expect(visit(node, deduplicateIdenticalDefinedTypesVisitor())).toStrictEqual(node);
});

test('it deduplicates identical types whose unqualified links are deduplicated too', () => {
    // Given two programs defining the same "wrapper" and "inner" types.
    const wrapper = definedTypeNode({
        identifier: 'wrapper',
        type: structTypeNode([structFieldTypeNode({ identifier: 'inner', type: definedTypeLinkNode('inner') })]),
    });
    const inner = definedTypeNode({ identifier: 'inner', type: integerTypeNode('u8') });
    const programA = programNode({ definedTypes: [wrapper, inner], identifier: 'programA', publicKey: '1111' });
    const programB = programNode({ definedTypes: [wrapper, inner], identifier: 'programB', publicKey: '2222' });

    // When we deduplicate identical defined types.
    const result = visit(
        rootNode(programA, { additionalPrograms: [programB] }),
        deduplicateIdenticalDefinedTypesVisitor(),
    );

    // Then both are removed from the second program.
    expect(result).toStrictEqual(
        rootNode(programA, { additionalPrograms: [programNode({ identifier: 'programB', publicKey: '2222' })] }),
    );
});
