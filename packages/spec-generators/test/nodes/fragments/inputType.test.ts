import { fragment } from '@codama/fragments/javascript';
import { array, attribute, defineNode, docs, optionalAttribute, stringIdentifier, u32, union } from '@codama/spec/api';
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
    it('emits a `XxxNodeInput` alias with name and docs reasserted to relaxed shapes', () => {
        const n = defineNode('myNode', {
            attributes: [
                attribute('name', stringIdentifier()),
                attribute('docs', docs()),
                attribute('data', union('TypeNode')),
            ],
        });
        const result = getInputTypeFragment(n, 'MyNode', undefined, getNodeTypeParameterAttributes(n, scope));
        expect(result.content).toContain('export type MyNodeInput<');
        // The reasserted fields appear in the intersection, name as `string` and docs as `DocsInput`.
        expect(result.content).toContain('readonly name: string;');
        expect(result.content).toContain('readonly docs?: DocsInput;');
        // Reasserted fields are stripped from the base interface via Omit<>.
        expect(result.content).toContain("Omit<MyNode<TData>, 'docs' | 'kind' | 'name'>");
    });

    it('wraps the base in Partial<> when the config defaults a spec-required attribute', () => {
        const n = defineNode('myNode', {
            attributes: [attribute('name', stringIdentifier()), attribute('items', array(union('ValueNode')))],
        });
        const config: NodeConstructorConfig = {
            attributes: { items: { default: fragment`[]` } },
        };
        const result = getInputTypeFragment(n, 'MyNode', config, getNodeTypeParameterAttributes(n, scope));
        expect(result.content).toContain('Omit<Partial<MyNode<TItems>>');
    });

    it('does not wrap in Partial<> when no required attribute carries a default override', () => {
        const n = defineNode('myNode', {
            attributes: [attribute('name', stringIdentifier()), attribute('data', union('TypeNode'))],
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
            attributes: [attribute('name', stringIdentifier()), optionalAttribute('count', u32())],
        });
        const config: NodeConstructorConfig = {
            attributes: { count: { default: fragment`0` } },
        };
        const result = getInputTypeFragment(n, 'MyNode', config, getNodeTypeParameterAttributes(n, scope));
        expect(result.content).not.toContain('Omit<Partial<');
    });

    it("omits the reasserted fields' names from the base Omit<…> clause", () => {
        const n = defineNode('myNode', {
            attributes: [attribute('name', stringIdentifier()), attribute('docs', docs())],
        });
        const result = getInputTypeFragment(n, 'MyNode', undefined, getNodeTypeParameterAttributes(n, scope));
        // The Omit clause lists `kind`, `name`, and `docs` (sorted).
        expect(result.content).toContain("Omit<MyNode, 'docs' | 'kind' | 'name'>");
    });

    it('reasserts programNode.publicKey as the original wide shape (a non-relaxed required field)', () => {
        // `programNode` is special-cased in `collectReassertedFields`.
        // Mirror enough of the real spec shape that genericParamOrder's
        // `[pdas, accounts, instructions, definedTypes, errors, events,
        // constants]` order can be honoured.
        const n = defineNode('programNode', {
            attributes: [
                attribute('name', stringIdentifier()),
                attribute('publicKey', stringIdentifier()),
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
        expect(result.content).toContain("'kind' | 'name' | 'publicKey'");
    });

    it('emits a parameterless Input type for a node with no type-parameter attributes', () => {
        const n = defineNode('myNode', { attributes: [attribute('name', stringIdentifier())] });
        const result = getInputTypeFragment(n, 'MyNode', undefined, getNodeTypeParameterAttributes(n, scope));
        // No generics block.
        expect(result.content).toContain('export type MyNodeInput = ');
    });

    it('emits a no-intersection Input type for a node with no name/docs/publicKey reassertions', () => {
        const n = defineNode('myNode', { attributes: [attribute('data', union('TypeNode'))] });
        const result = getInputTypeFragment(n, 'MyNode', undefined, getNodeTypeParameterAttributes(n, scope));
        // No trailing `& { … }`.
        expect(result.content).not.toContain('& {');
    });
});
