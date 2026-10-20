import type { Node } from '@codama/node-types';
import { describe, expect, test } from 'vitest';

import { formatErrorMessage } from '../src/message-formatter';

const root = { kind: 'rootNode' } as Node;
const program = { identifier: 'token', kind: 'programNode' } as Node;
const account = { identifier: 'mint', kind: 'accountNode' } as Node;
const field = { identifier: 'decimals', kind: 'structFieldTypeNode' } as Node;

describe('formatErrorMessage', () => {
    test('it renders the variables of the context', () => {
        expect(formatErrorMessage('Unrecognized kind [$kind].', { kind: 'missingNode' })).toBe(
            'Unrecognized kind [missingNode].',
        );
    });

    test('it renders any node path of the context as node selectors', () => {
        const message = formatErrorMessage('Conflicts with $conflictingPath.', {
            conflictingPath: [root, program, account],
        });
        expect(message).toBe('Conflicts with [programNode]token.[accountNode]mint.');
    });

    test('it renders lists of node paths of the context as lists of node selectors', () => {
        const message = formatErrorMessage('Got the cycle $cycle.', { cycle: [[root, program, account], [field]] });
        expect(message).toBe('Got the cycle [[programNode]token.[accountNode]mint, [structFieldTypeNode]decimals].');
    });
});
