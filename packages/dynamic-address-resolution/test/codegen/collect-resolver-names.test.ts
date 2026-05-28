import {
    conditionalValueNode,
    instructionAccountNode,
    instructionArgumentNode,
    instructionNode,
    numberTypeNode,
    resolverValueNode,
} from 'codama';
import { describe, expect, test } from 'vitest';

import { collectResolverNames } from '../../src/codegen/collect-resolver-names';

describe('collectResolverNames', () => {
    test('should dedupe resolver names across accounts and arguments', () => {
        const ix = instructionNode({
            accounts: [
                instructionAccountNode({
                    defaultValue: resolverValueNode('shared'),
                    isSigner: false,
                    isWritable: false,
                    name: 'a',
                }),
            ],
            arguments: [
                instructionArgumentNode({
                    defaultValue: resolverValueNode('shared'),
                    name: 'arg',
                    type: numberTypeNode('u8'),
                }),
            ],
            name: 'doThing',
        });

        const names = collectResolverNames(ix);
        expect(names).toEqual(new Set(['shared']));
    });

    test('should recurse into conditionalValueNode branches', () => {
        const ix = instructionNode({
            accounts: [
                instructionAccountNode({
                    defaultValue: conditionalValueNode({
                        condition: resolverValueNode('condition'),
                        ifFalse: resolverValueNode('no'),
                        ifTrue: resolverValueNode('yes'),
                    }),
                    isSigner: false,
                    isWritable: false,
                    name: 'a',
                }),
            ],
            name: 'branch',
        });

        const names = collectResolverNames(ix);
        expect(names).toEqual(new Set(['condition', 'yes', 'no']));
    });
});
