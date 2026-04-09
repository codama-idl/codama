import {
    CODAMA_ERROR__DYNAMIC_INSTRUCTIONS__INVARIANT_VIOLATION,
    CODAMA_ERROR__DYNAMIC_INSTRUCTIONS__NODE_REFERENCE_NOT_FOUND,
    CODAMA_ERROR__LINKED_NODE_NOT_FOUND,
    CODAMA_ERROR__UNEXPECTED_NODE_KIND,
    CODAMA_ERROR__UNRECOGNIZED_NODE_KIND,
    CodamaError,
} from '@codama/errors';
import type { Address, ProgramDerivedAddress } from '@solana/addresses';
import { address, getProgramDerivedAddress } from '@solana/addresses';
import type { ReadonlyUint8Array } from '@solana/codecs';
import type { Node, PdaNode, PdaSeedValueNode, PdaValueNode, RegisteredPdaSeedNode, VariablePdaSeedNode } from 'codama';
import { isNode, visitOrElse } from 'codama';

import { getMaybeNodeKind } from '../../shared/util';
import { createPdaSeedValueVisitor, PDA_SEED_VALUE_SUPPORTED_NODE_KINDS } from '../visitors/pda-seed-value';
import type { BaseResolutionContext } from './types';

export type ResolvePDAAddressContext = BaseResolutionContext & {
    pdaValueNode: PdaValueNode;
};

/**
 * Derives a PDA from a PdaValueNode.
 * Encodes each seed (ConstantPdaSeedNode and VariablePdaSeedNode) into bytes and computes the address.
 */
export async function resolvePDAAddress({
    root,
    ixNode,
    argumentsInput = {},
    accountsInput = {},
    pdaValueNode,
    resolutionPath,
    resolversInput,
}: ResolvePDAAddressContext): Promise<ProgramDerivedAddress | null> {
    if (!isNode(pdaValueNode, 'pdaValueNode')) {
        throw new CodamaError(CODAMA_ERROR__UNEXPECTED_NODE_KIND, {
            expectedKinds: ['pdaValueNode'],
            kind: getMaybeNodeKind(pdaValueNode),
            node: pdaValueNode,
        });
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
                    throw new CodamaError(CODAMA_ERROR__DYNAMIC_INSTRUCTIONS__NODE_REFERENCE_NOT_FOUND, {
                        instructionName: ixNode.name,
                        referencedName: seedName,
                    });
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

            throw new CodamaError(CODAMA_ERROR__UNRECOGNIZED_NODE_KIND, {
                kind: getMaybeNodeKind(seedNode) ?? 'unknown',
            });
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
            throw new CodamaError(CODAMA_ERROR__LINKED_NODE_NOT_FOUND, {
                kind: 'pdaLinkNode',
                linkNode: pdaDefaultValue.pda,
                name: pdaDefaultValue.pda.name,
                path: [],
            });
        }
        return linkedPda;
    }

    if (isNode(pdaDefaultValue.pda, 'pdaNode')) {
        return pdaDefaultValue.pda;
    }

    throw new CodamaError(CODAMA_ERROR__UNEXPECTED_NODE_KIND, {
        expectedKinds: ['pdaLinkNode', 'pdaNode'],
        kind: getMaybeNodeKind(pdaDefaultValue.pda),
        node: pdaDefaultValue.pda,
    });
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
        throw new CodamaError(CODAMA_ERROR__UNEXPECTED_NODE_KIND, {
            expectedKinds: ['pdaSeedValueNode'],
            kind: getMaybeNodeKind(variableSeedValueNode),
            node: variableSeedValueNode as Node,
        });
    }

    if (seedNode.name !== variableSeedValueNode.name) {
        // Sanity check: this should not happen.
        throw new CodamaError(CODAMA_ERROR__DYNAMIC_INSTRUCTIONS__INVARIANT_VIOLATION, {
            message: `Mismatched PDA seed names: expected [${seedNode.name}], got [${variableSeedValueNode.name}]`,
        });
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
        throw new CodamaError(CODAMA_ERROR__UNEXPECTED_NODE_KIND, {
            expectedKinds: [...PDA_SEED_VALUE_SUPPORTED_NODE_KINDS],
            kind: node.kind,
            node,
        });
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
        throw new CodamaError(CODAMA_ERROR__UNEXPECTED_NODE_KIND, {
            expectedKinds: ['constantPdaSeedNode'],
            kind: seedNode.kind,
            node: seedNode,
        });
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
    return visitOrElse(seedNode.value, visitor, node => {
        throw new CodamaError(CODAMA_ERROR__UNEXPECTED_NODE_KIND, {
            expectedKinds: [...PDA_SEED_VALUE_SUPPORTED_NODE_KINDS],
            kind: node.kind,
            node,
        });
    });
}
