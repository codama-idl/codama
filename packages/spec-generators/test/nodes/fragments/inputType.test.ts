import { fragment } from '@codama/fragments/javascript';
import {
    address,
    array,
    attribute,
    defineNode,
    docs,
    optionalAttribute,
    stringIdentifier,
    u32,
    union,
} from '@codama/spec/api';
import { describe, expect, it } from 'vitest';

import type { NodeConstructorConfig } from '../../../src/nodes/config';
import { getInputTypeFragment } from '../../../src/nodes/fragments/inputType';
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

describe('getInputTypeFragment', () => {
    it('emits a `XxxNodeInput` alias with the identifier reasserted as a plain string', () => {
        const n = defineNode('myNode', {
            attributes: [
                attribute('identifier', stringIdentifier()),
                optionalAttribute('docs', docs()),
                attribute('data', union('TypeNode')),
            ],
        });
        const result = getInputTypeFragment(n, 'MyNode', undefined, getNodeTypeParameterAttributes(n, scope));
        expect(result.content).toContain('export type MyNodeInput<');
        // The identifier is relaxed from its brand to `string` in the intersection.
        expect(result.content).toContain('readonly identifier: string;');
        // Reasserted fields are stripped from the base interface via Omit<>.
        expect(result.content).toContain("Omit<MyNode<TDocs, TData>, 'identifier' | 'kind'>");
    });

    it('keeps docs as a type-parameter child rather than reasserting them', () => {
        const n = defineNode('myNode', { attributes: [optionalAttribute('docs', docs())] });
        const result = getInputTypeFragment(n, 'MyNode', undefined, getNodeTypeParameterAttributes(n, scope));
        expect(result.content).toContain('TDocs extends string | TextNode | undefined = string | TextNode | undefined');
        expect(result.content).not.toContain('readonly docs');
    });

    it('wraps the base in Partial<> when the config defaults a spec-required attribute', () => {
        const n = defineNode('myNode', {
            attributes: [attribute('identifier', stringIdentifier()), attribute('items', array(union('ValueNode')))],
        });
        const config: NodeConstructorConfig = {
            attributes: { items: { default: fragment`[]` } },
        };
        const result = getInputTypeFragment(n, 'MyNode', config, getNodeTypeParameterAttributes(n, scope));
        expect(result.content).toContain('Omit<Partial<MyNode<TItems>>');
    });

    it('does not wrap in Partial<> when no required attribute carries a default override', () => {
        const n = defineNode('myNode', {
            attributes: [attribute('identifier', stringIdentifier()), attribute('data', union('TypeNode'))],
        });
        const result = getInputTypeFragment(n, 'MyNode', undefined, getNodeTypeParameterAttributes(n, scope));
        expect(result.content).not.toContain('Omit<Partial<');
        expect(result.content).toContain('Omit<MyNode<TData>');
    });

    it('does not wrap in Partial<> when the only default override targets an already-optional attribute', () => {
        // The Partial<> wrap is to let callers omit *required* fields the
        // constructor defaults. Optional fields are already omittable, so
        // defaulting an optional attribute doesn't need Partial<>.
        const n = defineNode('myNode', {
            attributes: [attribute('identifier', stringIdentifier()), optionalAttribute('count', u32())],
        });
        const config: NodeConstructorConfig = {
            attributes: { count: { default: fragment`0` } },
        };
        const result = getInputTypeFragment(n, 'MyNode', config, getNodeTypeParameterAttributes(n, scope));
        expect(result.content).not.toContain('Omit<Partial<');
    });

    it("omits the reasserted fields' names from the base Omit<…> clause", () => {
        const n = defineNode('myNode', {
            attributes: [attribute('identifier', stringIdentifier()), optionalAttribute('key', stringIdentifier())],
        });
        const result = getInputTypeFragment(n, 'MyNode', undefined, getNodeTypeParameterAttributes(n, scope));
        // The Omit clause lists `identifier`, `key` and `kind` (sorted), and optional fields stay optional.
        expect(result.content).toContain("Omit<MyNode, 'identifier' | 'key' | 'kind'>");
        expect(result.content).toContain('readonly key?: string;');
    });

    it('reasserts programNode.publicKey as the original wide shape (a non-relaxed required field)', () => {
        // `programNode` is special-cased in `collectReassertedFields`.
        // Mirror enough of the real spec shape that genericParamOrder's
        // `[docs, pdas, accounts, instructions, definedTypes, errors,
        // events, constants]` order can be honoured.
        const n = defineNode('programNode', {
            attributes: [
                attribute('identifier', stringIdentifier()),
                attribute('publicKey', address()),
                optionalAttribute('docs', docs()),
                attribute('pdas', array(union('PdaNode'))),
                attribute('accounts', array(union('AccountNode'))),
                attribute('instructions', array(union('InstructionNode'))),
                attribute('definedTypes', array(union('DefinedTypeNode'))),
                attribute('errors', array(union('ErrorNode'))),
                attribute('events', array(union('EventNode'))),
                attribute('constants', array(union('ConstantNode'))),
            ],
        });
        const result = getInputTypeFragment(n, 'ProgramNode', undefined, getNodeTypeParameterAttributes(n, scope));
        expect(result.content).toContain("readonly publicKey: ProgramNode['publicKey'];");
        // `publicKey` is also stripped from the base via Omit so the
        // intersection's reassertion takes precedence.
        expect(result.content).toContain("'identifier' | 'kind' | 'publicKey'");
    });

    it('emits a parameterless Input type for a node with no type-parameter attributes', () => {
        const n = defineNode('myNode', { attributes: [attribute('identifier', stringIdentifier())] });
        const result = getInputTypeFragment(n, 'MyNode', undefined, getNodeTypeParameterAttributes(n, scope));
        // No generics block.
        expect(result.content).toContain('export type MyNodeInput = ');
    });

    it('emits a no-intersection Input type for a node with no branded-string or publicKey reassertions', () => {
        const n = defineNode('myNode', { attributes: [attribute('data', union('TypeNode'))] });
        const result = getInputTypeFragment(n, 'MyNode', undefined, getNodeTypeParameterAttributes(n, scope));
        // No trailing `& { … }`.
        expect(result.content).not.toContain('& {');
    });
});
