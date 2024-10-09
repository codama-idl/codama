import {
    InstructionAccountNode,
    InstructionInputValueNode,
    InstructionNode,
    pascalCase,
    ProgramNode,
} from '@codama/nodes';
import { LinkableDictionary } from '@codama/visitors-core';

import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { ImportMap } from '../ImportMap';
import { Fragment, fragment } from './common';

export function getInstructionAccountTypeParamFragment(
    scope: Pick<GlobalFragmentScope, 'linkables'> & {
        allowAccountMeta: boolean;
        instructionAccountNode: InstructionAccountNode;
        instructionNode: InstructionNode;
        programNode: ProgramNode;
    },
): Fragment {
    const { instructionNode, instructionAccountNode, programNode, allowAccountMeta, linkables } = scope;
    const typeParam = `TAccount${pascalCase(instructionAccountNode.name)}`;
    const accountMeta = allowAccountMeta ? ' | IAccountMeta<string>' : '';
    const imports = new ImportMap();
    if (allowAccountMeta) {
        imports.add('solanaInstructions', 'type IAccountMeta');
    }

    if (instructionNode.optionalAccountStrategy === 'omitted' && instructionAccountNode.isOptional) {
        return fragment(`${typeParam} extends string${accountMeta} | undefined = undefined`, imports);
    }

    const defaultAddress = getDefaultAddress(instructionAccountNode.defaultValue, programNode.publicKey, linkables);

    return fragment(`${typeParam} extends string${accountMeta} = ${defaultAddress}`, imports);
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
            const programNode = linkables.get(defaultValue);
            return programNode ? `"${programNode.publicKey}"` : 'string';
        case 'programIdValueNode':
            return `"${programId}"`;
        default:
            return 'string';
    }
}
