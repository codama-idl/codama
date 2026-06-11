import { attribute, boolean, enumeration, node, optionalAttribute, u32 } from '@codama/spec/api';
import { describe, expect, it } from 'vitest';

import { getAttributeBodyLineFragment } from '../../../src/nodeTypes/fragments/attributeBodyLine';
import type { RenderScope } from '../../../src/nodeTypes/options';

type TypeParameterScope = Pick<RenderScope, 'narrowableDataAttributes'>;

function buildScope(overrides: Partial<TypeParameterScope> = {}): TypeParameterScope {
    return { narrowableDataAttributes: new Set(), ...overrides };
}

describe('getAttributeBodyLineFragment', () => {
    it('renders a required data attribute as a concrete typed line', () => {
        const result = getAttributeBodyLineFragment('someTypeNode', attribute('flag', boolean()), buildScope());
        expect(result.content).toBe('readonly flag: boolean;');
    });

    it('renders an optional data attribute with `?:` and the same typed body', () => {
        const result = getAttributeBodyLineFragment('someTypeNode', optionalAttribute('count', u32()), buildScope());
        expect(result.content).toBe('readonly count?: number;');
    });

    it('emits a single-line JSDoc above the body line when docs are a single paragraph', () => {
        const result = getAttributeBodyLineFragment(
            'someTypeNode',
            attribute('flag', boolean(), { docs: ['A flag.'] }),
            buildScope(),
        );
        expect(result.content).toBe('/** A flag. */\nreadonly flag: boolean;');
    });

    it('emits a multi-line JSDoc above the body line when docs span multiple paragraphs', () => {
        const result = getAttributeBodyLineFragment(
            'someTypeNode',
            attribute('flag', boolean(), { docs: ['First paragraph.', 'Second paragraph.'] }),
            buildScope(),
        );
        expect(result.content).toBe('/**\n * First paragraph.\n * Second paragraph.\n */\nreadonly flag: boolean;');
    });

    it('uses the type-parameter identifier when the attribute is a child reference', () => {
        const result = getAttributeBodyLineFragment(
            'someTypeNode',
            attribute('payload', node('innerTypeNode')),
            buildScope(),
        );
        expect(result.content).toBe('readonly payload: TPayload;');
    });

    it('uses the type-parameter identifier on optional child attributes too', () => {
        const result = getAttributeBodyLineFragment(
            'someTypeNode',
            optionalAttribute('payload', node('innerTypeNode')),
            buildScope(),
        );
        expect(result.content).toBe('readonly payload?: TPayload;');
    });

    it('uses the type-parameter identifier for narrowable data attributes', () => {
        const result = getAttributeBodyLineFragment(
            'numberTypeNode',
            attribute('format', enumeration('NumberFormat')),
            buildScope({ narrowableDataAttributes: new Set(['numberTypeNode:format']) }),
        );
        expect(result.content).toBe('readonly format: TFormat;');
    });

    it('does not surface a data attribute that is not in the narrowable set as a type parameter', () => {
        const result = getAttributeBodyLineFragment(
            'numberTypeNode',
            attribute('format', enumeration('NumberFormat')),
            buildScope(),
        );
        expect(result.content).toBe('readonly format: NumberFormat;');
    });
});
