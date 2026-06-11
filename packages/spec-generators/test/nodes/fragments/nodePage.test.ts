import { fragment, use } from '@codama/fragments/javascript';
import { array, attribute, defineNode, docs, stringIdentifier, union } from '@codama/spec/api';
import { describe, expect, it } from 'vitest';

import type { NodeConstructorConfig } from '../../../src/nodes/config';
import { getNodePageFragment } from '../../../src/nodes/fragments/nodePage';
import {
    GENERIC_PARAM_ORDER,
    NARROWABLE_DATA_ATTRIBUTES,
    type ResolvedRenderOptions,
} from '../../../src/nodes/options';

const scope: Pick<ResolvedRenderOptions, 'genericParamOrder' | 'narrowableDataAttributes'> = {
    genericParamOrder: GENERIC_PARAM_ORDER,
    narrowableDataAttributes: NARROWABLE_DATA_ATTRIBUTES,
};

describe('getNodePageFragment', () => {
    it('emits an `export function <kind>` declaration', () => {
        const n = defineNode('myNode', {
            attributes: [attribute('name', stringIdentifier()), attribute('data', union('TypeNode'))],
        });
        const out = getNodePageFragment(n, 'MyNode', undefined, scope).content;
        expect(out).toContain('export function myNode<');
    });

    it('uses positional shape when positionalArgs is supplied — no Input type emitted', () => {
        const n = defineNode('myNode', {
            attributes: [attribute('format', union('TypeNode')), attribute('endian', union('TypeNode'))],
        });
        const config: NodeConstructorConfig = { positionalArgs: ['format', 'endian'] };
        const out = getNodePageFragment(n, 'MyNode', config, scope).content;
        expect(out).not.toContain('MyNodeInput');
    });

    it('imports `camelCase` from shared when the body uses it', () => {
        const n = defineNode('myNode', { attributes: [attribute('name', stringIdentifier())] });
        const out = getNodePageFragment(n, 'MyNode', undefined, scope);
        expect([...out.imports.keys()]).toContain('shared:camelCase');
    });

    it('imports `parseDocs` from shared when the node has a `docs` attribute', () => {
        const n = defineNode('myNode', {
            attributes: [attribute('name', stringIdentifier()), attribute('docs', docs())],
        });
        const out = getNodePageFragment(n, 'MyNode', undefined, scope);
        expect([...out.imports.keys()]).toContain('shared:parseDocs');
    });

    it('pulls in imports declared by an override Fragment via use(...)', () => {
        // The override declares its own import via `use(...)`. The
        // fragment pipeline composes that import into the rendered
        // file's import map — no scanner involved.
        const n = defineNode('myNode', {
            attributes: [attribute('data', union('TypeNode'))],
        });
        const config: NodeConstructorConfig = {
            attributes: {
                data: { default: fragment`${use('structTypeNode', 'constructor:structTypeNode')}([])` },
            },
        };
        const out = getNodePageFragment(n, 'MyNode', config, scope);
        expect([...out.imports.keys()]).toContain('constructor:structTypeNode');
    });

    it('does not pull in any spurious import when the override is a plain literal', () => {
        // A `default: fragment\`[]\`` override has no `use(...)` call,
        // so no extra import is emitted.
        const n = defineNode('myNode', {
            attributes: [attribute('items', array(union('ValueNode')))],
        });
        const config: NodeConstructorConfig = {
            attributes: { items: { default: fragment`[]` } },
        };
        const out = getNodePageFragment(n, 'MyNode', config, scope);
        // The base spec walk imports `ValueNode` from @codama/node-types
        // (the generic constraint refers to it), but no constructor-style
        // import comes from the override.
        const constructorImports = [...out.imports.keys()].filter(k => k.startsWith('constructor:'));
        expect(constructorImports).toEqual([]);
    });
});
