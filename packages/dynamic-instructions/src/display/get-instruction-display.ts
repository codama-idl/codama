import { type ParsedInstruction, parseInstruction } from '@codama/dynamic-parsers';
import { getLastNodeFromPath, type RootNode, titleCase } from 'codama';

import { buildDisplayContext } from './build-display-context';
import { interpolateIntent } from './interpolate-intent';
import { listFallback } from './list-fallback';
import type { GetInstructionDisplayOptions, InstructionDisplay } from './types';

/** A concrete on-chain instruction, as accepted by `@codama/dynamic-parsers`' `parseInstruction`. */
type Instruction = Parameters<typeof parseInstruction>[1];

/**
 * Resolves a concrete instruction into its human-readable display.
 *
 * Parses the raw instruction against the root, then derives its display. Returns `null` when
 * the instruction cannot be identified or decoded — parsing failure is an expected outcome
 * (e.g. when probing an instruction from an unknown program), not an error.
 */
export async function getInstructionDisplay(
    root: RootNode,
    instruction: Instruction,
    options: GetInstructionDisplayOptions = {},
): Promise<InstructionDisplay | null> {
    const parsedInstruction = parseInstruction(root, instruction);
    if (!parsedInstruction) return null;
    return await getInstructionDisplayFromParsedInstruction(root, parsedInstruction, options);
}

/**
 * Resolves an already-parsed instruction into its human-readable display.
 *
 * Computes the intent label and renders both display modes — the interpolated sentence and the
 * structured fallback list — leaving the choice between them to the renderer.
 */
export async function getInstructionDisplayFromParsedInstruction(
    root: RootNode,
    parsedInstruction: ParsedInstruction,
    options: GetInstructionDisplayOptions = {},
): Promise<InstructionDisplay> {
    const displayContext = await buildDisplayContext(root, parsedInstruction, options);
    const instruction = getLastNodeFromPath(displayContext.parsedInstruction.path);

    const intent = instruction.display?.intent ?? titleCase(instruction.name);
    const [interpolatedIntent, fields] = await Promise.all([
        interpolateIntent(displayContext),
        listFallback(displayContext),
    ]);

    return { fields, intent, interpolatedIntent };
}
