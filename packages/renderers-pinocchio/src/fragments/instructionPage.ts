import { logWarn } from '@codama/errors';
import {
    InstructionArgumentNode,
    InstructionNode,
    isNode,
    pascalCase,
    snakeCase,
    SnakeCaseString,
    structTypeNodeFromInstructionArgumentNodes,
    VALUE_NODES,
} from '@codama/nodes';
import { getLastNodeFromPath, NodePath, visit } from '@codama/visitors-core';

import { getTypeManifestVisitor, TypeManifest } from '../getTypeManifestVisitor';
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
    const instructionArguments = getParsedInstructionArguments(instructionNode, accountsAndArgsConflicts, scope);
    const hasArgs = instructionArguments.some(arg => arg.defaultValueStrategy !== 'omitted');
    const hasOptional = instructionArguments.some(
        arg => !arg.resolvedDefaultValue && arg.defaultValueStrategy !== 'omitted',
    );

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
    displayName: SnakeCaseString;
    fixedSize: number | null;
    manifest: TypeManifest;
    resolvedDefaultValue: Fragment | null;
    resolvedInnerOptionType: Fragment | null;
};

function getParsedInstructionArguments(
    instructionNode: InstructionNode,
    accountsAndArgsConflicts: string[],
    scope: Pick<RenderScope, 'byteSizeVisitor' | 'getImportFrom' | 'getTraitsFromNode'>,
): ParsedInstructionArgument[] {
    const argumentVisitor = getTypeManifestVisitor({
        ...scope,
        nestedStruct: true,
        parentName: `${pascalCase(instructionNode.name)}InstructionData`,
    });

    return instructionNode.arguments.map(argument => {
        return {
            ...argument,
            displayName: accountsAndArgsConflicts.includes(argument.name)
                ? (`${snakeCase(argument.name)}_arg` as SnakeCaseString)
                : snakeCase(argument.name),
            fixedSize: visit(argument.type, scope.byteSizeVisitor),
            manifest: visit(argument.type, argumentVisitor),
            resolvedDefaultValue:
                !!argument.defaultValue && isNode(argument.defaultValue, VALUE_NODES)
                    ? renderValueNode(argument.defaultValue, scope.getImportFrom)
                    : null,
            resolvedInnerOptionType: isNode(argument.type, 'optionTypeNode')
                ? visit(argument.type.item, argumentVisitor).type
                : null,
        };
    });
}

function getConflictsBetweenAccountsAndArguments(instructionNode: InstructionNode): string[] {
    const allNames = [
        ...instructionNode.accounts.map(account => account.name),
        ...instructionNode.arguments.map(argument => argument.name),
    ];
    const duplicates = allNames.filter((e, i, a) => a.indexOf(e) !== i);
    return [...new Set(duplicates)];
}
