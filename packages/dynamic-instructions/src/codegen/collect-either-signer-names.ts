import type { InstructionNode } from 'codama';

/**
 * Collect the names of accounts on an instruction with `isSigner: 'either'`.
 */
export function collectEitherSignerNames(ix: InstructionNode): string[] {
    return (ix.accounts ?? []).filter(acc => acc.isSigner === 'either').map(acc => acc.name);
}
