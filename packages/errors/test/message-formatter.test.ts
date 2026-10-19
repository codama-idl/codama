import type { Node } from '@codama/node-types';
import { describe, expect, test } from 'vitest';

import { CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_ADDRESS_TYPE } from '../src';
import { formatErrorMessage, getHumanReadableErrorMessage } from '../src/message-formatter';

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

    test('it renders an optional section when its variables are in the context', () => {
        const message = formatErrorMessage('Invalid account $path{{ at index [$index]}}.', {
            index: 1,
            path: [program],
        });
        expect(message).toBe('Invalid account [programNode]token at index [1].');
    });

    test('it leaves out an optional section when one of its variables is not in the context', () => {
        expect(formatErrorMessage('Invalid account $path{{ at index [$index]}}.', { path: [program] })).toBe(
            'Invalid account [programNode]token.',
        );
    });

    test('it leaves out an optional section when one of its variables is undefined', () => {
        const message = formatErrorMessage('Invalid account $path{{ at index [$index]}}.', {
            index: undefined,
            path: [program],
        });
        expect(message).toBe('Invalid account [programNode]token.');
    });
});

describe('getHumanReadableErrorMessage', () => {
    test('it renders the index of an unexpected address type when given', () => {
        const message = getHumanReadableErrorMessage(CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_ADDRESS_TYPE, {
            actualType: 'number',
            expectedType: 'Address | PublicKey',
            index: 1,
            path: [root, program, account],
        });
        expect(message).toBe(
            'Expected an address of type [Address | PublicKey] for [programNode]token.[accountNode]mint at index [1], but received [number].',
        );
    });

    test('it leaves out the index of an unexpected address type when not given', () => {
        const message = getHumanReadableErrorMessage(CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_ADDRESS_TYPE, {
            actualType: 'number',
            expectedType: 'Address | PublicKey',
            path: [root, program, account],
        });
        expect(message).toBe(
            'Expected an address of type [Address | PublicKey] for [programNode]token.[accountNode]mint, but received [number].',
        );
    });
});
