import { InstructionAccountNode, pascalCase } from '@codama/nodes';

import { Fragment, fragment } from './common';

export function getInstructionAccountMetaFragment(instructionAccountNode: InstructionAccountNode): Fragment {
    const typeParam = `TAccount${pascalCase(instructionAccountNode.name)}`;

    // Writable, signer.
    if (instructionAccountNode.isSigner === true && instructionAccountNode.isWritable) {
        return fragment(`WritableSignerAccount<${typeParam}> & AccountSignerMeta<${typeParam}>`)
            .addImports('solanaInstructions', ['type WritableSignerAccount'])
            .addImports('solanaSigners', ['type AccountSignerMeta']);
    }

    // Readonly, signer.
    if (instructionAccountNode.isSigner === true) {
        return fragment(`ReadonlySignerAccount<${typeParam}> & AccountSignerMeta<${typeParam}>`)
            .addImports('solanaInstructions', ['type ReadonlySignerAccount'])
            .addImports('solanaSigners', ['type AccountSignerMeta']);
    }

    // Writable, non-signer or optional signer.
    if (instructionAccountNode.isWritable) {
        return fragment(`WritableAccount<${typeParam}>`).addImports('solanaInstructions', 'type WritableAccount');
    }

    // Readonly, non-signer or optional signer.
    return fragment(`ReadonlyAccount<${typeParam}>`).addImports('solanaInstructions', 'type ReadonlyAccount');
}
