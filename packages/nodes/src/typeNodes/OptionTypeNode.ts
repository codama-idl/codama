import type { NestedTypeNode, NumberTypeNode, OptionTypeNode, TypeNode } from '@kinobi-so/node-types';

import { numberTypeNode } from './NumberTypeNode';

export function optionTypeNode<
    TItem extends TypeNode,
    TPrefix extends NestedTypeNode<NumberTypeNode> = NumberTypeNode<'u8'>,
>(
    item: TItem,
    options: {
        readonly fixed?: boolean;
        readonly prefix?: TPrefix;
    } = {},
): OptionTypeNode<TItem, TPrefix> {
    return Object.freeze({
        kind: 'optionTypeNode',

        // Data.
        fixed: options.fixed ?? false,

        // Children.
        item,
        prefix: (options.prefix ?? numberTypeNode('u8')) as TPrefix,
    });
}
