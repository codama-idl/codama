import { type InstructionNode, pascalCase, type RootNode } from 'codama';

import { collectEitherSignerNames } from './collect-either-signer-names';

/**
 * Generate the per-instruction `${Name}Signers` type alias for instructions with `isSigner: 'either'` accounts.
 */
export function generateSignerTypes(idl: RootNode): string {
    let output = '';
    for (const ix of idl.program.instructions) {
        output += generateSignersTypeBlock(ix);
    }
    return output;
}

/**
 * Symbol registry for the `${Name}Signers` alias.
 * Describe which `isSigner: 'either'` accounts are passed as signers.
 */
export type InstructionSignerRef = {
    hasEitherSigners: boolean;
    signersRef: string | null;
};

export function getInstructionSignerRef(ix: InstructionNode): InstructionSignerRef {
    const hasEitherSigners = collectEitherSignerNames(ix).length > 0;
    return {
        hasEitherSigners,
        signersRef: hasEitherSigners ? `${pascalCase(ix.name)}Signers` : null,
    };
}

function generateSignersTypeBlock(ix: InstructionNode): string {
    const names = collectEitherSignerNames(ix);
    if (names.length === 0) return '';
    const quoted = names.map(name => `'${name}'`);
    return `export type ${pascalCase(ix.name)}Signers = (${quoted.join(' | ')})[];\n\n`;
}
