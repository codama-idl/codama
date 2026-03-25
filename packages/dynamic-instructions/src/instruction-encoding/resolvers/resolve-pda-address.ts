import type { Address, ProgramDerivedAddress } from '@solana/addresses';
import { address, getProgramDerivedAddress } from '@solana/addresses';
import type { ReadonlyUint8Array } from '@solana/codecs';
import type {
    InstructionAccountNode,
    PdaNode,
    PdaSeedValueNode,
    PdaValueNode,
    RegisteredPdaSeedNode,
    VariablePdaSeedNode,
} from 'codama';
import { isNode, visitOrElse } from 'codama';

import { AccountError } from '../../shared/errors';
import { createPdaSeedValueVisitor } from '../visitors/pda-seed-value';
import type { BaseResolutionContext } from './types';

export type ResolvePDAAddressContext = BaseResolutionContext & {
    ixAccountNode: InstructionAccountNode;
    pdaValueNode: PdaValueNode;
};

/**
 * Derives a PDA from a PdaValueNode.
 * Encodes each seed (ConstantPdaSeedNode and VariablePdaSeedNode) into bytes and computes the address.
 */
export async function resolvePDAAddress({
    root,
    ixNode,
    ixAccountNode,
    argumentsInput = {},
    accountsInput = {},
    pdaValueNode,
    resolutionPath,
    resolversInput,
}: ResolvePDAAddressContext): Promise<ProgramDerivedAddress | null> {
    if (!isNode(pdaValueNode, 'pdaValueNode')) {
        throw new AccountError(`Account node ${ixAccountNode.name} is not a PDA`);
    }

    const pdaNode = resolvePdaNode(pdaValueNode, root.program.pdas);
    const programId = address(pdaNode.programId || root.program.publicKey);

    const seedValues = await Promise.all(
        pdaNode.seeds.map(async seedNode => {
            if (seedNode.kind === 'constantPdaSeedNode') {
                return await resolveConstantPdaSeed({
                    accountsInput,
                    argumentsInput,
                    ixNode,
                    programId,
                    resolutionPath,
                    resolversInput,
                    root,
                    seedNode,
                });
            }

            if (seedNode.kind === 'variablePdaSeedNode') {
                const variableSeedValueNodes = pdaValueNode.seeds;
                const seedName = seedNode.name;
                const variableSeedValueNode = variableSeedValueNodes.find(node => node.name === seedName);

                if (!variableSeedValueNode) {
                    throw new AccountError(
                        `PDA Node ${pdaNode.name}. Variable PDA SeedValueNode ${seedName} was not found for ${ixAccountNode.name} account`,
                    );
                }

                return await resolveVariablePdaSeed({
                    accountsInput,
                    argumentsInput,
                    ixNode,
                    programId,
                    resolutionPath,
                    resolversInput,
                    root,
                    seedNode,
                    variableSeedValueNode,
                });
            }

            throw new AccountError(
                `PDA node: ${pdaNode.name}. Unsupported seed kind ${(seedNode as { kind?: string }).kind}`,
            );
        }),
    );

    return await getProgramDerivedAddress({
        programAddress: programId,
        seeds: seedValues,
    });
}

function resolvePdaNode(pdaDefaultValue: PdaValueNode, pdas: PdaNode[]): PdaNode {
    if (isNode(pdaDefaultValue.pda, 'pdaLinkNode')) {
        const linkedPda = pdas.find(p => p.name === pdaDefaultValue.pda.name);
        if (!linkedPda) {
            throw new AccountError(`Linked PDA node not found: ${pdaDefaultValue.pda.name}`);
        }
        return linkedPda;
    }

    if (isNode(pdaDefaultValue.pda, 'pdaNode')) {
        return pdaDefaultValue.pda;
    }

    throw new AccountError(`Unsupported PDA node kind: ${(pdaDefaultValue.pda as { kind: string }).kind}`);
}

type ResolvePdaSeedContext = BaseResolutionContext & {
    programId: Address;
    seedNode: VariablePdaSeedNode;
    variableSeedValueNode: PdaSeedValueNode;
};
function resolveVariablePdaSeed({
    accountsInput = {},
    argumentsInput = {},
    ixNode,
    programId,
    resolutionPath,
    resolversInput,
    root,
    seedNode,
    variableSeedValueNode,
}: ResolvePdaSeedContext): Promise<ReadonlyUint8Array> {
    if (!isNode(variableSeedValueNode, 'pdaSeedValueNode')) {
        throw new AccountError(`Not a PDA seed value node: ${(variableSeedValueNode as { kind?: string }).kind}`);
    }

    if (seedNode.name !== variableSeedValueNode.name) {
        throw new AccountError(`Mismatched PDA seed: ${seedNode.name} vs ${variableSeedValueNode.name}`);
    }

    const visitor = createPdaSeedValueVisitor({
        accountsInput,
        argumentsInput,
        ixNode,
        programId,
        resolutionPath,
        resolversInput,
        root,
        seedTypeNode: seedNode.type,
    });

    return visitOrElse(variableSeedValueNode.value, visitor, node => {
        throw new AccountError(`Unsupported variable PDA seed value node: ${node.kind}`);
    });
}

type ResolveConstantPdaSeedContext = BaseResolutionContext & {
    programId: Address;
    seedNode: RegisteredPdaSeedNode;
};
function resolveConstantPdaSeed({
    accountsInput,
    argumentsInput,
    ixNode,
    programId,
    resolutionPath,
    resolversInput,
    root,
    seedNode,
}: ResolveConstantPdaSeedContext): Promise<ReadonlyUint8Array> {
    if (!isNode(seedNode, 'constantPdaSeedNode')) {
        throw new AccountError(`Not a constant PDA seed node: ${seedNode.kind}`);
    }

    const visitor = createPdaSeedValueVisitor({
        accountsInput,
        argumentsInput,
        ixNode,
        programId,
        resolutionPath,
        resolversInput,
        root,
    });
    return visitOrElse(seedNode.value, visitor, node => {
        throw new AccountError(`Unsupported constant PDA seed value node: ${node.kind}`);
    });
}
