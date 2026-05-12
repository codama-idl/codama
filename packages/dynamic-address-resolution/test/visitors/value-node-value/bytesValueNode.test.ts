import { bytesValueNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { makeVisitor } from './value-node-value-test-utils';

describe('value-node-value: visitBytesValue', () => {
    test('should resolve with base16 encoding', () => {
        const result = makeVisitor().visitBytesValue(bytesValueNode('base16', 'deadbeef'));
        expect(result).toEqual({ encoding: 'base16', kind: 'bytesValueNode', value: 'deadbeef' });
    });

    test('should resolve with base64 encoding', () => {
        const result = makeVisitor().visitBytesValue(bytesValueNode('base64', 'AQID'));
        expect(result).toEqual({ encoding: 'base64', kind: 'bytesValueNode', value: 'AQID' });
    });
});
