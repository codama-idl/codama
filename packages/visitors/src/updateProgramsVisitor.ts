import { programNode, ProgramNodeInput } from '@codama/nodes';
import { LinkableDictionary } from '@codama/visitors-core';

import {
    assertValidUpdateKeys,
    createUpdateResolver,
    getAppliedUpdate,
    getUpdateTransformer,
    getUpdateVisitor,
    identifierOrUndefined,
    UpdateEntry,
} from './updateHelpers';

export type ProgramUpdates = AppliedProgramUpdates | { delete: true };
type AppliedProgramUpdates = Partial<Omit<ProgramNodeInput, 'accounts' | 'definedTypes' | 'errors' | 'instructions'>>;

const PROGRAM_UPDATE_KEYS = ['constants', 'docs', 'events', 'identifier', 'pdas', 'plugins', 'publicKey', 'version'];

/**
 * Update or delete programs, keyed by `NodeSelector`s such as program
 * identifiers (matched exactly).
 *
 * Renaming a program also renames every `programLinkNode` pointing to it.
 *
 * @throws {CODAMA_ERROR__VISITORS__UNRECOGNIZED_UPDATE_KEYS} if an update
 * contains an unrecognised key (e.g. `name` instead of `identifier`).
 *
 * @example
 * ```ts
 * updateProgramsVisitor({
 *     splToken: { identifier: 'token', publicKey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
 *     splAssociatedToken: { delete: true },
 * });
 * ```
 */
export function updateProgramsVisitor(map: Record<string, ProgramUpdates>) {
    const entries = Object.entries(map).map(([selector, updates]): UpdateEntry<AppliedProgramUpdates> => {
        assertValidUpdateKeys(selector, updates, 'delete' in updates ? ['delete'] : PROGRAM_UPDATE_KEYS);
        return { select: ['[programNode]', selector], updates };
    });
    const resolve = createUpdateResolver(entries, (previous, next) => ({ ...previous, ...next }));

    return getUpdateVisitor(
        [getUpdateTransformer('programNode', resolve, (node, updates) => programNode({ ...node, ...updates }))],
        {
            linkables: new LinkableDictionary(),
            renames: { programs: path => identifierOrUndefined(getAppliedUpdate(resolve(path))?.identifier) },
        },
    );
}
