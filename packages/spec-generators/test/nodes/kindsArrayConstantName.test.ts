import { describe, expect, it } from 'vitest';

import { kindsArrayConstantName } from '../../src/nodes/kindsArrayConstantName';

describe('kindsArrayConstantName', () => {
    it('snake-cases and upper-cases the union name with a _KINDS suffix', () => {
        expect(kindsArrayConstantName('StandaloneTypeNode')).toBe('STANDALONE_TYPE_NODE_KINDS');
        expect(kindsArrayConstantName('TypeNode')).toBe('TYPE_NODE_KINDS');
        expect(kindsArrayConstantName('InstructionInputValueNode')).toBe('INSTRUCTION_INPUT_VALUE_NODE_KINDS');
    });
});
