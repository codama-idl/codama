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
            `#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, Eq, PartialEq, Copy, PartialOrd, Hash, FromPrimitive)]\n`,
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
                `#[cfg(feature = "serde", derive(Serialize, Deserialize))]\n`,
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
        expect(render).toBe(`#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, Eq, PartialEq)]\n`);

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
        expect(render).toBe(`#[derive(My, Traits)]\n`);

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
        expect(render).toBe(`#[derive(My, Traits)]\n#[cfg(feature = "serde", derive(Serialize))]\n`);

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

describe('base traits', () => {
    test('it uses both the base and enum traits', () => {
        // Given a scalar enum defined type.
        const node = definedTypeNode({
            name: 'Feedback',
            type: enumTypeNode([enumEmptyVariantTypeNode('Good'), enumEmptyVariantTypeNode('Bad')]),
        });

        // When we get the traits from the node using custom base and enum defaults.
        const { render } = getTraitsFromNode(node, {
            ...RESET_OPTIONS,
            baseDefaults: ['MyBaseTrait'],
            enumDefaults: ['MyEnumTrait'],
        });

        // Then we expect both the base and enum traits to be rendered.
        expect(render).toBe(`#[derive(MyBaseTrait, MyEnumTrait)]\n`);
    });

    test('it uses both the base and struct traits', () => {
        // Given an account node.
        const node = accountNode({
            data: structTypeNode([
                structFieldTypeNode({ name: 'x', type: numberTypeNode('u64') }),
                structFieldTypeNode({ name: 'y', type: numberTypeNode('u64') }),
            ]),
            name: 'Coordinates',
        });

        // When we get the traits from the node using custom base and struct defaults.
        const { render } = getTraitsFromNode(node, {
            ...RESET_OPTIONS,
            baseDefaults: ['MyBaseTrait'],
            structDefaults: ['MyStructTrait'],
        });

        // Then we expect both the base and struct traits to be rendered.
        expect(render).toBe(`#[derive(MyBaseTrait, MyStructTrait)]\n`);
    });

    test('it uses both the base and alias traits', () => {
        // Given a defined type node that is not an enum or struct.
        const node = definedTypeNode({
            name: 'Score',
            type: numberTypeNode('u64'),
        });

        // When we get the traits from the node using custom base and alias defaults.
        const { render } = getTraitsFromNode(node, {
            ...RESET_OPTIONS,
            aliasDefaults: ['MyAliasTrait'],
            baseDefaults: ['MyBaseTrait'],
        });

        // Then we expect both the base and alias traits to be rendered.
        expect(render).toBe(`#[derive(MyBaseTrait, MyAliasTrait)]\n`);
    });

    test('it identifies feature flags under all default traits', () => {
        // Given a scalar enum defined type.
        const node = definedTypeNode({
            name: 'Feedback',
            type: enumTypeNode([enumEmptyVariantTypeNode('Good'), enumEmptyVariantTypeNode('Bad')]),
        });

        // When we get the traits from the node such that:
        // - We provide custom base and enum defaults.
        // - We provide custom feature flags for traits in both categories.
        const { render } = getTraitsFromNode(node, {
            ...RESET_OPTIONS,
            baseDefaults: ['MyBaseTrait', 'MyNonFeatureTrait'],
            enumDefaults: ['MyEnumTrait'],
            featureFlags: {
                base: ['MyBaseTrait'],
                enum: ['MyEnumTrait'],
            },
        });

        // Then we expect both the base and enum traits to be rendered as separate feature flags.
        expect(render).toBe(
            `#[derive(MyNonFeatureTrait)]\n` +
                `#[cfg(feature = "base", derive(MyBaseTrait))]\n` +
                `#[cfg(feature = "enum", derive(MyEnumTrait))]\n`,
        );
    });

    test('it renders traits correctly when they are all under feature flags', () => {
        // Given a scalar enum defined type.
        const node = definedTypeNode({
            name: 'Feedback',
            type: enumTypeNode([enumEmptyVariantTypeNode('Good'), enumEmptyVariantTypeNode('Bad')]),
        });

        // When we get the traits from the node such that
        // all traits are under feature flags.
        const { render } = getTraitsFromNode(node, {
            ...RESET_OPTIONS,
            baseDefaults: ['MyBaseTrait'],
            enumDefaults: ['MyEnumTrait'],
            featureFlags: {
                base: ['MyBaseTrait'],
                enum: ['MyEnumTrait'],
            },
        });

        // Then we expect the following traits to be rendered.
        expect(render).toBe(
            `#[cfg(feature = "base", derive(MyBaseTrait))]\n#[cfg(feature = "enum", derive(MyEnumTrait))]\n`,
        );
    });
});

