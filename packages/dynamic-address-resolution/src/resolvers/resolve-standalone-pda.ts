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
import type { PdaNode, RegisteredPdaSeedNode, RootNode, VariablePdaSeedNode } from 'codama';
import { camelCase, isNode } from 'codama';

import { toAddress } from '../shared/address';
import { getMemoizedUtf8Encoder } from '../shared/codecs';
import { formatValueType, getMaybeNodeKind } from '../shared/util';
import { createCodecInputTransformer } from '../visitors/codec-input-transformer';
import { resolveConstantPdaSeedValue } from './resolve-constant-pda-seed-value';

/**
 * Derives a PDA from a standalone `PdaNode` and user-supplied seed values,
 * without requiring an instruction context.
 */
export async function resolveStandalonePda(
    root: RootNode,
    pdaNode: PdaNode,
    seedInputs: Record<string, unknown> = {},
): Promise<ProgramDerivedAddress> {
    const programAddress = toAddress(pdaNode.programId || root.program.publicKey);
    const seedValues = await Promise.all(
        (pdaNode.seeds ?? []).map(async (seedNode): Promise<ReadonlyUint8Array> => {
            if (seedNode.kind === 'constantPdaSeedNode') {
                return await resolveStandaloneConstantSeed(programAddress, seedNode);
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
    return resolveConstantPdaSeedValue(seedNode.value, { programId: programAddress });
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
    const transformer = createCodecInputTransformer(typeNode, root, { bytesEncoding: 'base16' });
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
