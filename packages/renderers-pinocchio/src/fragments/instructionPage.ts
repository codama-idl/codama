import { logWarn } from '@codama/errors';
import {
    InstructionArgumentNode,
    InstructionNode,
    isNode,
    pascalCase,
    structTypeNodeFromInstructionArgumentNodes,
    VALUE_NODES,
} from '@codama/nodes';
import { getLastNodeFromPath, NodePath, visit } from '@codama/visitors-core';

import { getTypeManifestVisitor, TypeManifestVisitor } from '../getTypeManifestVisitor';
import { renderValueNode } from '../renderValueNodeVisitor';
import { Fragment, fragment, getPageFragment, RenderScope } from '../utils';

export function getInstructionPageFragment(
    scope: Pick<RenderScope, 'byteSizeVisitor' | 'dependencyMap' | 'getImportFrom' | 'getTraitsFromNode'> & {
        instructionPath: NodePath<InstructionNode>;
    },
): Fragment {
    const instructionNode = getLastNodeFromPath(scope.instructionPath);

    // canMergeAccountsAndArgs
    const accountsAndArgsConflicts = getConflictsBetweenAccountsAndArguments(instructionNode);
    if (accountsAndArgsConflicts.length > 0) {
        logWarn(
            `[Rust] Accounts and args of instruction [${instructionNode.name}] have the following ` +
                `conflicting attributes [${accountsAndArgsConflicts.join(', ')}]. ` +
                `Thus, the conflicting arguments will be suffixed with "_arg". ` +
                'You may want to rename the conflicting attributes.',
        );
    }

    // Instruction args.
    const instructionArgs: ParsedInstructionArgument[] = [];
    // let hasArgs = false;
    // let hasOptional = false;
    // hasArgs = hasArgs || argument.defaultValueStrategy !== 'omitted';
    // hasOptional = hasOptional || (hasDefaultValue && argument.defaultValueStrategy !== 'omitted');

    const argumentVisitor = getTypeManifestVisitor({
        ...scope,
        nestedStruct: true,
        parentName: `${pascalCase(instructionNode.name)}InstructionData`,
    });

    const struct = structTypeNodeFromInstructionArgumentNodes(instructionNode.arguments);
    const structVisitor = getTypeManifestVisitor({
        ...scope,
        parentName: `${pascalCase(instructionNode.name)}InstructionData`,
    });
    const typeManifest = visit(struct, structVisitor);
    const instructionSize = visit(struct, scope.byteSizeVisitor);

    // imports: imports
    //     .remove(`generatedInstructions::${pascalCase(node.name)}`)
    //     .toString(dependencyMap),

    return getPageFragment(fragment``, scope);
}

type ParsedInstructionArgument = InstructionArgumentNode & {
    default: boolean;
    innerOptionType: string | null;
    name: string;
    optional: boolean;
    size: number;
    type: string;
    value: string | null;
};

function getParsedInstructionArgument(
    argument: InstructionArgumentNode,
    argumentVisitor: TypeManifestVisitor,
    accountsAndArgsConflicts: string[],
    scope: Pick<RenderScope, 'byteSizeVisitor' | 'getImportFrom'>,
): ParsedInstructionArgument {
    const manifest = visit(argument.type, argumentVisitor);
    const innerOptionType = isNode(argument.type, 'optionTypeNode')
        ? manifest.type.content.slice('Option<'.length, -1)
        : null;

    const hasDefaultValue = !!argument.defaultValue && isNode(argument.defaultValue, VALUE_NODES);
    let renderValue: string | null = null;
    if (hasDefaultValue) {
        const { imports: argImports, render: value } = renderValueNode(argument.defaultValue, scope.getImportFrom);
        imports.mergeWith(argImports);
        renderValue = value;
    }

    const name = accountsAndArgsConflicts.includes(argument.name) ? `${argument.name}_arg` : argument.name;

    return {
        default: hasDefaultValue && argument.defaultValueStrategy === 'omitted',
        innerOptionType,
        name,
        optional: hasDefaultValue && argument.defaultValueStrategy !== 'omitted',
        size: visit(argument.type, scope.byteSizeVisitor) as number, // We fail later if the whole data is variable.
        type: manifest.type,
        value: renderValue,
    };
}

function getConflictsBetweenAccountsAndArguments(instructionNode: InstructionNode): string[] {
    const allNames = [
        ...instructionNode.accounts.map(account => account.name),
        ...instructionNode.arguments.map(argument => argument.name),
    ];
    const duplicates = allNames.filter((e, i, a) => a.indexOf(e) !== i);
    return [...new Set(duplicates)];
}
