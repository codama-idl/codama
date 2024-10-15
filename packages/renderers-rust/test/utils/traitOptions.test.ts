import { definedTypeNode, enumEmptyVariantTypeNode, enumTypeNode } from '@codama/nodes';
import { describe, expect, test } from 'vitest';

import { getTraitsFromNode, TraitOptions } from '../../src/utils';

describe('default values', () => {
    test('it defaults to a set of traits for enums', () => {
        // Given a scalar enum defined type.
        const node = definedTypeNode({
            name: 'Feedback',
            type: enumTypeNode([enumEmptyVariantTypeNode('Good'), enumEmptyVariantTypeNode('Bad')]),
        });

        // When we get the traits from the node using the default options.
        const { render, imports } = getTraitsFromNode(node);

        // Then we expect the following traits to be rendered.
        expect(render).toBe(
            `#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, Eq, PartialEq, Copy, PartialOrd, Hash, FromPrimitive)]`,
        );

        // And the following imports to be used.
        expect([...imports.imports]).toStrictEqual([
            'borsh::BorshSerialize',
            'borsh::BorshDeserialize',
            'num_derive::FromPrimitive',
        ]);
    });

    test.todo('it defaults to a set of traits for structs');
    test.todo('it defaults to a set of traits for aliases');
    test.todo('it defaults to not using fully qualified names');
    test.todo('it defaults to a set of feature flags for traits');
});

const RESET_OPTIONS: Required<TraitOptions> = {
    aliasDefaults: [],
    baseDefaults: [],
    enumDefaults: [],
    featureFlags: {},
    overrides: {},
    structDefaults: [],
    useFullyQualifiedName: false,
};
console.log({ RESET_OPTIONS });
