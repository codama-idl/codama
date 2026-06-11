import { array, attribute, enumeration, node, optionalAttribute } from '@codama/spec/api';
import { describe, expect, it } from 'vitest';

import { getTypeParameterDefinitionFragment } from '../../../src/nodeTypes/fragments/typeParameterDefinition';

describe('getTypeParameterDefinitionFragment', () => {
    it('renders a type-parameter definition for a child attribute, constraint = default = type', () => {
        const result = getTypeParameterDefinitionFragment(attribute('payload', node('innerTypeNode')));
        expect(result.content).toBe('TPayload extends InnerTypeNode = InnerTypeNode');
    });

    it('extends an optional child constraint with ` | undefined` on both sides', () => {
        const result = getTypeParameterDefinitionFragment(optionalAttribute('payload', node('innerTypeNode')));
        expect(result.content).toBe('TPayload extends InnerTypeNode | undefined = InnerTypeNode | undefined');
    });

    it('renders an array-of-node child as an Array<T> type parameter', () => {
        const result = getTypeParameterDefinitionFragment(attribute('items', array(node('innerTypeNode'))));
        expect(result.content).toBe('TItems extends Array<InnerTypeNode> = Array<InnerTypeNode>');
    });

    it('renders a narrowable data attribute as a type parameter over its enumeration constraint', () => {
        const result = getTypeParameterDefinitionFragment(attribute('format', enumeration('NumberFormat')));
        expect(result.content).toBe('TFormat extends NumberFormat = NumberFormat');
    });

    it('substitutes the self-alias in a child constraint when configured', () => {
        const result = getTypeParameterDefinitionFragment(
            optionalAttribute('children', array(node('recursiveTypeNode'))),
            { selfAlias: { alias: 'SelfRecursiveTypeNode', kind: 'recursiveTypeNode' } },
        );
        expect(result.content).toBe(
            'TChildren extends Array<SelfRecursiveTypeNode> | undefined = Array<SelfRecursiveTypeNode> | undefined',
        );
    });

    it('does not substitute when the attribute does not reference the self kind', () => {
        // The attribute references a different kind; the selfAlias
        // context should be a no-op.
        const result = getTypeParameterDefinitionFragment(attribute('payload', node('innerTypeNode')), {
            selfAlias: { alias: 'SelfRecursiveTypeNode', kind: 'recursiveTypeNode' },
        });
        expect(result.content).toBe('TPayload extends InnerTypeNode = InnerTypeNode');
    });
});
