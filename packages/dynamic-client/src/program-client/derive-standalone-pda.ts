import { getNodeCodec } from '@codama/dynamic-codecs';
import {
    CODAMA_ERROR__DYNAMIC_CLIENT__ARGUMENT_MISSING,
    CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_ARGUMENT_TYPE,
    CODAMA_ERROR__UNEXPECTED_NODE_KIND,
    CODAMA_ERROR__UNRECOGNIZED_NODE_KIND,
    CodamaError,
} from '@codama/errors';
import type { Address, ProgramDerivedAddress } from '@solana/addresses';
import { getProgramDerivedAddress } from '@solana/addresses';
import type { ReadonlyUint8Array } from '@solana/codecs';
import type { InstructionNode, PdaNode, RegisteredPdaSeedNode, RootNode, VariablePdaSeedNode } from 'codama';
import { camelCase, isNode, visitOrElse } from 'codama';

import {
    createInputValueTransformer,
    createPdaSeedValueVisitor,
    PDA_SEED_VALUE_SUPPORTED_NODE_KINDS,
} from '../instruction-encoding';
import { toAddress } from '../shared/address';
import { getMemoizedUtf8Encoder } from '../shared/codecs';
import { formatValueType, getMaybeNodeKind } from '../shared/util';

/**
 * Minimal InstructionNode stub to satisfy constant PDA seeds requirements.
 * Constant seeds only use programIdValue / publicKeyValue / bytesValue / stringValue, none of which reference instruction arguments or accounts
 */
const STANDALONE_IX_NODE: InstructionNode = {
    accounts: [],
    arguments: [],
    kind: 'instructionNode',
    name: '__standalone__' as InstructionNode['name'],
};

/**
 * Derives a PDA from a standalone `PdaNode` and user-supplied seed values,
 * without requiring an instruction context.
 */
export async function deriveStandalonePDA(
    root: RootNode,
    pdaNode: PdaNode,
    seedInputs: Record<string, unknown> = {},
): Promise<ProgramDerivedAddress> {
    const programAddress = toAddress(pdaNode.programId || root.program.publicKey);
    const seedValues = await Promise.all(
        pdaNode.seeds.map(async (seedNode): Promise<ReadonlyUint8Array> => {
            if (seedNode.kind === 'constantPdaSeedNode') {
                return await resolveStandaloneConstantSeed(root, programAddress, seedNode);
            }
            if (seedNode.kind === 'variablePdaSeedNode') {
                return await resolveStandaloneVariableSeed(root, seedNode, seedInputs);
            }
            throw new CodamaError(CODAMA_ERROR__UNRECOGNIZED_NODE_KIND, {
                kind: getMaybeNodeKind(seedNode) ?? 'unknown',
            });
        }),
    );

    return await getProgramDerivedAddress({ programAddress, seeds: seedValues });
}

function resolveStandaloneConstantSeed(
    root: RootNode,
    programAddress: Address,
    seedNode: RegisteredPdaSeedNode,
): Promise<ReadonlyUint8Array> {
    if (!isNode(seedNode, 'constantPdaSeedNode')) {
        throw new CodamaError(CODAMA_ERROR__UNEXPECTED_NODE_KIND, {
            expectedKinds: ['constantPdaSeedNode'],
            kind: seedNode.kind,
            node: seedNode,
        });
    }
    const visitor = createPdaSeedValueVisitor({
        accountsInput: undefined,
        argumentsInput: undefined,
        ixNode: STANDALONE_IX_NODE,
        programId: programAddress,
        resolutionPath: [],
        resolversInput: undefined,
        root,
    });
    return visitOrElse(seedNode.value, visitor, node => {
        throw new CodamaError(CODAMA_ERROR__UNEXPECTED_NODE_KIND, {
            expectedKinds: Array.from(PDA_SEED_VALUE_SUPPORTED_NODE_KINDS),
            kind: node.kind,
            node,
        });
    });
}

function resolveStandaloneVariableSeed(
    root: RootNode,
    seedNode: VariablePdaSeedNode,
    seedInputs: Record<string, unknown>,
): Promise<ReadonlyUint8Array> {
    const input = seedInputs[seedNode.name];
    const typeNode = seedNode.type;

    // remainderOptionTypeNode seeds are optional — null means zero bytes.
    if (input === undefined || input === null) {
        if (isNode(typeNode, 'remainderOptionTypeNode')) {
            return Promise.resolve(new Uint8Array(0));
        }
        throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__ARGUMENT_MISSING, {
            argumentName: seedNode.name,
            instructionName: camelCase('standaloneSeedNode'),
        });
    }

    // For simple string seeds encode directly with UTF-8 (no length prefix)
    if (isNode(typeNode, 'stringTypeNode')) {
        if (typeof input !== 'string') {
            throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_ARGUMENT_TYPE, {
                actualType: formatValueType(input),
                expectedType: 'string',
                nodeKind: 'stringTypeNode',
            });
        }
        return Promise.resolve(getMemoizedUtf8Encoder().encode(input));
    }

    // Create a synthetic instructionArgumentNode so getNodeCodec can resolve the type.
    // The seed's declared type is used directly (no size-prefix wrapper).
    const syntheticArgNode = createSyntheticArgNode(seedNode);
    const codec = getNodeCodec([root, root.program, syntheticArgNode]);
    const transformer = createInputValueTransformer(typeNode, root, { bytesEncoding: 'base16' });
    const transformedInput = transformer(input);
    return Promise.resolve(codec.encode(transformedInput));
}

function createSyntheticArgNode(seedNode: VariablePdaSeedNode) {
    return {
        docs: [] as string[],
        kind: 'instructionArgumentNode' as const,
        name: seedNode.name,
        type: seedNode.type,
    };
}
