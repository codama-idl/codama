import { array, boolean, literal, nestedUnion, node, tuple, union } from '@codama/spec/api';
import { describe, expect, it } from 'vitest';

import { isTypeExprSelfReferential } from '../../../src/nodeTypes/utils/selfReference';

describe('isTypeExprSelfReferential', () => {
    it('returns true for a direct node reference matching the kind', () => {
        expect(isTypeExprSelfReferential(node('fooNode'), 'fooNode')).toBe(true);
    });

    it('returns false for a direct node reference to a different kind', () => {
        expect(isTypeExprSelfReferential(node('barNode'), 'fooNode')).toBe(false);
    });

    it('recurses through array() to find a matching node reference', () => {
        expect(isTypeExprSelfReferential(array(node('fooNode')), 'fooNode')).toBe(true);
    });

    it('recurses through tuple() to find a matching node reference', () => {
        expect(isTypeExprSelfReferential(tuple(node('barNode'), node('fooNode')), 'fooNode')).toBe(true);
    });

    it('does not recurse through union references — they are name-aliased and break cycles', () => {
        expect(isTypeExprSelfReferential(union('FooUnion'), 'fooNode')).toBe(false);
    });

    it('does not recurse through nestedUnion references either', () => {
        expect(isTypeExprSelfReferential(nestedUnion('NestedFoo', 'fooNode'), 'fooNode')).toBe(false);
    });

    it('returns false for primitive types', () => {
        expect(isTypeExprSelfReferential(boolean(), 'fooNode')).toBe(false);
        expect(isTypeExprSelfReferential(literal('something'), 'fooNode')).toBe(false);
    });

    it('returns false for nested array(array(barNode)) when looking for fooNode', () => {
        expect(isTypeExprSelfReferential(array(array(node('barNode'))), 'fooNode')).toBe(false);
    });
});