describe('overridden traits', () => {
    test('it replaces all default traits with the overridden traits', () => {
        // Given a scalar enum defined type.
        const node = definedTypeNode({
            name: 'Feedback',
            type: enumTypeNode([enumEmptyVariantTypeNode('Good'), enumEmptyVariantTypeNode('Bad')]),
        });

        // When we get the traits from the node such that:
        // - We provide custom base and enum defaults.
        // - We override the feedback type with custom traits.
        const { render } = getTraitsFromNode(node, {
            ...RESET_OPTIONS,
            baseDefaults: ['MyBaseTrait'],
            enumDefaults: ['MyEnumTrait'],
            overrides: { feedback: ['MyFeedbackTrait'] },
        });

        // Then we expect only the feedback traits to be rendered.
        expect(render).toBe(`#[derive(MyFeedbackTrait)]\n`);
    });

    test('it finds traits to override when using pascal case', () => {
        // Given a scalar enum defined type.
        const node = definedTypeNode({
            name: 'Feedback',
            type: enumTypeNode([enumEmptyVariantTypeNode('Good'), enumEmptyVariantTypeNode('Bad')]),
        });

        // When we get the traits from the node such that
        // we use PascalCase for the type name.
        const { render } = getTraitsFromNode(node, {
            ...RESET_OPTIONS,
            overrides: { Feedback: ['MyFeedbackTrait'] },
        });

        // Then we still expect the custom feedback traits to be rendered.
        expect(render).toBe(`#[derive(MyFeedbackTrait)]\n`);
    });

    test('it identifies feature flags under all overridden traits', () => {
        // Given a scalar enum defined type.
        const node = definedTypeNode({
            name: 'Feedback',
            type: enumTypeNode([enumEmptyVariantTypeNode('Good'), enumEmptyVariantTypeNode('Bad')]),
        });

        // When we get the traits from the node such that:
        // - We override the feedback type with custom traits.
        // - We provide custom feature flags for these some of these custom traits.
        const { render } = getTraitsFromNode(node, {
            ...RESET_OPTIONS,
            featureFlags: { custom: ['MyFeedbackTrait'] },
            overrides: { feedback: ['MyFeedbackTrait', 'MyNonFeatureTrait'] },
        });

        // Then we expect some of the overridden traits to be rendered under feature flags.
        expect(render).toBe(`#[derive(MyNonFeatureTrait)]\n#[cfg(feature = "custom", derive(MyFeedbackTrait))]\n`);
    });
});

describe('fully qualified name traits', () => {
    test('it can use fully qualified names for traits instead of importing them', () => {
        // Given a scalar enum defined type.
        const node = definedTypeNode({
            name: 'Feedback',
            type: enumTypeNode([enumEmptyVariantTypeNode('Good'), enumEmptyVariantTypeNode('Bad')]),
        });

        // When we get the traits from the node such that we use fully qualified names.
        const { render, imports } = getTraitsFromNode(node, {
            ...RESET_OPTIONS,
            baseDefaults: ['fruits::Apple', 'fruits::Banana', 'vegetables::Carrot'],
            useFullyQualifiedName: true,
        });

        // Then we expect the fully qualified names to be used for the traits.
        expect(render).toBe(`#[derive(fruits::Apple, fruits::Banana, vegetables::Carrot)]\n`);

        // And no imports should be used.
        expect([...imports.imports]).toStrictEqual([]);
    });
});
