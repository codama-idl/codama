import {
    definedTypeLinkNode,
    definedTypeNode,
    numberTypeNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';
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

    const expectedContent = `---
title: Counter
description: Overview of the Counter type
---

# Counter

This is some description for the counter type.
It can use multiple lines.

## Type definition

\`\`\`ts
type Counter = { value: number /* u32 */ }
\`\`\``;

    expect(getDefinedTypePageFragment(node, getTypeVisitor())).toStrictEqual(fragment(expectedContent));
});

test('it renders see also sections', () => {
    const node = definedTypeNode({
        name: 'counter',
        type: structTypeNode([structFieldTypeNode({ name: 'value', type: definedTypeLinkNode('someType') })]),
    });

    const expectedContent = `---
title: Counter
description: Overview of the Counter type
---

# Counter

## Type definition

\`\`\`ts
type Counter = { value: SomeType }
\`\`\`

## See also

- [SomeType](someType.md)`;

    expect(getDefinedTypePageFragment(node, getTypeVisitor())).toStrictEqual(
        addFragmentImports(fragment(expectedContent), 'generatedTypes', 'SomeType'),
    );
});
