import type { PluginNode } from '@codama/node-types';

import { namespaceString } from '../shared';

/**
 * Attaches namespaced, plugin-specific data to a node.
 * A plugin is uniquely identified by its `namespace`; the optional `payload` carries arbitrary, consumer-defined data that only the matching plugin knows how to interpret. Codama itself treats the payload as opaque.
 * Every node can carry plugins via the `plugins` base attribute.
 *
 * The `codama.*` namespace is reserved for official plugins, defined by this specification for information that is renderer-specific by nature:
 *
 * - `codama.resolver` — on a node whose value renderers resolve with custom code rather than from the IDL, e.g. an instruction account, a struct field, remaining accounts or a byte delta. Its payload is `{ name, dependsOn? }`: the `name` of the resolver function, and the inputs it depends on as `accounts.<identifier>` or `data.<path>` strings, e.g. `["accounts.mint", "data.config.fee"]`, where `data.*` covers both the instruction data and its extra arguments. `dependsOn` is interpreted relative to the enclosing instruction, so it must be omitted on nodes outside an instruction.
 * - `codama.extraArgument` — on an instruction node, one per client input that is not serialised in the instruction data, e.g. to feed a resolver. Its payload is `{ identifier, type, defaultValue?, docs? }`, where `type` and `defaultValue` are the JSON of a type node and an instruction input value node — as for instruction account defaults. Its `identifier` must not collide with a top-level field of the instruction data.
 *
 * Like any payload, these are inert: renaming the nodes they reference does not update them.
 */
export function pluginNode<const TPlugins extends Array<PluginNode> | undefined = undefined>(
    namespace: string,
    payload?: unknown,
    options: {
        plugins?: TPlugins;
    } = {},
): PluginNode<TPlugins> {
    return Object.freeze({
        kind: 'pluginNode',

        // Data.
        namespace: namespaceString(namespace),
        ...(payload !== undefined && { payload }),

        // Children.
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}
