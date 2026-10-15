import { fragment } from '@codama/fragments/javascript';
import { array, attribute, defineNode, enumeration, node, optionalAttribute, u32, union } from '@codama/spec/api';
import { describe, expect, it } from 'vitest';

import type { NodeConstructorConfig } from '../../../src/nodes/config';
import { computeConstructorDefaults } from '../../../src/nodes/fragments/nodeTypeParameters';
import {
    GENERIC_PARAM_ORDER,
    getNodeTypeParameterAttributes,
    NARROWABLE_DATA_ATTRIBUTES,
    type ResolvedRenderOptions,
} from '../../../src/nodes/options';

const scope: Pick<ResolvedRenderOptions, 'genericParamOrder' | 'narrowableDataAttributes'> = {
    genericParamOrder: GENERIC_PARAM_ORDER,
    narrowableDataAttributes: NARROWABLE_DATA_ATTRIBUTES,
};

describe('getNodeTypeParameterAttributes', () => {
    it('selects child attributes by default', () => {
        const n = defineNode('myNode', {
            attributes: [
                attribute('plainData', u32()),
                attribute('childUnion', union('TypeNode')),
                attribute('childNode', node('innerNode')),
            ],
        });
        const attrs = getNodeTypeParameterAttributes(n, scope);
        expect(attrs.map(a => a.name)).toEqual(['childUnion', 'childNode']);
    });

    it('also selects narrowable-data attributes listed in NARROWABLE_DATA_ATTRIBUTES', () => {
        // `integerTypeNode:format` is on the shared narrowable list.
        const n = defineNode('integerTypeNode', {
            attributes: [
                attribute('format', enumeration('IntegerFormat')),
                attribute('endian', enumeration('Endianness')),
            ],
        });
        const attrs = getNodeTypeParameterAttributes(n, scope);
        // `format` surfaces as a type parameter because it's narrowable;
        // `endian` is plain data and does not.
        expect(attrs.map(a => a.name)).toEqual(['format']);
    });

    it('uses genericParamOrder overrides to reorder type-parameter attributes', () => {
        // `pdaValueNode` surfaces `pda`, `seeds` and `programId` (children)
        // as type parameters; the GENERIC_PARAM_ORDER table pins the
        // order to `[seeds, programId, pda]`.
        const n = defineNode('pdaValueNode', {
            attributes: [
                attribute('pda', union('PdaValuePda')),
                attribute('seeds', array(union('PdaSeedValueNode'))),
                optionalAttribute('programId', union('PdaValueProgramId')),
            ],
        });
        const attrs = getNodeTypeParameterAttributes(n, scope);
        expect(attrs.map(a => a.name)).toEqual(['seeds', 'programId', 'pda']);
    });

    it('throws when GENERIC_PARAM_ORDER references attributes the spec does not surface', () => {
        // `programNode`'s order lists `docs` and `pdas` first. If we
        // construct a synthetic `programNode` without them, the override
        // is out of sync with the spec.
        const n = defineNode('programNode', { attributes: [attribute('publicKey', u32())] });
        expect(() => getNodeTypeParameterAttributes(n, scope)).toThrow(
            /genericParamOrder for "programNode" is out of sync.*unknown attribute/,
        );
    });

    it('appends type-parameter attributes that GENERIC_PARAM_ORDER does not list, e.g. base attributes', () => {
        // `pdaValueNode`'s order is `[seeds, programId, pda]`. Base
        // attributes such as `plugins` are deliberately absent from the
        // override table and land last.
        const n = defineNode('pdaValueNode', {
            attributes: [
                optionalAttribute('plugins', array(node('pluginNode'))),
                attribute('pda', union('PdaValuePda')),
                attribute('seeds', array(union('PdaSeedValueNode'))),
                optionalAttribute('programId', union('PdaValueProgramId')),
            ],
        });
        const attrs = getNodeTypeParameterAttributes(n, scope);
        expect(attrs.map(a => a.name)).toEqual(['seeds', 'programId', 'pda', 'plugins']);
    });
});

