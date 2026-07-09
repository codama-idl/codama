/**
 * Per-node configuration overrides for the `@codama/nodes` generator.
 *
 * The generator drives most of its output from the spec; this table
 * carries only the information the spec can't express: which spec
 * attributes are positional parameters (the rest go in a trailing
 * `options` bag), and per-attribute overrides for defaults,
 * string-coercions, and bespoke body expressions.
 *
 * A node with no entry uses the default rules: a single
 * `input: XxxNodeInput` object param, `camelCase` on the `name`
 * attribute, drop-if-empty for `docs`, conditional spread for every
 * other optional attribute, and pass-through (with shorthand) for
 * required ones.
 */

import { type Fragment, fragment, use } from '@codama/fragments/javascript';
import type { Spec } from '@codama/spec';

import { TS_RESERVED_PARAM_NAMES } from './reservedParamNames';

/**
 * Per-attribute render override.
 *
 *   - `coerce` widens the parameter type to `<spec-type> | string`
 *     and emits the fragment verbatim as the body line's value
 *     (e.g. `typeof program === 'string' ? programLinkNode(program) : program`).
 *
 *   - `default` populates the attribute when the caller passes
 *     `undefined`, emitting `attr: <reader> ?? <expr>,`. When the
 *     attribute surfaces as a type parameter, `genericDefault`
 *     overrides the type parameter's default expression. `hidden:
 *     true` removes the attribute from the signature entirely and
 *     emits the default directly in the body (used for
 *     `rootNode.standard` and `rootNode.version`).
 *
 *   - `value` is a bespoke body expression for attributes whose
 *     value depends on a sibling (currently only
 *     `instructionByteDeltaNode.withHeader`).
 *
 * `paramName` overrides the JS identifier when the spec attribute
 * name collides with a TS reserved word (`enum` → `enumLink`).
 *
 * Override fragments declare their own imports via `use(...)`; the
 * fragment pipeline composes them automatically.
 */
export type AttributeOverride =
    | {
          readonly default: Fragment;
          readonly genericDefault?: Fragment;
          readonly hidden?: boolean;
          readonly paramName?: string;
      }
    | { readonly coerce: Fragment; readonly paramName?: string }
    | { readonly paramName: string }
    | { readonly value: Fragment };

export interface NodeConstructorConfig {
    readonly attributes?: Readonly<Record<string, AttributeOverride>>;
    /**
     * Spec attributes surfaced as bare positional parameters, in this
     * exact order. Remaining attributes land in a trailing `options`
     * bag. When omitted, the constructor takes a single `input` object.
     */
    readonly positionalArgs?: readonly string[];
}

