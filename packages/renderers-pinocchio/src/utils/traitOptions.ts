import { AccountNode, assertIsNode, camelCase, DefinedTypeNode, isNode, isScalarEnum } from '@codama/nodes';

import { Fragment, fragment, mergeFragmentImports } from './fragment';
import { ImportMap } from './importMap';

export type TraitOptions = {
    /** The default traits to implement for all types. */
    baseDefaults?: string[];
    /**
     * The default traits to implement for data enums only — on top of the base defaults.
     * Data enums are enums with at least one non-unit variant.
     */
    dataEnumDefaults?: string[];
    /**
     * The mapping of feature flags to traits.
     * For each entry, the traits will be rendered within a
     * `#[cfg_attr(feature = "feature_name", derive(Traits))]` attribute.
     */
    featureFlags?: Record<string, string[]>;
    /** The complete trait overrides of specific types. */
    overrides?: Record<string, string[]>;
    /**
     * The default traits to implement for scalar enums only — on top of the base defaults.
     * Scalar enums are enums with no variants or only unit variants.
     */
    scalarEnumDefaults?: string[];
    /** The default traits to implement for structs only — on top of the base defaults. */
    structDefaults?: string[];
    /** Whether or not to use the fully qualified name for traits, instead of importing them. */
    useFullyQualifiedName?: boolean;
};

export const DEFAULT_TRAIT_OPTIONS: Required<TraitOptions> = {
    baseDefaults: [
        'borsh::BorshSerialize',
        'borsh::BorshDeserialize',
        'serde::Serialize',
        'serde::Deserialize',
        'Clone',
        'Debug',
        'Eq',
        'PartialEq',
    ],
    dataEnumDefaults: [],
    featureFlags: {
        borsh: ['borsh::BorshSerialize', 'borsh::BorshDeserialize'],
        serde: ['serde::Serialize', 'serde::Deserialize'],
    },
    overrides: {},
    scalarEnumDefaults: ['Copy', 'PartialOrd', 'Hash', 'num_derive::FromPrimitive'],
    structDefaults: [],
    useFullyQualifiedName: false,
};

export type GetTraitsFromNodeFunction = (node: AccountNode | DefinedTypeNode) => Fragment;

export function getTraitsFromNodeFactory(options: TraitOptions = {}): GetTraitsFromNodeFunction {
    return node => getTraitsFromNode(node, options);
}

export function getTraitsFromNode(node: AccountNode | DefinedTypeNode, userOptions: TraitOptions = {}): Fragment {
    assertIsNode(node, ['accountNode', 'definedTypeNode']);
    const options: Required<TraitOptions> = { ...DEFAULT_TRAIT_OPTIONS, ...userOptions };

    // Get the node type and return early if it's a type alias.
    const nodeType = getNodeType(node);
    if (nodeType === 'alias') return fragment``;

    // Find all the FQN traits for the node.
    const sanitizedOverrides = Object.fromEntries(
        Object.entries(options.overrides).map(([key, value]) => [camelCase(key), value]),
    );
    const nodeOverrides: string[] | undefined = sanitizedOverrides[node.name];
    const allTraits = nodeOverrides === undefined ? getDefaultTraits(nodeType, options) : nodeOverrides;

    // Wrap the traits in feature flags if necessary.
    const partitionedTraits = partitionTraitsInFeatures(allTraits, options.featureFlags);
    let unfeaturedTraits = partitionedTraits[0];
    const featuredTraits = partitionedTraits[1];

    // Import the traits if necessary.
    const imports = new ImportMap();
    if (!options.useFullyQualifiedName) {
        unfeaturedTraits = extractFullyQualifiedNames(unfeaturedTraits, imports);
    }

    // Render the trait lines.
    const traitLines: string[] = [
        ...(unfeaturedTraits.length > 0 ? [`#[derive(${unfeaturedTraits.join(', ')})]\n`] : []),
        ...Object.entries(featuredTraits).map(([feature, traits]) => {
            return `#[cfg_attr(feature = "${feature}", derive(${traits.join(', ')}))]\n`;
        }),
    ];

    return mergeFragmentImports(fragment`${traitLines.join('')}`, [imports]);
}

function getNodeType(node: AccountNode | DefinedTypeNode): 'alias' | 'dataEnum' | 'scalarEnum' | 'struct' {
    if (isNode(node, 'accountNode')) return 'struct';
    if (isNode(node.type, 'structTypeNode')) return 'struct';
    if (isNode(node.type, 'enumTypeNode')) {
        return isScalarEnum(node.type) ? 'scalarEnum' : 'dataEnum';
    }
    return 'alias';
}

function getDefaultTraits(
    nodeType: 'dataEnum' | 'scalarEnum' | 'struct',
    options: Pick<
        Required<TraitOptions>,
        'baseDefaults' | 'dataEnumDefaults' | 'scalarEnumDefaults' | 'structDefaults'
    >,
): string[] {
    switch (nodeType) {
        case 'dataEnum':
            return [...options.baseDefaults, ...options.dataEnumDefaults];
        case 'scalarEnum':
            return [...options.baseDefaults, ...options.scalarEnumDefaults];
        case 'struct':
            return [...options.baseDefaults, ...options.structDefaults];
    }
}

function partitionTraitsInFeatures(
    traits: string[],
    featureFlags: Record<string, string[]>,
): [string[], Record<string, string[]>] {
    // Reverse the feature flags option for quick lookup.
    // If there are any duplicate traits, the first one encountered will be used.
    const reverseFeatureFlags = Object.entries(featureFlags).reduce(
        (acc, [feature, traits]) => {
            for (const trait of traits) {
                if (!acc[trait]) acc[trait] = feature;
            }
            return acc;
        },
        {} as Record<string, string>,
    );

    const unfeaturedTraits: string[] = [];
    const featuredTraits: Record<string, string[]> = {};
    for (const trait of traits) {
        const feature: string | undefined = reverseFeatureFlags[trait];
        if (feature === undefined) {
            unfeaturedTraits.push(trait);
        } else {
            if (!featuredTraits[feature]) featuredTraits[feature] = [];
            featuredTraits[feature].push(trait);
        }
    }

    return [unfeaturedTraits, featuredTraits];
}

function extractFullyQualifiedNames(traits: string[], imports: ImportMap): string[] {
    return traits.map(trait => {
        const index = trait.lastIndexOf('::');
        if (index === -1) return trait;
        imports.add(trait);
        return trait.slice(index + 2);
    });
}
