import { InstructionAccountNode, pascalCase } from '@codama/nodes';

import { Fragment, fragment, use } from '../utils';

export function getInstructionAccountMetaFragment(instructionAccountNode: InstructionAccountNode): Fragment {
    const typeParam = `TAccount${pascalCase(instructionAccountNode.name)}`;

    // Writable, signer.
    if (instructionAccountNode.isSigner === true && instructionAccountNode.isWritable) {
        return fragment`${use('type WritableSignerAccount', 'solanaInstructions')}<${typeParam}> & ${use('type AccountSignerMeta', 'solanaSigners')}<${typeParam}>`;
    }

    // Readonly, signer.
    if (instructionAccountNode.isSigner === true) {
        return fragment`${use('type ReadonlySignerAccount', 'solanaInstructions')}<${typeParam}> & ${use('type AccountSignerMeta', 'solanaSigners')}<${typeParam}>`;
    }

    // Writable, non-signer or optional signer.
    if (instructionAccountNode.isWritable) {
        return fragment`${use('type WritableAccount', 'solanaInstructions')}<${typeParam}>`;
    }

    // Readonly, non-signer or optional signer.
    return fragment`${use('type ReadonlyAccount', 'solanaInstructions')}<${typeParam}>`;
}
