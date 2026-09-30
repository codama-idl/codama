import { getResolutionRefs } from '@codama/dynamic-address-resolution/codegen';
import { pascalCase, type RootNode } from 'codama';

import { getInstructionSignerRef } from './generate-signer-types';

/**
 * Generate the `${Program}InstructionBuilders` aggregate map type.
 * Keys each instruction name to its `InstructionsBuilderFn` signature.
 *
 * NOTE: it is intentionally NOT exported as public method.
 * Use `generateTypes` instead.
 */
export function generateInstructionBuildersMap(idl: RootNode): string {
    const programName = pascalCase(idl.program.identifier);
    let output = `/**
 * Strongly-typed instruction builders for ${programName}.
 */
export type ${programName}InstructionBuilders = {\n`;

    for (const ix of idl.program.instructions ?? []) {
        const refs = getResolutionRefs(ix, idl.program.definedTypes ?? []);
        const signerRef = getInstructionSignerRef(ix);
        const dataGeneric = refs.dataRef ?? 'undefined';
        const signersGeneric = signerRef.signersRef ?? 'string[]';
        output += `    ${ix.identifier}: InstructionsBuilderFn<${dataGeneric}, ${refs.accountsRef}, ${signersGeneric}>;\n`;
    }

    output += '};\n';
    return output;
}
