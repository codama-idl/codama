import { attribute, defineNode, docs, optionalAttribute, stringIdentifier } from '@codama/spec/api';
import { describe, expect, it } from 'vitest';

import { getNodeFunctionBodyFragment } from '../../../src/nodes/fragments/nodeFunctionBody';
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

describe('getNodeFunctionBodyFragment', () => {
    it('passes docs through in a conditional spread, as other optional children', () => {
        const n = defineNode('myNode', {
            attributes: [attribute('identifier', stringIdentifier()), optionalAttribute('docs', docs())],
        });
        const out = getNodeFunctionBodyFragment(n, undefined, getNodeTypeParameterAttributes(n, scope)).content;
        // Docs are a `string | TextNode` child in v2, so they are not parsed into lines.
        expect(out).toContain('...(input.docs !== undefined && { docs: input.docs }),');
        expect(out).not.toContain('parseDocs');
    });
});