export const NODE_CONFIGS: ReadonlyMap<string, NodeConstructorConfig> = new Map<string, NodeConstructorConfig>([
    [
        'accountNode',
        {
            attributes: {
                data: {
                    default: fragment`${use('structTypeNode', 'constructor:structTypeNode')}([])`,
                    genericDefault: fragment`${use('type StructTypeNode', '@codama/node-types')}<[]>`,
                },
            },
        },
    ],
    ['constantNode', { positionalArgs: ['name', 'type', 'value', 'docs'] }],
    ['instructionAccountNode', { attributes: { isOptional: { default: fragment`false` } } }],
    [
        'instructionByteDeltaNode',
        {
            attributes: {
                withHeader: {
                    value: fragment`options.withHeader ?? !${use('isNode', 'shared:isNode')}(value, 'resolverValueNode')`,
                },
            },
            positionalArgs: ['value'],
        },
    ],
    [
        'instructionNode',
        {
            attributes: {
                accounts: { default: fragment`[]` },
                arguments: { default: fragment`[]` },
                optionalAccountStrategy: { default: fragment`'programId'` },
            },
        },
    ],
    ['instructionRemainingAccountsNode', { positionalArgs: ['value'] }],
    ['instructionStatusNode', { positionalArgs: ['lifecycle', 'message'] }],
    [
        'programNode',
        {
            attributes: {
                accounts: { default: fragment`[]` },
                constants: { default: fragment`[]` },
                definedTypes: { default: fragment`[]` },
                errors: { default: fragment`[]` },
                events: { default: fragment`[]` },
                instructions: { default: fragment`[]` },
                pdas: { default: fragment`[]` },
                version: { default: fragment`'0.0.0'` },
            },
        },
    ],
    [
        'rootNode',
        {
            attributes: {
                additionalPrograms: { default: fragment`[]` },
                standard: { default: fragment`'codama'`, hidden: true },
                version: { default: use('CODAMA_VERSION', 'generated:CodamaVersion'), hidden: true },
            },
            positionalArgs: ['program', 'additionalPrograms'],
        },
    ],

    ['amountTypeNode', { positionalArgs: ['number', 'decimals', 'unit'] }],
    ['arrayTypeNode', { positionalArgs: ['item', 'count'] }],
    [
        'booleanTypeNode',
        {
            attributes: {
                size: {
                    default: fragment`${use('numberTypeNode', 'constructor:numberTypeNode')}('u8')`,
                    genericDefault: fragment`${use('type NumberTypeNode', '@codama/node-types')}<'u8'>`,
                },
            },
            positionalArgs: ['size'],
        },
    ],
    ['bytesTypeNode', { positionalArgs: [] }],
    ['dateTimeTypeNode', { positionalArgs: ['number'] }],
    ['enumEmptyVariantTypeNode', { positionalArgs: ['name', 'discriminator'] }],
    ['enumStructVariantTypeNode', { positionalArgs: ['name', 'struct', 'discriminator'] }],
    ['enumTupleVariantTypeNode', { positionalArgs: ['name', 'tuple', 'discriminator'] }],
    [
        'enumTypeNode',
        {
            attributes: {
                size: {
                    default: fragment`${use('numberTypeNode', 'constructor:numberTypeNode')}('u8')`,
                    genericDefault: fragment`${use('type NumberTypeNode', '@codama/node-types')}<'u8'>`,
                },
            },
            positionalArgs: ['variants'],
        },
    ],
    ['fixedSizeTypeNode', { positionalArgs: ['type', 'size'] }],
    ['hiddenPrefixTypeNode', { positionalArgs: ['type', 'prefix'] }],
    ['hiddenSuffixTypeNode', { positionalArgs: ['type', 'suffix'] }],
    ['mapTypeNode', { positionalArgs: ['key', 'value', 'count'] }],
    [
        'numberTypeNode',
        {
            attributes: { endian: { default: fragment`'le'` } },
            positionalArgs: ['format', 'endian'],
        },
    ],
    [
        'optionTypeNode',
        {
            attributes: {
                fixed: { default: fragment`false` },
                prefix: {
                    default: fragment`${use('numberTypeNode', 'constructor:numberTypeNode')}('u8')`,
                    genericDefault: fragment`${use('type NumberTypeNode', '@codama/node-types')}<'u8'>`,
                },
            },
            positionalArgs: ['item'],
        },
    ],
    [
        'postOffsetTypeNode',
        {
            attributes: { strategy: { default: fragment`'relative'` } },
            positionalArgs: ['type', 'offset', 'strategy'],
        },
    ],
    [
        'preOffsetTypeNode',
        {
            attributes: { strategy: { default: fragment`'relative'` } },
            positionalArgs: ['type', 'offset', 'strategy'],
        },
    ],
    ['publicKeyTypeNode', { positionalArgs: [] }],
    ['remainderOptionTypeNode', { positionalArgs: ['item'] }],
    ['sentinelTypeNode', { positionalArgs: ['type', 'sentinel'] }],
    ['setTypeNode', { positionalArgs: ['item', 'count'] }],
    ['sizePrefixTypeNode', { positionalArgs: ['type', 'prefix'] }],
    ['solAmountTypeNode', { positionalArgs: ['number'] }],
    ['stringTypeNode', { positionalArgs: ['encoding'] }],
    ['structTypeNode', { positionalArgs: ['fields'] }],
    ['tupleTypeNode', { positionalArgs: ['items'] }],
    ['zeroableOptionTypeNode', { positionalArgs: ['item', 'zeroValue'] }],

    ['arrayValueNode', { positionalArgs: ['items'] }],
    ['booleanValueNode', { positionalArgs: ['boolean'] }],
    ['bytesValueNode', { positionalArgs: ['encoding', 'data'] }],
    ['constantValueNode', { positionalArgs: ['type', 'value'] }],
    [
        'enumValueNode',
        {
            attributes: {
                enum: {
                    coerce: fragment`typeof enumLink === 'string' ? ${use('definedTypeLinkNode', 'constructor:definedTypeLinkNode')}(enumLink) : enumLink`,
                    paramName: 'enumLink',
                },
            },
            positionalArgs: ['enum', 'variant', 'value'],
        },
    ],
    ['mapEntryValueNode', { positionalArgs: ['key', 'value'] }],
    ['mapValueNode', { positionalArgs: ['entries'] }],
    ['noneValueNode', { positionalArgs: [] }],
    ['numberValueNode', { positionalArgs: ['number'] }],
    ['publicKeyValueNode', { positionalArgs: ['publicKey', 'identifier'] }],
    ['setValueNode', { positionalArgs: ['items'] }],
    ['someValueNode', { positionalArgs: ['value'] }],
    ['stringValueNode', { positionalArgs: ['string'] }],
    ['structFieldValueNode', { positionalArgs: ['name', 'value'] }],
    ['structValueNode', { positionalArgs: ['fields'] }],
    ['tupleValueNode', { positionalArgs: ['items'] }],

    ['accountBumpValueNode', { positionalArgs: ['name'] }],
    ['accountValueNode', { positionalArgs: ['name'] }],
    ['argumentValueNode', { positionalArgs: ['name'] }],
    // `conditionalValueNode` falls through to the default object-input
    // rendering with no overrides — its shape is `{ condition,
    // ifTrue?, ifFalse?, value? }` with no `name`/`docs` field.
    ['identityValueNode', { positionalArgs: [] }],
    ['payerValueNode', { positionalArgs: [] }],
    ['pdaSeedValueNode', { positionalArgs: ['name', 'value'] }],
    [
        'pdaValueNode',
        {
            attributes: {
                pda: {
                    coerce: fragment`typeof pda === 'string' ? ${use('pdaLinkNode', 'constructor:pdaLinkNode')}(pda) : pda`,
                },
                seeds: { default: fragment`[]` },
            },
            positionalArgs: ['pda', 'seeds', 'programId'],
        },
    ],
    ['programIdValueNode', { positionalArgs: [] }],
    ['resolverValueNode', { positionalArgs: ['name'] }],

    ['fixedCountNode', { positionalArgs: ['value'] }],
    ['prefixedCountNode', { positionalArgs: ['prefix'] }],
    ['remainderCountNode', { positionalArgs: [] }],

    [
        'constantDiscriminatorNode',
        {
            attributes: { offset: { default: fragment`0` } },
            positionalArgs: ['constant', 'offset'],
        },
    ],
    [
        'fieldDiscriminatorNode',
        {
            attributes: { offset: { default: fragment`0` } },
            positionalArgs: ['name', 'offset'],
        },
    ],
    ['sizeDiscriminatorNode', { positionalArgs: ['size'] }],

    [
        'accountLinkNode',
        {
            attributes: {
                program: {
                    coerce: fragment`typeof program === 'string' ? ${use('programLinkNode', 'constructor:programLinkNode')}(program) : program`,
                },
            },
            positionalArgs: ['name', 'program'],
        },
    ],
    [
        'definedTypeLinkNode',
        {
            attributes: {
                program: {
                    coerce: fragment`typeof program === 'string' ? ${use('programLinkNode', 'constructor:programLinkNode')}(program) : program`,
                },
            },
            positionalArgs: ['name', 'program'],
        },
    ],
    [
        'instructionAccountLinkNode',
        {
            attributes: {
                instruction: {
                    coerce: fragment`typeof instruction === 'string' ? ${use('instructionLinkNode', 'constructor:instructionLinkNode')}(instruction) : instruction`,
                },
            },
            positionalArgs: ['name', 'instruction'],
        },
    ],
    [
        'instructionArgumentLinkNode',
        {
            attributes: {
                instruction: {
                    coerce: fragment`typeof instruction === 'string' ? ${use('instructionLinkNode', 'constructor:instructionLinkNode')}(instruction) : instruction`,
                },
            },
            positionalArgs: ['name', 'instruction'],
        },
    ],
    [
        'instructionLinkNode',
        {
            attributes: {
                program: {
                    coerce: fragment`typeof program === 'string' ? ${use('programLinkNode', 'constructor:programLinkNode')}(program) : program`,
                },
            },
            positionalArgs: ['name', 'program'],
        },
    ],
    [
        'pdaLinkNode',
        {
            attributes: {
                program: {
                    coerce: fragment`typeof program === 'string' ? ${use('programLinkNode', 'constructor:programLinkNode')}(program) : program`,
                },
            },
            positionalArgs: ['name', 'program'],
        },
    ],
    ['programLinkNode', { positionalArgs: ['name'] }],

    [
        'providedNode',
        {
            attributes: {
                // Rename the local identifier used in generated bodies (constructor positional
                // arg, visitor walk-step local) so it does not shadow the outer `node`
                // parameter that every visitor receives.
                node: { paramName: 'value' },
            },
            positionalArgs: ['name', 'node'],
        },
    ],

    ['constantPdaSeedNode', { positionalArgs: ['type', 'value'] }],
    ['variablePdaSeedNode', { positionalArgs: ['name', 'type', 'docs'] }],
]);

