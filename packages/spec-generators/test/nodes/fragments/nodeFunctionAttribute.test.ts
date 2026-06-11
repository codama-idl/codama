import { fragment } from '@codama/fragments/javascript';
import type { AttributeSpec } from '@codama/spec';
import { array, attribute, defineNode, node, optionalAttribute, stringIdentifier, u32, union } from '@codama/spec/api';
import { describe, expect, it } from 'vitest';

import type { AttributeOverride } from '../../../src/nodes/config';
import { getNodeFunctionAttributeFragment } from '../../../src/nodes/fragments/nodeFunctionAttribute';
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

/**
 * Helper: build an `AttributeSpec` in isolation by wrapping it in a
 * throwaway node and pulling the first attribute off.
 */
function specAttr(attr: ReturnType<typeof attribute>) {
    return defineNode('dummy', { attributes: [attr] }).attributes[0];
}

/**
 * Helper: derive the type-parameter `AttributeSpec` for a synthetic
 * node. Returns `undefined` if the attribute does not surface as a
 * type parameter.
 */
function typeParamAttrFor(attr: ReturnType<typeof attribute>): AttributeSpec | undefined {
    const n = defineNode('dummy', { attributes: [attr] });
    return getNodeTypeParameterAttributes(n, scope)[0];
}

describe('getNodeFunctionAttributeFragment', () => {
    it('rule 1: hidden-defaulted attribute emits the default expression directly', () => {
        const attr = specAttr(attribute('standard', u32()));
        const override: AttributeOverride = { default: fragment`'codama'`, hidden: true };
        const out = getNodeFunctionAttributeFragment(attr, 'options.standard', override, undefined, false).content;
        expect(out).toBe("standard: 'codama',");
    });

    it('rule 2: value override emits expression verbatim', () => {
        const attr = specAttr(attribute('withHeader', u32()));
        const override: AttributeOverride = { value: fragment`options.withHeader ?? someFn(value)` };
        const out = getNodeFunctionAttributeFragment(attr, 'options.withHeader', override, undefined, false).content;
        expect(out).toBe('withHeader: options.withHeader ?? someFn(value),');
    });

    it('rule 3: stringIdentifier wraps the reader in `camelCase(...)`', () => {
        const attr = specAttr(attribute('name', stringIdentifier()));
        const out = getNodeFunctionAttributeFragment(attr, 'input.name', undefined, undefined, false).content;
        expect(out).toBe('name: camelCase(input.name),');
    });

    it('rule 3 (optional path): optional stringIdentifier wraps in a conditional spread', () => {
        const attr = specAttr(optionalAttribute('identifier', stringIdentifier()));
        const out = getNodeFunctionAttributeFragment(attr, 'input.identifier', undefined, undefined, false).content;
        expect(out).toBe('...(input.identifier !== undefined && { identifier: camelCase(input.identifier) }),');
    });

    it('uses the spec attribute name as the body key regardless of `paramName`', () => {
        // The `enum` → `enumLink` rename only applies to the JS
        // parameter identifier; the body's object-literal key must
        // stay `enum` so the encoded shape matches the interface.
        const attr = specAttr(attribute('enum', node('definedTypeLinkNode')));
        const override: AttributeOverride = { coerce: fragment`enumLink`, paramName: 'enumLink' };
        const typeParamAttr = typeParamAttrFor(attribute('enum', node('definedTypeLinkNode')));
        const out = getNodeFunctionAttributeFragment(attr, 'enumLink', override, typeParamAttr, true).content;
        expect(out.startsWith('enum:')).toBe(true);
    });

    it('rule 4: coerce override emits the fragment verbatim with an `as TGeneric` cast for type-parameter attrs', () => {
        const attr = specAttr(attribute('program', node('programLinkNode')));
        const override: AttributeOverride = {
            coerce: fragment`typeof program === 'string' ? programLinkNode(program) : program`,
        };
        const typeParamAttr = typeParamAttrFor(attribute('program', node('programLinkNode')));
        const out = getNodeFunctionAttributeFragment(attr, 'program', override, typeParamAttr, true).content;
        expect(out).toContain("typeof program === 'string' ? programLinkNode(program) : program");
    });

    it('rule 4 (optional path): optional coerce drops behind a conditional spread', () => {
        const attr = specAttr(optionalAttribute('program', node('programLinkNode')));
        const override: AttributeOverride = {
            coerce: fragment`typeof program === 'string' ? programLinkNode(program) : program`,
        };
        const typeParamAttr = typeParamAttrFor(optionalAttribute('program', node('programLinkNode')));
        const out = getNodeFunctionAttributeFragment(attr, 'program', override, typeParamAttr, true).content;
        expect(out).toContain('...(program !== undefined && {');
    });

    it('rule 5: default override on a non-bare type-parameter attribute emits a `?? <default>` fallback', () => {
        const attr = specAttr(attribute('items', array(union('ValueNode'))));
        const override: AttributeOverride = { default: fragment`[]` };
        const typeParamAttr = typeParamAttrFor(attribute('items', array(union('ValueNode'))));
        const out = getNodeFunctionAttributeFragment(attr, 'input.items', override, typeParamAttr, false).content;
        expect(out).toBe('items: (input.items ?? []) as TItems,');
    });

    it('rule 6: optional attribute without overrides becomes a conditional spread', () => {
        const attr = specAttr(optionalAttribute('foo', u32()));
        const out = getNodeFunctionAttributeFragment(attr, 'input.foo', undefined, undefined, false).content;
        expect(out).toBe('...(input.foo !== undefined && { foo: input.foo }),');
    });

    it('rule 7: required attribute with reader === key collapses to the shorthand `key,`', () => {
        const attr = specAttr(attribute('format', u32()));
        const out = getNodeFunctionAttributeFragment(attr, 'format', undefined, undefined, true).content;
        expect(out).toBe('format,');
    });
});
