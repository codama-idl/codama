import { InstructionAccountNode, InstructionInputValueNode, pascalCase } from '@codama/nodes';
import {
    findInstructionNodeFromPath,
    findProgramNodeFromPath,
    getLastNodeFromPath,
    LinkableDictionary,
    NodePath,
    pipe,
} from '@codama/visitors-core';

import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { ImportMap } from '../ImportMap';
import { Fragment, fragment, mergeFragmentImports } from '../utils';

export function getInstructionAccountTypeParamFragment(
    scope: Pick<GlobalFragmentScope, 'linkables'> & {
        allowAccountMeta: boolean;
        instructionAccountPath: NodePath<InstructionAccountNode>;
    },
): Fragment {
    const { instructionAccountPath, allowAccountMeta, linkables } = scope;
    const instructionAccountNode = getLastNodeFromPath(instructionAccountPath);
    const instructionNode = findInstructionNodeFromPath(instructionAccountPath)!;
    const programNode = findProgramNodeFromPath(instructionAccountPath)!;
    const typeParam = `TAccount${pascalCase(instructionAccountNode.name)}`;
    const accountMeta = allowAccountMeta ? ' | AccountMeta<string>' : '';
    const imports = new ImportMap();
    if (allowAccountMeta) {
        imports.add('solanaInstructions', 'type AccountMeta');
    }

    if (instructionNode.optionalAccountStrategy === 'omitted' && instructionAccountNode.isOptional) {
        return pipe(fragment(`${typeParam} extends string${accountMeta} | undefined = undefined`), f =>
            mergeFragmentImports(f, [imports]),
        );
    }

    const defaultAddress = getDefaultAddress(instructionAccountNode.defaultValue, programNode.publicKey, linkables);

    return pipe(fragment(`${typeParam} extends string${accountMeta} = ${defaultAddress}`), f =>
        mergeFragmentImports(f, [imports]),
    );
}

function getDefaultAddress(
    defaultValue: InstructionInputValueNode | undefined,
    programId: string,
    linkables: LinkableDictionary,
): string {
    switch (defaultValue?.kind) {
        case 'publicKeyValueNode':
            return `"${defaultValue.publicKey}"`;
        case 'programLinkNode':
            // eslint-disable-next-line no-case-declarations
            const programNode = linkables.get([defaultValue]);
            return programNode ? `"${programNode.publicKey}"` : 'string';
        case 'programIdValueNode':
            return `"${programId}"`;
        default:
            return 'string';
    }
}
