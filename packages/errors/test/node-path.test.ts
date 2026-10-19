import type { Node } from '@codama/node-types';
import { describe, expect, test } from 'vitest';

import {
    CODAMA_ERROR__LINKED_NODE_NOT_FOUND,
    CODAMA_ERROR__UNEXPECTED_NODE_KIND,
    CodamaError,
    getNodePathString,
} from '../src';
import { decodeEncodedContext, encodeContextObject } from '../src/context';
import { getHumanReadableErrorMessage } from '../src/message-formatter';

const root = { kind: 'rootNode' } as Node;
const program = { identifier: 'token', kind: 'programNode' } as Node;
const account = { identifier: 'mint', kind: 'accountNode' } as Node;
const struct = { kind: 'structTypeNode' } as Node;
const field = { identifier: 'decimals', kind: 'structFieldTypeNode' } as Node;

describe('getNodePathString', () => {
    test('it renders nodes as node selectors separated by dots, leaving out the root', () => {
        expect(getNodePathString([root, program, account, struct, field])).toBe(
            '[programNode]token.[accountNode]mint.[structTypeNode].[structFieldTypeNode]decimals',
        );
    });

    test('it renders paths that do not start at the root', () => {
        expect(getNodePathString([struct, field])).toBe('[structTypeNode].[structFieldTypeNode]decimals');
    });

    test('it renders a root on its own', () => {
        expect(getNodePathString([root])).toBe('[rootNode]');
    });

    test('it falls back to the name of nodes that have no identifier', () => {
        const v1Account = { kind: 'accountNode', name: 'mint' } as unknown as Node;
        expect(getNodePathString([root, program, v1Account])).toBe('[programNode]token.[accountNode]mint');
    });

    test('it renders an empty path as an empty string', () => {
        expect(getNodePathString([])).toBe('');
    });
});

describe('error messages', () => {
    test('it renders the path of the context as node selectors', () => {
        const error = new CodamaError(CODAMA_ERROR__LINKED_NODE_NOT_FOUND, { path: [root, program, account] });
        expect(error.message).toBe('Could not find the node linked from [programNode]token.[accountNode]mint.');
    });

    test('it renders an empty path as none', () => {
        const error = new CodamaError(CODAMA_ERROR__UNEXPECTED_NODE_KIND, { expectedKinds: ['accountNode'], path: [] });
        expect(error.message).toBe('Expected node of kind [accountNode], got none.');
    });

    test('it encodes the path of production errors as node selectors', () => {
        const encoded = encodeContextObject({ expectedKinds: ['accountNode'], path: [root, program, struct] });
        const decoded = decodeEncodedContext(encoded);
        expect(decoded).toEqual({ expectedKinds: '[accountNode]', path: '[programNode]token.[structTypeNode]' });
        expect(getHumanReadableErrorMessage(CODAMA_ERROR__UNEXPECTED_NODE_KIND, decoded)).toBe(
            'Expected node of kind [[accountNode]], got [programNode]token.[structTypeNode].',
        );
    });

    test('it encodes lists of node paths of production errors as lists of node selectors', () => {
        const encoded = encodeContextObject({ cycle: [[root, program, account], [field]], path: [root, program] });
        expect(decodeEncodedContext(encoded)).toEqual({
            cycle: '[[programNode]token.[accountNode]mint, [structFieldTypeNode]decimals]',
            path: '[programNode]token',
        });
    });

    test('it renders lists that are not node paths as is', () => {
        const message = getHumanReadableErrorMessage(CODAMA_ERROR__UNEXPECTED_NODE_KIND, {
            expectedKinds: ['accountNode', 'pdaNode'],
            path: [account],
        });
        expect(message).toBe('Expected node of kind [accountNode,pdaNode], got [accountNode]mint.');
    });
});