describe('computeConstructorDefaults', () => {
    it('defaults every type parameter to `undefined` when the spec marks it optional', () => {
        const n = defineNode('myNode', {
            attributes: [optionalAttribute('child', union('TypeNode'))],
        });
        const attrs = getNodeTypeParameterAttributes(n, scope);
        const [d] = computeConstructorDefaults(n, attrs, undefined, scope);
        expect(d.content).toBe('undefined');
    });

    it('produces no constructor default for a required child attribute with no override', () => {
        const n = defineNode('myNode', {
            attributes: [attribute('child', union('TypeNode'))],
        });
        const attrs = getNodeTypeParameterAttributes(n, scope);
        const [d] = computeConstructorDefaults(n, attrs, undefined, scope);
        expect(d.content).toBe('');
    });

    it('falls back to the wide constraint as default for a narrowable-data attribute with no override', () => {
        // `integerTypeNode:format` is narrowable; with no override, the
        // constructor default is the wide constraint (`IntegerFormat`).
        const n = defineNode('integerTypeNode', {
            attributes: [attribute('format', enumeration('IntegerFormat'))],
        });
        const attrs = getNodeTypeParameterAttributes(n, scope);
        const [d] = computeConstructorDefaults(n, attrs, undefined, scope);
        expect(d.content).toBe('IntegerFormat');
    });

    it('uses an override-supplied default verbatim for primitive defaults', () => {
        const config: NodeConstructorConfig = {
            attributes: { items: { default: fragment`[]` } },
        };
        const n = defineNode('myNode', {
            attributes: [attribute('items', array(union('ValueNode')))],
        });
        const attrs = getNodeTypeParameterAttributes(n, scope);
        const [d] = computeConstructorDefaults(n, attrs, config, scope);
        expect(d.content).toBe('[]');
    });

    it('uses `genericDefault` over `default` when supplied', () => {
        const config: NodeConstructorConfig = {
            attributes: {
                size: {
                    default: fragment`integerTypeNode('u8')`,
                    genericDefault: fragment`IntegerTypeNode<'u8'>`,
                },
            },
        };
        const n = defineNode('myNode', {
            attributes: [attribute('size', union('TypeNode'))],
        });
        const attrs = getNodeTypeParameterAttributes(n, scope);
        const [d] = computeConstructorDefaults(n, attrs, config, scope);
        expect(d.content).toBe("IntegerTypeNode<'u8'>");
    });

    it('falls back to the wide constraint for a required attribute with a `coerce` override', () => {
        const config: NodeConstructorConfig = {
            attributes: {
                program: { coerce: fragment`typeof program === 'string' ? programLinkNode(program) : program` },
            },
        };
        const n = defineNode('myNode', {
            attributes: [attribute('program', node('programLinkNode'))],
        });
        const attrs = getNodeTypeParameterAttributes(n, scope);
        const [d] = computeConstructorDefaults(n, attrs, config, scope);
        expect(d.content).toBe('ProgramLinkNode');
    });

    it('broadens a trailing required type parameter that follows a defaulted one', () => {
        // `pdaValueNode`'s GENERIC_PARAM_ORDER is `[seeds, programId, pda]`
        // — `seeds` is defaulted via the override `[]`, `programId` is
        // optional (`undefined`), and `pda` is required. TS would
        // disallow a required type parameter after a defaulted one, so
        // the renderer broadens `pda`'s default to its wide constraint.
        const config: NodeConstructorConfig = {
            attributes: {
                seeds: { default: fragment`[]` },
            },
        };
        const n = defineNode('pdaValueNode', {
            attributes: [
                attribute('seeds', array(union('PdaSeedValueNode'))),
                optionalAttribute('programId', union('PdaValueProgramId')),
                attribute('pda', union('PdaValuePda')),
            ],
        });
        const attrs = getNodeTypeParameterAttributes(n, scope);
        const defaults = computeConstructorDefaults(n, attrs, config, scope);
        const pdaIdx = attrs.findIndex(a => a.name === 'pda');
        // Broadened to the wide constraint rather than left empty.
        expect(defaults[pdaIdx].content).toBe('PdaValuePda');
    });

    it('returns an empty list when the node has no type-parameter attributes', () => {
        const n = defineNode('myNode', { attributes: [attribute('plain', u32())] });
        const attrs = getNodeTypeParameterAttributes(n, scope);
        expect(computeConstructorDefaults(n, attrs, undefined, scope)).toEqual([]);
    });
});
