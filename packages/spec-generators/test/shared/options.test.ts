import { array, attribute, boolean, enumeration, node, optionalAttribute, u32, union } from '@codama/spec/api';
import { describe, expect, it } from 'vitest';

import { isNodeTypeParameterAttribute, type SharedResolvedRenderOptions } from '../../src/shared';

type TypeParameterScope = Pick<SharedResolvedRenderOptions, 'narrowableDataAttributes'>;

function buildOptions(overrides: Partial<TypeParameterScope> = {}): TypeParameterScope {
    return { narrowableDataAttributes: new Set(), ...overrides };
}

describe('isNodeTypeParameterAttribute', () => {
    it('selects a child attribute whose type is a direct node reference', () => {
        expect(isNodeTypeParameterAttribute('aNode', attribute('payload', node('innerNode')), buildOptions())).toBe(
            true,
        );
    });

    it('selects a child attribute whose type is a union reference', () => {
        expect(isNodeTypeParameterAttribute('aNode', attribute('payload', union('TypeNode')), buildOptions())).toBe(
            true,
        );
    });

    it('selects a child attribute wrapped in an array', () => {
        expect(
            isNodeTypeParameterAttribute('aNode', attribute('items', array(node('innerNode'))), buildOptions()),
        ).toBe(true);
    });

    it('rejects a plain data attribute (boolean)', () => {
        expect(isNodeTypeParameterAttribute('aNode', attribute('flag', boolean()), buildOptions())).toBe(false);
    });

    it('rejects a plain data attribute (number)', () => {
        expect(isNodeTypeParameterAttribute('aNode', attribute('count', u32()), buildOptions())).toBe(false);
    });

    it('selects a narrowable data attribute when its key is in narrowableDataAttributes', () => {
        const options = buildOptions({ narrowableDataAttributes: new Set(['numberTypeNode:format']) });
        expect(
            isNodeTypeParameterAttribute('numberTypeNode', attribute('format', enumeration('NumberFormat')), options),
        ).toBe(true);
    });

    it('rejects a data attribute whose key is absent from the narrowable set', () => {
        const options = buildOptions({ narrowableDataAttributes: new Set(['otherNode:format']) });
        expect(
            isNodeTypeParameterAttribute('numberTypeNode', attribute('format', enumeration('NumberFormat')), options),
        ).toBe(false);
    });

    it('respects optionality (still selects an optional child attribute)', () => {
        expect(
            isNodeTypeParameterAttribute('aNode', optionalAttribute('payload', node('innerNode')), buildOptions()),
        ).toBe(true);
    });
});
