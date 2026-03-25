import { enumValueNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { makeVisitor } from './value-node-value-test-utils';

describe('value-node-value: visitEnumValue', () => {
    test('should resolve enum variant', () => {
        const result = makeVisitor().visitEnumValue(enumValueNode('TokenStandard', 'nonFungible'));
        expect(result).toEqual({ kind: 'enumValueNode', value: 'nonFungible' });
    });
});
