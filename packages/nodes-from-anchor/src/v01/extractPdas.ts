import {
    camelCase,
    type CamelCaseString,
    instructionAccountNode,
    type InstructionNode,
    instructionNode,
    isNode,
    pdaLinkNode,
    type PdaNode,
    pdaNode,
    type ProgramNode,
    programNode,
} from '@codama/nodes';

const ATA_PROGRAM_ID = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';

function pdaFingerprint(pda: PdaNode): string {
    return JSON.stringify({ programId: pda.programId, seeds: pda.seeds });
}

export function extractPdasFromProgram(program: ProgramNode): ProgramNode {
    const pdaMap = new Map<string, { name: CamelCaseString; pdaNode: PdaNode }>();
    const nameToFingerprint = new Map<CamelCaseString, string>();

    // Collect inline PDAs from all instruction accounts.
    for (const instruction of program.instructions) {
        for (const account of instruction.accounts) {
            if (
                !account.defaultValue ||
                !isNode(account.defaultValue, 'pdaValueNode') ||
                !isNode(account.defaultValue.pda, 'pdaNode')
            ) {
                continue;
            }

            const pda = account.defaultValue.pda;
            if (pda.programId === ATA_PROGRAM_ID) continue;

            const fingerprint = pdaFingerprint(pda);
            if (pdaMap.has(fingerprint)) continue;

            let resolvedName = pda.name;
            const existingFingerprint = nameToFingerprint.get(resolvedName);

            if (existingFingerprint !== undefined && existingFingerprint !== fingerprint) {
                resolvedName = camelCase(`${pda.name}_${instruction.name}`);
                console.warn(
                    `PDA name collision: "${pda.name}" has different seeds across instructions. ` +
                        `Renaming to "${resolvedName}".`,
                );
            }

            nameToFingerprint.set(resolvedName, fingerprint);
            pdaMap.set(fingerprint, {
                name: resolvedName,
                pdaNode: pdaNode({ ...pda, name: resolvedName }),
            });
        }
    }

    // Rewrite instructions: replace inline pdaNode with pdaLinkNode.
    const rewrittenInstructions = program.instructions.map(instruction => {
        const rewrittenAccounts = instruction.accounts.map(account => {
            if (
                !account.defaultValue ||
                !isNode(account.defaultValue, 'pdaValueNode') ||
                !isNode(account.defaultValue.pda, 'pdaNode')
            ) {
                return account;
            }

            if (account.defaultValue.pda.programId === ATA_PROGRAM_ID) return account;

            const entry = pdaMap.get(pdaFingerprint(account.defaultValue.pda));
            if (!entry) return account;

            const defaultValue = { ...account.defaultValue, pda: pdaLinkNode(entry.name) };
            return instructionAccountNode({ ...account, defaultValue });
        });

        return instructionNode({
            ...instruction,
            accounts: rewrittenAccounts,
        }) as InstructionNode;
    });

    return programNode({
        ...program,
        instructions: rewrittenInstructions,
        pdas: [...pdaMap.values()].map(entry => entry.pdaNode),
    });
}
