import {
    CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_DERIVE_PDA,
    CODAMA_ERROR__DYNAMIC_CLIENT__NODE_REFERENCE_NOT_FOUND,
    CODAMA_ERROR__DYNAMIC_CLIENT__PDA_SEED_MISSING,
    CodamaError,
} from '@codama/errors';
import type { Address, ProgramDerivedAddress } from '@solana/addresses';
import { getProgramDerivedAddress } from '@solana/addresses';
import type { ReadonlyUint8Array } from '@solana/codecs';
import {
    getLastNodeFromPath,
    isNode,
    type NodePath,
    type PdaNode,
    type PdaValueNode,
    type VariablePdaSeedNode,
} from 'codama';

import { toAddress, toAddressOrThrow } from '../shared/address';
import { OPTIONAL_NODE_KINDS } from '../shared/nodes';
import { resolvePdaSeedValue } from '../visitors/pda-seed-value';
import { encodeValue, getProgramAddress, getValue } from './context';
import { resolveAccountValueNodeAddress } from './resolve-account-value-node-address';
import { getRequiredDataValue } from './resolve-value';
import type { ResolutionContext } from './types';

/**
 * Derive the PDA of a `pdaValueNode`, using the program address it provides,
 * or the one of the PDA, or the address of the program defining the PDA.
 */
export async function resolvePdaAddress(node: PdaValueNode, ctx: ResolutionContext): Promise<ProgramDerivedAddress> {
    const pdaPath = getPdaPath(node, ctx);
    const programAddress = node.programId
        ? await resolvePdaProgramAddress(node.programId, ctx, pdaPath)
        : getPdaProgramAddress(pdaPath);

    return await derivePda(pdaPath, programAddress, ctx, async seedNode => {
        const seedValueNode = (node.seeds ?? []).find(seed => seed.identifier === seedNode.identifier);
        if (!seedValueNode) {
            throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__NODE_REFERENCE_NOT_FOUND, {
                path: pdaPath,
                referencedName: seedNode.identifier,
            });
        }
        return await resolvePdaSeedValue(seedValueNode.value, ctx, [...pdaPath, seedNode]);
    });
}

/** The path of the PDA of a `pdaValueNode`, following links. Inline PDAs belong to the program of the instruction. */
function getPdaPath(node: PdaValueNode, ctx: ResolutionContext): NodePath<PdaNode> {
    if (isNode(node.pda, 'pdaLinkNode')) {
        return ctx.linkables.getPathOrThrow([...ctx.instructionPath, node, node.pda]);
    }
    return [...ctx.instructionPath, node, node.pda];
}

/** The program address used to derive a PDA when its value does not provide one. */
export function getPdaProgramAddress(pdaPath: NodePath<PdaNode>): Address {
    const pdaNode = getLastNodeFromPath(pdaPath);
    return pdaNode.programId ? toAddress(pdaNode.programId) : getProgramAddress(pdaPath);
}

async function resolvePdaProgramAddress(
    programId: NonNullable<PdaValueNode['programId']>,
    ctx: ResolutionContext,
    pdaPath: NodePath<PdaNode>,
): Promise<Address> {
    if (isNode(programId, 'dataValueNode')) {
        return toAddressOrThrow(await getRequiredDataValue(ctx, programId.path), pdaPath);
    }
    const address = await resolveAccountValueNodeAddress(programId, ctx);
    if (address === null) {
        throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_DERIVE_PDA, { path: pdaPath });
    }
    return address;
}

/**
 * Derive a PDA by encoding each of its seeds using its declared type.
 * Constant seeds use their value, and variable seeds use the value returned by `getVariableSeedValue`.
 */
export async function derivePda(
    pdaPath: NodePath<PdaNode>,
    programAddress: Address,
    ctx: Pick<ResolutionContext, 'linkables' | 'scope'>,
    getVariableSeedValue: (seedNode: VariablePdaSeedNode) => Promise<unknown>,
): Promise<ProgramDerivedAddress> {
    const pdaNode = getLastNodeFromPath(pdaPath);
    const seeds = await Promise.all(
        (pdaNode.seeds ?? []).map(async (seedNode): Promise<ReadonlyUint8Array> => {
            const seedPath = [...pdaPath, seedNode];
            if (isNode(seedNode, 'constantPdaSeedNode')) {
                const value = isNode(seedNode.value, 'programIdValueNode')
                    ? programAddress
                    : getValue(ctx, seedPath, seedNode.value);
                return encodeValue(ctx, seedPath, seedNode.type, value);
            }
            const value = await getVariableSeedValue(seedNode);
            if (value === undefined || value === null) {
                // Missing option seeds encode as `None`, e.g. to zero bytes for remainder options.
                if (OPTIONAL_NODE_KINDS.includes(seedNode.type.kind)) {
                    return encodeValue(ctx, seedPath, seedNode.type, null);
                }
                throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__PDA_SEED_MISSING, { path: seedPath });
            }
            return encodeValue(ctx, seedPath, seedNode.type, value);
        }),
    );
    return await getProgramDerivedAddress({ programAddress, seeds });
}