/**
 * Cross-check a `nodeConfigs` map against the spec at generation time.
 * Catches stale config entries, attribute typos, and reserved
 * positional-arg names without a `paramName` override.
 */
export function validateNodeConfigs(spec: Spec, nodeConfigs: ReadonlyMap<string, NodeConstructorConfig>): void {
    const allNodes = spec.categories.flatMap(c => c.nodes);
    const validNodeKinds = new Set(allNodes.map(n => n.kind));
    const validKeys = new Set(allNodes.flatMap(n => n.attributes.map(a => `${n.kind}:${a.name}`)));

    for (const [kind, config] of nodeConfigs) {
        if (!validNodeKinds.has(kind)) {
            throw new Error(`nodeConfigs references unknown node kind "${kind}".`);
        }
        for (const attrName of Object.keys(config.attributes ?? {})) {
            if (!validKeys.has(`${kind}:${attrName}`)) {
                throw new Error(
                    `nodeConfigs.attributes for "${kind}" references attribute "${attrName}" which the spec does not declare.`,
                );
            }
        }
        for (const name of config.positionalArgs ?? []) {
            if (!validKeys.has(`${kind}:${name}`)) {
                throw new Error(
                    `nodeConfigs.positionalArgs for "${kind}" references attribute "${name}" which the spec does not declare.`,
                );
            }
            if (TS_RESERVED_PARAM_NAMES.has(name)) {
                const override = config.attributes?.[name];
                const hasParamName =
                    override !== undefined && 'paramName' in override && override.paramName !== undefined;
                if (!hasParamName) {
                    throw new Error(
                        `nodeConfigs for "${kind}" lists "${name}" as a positional arg but it's a TS reserved word; ` +
                            `add a \`paramName\` override on the attribute.`,
                    );
                }
            }
        }
    }
}
