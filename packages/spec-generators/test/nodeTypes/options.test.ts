import { array, attribute, boolean, enumeration, node, optionalAttribute, u32, union } from '@codama/spec/api';
import { describe, expect, it } from 'vitest';

import { isAttributeLifted, type ResolvedRenderOptions } from '../../src/nodeTypes/options';

type LiftOptions = Pick<ResolvedRenderOptions, 'narrowableDataAttributes'>;

function buildOptions(overrides: Partial<LiftOptions> = {}): LiftOptions {
    return { narrowableDataAttributes: new Set(), ...overrides };
}

describe('isAttributeLifted', () => {
    it('lifts a child attribute whose type is a direct node reference', () => {
        expect(isAttributeLifted('aNode', attribute('payload', node('innerNode')), buildOptions())).toBe(true);
    });

    it('lifts a child attribute whose type is a union reference', () => {
        expect(isAttributeLifted('aNode', attribute('payload', union('TypeNode')), buildOptions())).toBe(true);
    });

    it('lifts a child attribute wrapped in an array', () => {
        expect(isAttributeLifted('aNode', attribute('items', array(node('innerNode'))), buildOptions())).toBe(true);
    });

    it('does not lift a plain data attribute (boolean)', () => {
        expect(isAttributeLifted('aNode', attribute('flag', boolean()), buildOptions())).toBe(false);
    });

    it('does not lift a plain data attribute (number)', () => {
        expect(isAttributeLifted('aNode', attribute('count', u32()), buildOptions())).toBe(false);
    });

    it('lifts a narrowable data attribute when its key is in narrowableDataAttributes', () => {
        const options = buildOptions({ narrowableDataAttributes: new Set(['numberTypeNode:format']) });
        expect(isAttributeLifted('numberTypeNode', attribute('format', enumeration('NumberFormat')), options)).toBe(
            true,
        );
    });

    it('does not lift a data attribute whose key is absent from the narrowable set', () => {
        const options = buildOptions({ narrowableDataAttributes: new Set(['otherNode:format']) });
        expect(isAttributeLifted('numberTypeNode', attribute('format', enumeration('NumberFormat')), options)).toBe(
            false,
        );
    });

    it('respects optionality (still lifts an optional child attribute)', () => {
        expect(isAttributeLifted('aNode', optionalAttribute('payload', node('innerNode')), buildOptions())).toBe(true);
    });
});
