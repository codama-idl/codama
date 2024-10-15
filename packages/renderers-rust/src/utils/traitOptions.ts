import { AccountNode, assertIsNode, camelCase, DefinedTypeNode, isNode } from '@codama/nodes';

import { ImportMap } from '../ImportMap';

export type TraitOptions = {
    /** The default traits to implement for type aliases only — on top of the base defaults. */
    aliasDefaults?: string[];
    /** The default traits to implement for all types. */
    baseDefaults?: string[];
    /** The default traits to implement for enums only — on top of the base defaults. */
    enumDefaults?: string[];
    /**
     * The mapping of feature flags to traits.
     * For each entry, the traits will be rendered within a
     * `#[cfg(feature = "feature_name", derive(Traits))]` attribute.
     */
    featureFlags?: Record<string, string[]>;
    /** The complete trait overrides of specific types. */
    overrides?: Record<string, string[]>;
    /** The default traits to implement for structs only — on top of the base defaults. */
    structDefaults?: string[];
    /** Whether or not to use the fully qualified name for traits, instead of importing them. */
    useFullyQualifiedName?: boolean;
};

export const DEFAULT_TRAIT_OPTIONS: Required<TraitOptions> = {
    aliasDefaults: [],
    baseDefaults: ['borsh::BorshSerialize', 'borsh::BorshDeserialize', 'Clone', 'Debug', 'Eq', 'PartialEq'],
    enumDefaults: ['Copy', 'PartialOrd', 'Hash', 'num_derive::FromPrimitive'],
    featureFlags: { serde: ['serde::Serialize', 'serde::Deserialize'] },
    overrides: {},
    structDefaults: ['serde::Serialize', 'serde::Deserialize'],
    useFullyQualifiedName: false,
};

export type GetTraitsFromNodeFunction = (node: AccountNode | DefinedTypeNode) => { imports: ImportMap; render: string };

export function getTraitsFromNodeFactory(options: TraitOptions = {}): GetTraitsFromNodeFunction {
    return node => getTraitsFromNode(node, options);
}

export function getTraitsFromNode(
    node: AccountNode | DefinedTypeNode,
    userOptions: TraitOptions = {},
): { imports: ImportMap; render: string } {
    assertIsNode(node, ['accountNode', 'definedTypeNode']);
    const options: Required<TraitOptions> = { ...DEFAULT_TRAIT_OPTIONS, ...userOptions };

    // Find all the FQN traits for the node.
    const nodeType = getNodeType(node);
    const sanitizedOverrides = Object.fromEntries(
        Object.entries(options.overrides).map(([key, value]) => [camelCase(key), value]),
    );
    const nodeOverrides: string[] | undefined = sanitizedOverrides[node.name];
    const allTraits = nodeOverrides === undefined ? getDefaultTraits(nodeType, options) : nodeOverrides;

    // Wrap the traits in feature flags if necessary.
    let [unfeaturedTraits, featuredTraits] = partitionTraitsInFeatures(allTraits, options.featureFlags);

    // Import the traits if necessary.
    const imports = new ImportMap();
    if (!options.useFullyQualifiedName) {
        unfeaturedTraits = extractFullyQualifiedNames(unfeaturedTraits, imports);
        featuredTraits = Object.fromEntries(
            Object.entries(featuredTraits).map(([feature, traits]) => {
                return [feature, extractFullyQualifiedNames(traits, imports)];
            }),
        );
    }

    // Render the trait lines.
    const traitLines: string[] = [
        ...(unfeaturedTraits.length > 0 ? [`#[derive(${unfeaturedTraits.join(', ')})]\n`] : []),
        ...Object.entries(featuredTraits).map(([feature, traits]) => {
            return `#[cfg(feature = "${feature}", derive(${traits.join(', ')}))]\n`;
        }),
    ];

    return { imports, render: traitLines.join('') };
}

function getNodeType(node: AccountNode | DefinedTypeNode): 'alias' | 'enum' | 'struct' {
    if (isNode(node, 'accountNode')) return 'struct';
    if (isNode(node.type, 'structTypeNode')) return 'struct';
    if (isNode(node.type, 'enumTypeNode')) return 'enum';
    return 'alias';
}

function getDefaultTraits(
    nodeType: 'alias' | 'enum' | 'struct',
    options: Pick<Required<TraitOptions>, 'aliasDefaults' | 'baseDefaults' | 'enumDefaults' | 'structDefaults'>,
): string[] {
    switch (nodeType) {
        case 'alias':
            return [...options.baseDefaults, ...options.aliasDefaults];
        case 'enum':
            return [...options.baseDefaults, ...options.enumDefaults];
        case 'struct':
        default:
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
