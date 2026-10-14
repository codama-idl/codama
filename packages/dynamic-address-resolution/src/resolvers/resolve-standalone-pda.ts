import type { ProgramDerivedAddress } from '@solana/addresses';
import type { LinkableDictionary, NodePath, PdaNode } from 'codama';
import { getLinkablesFromNode, ProvidedScope } from 'codama';

import { type AddressInput, toAddress } from '../shared/address';
import { derivePda, getPdaProgramAddress } from './resolve-pda-address';

export type ResolveStandalonePdaInput = {
    /**
     * The linkable nodes of the tree, e.g. from `getLinkablesFromNode(root)`, used to follow links.
     * Defaults to recording them from the root of the path: pass them to avoid recording them again.
     */
    linkables?: LinkableDictionary;
    /** The path of the PDA from the root node, e.g. `[root, program, pda]`. */
    path: NodePath<PdaNode>;
    /**
     * The program deriving the PDA, overriding the `programId` of the PDA and,
     * without one, the program defining it. Instructions may derive a PDA from
     * another program through their `pdaValueNode.programId`, which this mirrors
     * outside of any instruction.
     */
    programId?: AddressInput;
    /** The values of the variable seeds of the PDA, keyed by seed identifier. */
    seedsInput?: Record<string, unknown>;
};

/**
 * Derive a PDA from its seed values, outside of any instruction. The PDA is
 * derived from the given `programId`, or else the `programId` of the PDA, or
 * else the address of the program defining it.
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
    linkables,
    path,
    programId,
    seedsInput = {},
}: ResolveStandalonePdaInput): Promise<ProgramDerivedAddress> {
    const ctx = { linkables: linkables ?? getLinkablesFromNode(path[0]), scope: new ProvidedScope() };
    const programAddress = programId === undefined ? getPdaProgramAddress(path) : toAddress(programId);
    return await derivePda(path, programAddress, ctx, seedNode => Promise.resolve(seedsInput[seedNode.identifier]));
}
