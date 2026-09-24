import { logWarn } from '@codama/errors';
import { camelCase } from '@codama/fragments/casing';
import {
    assertIsNode,
    identifierString,
    IdentifierString,
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
    return visit(pdaNode({ ...pda, identifier: '' }), hashVisitor);
}

function getUniquePdaName(name: IdentifierString, usedNames: Set<IdentifierString>): IdentifierString {
    if (!usedNames.has(name)) return name;
    let suffix = 2;
    let candidate = identifierString(camelCase(`${name}${suffix}`));
    while (usedNames.has(candidate)) {
        suffix++;
        candidate = identifierString(camelCase(`${name}${suffix}`));
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
    const usedNames = new Set<IdentifierString>((program.pdas ?? []).map(p => p.identifier));
    const nameToFingerprint = new Map<IdentifierString, Fingerprint>();

    const rewrittenInstructions = (program.instructions ?? []).map(instruction => {
        const rewrittenAccounts = (instruction.accounts ?? []).map(account => {
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
                let resolvedName = pda.identifier;
                const existingFingerprint = nameToFingerprint.get(resolvedName);

                if (existingFingerprint !== undefined && existingFingerprint !== fingerprint) {
                    resolvedName = identifierString(camelCase(`${instruction.identifier}_${pda.identifier}`));
                    logWarn(
                        `PDA name collision: "${pda.identifier}" has different seeds across instructions. ` +
                            `Renaming to "${resolvedName}".`,
                    );
                }

                resolvedName = getUniquePdaName(resolvedName, usedNames);

                usedNames.add(resolvedName);
                nameToFingerprint.set(resolvedName, fingerprint);
                pdaMap.set(fingerprint, pdaNode({ ...pda, identifier: resolvedName }));
            }

            const extractedPda = pdaMap.get(fingerprint)!;
            const defaultValue = { ...account.defaultValue, pda: pdaLinkNode(extractedPda.identifier) };
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
        pdas: [...(program.pdas ?? []), ...pdaMap.values()],
    });
}
