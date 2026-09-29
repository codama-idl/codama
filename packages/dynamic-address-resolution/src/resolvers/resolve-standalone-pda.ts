import type { ProgramDerivedAddress } from '@solana/addresses';
import type { NodePath, PdaNode } from 'codama';
import { ProvidedScope } from 'codama';

import { getLinkables } from './context';
import { derivePda, getPdaProgramAddress } from './resolve-pda-address';

export type ResolveStandalonePdaInput = {
    /** The path of the PDA from the root node, e.g. `[root, program, pda]`. */
    path: NodePath<PdaNode>;
    /** The values of the variable seeds of the PDA, keyed by seed identifier. */
    seedsInput?: Record<string, unknown>;
};

/**
 * Derive a PDA from its seed values, outside of any instruction.
 *
 * @example
 * ```ts
 * const [address, bump] = await resolveStandalonePda({
 *     path: [root, root.program, metadataPda],
 *     seedsInput: { authority, seed: 'idl' },
 * });
 * ```
 */
export async function resolveStandalonePda({
    path,
    seedsInput = {},
}: ResolveStandalonePdaInput): Promise<ProgramDerivedAddress> {
    const ctx = { linkables: getLinkables(path), scope: new ProvidedScope() };
    return await derivePda(path, getPdaProgramAddress(path), ctx, seedNode =>
        Promise.resolve(seedsInput[seedNode.identifier]),
    );
}
