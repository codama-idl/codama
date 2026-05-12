import { attribute, defineNode, docs, stringIdentifier } from '@codama/spec/api';
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
    it('drops empty docs via the conditional spread + parsedDocs pattern', () => {
        const n = defineNode('myNode', {
            attributes: [attribute('name', stringIdentifier()), attribute('docs', docs())],
        });
        const out = getNodeFunctionBodyFragment(n, undefined, getNodeTypeParameterAttributes(n, scope)).content;
        // The `docs` handling hoists `parseDocs(<reader>)` to a local
        // and conditionally spreads it into the encoded shape.
        expect(out).toContain('const parsedDocs = parseDocs(input.docs);');
        expect(out).toContain('...(parsedDocs.length > 0 && { docs: parsedDocs }),');
    });
});
