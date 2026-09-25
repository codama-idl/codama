import { CODAMA_ERROR__VISITORS__INVALID_PDA_SEED_VALUES, CodamaError } from '@codama/errors';
import {
    accountValueNode,
    assertIsNode,
    dataValueNode,
    INSTRUCTION_INPUT_VALUE_NODES,
    InstructionInputValueNode,
    InstructionNode,
    isNode,
    isNodeFilter,
    PdaNode,
    PdaSeedValueNode,
    pdaSeedValueNode,
    pdaValueNode,
} from '@codama/nodes';
import {
    extendVisitor,
    getInstructionDataFields,
    getLastNodeFromPath,
    identityVisitor,
    LinkableDictionary,
    NodePath,
    pipe,
    Visitor,
} from '@codama/visitors-core';

/**
 * Fills in default values for variable PDA seeds that are not explicitly provided.
 * Namely, public key seeds are filled with an `accountValueNode` when the
 * instruction has an account with the seed's identifier, and other seeds are
 * filled with a `dataValueNode` when the instruction's data has a top-level
 * field with the seed's identifier.
 *
 * An instruction path and linkable dictionary are required to determine which
 * seeds are valid, to follow linked instruction data and to find the PDA of
 * `pdaLinkNode`s. Any invalid default seed won't be filled in.
 *
 * Strict mode goes one step further and will throw an error if the final array of
 * `pdaSeedValueNode`s contains invalid seeds or if there aren't enough variable seeds.
 */
export function fillDefaultPdaSeedValuesVisitor(
    instructionPath: NodePath<InstructionNode>,
    linkables: LinkableDictionary,
    strictMode: boolean = false,
) {
    const instruction = getLastNodeFromPath(instructionPath);
    const dataPaths = new Set<string>(getInstructionDataFields(instructionPath, linkables).map(({ path }) => path));
    const accountIdentifiers = new Set<string>((instruction.accounts ?? []).map(account => account.identifier));

    return pipe(identityVisitor({ keys: INSTRUCTION_INPUT_VALUE_NODES }), v =>
        extendVisitor(v, {
            visitPdaValue(node, { next }) {
                const visitedNode = next(node);
                assertIsNode(visitedNode, 'pdaValueNode');
                const foundPda = isNode(visitedNode.pda, 'pdaNode')
                    ? visitedNode.pda
                    : linkables.get([...instructionPath, visitedNode.pda]);
                if (!foundPda) return visitedNode;
                const seeds = addDefaultSeedValuesFromPdaWhenMissing(
                    foundPda,
                    visitedNode.seeds ?? [],
                    accountIdentifiers,
                    dataPaths,
                );
                if (strictMode && !allSeedsAreValid(foundPda, seeds, accountIdentifiers, dataPaths)) {
                    throw new CodamaError(CODAMA_ERROR__VISITORS__INVALID_PDA_SEED_VALUES, {
                        instruction,
                        instructionName: instruction.identifier,
                        pda: foundPda,
                        pdaName: foundPda.identifier,
                    });
                }
                return pdaValueNode(visitedNode.pda, { ...visitedNode, seeds });
            },
        }),
    ) as Visitor<InstructionInputValueNode, InstructionInputValueNode['kind']>;
}

function addDefaultSeedValuesFromPdaWhenMissing(
    pda: PdaNode,
    existingSeeds: PdaSeedValueNode[],
    accountIdentifiers: Set<string>,
    dataPaths: Set<string>,
): PdaSeedValueNode[] {
    const existingSeedNames = new Set<string>(existingSeeds.map(seed => seed.identifier));
    const defaultSeeds = getDefaultSeedValuesFromPda(pda, accountIdentifiers, dataPaths).filter(
        seed => !existingSeedNames.has(seed.identifier),
    );
    return [...existingSeeds, ...defaultSeeds];
}

function getDefaultSeedValuesFromPda(
    pda: PdaNode,
    accountIdentifiers: Set<string>,
    dataPaths: Set<string>,
): PdaSeedValueNode[] {
    return (pda.seeds ?? []).flatMap((seed): PdaSeedValueNode[] => {
        if (!isNode(seed, 'variablePdaSeedNode')) return [];

        if (isNode(seed.type, 'publicKeyTypeNode') && accountIdentifiers.has(seed.identifier)) {
            return [pdaSeedValueNode(seed.identifier, accountValueNode(seed.identifier))];
        }

        if (dataPaths.has(seed.identifier)) {
            return [pdaSeedValueNode(seed.identifier, dataValueNode(seed.identifier))];
        }

        return [];
    });
}

function allSeedsAreValid(
    pda: PdaNode,
    seeds: PdaSeedValueNode[],
    accountIdentifiers: Set<string>,
    dataPaths: Set<string>,
): boolean {
    const hasAllVariableSeeds = (pda.seeds ?? []).filter(isNodeFilter('variablePdaSeedNode')).length === seeds.length;
    const validSeeds = seeds.every(seed => {
        if (isNode(seed.value, 'accountValueNode')) return accountIdentifiers.has(seed.value.identifier);
        if (isNode(seed.value, 'dataValueNode')) return dataPaths.has(seed.value.path);
        return true;
    });

    return hasAllVariableSeeds && validSeeds;
}
