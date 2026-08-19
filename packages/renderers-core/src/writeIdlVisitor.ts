import { writeFile } from '@codama/fragments';
import { rootNodeVisitor } from '@codama/visitors-core';

/**
 * Writes the visited `RootNode` to a JSON file at the given path,
 * creating intermediate directories as needed.
 *
 * This is typically used as a Codama CLI script to write the IDL back
 * to a file after all `before` visitors have been applied — e.g. to
 * publish an IDL whose render-time transformations are resolved.
 *
 * ```ts
 * // codama.mjs
 * export default {
 *     idl: 'interface-idl.json',
 *     before: [...],
 *     scripts: {
 *         idl: { from: '@codama/renderers-core#writeIdlVisitor', args: ['idl.json'] },
 *     },
 * };
 * ```
 *
 * Node-only: throws a structured `CodamaError` on non-Node platforms
 * so accidental calls from a browser bundle fail loudly.
 */
export function writeIdlVisitor(path: string) {
    return rootNodeVisitor(root => {
        writeFile(path, JSON.stringify(root, null, 2));
    });
}
