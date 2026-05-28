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
    const programName = pascalCase(idl.program.name);
    let output = `/**
 * Strongly-typed instruction builders for ${programName}.
 */
export type ${programName}InstructionBuilders = {\n`;

    for (const ix of idl.program.instructions) {
        const refs = getResolutionRefs(ix);
        const signerRef = getInstructionSignerRef(ix);
        const argsGeneric = refs.argsRef ?? 'Record<string, never>';
        const signersGeneric = signerRef.signersRef ?? 'string[]';
        const resolversGeneric = refs.resolversRef ? `, ${refs.resolversRef}` : '';
        output += `    ${ix.name}: InstructionsBuilderFn<${argsGeneric}, ${refs.accountsRef}, ${signersGeneric}${resolversGeneric}>;\n`;
    }

    output += '};\n';
    return output;
}
