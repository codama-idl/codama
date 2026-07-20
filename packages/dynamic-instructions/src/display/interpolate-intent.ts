import { getLastNodeFromPath } from 'codama';

import { formatArgumentValue } from './format-argument-value';
import type { DisplayContext } from './types';

/** Matches a `${root.path}` placeholder, capturing the root and the (flat) path after it. */
const PLACEHOLDER_PATTERN = /\$\{\s*(data|accounts)\.([a-zA-Z0-9_]+)\s*\}/g;

/**
 * Renders an instruction's `interpolatedIntent` template into a concrete sentence.
 *
 * Placeholders use the flat form `${data.<argument>}` and `${accounts.<account>}`. Each is
 * replaced by the referent's own presentation: arguments through their value-display nodes,
 * accounts by their address.
 *
 * Returns `null` when the instruction has no `interpolatedIntent`, or when any placeholder
 * cannot be resolved (an unknown name, or a value whose formatting fails). A `null` result
 * signals the caller to fall back to the structured field list.
 */
export async function interpolateIntent(displayContext: DisplayContext): Promise<string | null> {
    const instruction = getLastNodeFromPath(displayContext.parsedInstruction.path);
    const template = instruction.display?.interpolatedIntent;
    if (template === undefined) return null;

    // Resolve each distinct placeholder in parallel, then substitute them back into the template.
    const placeholders = [...template.matchAll(PLACEHOLDER_PATTERN)].filter(
        ([token], index, all) => all.findIndex(([other]) => other === token) === index,
    );
    const resolved = await Promise.all(
        placeholders.map(async ([token, root, name]) => {
            return [token, await resolvePlaceholder(root, name, displayContext)] as const;
        }),
    );

    if (resolved.some(([, value]) => value === null)) return null;
    const replacements = new Map(resolved);

    return template.replace(PLACEHOLDER_PATTERN, match => replacements.get(match) ?? match);
}

/** Resolves a single placeholder to its rendered string, or `null` when it cannot be resolved. */
async function resolvePlaceholder(root: string, name: string, displayContext: DisplayContext): Promise<string | null> {
    const { data, path } = displayContext.parsedInstruction;
    if (root === 'data') {
        const instruction = getLastNodeFromPath(path);
        const argument = (instruction.arguments ?? []).find(arg => arg.name === name);
        const decodedData = data as Record<string, unknown>;
        if (!argument || !(name in decodedData)) return null;
        const ownerPath = [...path, argument];
        return await formatArgumentValue(argument.type, ownerPath, decodedData[name], displayContext);
    }

    // root === 'accounts'
    return displayContext.parsedInstruction.accounts.find(account => account.name === name)?.address ?? null;
}
