import {
    accountNode,
    definedTypeNode,
    enumEmptyVariantTypeNode,
    enumStructVariantTypeNode,
    enumTypeNode,
    numberTypeNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';
import { describe, expect, test } from 'vitest';

import { getTraitsFromNode, TraitOptions } from '../../src/utils';

describe('default values', () => {
    test('it defaults to a set of traits for data enums', () => {
        // Given a data enum defined type.
        const node = definedTypeNode({
            name: 'Command',
            type: enumTypeNode([
                enumStructVariantTypeNode(
                    'Play',
                    structTypeNode([structFieldTypeNode({ name: 'guess', type: numberTypeNode('u16') })]),
                ),
                enumEmptyVariantTypeNode('Quit'),
            ]),
        });

        // When we get the traits from the node using the default options.
        const { content, imports } = getTraitsFromNode(node);

        // Then we expect the following traits to be rendered.
        expect(content).toBe(
            `#[derive(Clone, Debug, Eq, PartialEq)]\n` +
                `#[cfg_attr(feature = "borsh", derive(borsh::BorshSerialize, borsh::BorshDeserialize))]\n` +
                `#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]\n`,
        );

        // And no additional imports.
        expect(imports.isEmpty());
    });

    test('it defaults to a set of traits for scalar enums', () => {
        // Given a scalar enum defined type.
        const node = definedTypeNode({
            name: 'Feedback',
            type: enumTypeNode([enumEmptyVariantTypeNode('Good'), enumEmptyVariantTypeNode('Bad')]),
        });

        // When we get the traits from the node using the default options.
        const { content, imports } = getTraitsFromNode(node);

        // Then we expect the following traits to be rendered.
        expect(content).toBe(
            `#[derive(Clone, Debug, Eq, PartialEq, Copy, PartialOrd, Hash, FromPrimitive)]\n` +
                `#[cfg_attr(feature = "borsh", derive(borsh::BorshSerialize, borsh::BorshDeserialize))]\n` +
                `#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]\n`,
        );

        // And the following imports to be used.
        expect([...imports.imports]).toStrictEqual(['num_derive::FromPrimitive']);
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
        const { content, imports } = getTraitsFromNode(node);

        // Then we expect the following traits to be rendered.
        expect(content).toBe(
            `#[derive(Clone, Debug, Eq, PartialEq)]\n` +
                `#[cfg_attr(feature = "borsh", derive(borsh::BorshSerialize, borsh::BorshDeserialize))]\n` +
                `#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]\n`,
        );

        // And no additional imports.
        expect(imports.isEmpty());
    });

    test('it does not use default traits if they are overridden', () => {
        // Given a defined type node that should use custom traits.
        const node = accountNode({
            data: structTypeNode([
                structFieldTypeNode({ name: 'x', type: numberTypeNode('u64') }),
                structFieldTypeNode({ name: 'y', type: numberTypeNode('u64') }),
            ]),
            name: 'Coordinates',
        });

        // When we get the traits from the node using the
        // default options with the overrides attribute.
        const { content, imports } = getTraitsFromNode(node, {
            overrides: { coordinates: ['My', 'special::Traits'] },
        });

        // Then we expect the following traits to be rendered.
        expect(content).toBe(`#[derive(My, Traits)]\n`);

        // And the following imports to be used.
        expect([...imports.imports]).toStrictEqual(['special::Traits']);
    });

    test('it still uses feature flags for overridden traits', () => {
        // Given a defined type node that should use custom traits.
        const node = accountNode({
            data: structTypeNode([
                structFieldTypeNode({ name: 'x', type: numberTypeNode('u64') }),
                structFieldTypeNode({ name: 'y', type: numberTypeNode('u64') }),
            ]),
            name: 'Coordinates',
        });

        // When we get the traits from the node using custom traits
        // such that some are part of the feature flag defaults.
        const { content } = getTraitsFromNode(node, {
            overrides: { coordinates: ['My', 'special::Traits', 'serde::Serialize'] },
        });

        // Then we expect the following traits to be rendered.
        expect(content).toBe(`#[derive(My, Traits)]\n#[cfg_attr(feature = "serde", derive(serde::Serialize))]\n`);
    });
});

const RESET_OPTIONS: Required<TraitOptions> = {
    baseDefaults: [],
    dataEnumDefaults: [],
    featureFlags: {},
    overrides: {},
    scalarEnumDefaults: [],
    structDefaults: [],
    useFullyQualifiedName: false,
};

describe('base traits', () => {
    test('it uses both the base and data enum traits', () => {
        // Given a data enum defined type.
        const node = definedTypeNode({
            name: 'Command',
            type: enumTypeNode([
                enumStructVariantTypeNode(
                    'Play',
                    structTypeNode([structFieldTypeNode({ name: 'guess', type: numberTypeNode('u16') })]),
                ),
                enumEmptyVariantTypeNode('Quit'),
            ]),
        });

        // When we get the traits from the node using custom base and data enum defaults.
        const { content } = getTraitsFromNode(node, {
            ...RESET_OPTIONS,
            baseDefaults: ['MyBaseTrait'],
            dataEnumDefaults: ['MyDataEnumTrait'],
        });

        // Then we expect both the base and data enum traits to be rendered.
        expect(content).toBe(`#[derive(MyBaseTrait, MyDataEnumTrait)]\n`);
    });

    test('it uses both the base and scalar enum traits', () => {
        // Given a scalar enum defined type.
        const node = definedTypeNode({
            name: 'Feedback',
            type: enumTypeNode([enumEmptyVariantTypeNode('Good'), enumEmptyVariantTypeNode('Bad')]),
        });

        // When we get the traits from the node using custom base and scalar enum defaults.
        const { content } = getTraitsFromNode(node, {
            ...RESET_OPTIONS,
            baseDefaults: ['MyBaseTrait'],
            scalarEnumDefaults: ['MyScalarEnumTrait'],
        });

        // Then we expect both the base and scalar enum traits to be rendered.
        expect(content).toBe(`#[derive(MyBaseTrait, MyScalarEnumTrait)]\n`);
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
        const { content } = getTraitsFromNode(node, {
            ...RESET_OPTIONS,
            baseDefaults: ['MyBaseTrait'],
            structDefaults: ['MyStructTrait'],
        });

        // Then we expect both the base and struct traits to be rendered.
        expect(content).toBe(`#[derive(MyBaseTrait, MyStructTrait)]\n`);
    });

    test('it never uses traits for type aliases', () => {
        // Given a defined type node that is not an enum or struct.
        const node = definedTypeNode({
            name: 'Score',
            type: numberTypeNode('u64'),
        });

        // When we get the traits from the node such that we have base defaults.
        const { content } = getTraitsFromNode(node, {
            ...RESET_OPTIONS,
            baseDefaults: ['MyBaseTrait'],
        });

        // Then we expect no traits to be rendered.
        expect(content).toBe('');
    });

    test('it identifies feature flags under all default traits', () => {
        // Given a scalar enum defined type.
        const node = definedTypeNode({
            name: 'Feedback',
            type: enumTypeNode([enumEmptyVariantTypeNode('Good'), enumEmptyVariantTypeNode('Bad')]),
        });

        // When we get the traits from the node such that:
        // - We provide custom base and scalar enum defaults.
        // - We provide custom feature flags for traits in both categories.
        const { content } = getTraitsFromNode(node, {
            ...RESET_OPTIONS,
            baseDefaults: ['MyBaseTrait', 'MyNonFeatureTrait'],
            featureFlags: {
                base: ['MyBaseTrait'],
                enum: ['MyScalarEnumTrait'],
            },
            scalarEnumDefaults: ['MyScalarEnumTrait'],
        });

        // Then we expect both the base and enum traits to be rendered as separate feature flags.
        expect(content).toBe(
            `#[derive(MyNonFeatureTrait)]\n` +
                `#[cfg_attr(feature = "base", derive(MyBaseTrait))]\n` +
                `#[cfg_attr(feature = "enum", derive(MyScalarEnumTrait))]\n`,
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
        const { content } = getTraitsFromNode(node, {
            ...RESET_OPTIONS,
            baseDefaults: ['MyBaseTrait'],
            featureFlags: {
                base: ['MyBaseTrait'],
                enum: ['MyScalarEnumTrait'],
            },
            scalarEnumDefaults: ['MyScalarEnumTrait'],
        });

        // Then we expect the following traits to be rendered.
        expect(content).toBe(
            `#[cfg_attr(feature = "base", derive(MyBaseTrait))]\n#[cfg_attr(feature = "enum", derive(MyScalarEnumTrait))]\n`,
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
        const { content } = getTraitsFromNode(node, {
            ...RESET_OPTIONS,
            baseDefaults: ['MyBaseTrait'],
            overrides: { feedback: ['MyFeedbackTrait'] },
            scalarEnumDefaults: ['MyScalarEnumTrait'],
        });

        // Then we expect only the feedback traits to be rendered.
        expect(content).toBe(`#[derive(MyFeedbackTrait)]\n`);
    });

    test('it finds traits to override when using pascal case', () => {
        // Given a scalar enum defined type.
        const node = definedTypeNode({
            name: 'Feedback',
            type: enumTypeNode([enumEmptyVariantTypeNode('Good'), enumEmptyVariantTypeNode('Bad')]),
        });

        // When we get the traits from the node such that
        // we use PascalCase for the type name.
        const { content } = getTraitsFromNode(node, {
            ...RESET_OPTIONS,
            overrides: { Feedback: ['MyFeedbackTrait'] },
        });

        // Then we still expect the custom feedback traits to be rendered.
        expect(content).toBe(`#[derive(MyFeedbackTrait)]\n`);
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
        const { content } = getTraitsFromNode(node, {
            ...RESET_OPTIONS,
            featureFlags: { custom: ['MyFeedbackTrait'] },
            overrides: { feedback: ['MyFeedbackTrait', 'MyNonFeatureTrait'] },
        });

        // Then we expect some of the overridden traits to be rendered under feature flags.
        expect(content).toBe(
            `#[derive(MyNonFeatureTrait)]\n#[cfg_attr(feature = "custom", derive(MyFeedbackTrait))]\n`,
        );
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
        const { content, imports } = getTraitsFromNode(node, {
            ...RESET_OPTIONS,
            baseDefaults: ['fruits::Apple', 'fruits::Banana', 'vegetables::Carrot'],
            useFullyQualifiedName: true,
        });

        // Then we expect the fully qualified names to be used for the traits.
        expect(content).toBe(`#[derive(fruits::Apple, fruits::Banana, vegetables::Carrot)]\n`);

        // And no imports should be used.
        expect([...imports.imports]).toStrictEqual([]);
    });
});
