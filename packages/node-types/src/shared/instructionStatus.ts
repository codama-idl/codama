/**
 * The status of an instruction.
 *
 * - `live`: The instruction is accessible (the default state).
 * - `deprecated`: The instruction is about to be archived.
 * - `archived`: The instruction is no longer accessible. Note that this is better
 *   than simply removing the instruction from the Codama IDL as explorers would
 *   still need to parse old instructions for the program.
 * - `draft`: The instruction is accessible but not fully implemented yet.
 */
export type InstructionStatus = 'archived' | 'deprecated' | 'draft' | 'live';

