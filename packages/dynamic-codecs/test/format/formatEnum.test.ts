import { enumTypeNode, enumVariantDisplayNode, enumVariantTypeNode, integerTypeNode, textNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { formatEnum, getNodeCodec } from '../../src';
import { hex } from '../_setup';

test('it formats enums as the identifier of their variant in title case', () => {
    const node = enumTypeNode([enumVariantTypeNode('stay'), enumVariantTypeNode('moveTo')]);
    const decoded = getNodeCodec([node]).decode(hex('01'));
    expect(formatEnum(decoded)).toBe('Move To');
});

test('it formats enums as the label of their variant', () => {
    const display = enumVariantDisplayNode({ label: 'Move' });
    const node = enumTypeNode([enumVariantTypeNode('stay'), enumVariantTypeNode('moveTo', { display })]);
    const decoded = getNodeCodec([node]).decode(hex('01'));
    expect(formatEnum(decoded)).toBe('Move');
});

test('it formats enums as the content of the text node labelling their variant', () => {
    const display = enumVariantDisplayNode({ label: textNode({ content: 'Move' }) });
    const node = enumTypeNode([enumVariantTypeNode('stay'), enumVariantTypeNode('moveTo', { display })]);
    const decoded = getNodeCodec([node]).decode(hex('01'));
    expect(formatEnum(decoded)).toBe('Move');
});

test('it formats enums without the data of their variant', () => {
    const node = enumTypeNode([
        enumVariantTypeNode('stay'),
        enumVariantTypeNode('moveTo', { data: integerTypeNode('u8') }),
    ]);
    const decoded = getNodeCodec([node]).decode(hex('0105'));
    expect(formatEnum(decoded)).toBe('Move To');
});
