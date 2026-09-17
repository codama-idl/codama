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
 * `input: XxxNodeInput` object param, `identifierString` brand-cast on
 * the `identifier` attribute, conditional spread for every optional
 * attribute, and pass-through (with shorthand) for required ones.
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
    ['constantNode', { positionalArgs: ['identifier', 'type', 'value'] }],
    ['instructionAccountNode', { attributes: { isOptional: { default: fragment`false` } } }],
    [
        'instructionByteDeltaNode',
        {
            attributes: {
                withHeader: { default: fragment`true` },
            },
            positionalArgs: ['value'],
        },
    ],
    [
        'instructionNode',
        {
            attributes: {
                accounts: { default: fragment`[]` },
                optionalAccountStrategy: { default: fragment`'programId'` },
            },
        },
    ],
    ['instructionRemainingAccountsNode', { positionalArgs: ['identifier'] }],
    ['instructionStatusNode', { positionalArgs: ['lifecycle'] }],
    ['pluginNode', { positionalArgs: ['namespace', 'payload'] }],
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
            positionalArgs: ['program'],
        },
    ],

    ['arrayTypeNode', { positionalArgs: ['item', 'count'] }],
    [
        'booleanTypeNode',
        {
            attributes: {
                size: {
                    default: fragment`${use('integerTypeNode', 'constructor:integerTypeNode')}('u8')`,
                    genericDefault: fragment`${use('type IntegerTypeNode', '@codama/node-types')}<'u8'>`,
                },
            },
            positionalArgs: [],
        },
    ],
    ['bytesTypeNode', { positionalArgs: [] }],
    ['dateTimeTypeNode', { positionalArgs: ['number'] }],
    ['durationTypeNode', { positionalArgs: ['number'] }],
    [
        'enumTypeNode',
        {
            attributes: {
                size: {
                    default: fragment`${use('integerTypeNode', 'constructor:integerTypeNode')}('u8')`,
                    genericDefault: fragment`${use('type IntegerTypeNode', '@codama/node-types')}<'u8'>`,
                },
            },
            positionalArgs: ['variants'],
        },
    ],
    ['enumVariantTypeNode', { positionalArgs: ['identifier'] }],
    ['fixedPointTypeNode', { positionalArgs: ['number', 'scale'] }],
    [
        'floatTypeNode',
        {
            attributes: { endian: { default: fragment`'le'` } },
            positionalArgs: ['format'],
        },
    ],
    [
        'integerTypeNode',
        {
            attributes: { endian: { default: fragment`'le'` } },
            positionalArgs: ['format'],
        },
    ],
    ['mapTypeNode', { positionalArgs: ['key', 'value', 'count'] }],
    [
        'optionTypeNode',
        {
            attributes: {
                fixed: { default: fragment`false` },
                prefix: {
                    default: fragment`${use('integerTypeNode', 'constructor:integerTypeNode')}('u8')`,
                    genericDefault: fragment`${use('type IntegerTypeNode', '@codama/node-types')}<'u8'>`,
                },
            },
            positionalArgs: ['item'],
        },
    ],
    ['publicKeyTypeNode', { positionalArgs: [] }],
    ['remainderOptionTypeNode', { positionalArgs: ['item'] }],
    ['setTypeNode', { positionalArgs: ['item', 'count'] }],
    ['stringTypeNode', { positionalArgs: ['encoding'] }],
    ['structTypeNode', { positionalArgs: ['fields'] }],
    ['tupleTypeNode', { positionalArgs: ['items'] }],
    ['zeroableOptionTypeNode', { positionalArgs: ['item'] }],

    ['fixedSizeTransformNode', { positionalArgs: ['size'] }],
    ['hiddenPrefixTransformNode', { positionalArgs: ['prefix'] }],
    ['hiddenSuffixTransformNode', { positionalArgs: ['suffix'] }],
    [
        'postOffsetTransformNode',
        {
            attributes: { strategy: { default: fragment`'relative'` } },
            positionalArgs: ['offset'],
        },
    ],
    [
        'preOffsetTransformNode',
        {
            attributes: { strategy: { default: fragment`'relative'` } },
            positionalArgs: ['offset'],
        },
    ],
    ['sentinelTransformNode', { positionalArgs: ['sentinel'] }],
    ['sizePrefixTransformNode', { positionalArgs: ['prefix'] }],

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
            positionalArgs: ['enum', 'variant'],
        },
    ],
    ['floatValueNode', { positionalArgs: ['value'] }],
    ['integerValueNode', { positionalArgs: ['value'] }],
    ['mapEntryValueNode', { positionalArgs: ['key', 'value'] }],
    ['mapValueNode', { positionalArgs: ['entries'] }],
    ['noneValueNode', { positionalArgs: [] }],
    ['publicKeyValueNode', { positionalArgs: ['publicKey'] }],
    ['setValueNode', { positionalArgs: ['items'] }],
    ['someValueNode', { positionalArgs: ['value'] }],
    ['stringValueNode', { positionalArgs: ['string'] }],
    ['structFieldValueNode', { positionalArgs: ['identifier', 'value'] }],
    ['structValueNode', { positionalArgs: ['fields'] }],
    ['tupleValueNode', { positionalArgs: ['items'] }],

    ['accountBumpValueNode', { positionalArgs: ['identifier'] }],
    ['accountDataValueNode', { positionalArgs: ['account'] }],
    ['accountValueNode', { positionalArgs: ['identifier'] }],
    ['dataValueNode', { positionalArgs: ['path'] }],
    // `conditionalValueNode` falls through to the default object-input
    // rendering with no overrides — its shape is `{ condition,
    // ifTrue?, ifFalse?, value? }` with no `identifier`/`docs` field.
    ['identityValueNode', { positionalArgs: [] }],
    ['payerValueNode', { positionalArgs: [] }],
    ['pdaSeedValueNode', { positionalArgs: ['identifier', 'value'] }],
    [
        'pdaValueNode',
        {
            attributes: {
                pda: {
                    coerce: fragment`typeof pda === 'string' ? ${use('pdaLinkNode', 'constructor:pdaLinkNode')}(pda) : pda`,
                },
                seeds: { default: fragment`[]` },
            },
            positionalArgs: ['pda'],
        },
    ],
    ['programIdValueNode', { positionalArgs: [] }],

    ['fixedCountNode', { positionalArgs: ['value'] }],
    ['prefixedCountNode', { positionalArgs: ['prefix'] }],
    ['remainderCountNode', { positionalArgs: [] }],
    ['sentinelCountNode', { positionalArgs: ['sentinel'] }],

    [
        'constantDiscriminatorNode',
        {
            attributes: { offset: { default: fragment`0` } },
            positionalArgs: ['constant'],
        },
    ],
    [
        'fieldDiscriminatorNode',
        {
            attributes: { offset: { default: fragment`0` } },
            positionalArgs: ['path'],
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
            positionalArgs: ['identifier'],
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
            positionalArgs: ['identifier'],
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
            positionalArgs: ['identifier'],
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
            positionalArgs: ['identifier'],
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
            positionalArgs: ['identifier'],
        },
    ],
    ['programLinkNode', { positionalArgs: ['identifier'] }],

    [
        'providedNode',
        {
            attributes: {
                // Rename the local identifier used in generated bodies (constructor positional
                // arg, visitor walk-step local) so it does not shadow the outer `node`
                // parameter that every visitor receives.
                node: { paramName: 'value' },
            },
            positionalArgs: ['identifier', 'node'],
        },
    ],

    ['constantPdaSeedNode', { positionalArgs: ['type', 'value'] }],
    ['variablePdaSeedNode', { positionalArgs: ['identifier', 'type'] }],
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
