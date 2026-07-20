import { fragment } from '@codama/fragments/javascript';
import { array, attribute, defineNode, enumeration, node, optionalAttribute, u32, union } from '@codama/spec/api';
import { describe, expect, it } from 'vitest';

import type { NodeConstructorConfig } from '../../../src/nodes/config';
import { getNodeFunctionPositionalArgumentsFragment } from '../../../src/nodes/fragments/nodeFunctionPositionalArguments';
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

describe('getNodeFunctionPositionalArgumentsFragment', () => {
    it('emits bare positional parameters in the declared order', () => {
        const n = defineNode('myNode', {
            attributes: [
                attribute('format', enumeration('NumberFormat')),
                attribute('endian', enumeration('Endianness')),
            ],
        });
        const config: NodeConstructorConfig = { positionalArgs: ['format', 'endian'] };
        const out = getNodeFunctionPositionalArgumentsFragment(
            n,
            getNodeTypeParameterAttributes(n, scope),
            config,
        ).content;
        expect(out).toMatch(/format: \w+/);
        expect(out).toMatch(/endian: \w+/);
    });

    it("renames the spec attribute `enum` to `enumLink` via the override's `paramName`", () => {
        const n = defineNode('myNode', {
            attributes: [attribute('enum', node('definedTypeLinkNode'))],
        });
        const config: NodeConstructorConfig = {
            attributes: {
                enum: { coerce: fragment`enumLink`, paramName: 'enumLink' },
            },
            positionalArgs: ['enum'],
        };
        const out = getNodeFunctionPositionalArgumentsFragment(
            n,
            getNodeTypeParameterAttributes(n, scope),
            config,
        ).content;
        expect(out).toMatch(/\benumLink:\s/);
    });

    it('puts non-positional attributes in a trailing `options` bag', () => {
        const n = defineNode('myNode', {
            attributes: [
                attribute('value', union('ValueNode')),
                optionalAttribute('subtract', enumeration('Endianness')),
            ],
        });
        const config: NodeConstructorConfig = { positionalArgs: ['value'] };
        const out = getNodeFunctionPositionalArgumentsFragment(
            n,
            getNodeTypeParameterAttributes(n, scope),
            config,
        ).content;
        expect(out).toContain('options: {');
        expect(out).toContain('subtract?:');
        expect(out).toContain('= {}');
    });

    it("widens an array attribute's `[]` default through the bare element-array type, without `| undefined`", () => {
        // The intermediate cast widens the `[]` literal before the final
        // narrowing to the generic. For arrays it must NOT include the
        // `| undefined` from the type-parameter constraint — that would just
        // add noise to the generated output.
        const n = defineNode('myNode', {
            attributes: [attribute('items', array(node('itemNode')))],
        });
        const config: NodeConstructorConfig = {
            attributes: { items: { default: fragment`[]` } },
            positionalArgs: ['items'],
        };
        const out = getNodeFunctionPositionalArgumentsFragment(
            n,
            getNodeTypeParameterAttributes(n, scope),
            config,
        ).content;
        expect(out).toContain('= [] as Array<ItemNode> as TItems');
        expect(out).not.toContain('| undefined');
    });

    it('excludes `hidden`-defaulted attributes from both signature and bag', () => {
        const n = defineNode('myNode', {
            attributes: [attribute('program', union('ProgramNode')), attribute('standard', u32())],
        });
        const config: NodeConstructorConfig = {
            attributes: { standard: { default: fragment`'codama'`, hidden: true } },
            positionalArgs: ['program'],
        };
        const out = getNodeFunctionPositionalArgumentsFragment(
            n,
            getNodeTypeParameterAttributes(n, scope),
            config,
        ).content;
        // No `options` bag — `standard` is the only non-positional and it's hidden.
        expect(out).not.toContain('options:');
        // And `standard` doesn't appear as a positional either.
        expect(out).not.toContain('standard');
    });
});
