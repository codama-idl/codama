import {
    assertIsNode,
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
import { bottomUpTransformerVisitor, getUniqueHashStringVisitor, visit, type Visitor } from '@codama/visitors';

type Fingerprint = string;

const ATA_PROGRAM_ID = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';

function pdaFingerprint(pda: PdaNode, hashVisitor: Visitor<string>): Fingerprint {
    return visit(pdaNode({ ...pda, name: '' as CamelCaseString }), hashVisitor);
}

export function extractPdasVisitor() {
    return bottomUpTransformerVisitor([
        {
            select: '[programNode]',
            transform: node => {
                assertIsNode(node, 'programNode');
                return extractPdasFromProgram(node);
            },
        },
    ]);
}

export function extractPdasFromProgram(program: ProgramNode): ProgramNode {
    const hashVisitor = getUniqueHashStringVisitor();
    const pdaMap = new Map<Fingerprint, PdaNode>();
    const usedNames = new Set<CamelCaseString>(program.pdas.map(p => p.name));
    const nameToFingerprint = new Map<CamelCaseString, Fingerprint>();

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

            const fingerprint = pdaFingerprint(pda, hashVisitor);
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

            // Ensure the resolved name doesn't collide with existing or previously extracted PDAs.
            let suffix = 2;
            const baseName = resolvedName;
            while (usedNames.has(resolvedName)) {
                resolvedName = camelCase(`${baseName}${suffix}`);
                suffix++;
            }

            usedNames.add(resolvedName);
            nameToFingerprint.set(resolvedName, fingerprint);
            pdaMap.set(fingerprint, pdaNode({ ...pda, name: resolvedName }));
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

            const extractedPda = pdaMap.get(pdaFingerprint(account.defaultValue.pda, hashVisitor));
            if (!extractedPda) return account;

            const defaultValue = { ...account.defaultValue, pda: pdaLinkNode(extractedPda.name) };
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
        pdas: [...program.pdas, ...pdaMap.values()],
    });
}
