import type { NestedTypeNode, NumberTypeNode, OptionTypeNode, TypeNode } from '@codama/node-types';
import { numberTypeNode } from './NumberTypeNode';

/** A value that may be present or absent (Some/None), with an explicit numeric prefix indicating presence. */
export function optionTypeNode<
    const TItem extends TypeNode,
    const TPrefix extends NestedTypeNode<NumberTypeNode> = NumberTypeNode<'u8'>,
>(
    item: TItem,
    options: {
        fixed?: boolean;
        prefix?: TPrefix;
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
