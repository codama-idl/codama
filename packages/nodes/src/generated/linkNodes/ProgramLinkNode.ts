import type { PluginNode, ProgramLinkNode } from '@codama/node-types';

import { identifierString } from '../../shared';

/** A reference to a program by name. */
export function programLinkNode<const TPlugins extends Array<PluginNode> | undefined = undefined>(
    identifier: string,
    options: {
        plugins?: TPlugins;
    } = {},
): ProgramLinkNode<TPlugins> {
    return Object.freeze({
        kind: 'programLinkNode',

        // Data.
        identifier: identifierString(identifier),

        // Children.
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}
