import { instructionAccountNode, instructionNode, resolverValueNode } from 'codama';
import { describe, expect, expectTypeOf, test } from 'vitest';

import {
    generateResolutionInputTypes,
    RESOLVER_FN_DECLARATION,
} from '../../src/codegen/generate-resolution-input-types';
import type { ResolverFn } from '../../src/shared/types';
import { makeRoot } from '../test-utils';

describe('emitted ResolverFn declaration', () => {
    test('should be emitted verbatim when at least one instruction has resolvers', () => {
        const root = makeRoot([
            instructionNode({
                accounts: [
                    instructionAccountNode({
                        defaultValue: resolverValueNode('resolveOwner'),
                        isSigner: false,
                        isWritable: false,
                        name: 'owner',
                    }),
                ],
                arguments: [],
                name: 'doStuff',
            }),
        ]);
        const output = generateResolutionInputTypes(root);
        expect(output).toContain(RESOLVER_FN_DECLARATION);
    });

    test('should match the structural shape of the runtime ResolverFn', () => {
        type EmittedResolverFn<TArgs, TAccs> = (argumentsInput: TArgs, accountsInput: TAccs) => Promise<unknown>;
        expectTypeOf<ResolverFn<{ x: number }, { a: string }>>().toEqualTypeOf<
            EmittedResolverFn<{ x: number }, { a: string }>
        >();
    });

    test('should not be emitted when no instruction has resolvers', () => {
        const root = makeRoot([
            instructionNode({
                accounts: [instructionAccountNode({ isSigner: false, isWritable: false, name: 'authority' })],
                arguments: [],
                name: 'plain',
            }),
        ]);
        const output = generateResolutionInputTypes(root);
        expect(output).not.toContain('type ResolverFn');
    });
});
