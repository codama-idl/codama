import { InstructionAccountNode, pascalCase } from '@kinobi-so/nodes';

import { Fragment, fragment } from './common';

export function getInstructionAccountMetaFragment(instructionAccountNode: InstructionAccountNode): Fragment {
    const typeParam = `TAccount${pascalCase(instructionAccountNode.name)}`;

    // Writable, signer.
    if (instructionAccountNode.isSigner === true && instructionAccountNode.isWritable) {
        return fragment(`WritableSignerAccount<${typeParam}> & IAccountSignerMeta<${typeParam}>`)
            .addImports('solanaInstructions', ['WritableSignerAccount'])
            .addImports('solanaSigners', ['IAccountSignerMeta']);
    }

    // Readonly, signer.
    if (instructionAccountNode.isSigner === true) {
        return fragment(`ReadonlySignerAccount<${typeParam}> & IAccountSignerMeta<${typeParam}>`)
            .addImports('solanaInstructions', ['ReadonlySignerAccount'])
            .addImports('solanaSigners', ['IAccountSignerMeta']);
    }

    // Writable, non-signer or optional signer.
    if (instructionAccountNode.isWritable) {
        return fragment(`WritableAccount<${typeParam}>`).addImports('solanaInstructions', 'WritableAccount');
    }

    // Readonly, non-signer or optional signer.
    return fragment(`ReadonlyAccount<${typeParam}>`).addImports('solanaInstructions', 'ReadonlyAccount');
}
