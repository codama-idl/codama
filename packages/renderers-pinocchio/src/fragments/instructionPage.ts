import { logWarn } from '@codama/errors';
import {
    InstructionArgumentNode,
    InstructionNode,
    isNode,
    pascalCase,
    snakeCase,
    SnakeCaseString,
    VALUE_NODES,
} from '@codama/nodes';
import { getLastNodeFromPath, NodePath, visit } from '@codama/visitors-core';

import {
    addFragmentImports,
    Fragment,
    fragment,
    getDocblockFragment,
    getPageFragment,
    mergeFragments,
    RenderScope,
} from '../utils';
import { getTypeManifestVisitor, TypeManifest } from '../visitors/getTypeManifestVisitor';
import { renderValueNode } from '../visitors/renderValueNodeVisitor';

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

    // Instruction arguments.
    const instructionArguments = getParsedInstructionArguments(instructionNode, accountsAndArgsConflicts, scope);
    const hasArgs = instructionArguments.some(arg => arg.defaultValueStrategy !== 'omitted');
    const hasOptional = instructionArguments.some(
        arg => !arg.resolvedDefaultValue && arg.defaultValueStrategy !== 'omitted',
    );

    // Helpers.
    const instructionFixedSize = visit(instructionNode, scope.byteSizeVisitor);
    const lifetime = instructionNode.accounts.length > 0 ? "<'a>" : '';

    return getPageFragment(
        mergeFragments(
            [
                getInstructionStructFragment(instructionNode, instructionArguments, lifetime),
                getInstructionImplFragment(instructionNode, instructionArguments, lifetime),
                getInstructionNestedStructsFragment(instructionArguments),
            ],
            cs => cs.join('\n\n'),
        ),
        scope,
    );
}

function getInstructionStructFragment(
    instructionNode: InstructionNode,
    instructionArguments: ParsedInstructionArgument[],
    lifetime: string,
) {
    const accountsFragment = mergeFragments(
        instructionNode.accounts.map(account => {
            const docs = getDocblockFragment(account.docs ?? [], true);
            const name = snakeCase(account.name);
            const type = addFragmentImports(
                account.isSigner === 'either' ? fragment`(&'a AccountInfo, bool)` : fragment`&'a AccountInfo`,
                ['pinocchio::account_info::AccountInfo'],
            );
            return account.isOptional
                ? fragment`${docs}pub ${name}: Option<${type}>,`
                : fragment`${docs}pub ${name}: ${type},`;
        }),
        cs => cs.join('\n'),
    );

    const argumentsFragment = mergeFragments(
        instructionArguments
            .filter(arg => !arg.resolvedDefaultValue)
            .map(arg => {
                const docs = getDocblockFragment(arg.docs ?? [], true);
                return fragment`${docs}pub ${arg.displayName}: ${arg.manifest.type},`;
            }),
        cs => cs.join('\n'),
    );

    return fragment`/// \`${snakeCase(instructionNode.name)}\` CPI helper.
pub struct ${pascalCase(instructionNode.name)}${lifetime} {
  ${accountsFragment}
  ${argumentsFragment}
}`;
}

function getInstructionImplFragment(
    instructionNode: InstructionNode,
    _instructionArguments: ParsedInstructionArgument[],
    lifetime: string,
) {
    const accountsFragment = mergeFragments(
        instructionNode.accounts.map(account => {
            const name = snakeCase(account.name);
            const isWritable = account.isWritable ? 'true' : 'false';
            const accountMetaArguments =
                account.isSigner === 'either'
                    ? fragment`self.${name}.0.key(), ${isWritable}, self.${name}.1`
                    : fragment`self.${name}.key(), ${isWritable}, ${account.isSigner}`;
            return fragment`pinocchio::instruction::AccountMeta::new(${accountMetaArguments}),`;
        }),
        cs => cs.join('\n'),
    );

    return fragment`impl${lifetime} ${pascalCase(instructionNode.name)}${lifetime} {
    #[inline(always)]
    pub fn invoke(&self) -> pinocchio::ProgramResult {
        self.invoke_signed(&[])
    }

    pub fn invoke_signed(&self, _signers: &[pinocchio::instruction::Signer]) -> pinocchio::ProgramResult {

      // account metadata
      let account_metas: [pinocchio::instruction::AccountMeta; {{ instruction.accounts.length }}] = [
        ${accountsFragment}
      ];

      Ok(())
    }
}`;
}

function getInstructionNestedStructsFragment(instructionArguments: ParsedInstructionArgument[]): Fragment {
    return mergeFragments(
        instructionArguments.flatMap(arg => arg.manifest.nestedStructs),
        cs => cs.join('\n\n'),
    );
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
