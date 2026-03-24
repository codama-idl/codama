import { logWarn } from '@codama/errors';
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

function pdaFingerprint(pda: PdaNode, hashVisitor: Visitor<string>): Fingerprint {
    return visit(pdaNode({ ...pda, name: '' }), hashVisitor);
}

function getUniquePdaName(name: CamelCaseString, usedNames: Set<CamelCaseString>): CamelCaseString {
    if (!usedNames.has(name)) return name;
    let suffix = 2;
    let candidate = camelCase(`${name}${suffix}`);
    while (usedNames.has(candidate)) {
        suffix++;
        candidate = camelCase(`${name}${suffix}`);
    }
    return candidate;
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

    const rewrittenInstructions = program.instructions.map(instruction => {
        const rewrittenAccounts = instruction.accounts.map(account => {
            if (
                !account.defaultValue ||
                !isNode(account.defaultValue, 'pdaValueNode') ||
                !isNode(account.defaultValue.pda, 'pdaNode')
            ) {
                return account;
            }

            const pda = account.defaultValue.pda;
            if (pda.programId && pda.programId !== program.publicKey) return account;

            const fingerprint = pdaFingerprint(pda, hashVisitor);

            if (!pdaMap.has(fingerprint)) {
                let resolvedName = pda.name;
                const existingFingerprint = nameToFingerprint.get(resolvedName);

                if (existingFingerprint !== undefined && existingFingerprint !== fingerprint) {
                    resolvedName = camelCase(`${instruction.name}_${pda.name}`);
                    logWarn(
                        `PDA name collision: "${pda.name}" has different seeds across instructions. ` +
                            `Renaming to "${resolvedName}".`,
                    );
                }

                resolvedName = getUniquePdaName(resolvedName, usedNames);

                usedNames.add(resolvedName);
                nameToFingerprint.set(resolvedName, fingerprint);
                pdaMap.set(fingerprint, pdaNode({ ...pda, name: resolvedName }));
            }

            const extractedPda = pdaMap.get(fingerprint)!;
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
