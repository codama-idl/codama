import {
    accountNode,
    definedTypeNode,
    enumEmptyVariantTypeNode,
    enumTypeNode,
    numberTypeNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';
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

    test('it defaults to a set of traits for structs', () => {
        // Given an account node.
        const node = accountNode({
            data: structTypeNode([
                structFieldTypeNode({ name: 'x', type: numberTypeNode('u64') }),
                structFieldTypeNode({ name: 'y', type: numberTypeNode('u64') }),
            ]),
            name: 'Coordinates',
        });

        // When we get the traits from the node using the default options.
        const { render, imports } = getTraitsFromNode(node);

        // Then we expect the following traits to be rendered.
        expect(render).toBe(
            `#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, Eq, PartialEq)]\n` +
                `#[cfg(feature = "serde", derive(Serialize, Deserialize))]`,
        );

        // And the following imports to be used.
        expect([...imports.imports]).toStrictEqual([
            'borsh::BorshSerialize',
            'borsh::BorshDeserialize',
            'serde::Serialize',
            'serde::Deserialize',
        ]);
    });

    test('it defaults to a set of traits for aliases', () => {
        // Given a defined type node that is not an enum or struct.
        const node = definedTypeNode({
            name: 'Score',
            type: numberTypeNode('u64'),
        });

        // When we get the traits from the node using the default options.
        const { render, imports } = getTraitsFromNode(node);

        // Then we expect the following traits to be rendered.
        expect(render).toBe(`#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, Eq, PartialEq)]`);

        // And the following imports to be used.
        expect([...imports.imports]).toStrictEqual(['borsh::BorshSerialize', 'borsh::BorshDeserialize']);
    });

    test('it does not use default traits if they are overridden', () => {
        // Given a defined type node that should use custom traits.
        const node = definedTypeNode({
            name: 'Score',
            type: numberTypeNode('u64'),
        });

        // When we get the traits from the node using the
        // default options with the overrides attribute.
        const { render, imports } = getTraitsFromNode(node, {
            overrides: { score: ['My', 'special::Traits'] },
        });

        // Then we expect the following traits to be rendered.
        expect(render).toBe(`#[derive(My, Traits)]`);

        // And the following imports to be used.
        expect([...imports.imports]).toStrictEqual(['special::Traits']);
    });

    test('it still uses feature flags for overridden traits', () => {
        // Given a defined type node that should use custom traits.
        const node = definedTypeNode({
            name: 'Score',
            type: numberTypeNode('u64'),
        });

        // When we get the traits from the node using custom traits
        // such that some are part of the feature flag defaults.
        const { render, imports } = getTraitsFromNode(node, {
            overrides: { score: ['My', 'special::Traits', 'serde::Serialize'] },
        });

        // Then we expect the following traits to be rendered.
        expect(render).toBe(`#[derive(My, Traits)]\n#[cfg(feature = "serde", derive(Serialize))]`);

        // And the following imports to be used.
        expect([...imports.imports]).toStrictEqual(['special::Traits', 'serde::Serialize']);
    });
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
