import {
    definedTypeLinkNode,
    definedTypeNode,
    numberTypeNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';
import { pipe } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { getDefinedTypePageFragment } from '../../src/fragments';
import { addFragmentImports, fragment } from '../../src/utils';
import { getTypeVisitor } from '../../src/visitors';

test('it renders defined type pages', () => {
    const node = definedTypeNode({
        docs: ['This is some description for the counter type.', 'It can use multiple lines.'],
        name: 'counter',
        type: structTypeNode([structFieldTypeNode({ name: 'value', type: numberTypeNode('u32') })]),
    });

    const result = getDefinedTypePageFragment(node, getTypeVisitor());

    expect(result).toStrictEqual(fragment`---
title: Counter
description: Overview of the Counter type
---

# Counter

This is some description for the counter type.
It can use multiple lines.

## Type definition

\`\`\`ts
type Counter = { value: number /* u32 */ }
\`\`\``);
});

test('it renders see also sections', () => {
    const node = definedTypeNode({
        name: 'counter',
        type: structTypeNode([structFieldTypeNode({ name: 'value', type: definedTypeLinkNode('someType') })]),
    });

    const result = getDefinedTypePageFragment(node, getTypeVisitor());

    expect(result).toStrictEqual(
        pipe(
            fragment`---
title: Counter
description: Overview of the Counter type
---

# Counter

## Type definition

\`\`\`ts
type Counter = { value: SomeType }
\`\`\`

## See also

- [SomeType](someType.md)`,
            f => addFragmentImports(f, 'generatedTypes', 'SomeType'),
        ),
    );
});
