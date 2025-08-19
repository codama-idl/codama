import { InstructionAccountNode, pascalCase } from '@codama/nodes';
import { pipe } from '@codama/visitors-core';

import { addFragmentImports, Fragment, fragment } from '../utils';

export function getInstructionAccountMetaFragment(instructionAccountNode: InstructionAccountNode): Fragment {
    const typeParam = `TAccount${pascalCase(instructionAccountNode.name)}`;

    // Writable, signer.
    if (instructionAccountNode.isSigner === true && instructionAccountNode.isWritable) {
        return pipe(
            fragment(`WritableSignerAccount<${typeParam}> & AccountSignerMeta<${typeParam}>`),
            f => addFragmentImports(f, 'solanaInstructions', ['type WritableSignerAccount']),
            f => addFragmentImports(f, 'solanaSigners', ['type AccountSignerMeta']),
        );
    }

    // Readonly, signer.
    if (instructionAccountNode.isSigner === true) {
        return pipe(
            fragment(`ReadonlySignerAccount<${typeParam}> & AccountSignerMeta<${typeParam}>`),
            f => addFragmentImports(f, 'solanaInstructions', ['type ReadonlySignerAccount']),
            f => addFragmentImports(f, 'solanaSigners', ['type AccountSignerMeta']),
        );
    }

    // Writable, non-signer or optional signer.
    if (instructionAccountNode.isWritable) {
        return pipe(fragment(`WritableAccount<${typeParam}>`), f =>
            addFragmentImports(f, 'solanaInstructions', ['type WritableAccount']),
        );
    }

    // Readonly, non-signer or optional signer.
    return pipe(fragment(`ReadonlyAccount<${typeParam}>`), f =>
        addFragmentImports(f, 'solanaInstructions', ['type ReadonlyAccount']),
    );
}
