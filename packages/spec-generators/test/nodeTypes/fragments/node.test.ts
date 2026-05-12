import {
    array,
    attribute,
    defineNode,
    enumeration,
    node,
    optionalAttribute,
    stringIdentifier,
    u32,
    union,
} from '@codama/spec/api';
import { describe, expect, it } from 'vitest';

import { getNodeFragment } from '../../../src/nodeTypes/fragments/node';
import type { RenderScope } from '../../../src/nodeTypes/options';

type NodeScope = Pick<RenderScope, 'genericParamOrder' | 'narrowableDataAttributes'>;

function buildScope(overrides: Partial<NodeScope> = {}): NodeScope {
    return {
        genericParamOrder: new Map(),
        narrowableDataAttributes: new Set(),
        ...overrides,
    };
}

// Minimum spec exercising the full body shape: a wrapping node with one
// data attribute (`endian`, an enumeration), one optional data attribute
// (`count`), and one child attribute (`payload`, a union).
function buildWrappingNode() {
    return defineNode('wrappingTypeNode', {
        attributes: [
            attribute('payload', union('TypeNode'), { docs: ['A wrapped payload.'] }),
            attribute('endian', enumeration('Endianness'), { docs: ['A byte order.'] }),
            optionalAttribute('count', u32(), { docs: ['Optional count.'] }),
        ],
        docs: ['A node referencing the union and the enumeration.'],
    });
}

function buildArgumentNode() {
    return defineNode('instructionArgumentNode', {
        attributes: [
            attribute('type', union('TypeNode')),
            optionalAttribute('defaultValue', union('InstructionInputValueNode')),
        ],
    });
}

describe('getNodeFragment', () => {
    it('emits an interface with kind discriminator, generics, and section markers', () => {
        const result = getNodeFragment(buildWrappingNode(), buildScope());
        const c = result.content;
        expect(c).toContain('export interface WrappingTypeNode<');
        expect(c).toContain("readonly kind: 'wrappingTypeNode';");
        expect(c).toContain('// Data.');
        expect(c).toContain('// Children.');
        // The `endian` enumeration is data; the `payload` union is a child.
        expect(c).toContain('readonly endian: Endianness;');
        expect(c).toContain('readonly payload: TPayload;');
        // Optional u32 attribute should land in Data with `?: number;`.
        expect(c).toContain('readonly count?: number;');
    });

    it('surfaces every child attribute as a type parameter', () => {
        const result = getNodeFragment(buildWrappingNode(), buildScope());
        expect(result.content).toContain('TPayload extends TypeNode = TypeNode');
    });

    it('emits no Data or Children section when the corresponding group is empty', () => {
        // A child-only node: just one child attribute, no data attributes.
        const childOnly = defineNode('childOnlyNode', {
            attributes: [attribute('child', node('innerTypeNode'))],
        });
        const result = getNodeFragment(childOnly, buildScope());
        expect(result.content).not.toContain('// Data.');
        expect(result.content).toContain('// Children.');
    });

    it('inserts a SelfXxxNode alias for self-referential nodes', () => {
        const recursive = defineNode('recursiveTypeNode', {
            attributes: [
                attribute('name', stringIdentifier()),
                optionalAttribute('children', array(node('recursiveTypeNode'))),
            ],
        });
        const result = getNodeFragment(recursive, buildScope());
        expect(result.content).toContain('type SelfRecursiveTypeNode = RecursiveTypeNode;');
        expect(result.content).toContain('TChildren extends Array<SelfRecursiveTypeNode>');
    });

    it('emits a JSDoc above the interface declaration when the node has docs', () => {
        const result = getNodeFragment(buildWrappingNode(), buildScope());
        expect(result.content).toMatch(
            /\/\*\* A node referencing the union and the enumeration\. \*\/\nexport interface WrappingTypeNode/,
        );
    });

    it('emits a multi-paragraph JSDoc when node docs span multiple paragraphs', () => {
        const multiParagraph = defineNode('multiParagraphNode', {
            attributes: [],
            docs: ['First paragraph.', 'Second paragraph.'],
        });
        const result = getNodeFragment(multiParagraph, buildScope());
        expect(result.content).toMatch(
            /\/\*\*\n \* First paragraph\.\n \* Second paragraph\.\n \*\/\nexport interface/,
        );
    });

    it('emits a JSDoc above each attribute that has docs', () => {
        const result = getNodeFragment(buildWrappingNode(), buildScope());
        // Data attribute.
        expect(result.content).toContain('/** A byte order. */\nreadonly endian: Endianness;');
        // Optional data attribute.
        expect(result.content).toContain('/** Optional count. */\nreadonly count?: number;');
        // Child attribute (surfaces as a type parameter).
        expect(result.content).toContain('/** A wrapped payload. */\nreadonly payload: TPayload;');
    });

    it('emits type parameters in declaration order when no override is supplied', () => {
        const result = getNodeFragment(buildArgumentNode(), buildScope());
        const tTypeIdx = result.content.indexOf('TType extends');
        const tDefaultIdx = result.content.indexOf('TDefaultValue extends');
        expect(tTypeIdx).toBeGreaterThan(-1);
        expect(tDefaultIdx).toBeGreaterThan(-1);
        // Declaration order on the node puts `type` first.
        expect(tTypeIdx).toBeLessThan(tDefaultIdx);
    });

    it('reorders type parameters according to genericParamOrder', () => {
        const result = getNodeFragment(
            buildArgumentNode(),
            buildScope({ genericParamOrder: new Map([['instructionArgumentNode', ['defaultValue', 'type']]]) }),
        );
        // The override pins `defaultValue` first, even though `type`
        // appears first in the spec.
        const tDefaultIdx = result.content.indexOf('TDefaultValue extends');
        const tTypeIdx = result.content.indexOf('TType extends');
        expect(tDefaultIdx).toBeGreaterThan(-1);
        expect(tTypeIdx).toBeGreaterThan(-1);
        expect(tDefaultIdx).toBeLessThan(tTypeIdx);
    });

    it('throws when genericParamOrder lists an attribute the node does not surface as a type parameter', () => {
        // The override expects both `type` and `defaultValue` to be
        // type parameters. We omit `type` from the spec entirely, so
        // the renderer's type-parameter set is `{ defaultValue }` while
        // the override expects `{ defaultValue, type }`.
        const incomplete = defineNode('instructionArgumentNode', {
            attributes: [optionalAttribute('defaultValue', union('InstructionInputValueNode'))],
        });
        expect(() =>
            getNodeFragment(
                incomplete,
                buildScope({ genericParamOrder: new Map([['instructionArgumentNode', ['defaultValue', 'type']]]) }),
            ),
        ).toThrow(/genericParamOrder for "instructionArgumentNode" is out of sync/);
    });
});
