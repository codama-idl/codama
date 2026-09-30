import type {
    InstructionAccountDisplayNode,
    InstructionRemainingAccountsNode,
    PluginNode,
    TextNode,
} from '@codama/node-types';

import { identifierString } from '../shared';

/**
 * A "remaining accounts" slot in an instruction — a variable-length tail of accounts appended after the named account slots.
 * Like `instructionAccountNode`, it declares a client input: the identifier names the account-list input exposed to callers. Renderers with matching plugins may fill it automatically.
 */
export function instructionRemainingAccountsNode<
    const TDocs extends string | TextNode | undefined = undefined,
    const TDisplay extends InstructionAccountDisplayNode | undefined = undefined,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    identifier: string,
    options: {
        isOptional?: boolean;
        isSigner?: boolean | 'either';
        isWritable?: boolean;
        docs?: TDocs;
        display?: TDisplay;
        plugins?: TPlugins;
    } = {},
): InstructionRemainingAccountsNode<TDocs, TDisplay, TPlugins> {
    return Object.freeze({
        kind: 'instructionRemainingAccountsNode',

        // Data.
        identifier: identifierString(identifier),
        ...(options.isOptional !== undefined && { isOptional: options.isOptional }),
        ...(options.isSigner !== undefined && { isSigner: options.isSigner }),
        ...(options.isWritable !== undefined && { isWritable: options.isWritable }),

        // Children.
        ...(options.docs !== undefined && { docs: options.docs }),
        ...(options.display !== undefined && { display: options.display }),
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}
