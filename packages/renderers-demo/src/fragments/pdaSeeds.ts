import { camelCase, isNode, PdaSeedNode } from '@codama/nodes';
import { mapFragmentContent } from '@codama/renderers-core';
import { pipe, visit } from '@codama/visitors-core';

import { Fragment, getTableFragment } from '../utils';
import { TypeVisitor } from '../visitors/getTypeVisitor';
import { ValueVisitor } from '../visitors/getValueVisitor';

export function getPdaSeedsFragment(
    seeds: PdaSeedNode[],
    typeVisitor: TypeVisitor,
    valueVisitor: ValueVisitor,
): Fragment | undefined {
    if (seeds.length === 0) return;

    const seedHeaders = ['Seed', 'Type', 'Value'];
    const seedRows = seeds.map(seed => {
        const type = pipe(
            visit(seed.type, typeVisitor),
            f => mapFragmentContent(f, c => c.replace(/\n\s*/g, ' ')),
            f => mapFragmentContent(f, c => `\`${c}\``),
        );

        if (isNode(seed, 'variablePdaSeedNode')) {
            return [`\`${camelCase(seed.name)}\``, type, seed.docs?.join(' ') ?? ''];
        }

        const value = pipe(visit(seed.value, valueVisitor), f => mapFragmentContent(f, c => `\`${c}\``));
        return ['_constant_', type, value];
    });

    return getTableFragment(seedHeaders, seedRows);
}
