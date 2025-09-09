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
import { getInstructionArgumentAssignmentVisitor } from '../visitors';
import { getTypeManifestVisitor, TypeManifest } from '../visitors/getTypeManifestVisitor';
import { renderValueNode } from '../visitors/renderValueNodeVisitor';

/**
 * Get the instruction page fragment.
 */
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

    /*
    const hasArgs = instructionArguments.some(arg => arg.defaultValueStrategy !== 'omitted');
    const hasOptional = instructionArguments.some(
        arg => !arg.resolvedDefaultValue && arg.defaultValueStrategy !== 'omitted',
    );
    */

    // Determines the size of the instruction data. The size is `null` if any of the arguments is
    // variable-sized.
    const instructionFixedSize = visit(instructionNode, scope.byteSizeVisitor);

    return getPageFragment(
        mergeFragments(
            [
                getInstructionStructFragment(instructionNode, instructionArguments),
                getInstructionImplFragment(instructionNode, instructionArguments, instructionFixedSize),
                getInstructionNestedStructsFragment(instructionArguments),
            ],
            cs => cs.join('\n\n'),
        ),
        scope,
    );
}

/**
 * Get the instruction `struct` fragment. The fragment includes the accounts and arguments
 * as fields.
 */
function getInstructionStructFragment(
    instructionNode: InstructionNode,
    instructionArguments: ParsedInstructionArgument[],
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

    const structLifetimes = getLifetimeDeclarations(instructionNode, instructionArguments);
    const argumentsFragment = mergeFragments(
        instructionArguments
            .filter(arg => !arg.resolvedDefaultValue)
            .map(arg => {
                const docs = getDocblockFragment(arg.docs ?? [], true);
                const lifetime = arg.lifetime ? `&'${arg.lifetime} ` : '';
                return fragment`${docs}pub ${arg.displayName}: ${lifetime}${arg.manifest.type},`;
            }),
        cs => cs.join('\n'),
    );

    return fragment`/// Helper for cross-program invocations of \`${snakeCase(instructionNode.name)}\` instruction.
pub struct ${pascalCase(instructionNode.name)}${structLifetimes} {
  ${accountsFragment}
  ${argumentsFragment}
}`;
}

/**
 * Get the instruction `impl` fragment. The fragment includes the `invoke` and `invoke_signed` methods.
 */
function getInstructionImplFragment(
    instructionNode: InstructionNode,
    instructionArguments: ParsedInstructionArgument[],
    instructionFixedSize: number | null,
) {
    const accountMetasFragment = mergeFragments(
        instructionNode.accounts.map(account => {
            const name = snakeCase(account.name);
            const isWritable = account.isWritable ? 'true' : 'false';
            const accountMetaArguments =
                account.isSigner === 'either'
                    ? fragment`self.${name}.0.key(), ${isWritable}, self.${name}.1`
                    : fragment`self.${name}.key(), ${isWritable}, ${account.isSigner}`;
            return fragment`AccountMeta::new(${accountMetaArguments}),`;
        }),
        cs => cs.join('\n'),
    );

    const accountsFragment = mergeFragments(
        instructionNode.accounts.map(account => {
            const name = snakeCase(account.name);
            return fragment`&self.${name},`;
        }),
        cs => cs.join('\n'),
    );

    const instructionDataFragment =
        instructionArguments.length > 0
            ? getInstructionDataFragment(instructionArguments, instructionFixedSize)
            : fragment`let data = &[];`;

    const structLifetimes = getLifetimeDeclarations(instructionNode, instructionArguments, true);

    return addFragmentImports(
        fragment`impl ${pascalCase(instructionNode.name)}${structLifetimes} {
    #[inline(always)]
    pub fn invoke(&self) -> ProgramResult {
        self.invoke_signed(&[])
    }

    pub fn invoke_signed(&self, signers: &[Signer]) -> ProgramResult {

      // account metas
      let account_metas: [AccountMeta; ${instructionNode.accounts.length}] = [
        ${accountMetasFragment}
      ];

      ${instructionDataFragment}

      let instruction = Instruction {
            program_id: &crate::ID,
            accounts: &account_metas,
            data,
        };

        invoke_signed(&instruction, &[${accountsFragment}], signers)
    }
}`,
        [
            'pinocchio::cpi::invoke_signed',
            'pinocchio::instruction::Instruction',
            'pinocchio::instruction::AccountMeta',
            'pinocchio::ProgramResult',
            'pinocchio::instruction::Signer',
        ],
    );
}

/**
 * Get the fragment for any nested `struct`s used in the instruction arguments.
 */
function getInstructionNestedStructsFragment(instructionArguments: ParsedInstructionArgument[]): Fragment {
    return mergeFragments(
        instructionArguments.flatMap(arg => arg.manifest.nestedStructs),
        cs => cs.join('\n\n'),
    );
}

/**
 * Get the fragment that constructs the instruction data. There are several special cases
 * to handle single argument instructions.
 */
function getInstructionDataFragment(
    instructionArguments: ParsedInstructionArgument[],
    instructionFixedSize: number | null,
): Fragment {
    const singleArgumentFragment = getInstructionDataFromSingleArgumentFragment(instructionArguments);
    if (singleArgumentFragment) return singleArgumentFragment;

    const declareDataFragment = addFragmentImports(
        fragment`let mut uninit_data = [UNINIT_BYTE; ${instructionFixedSize !== null ? instructionFixedSize : 0}];`,
        ['super::UNINIT_BYTE', 'core::slice::from_raw_parts'],
    );
    let offset = 0;
    const assignDataContentFragment = mergeFragments(
        instructionArguments.map(argument => {
            const [fragment, updated] = visit(argument.type, getInstructionArgumentAssignmentVisitor(argument, offset));
            offset = updated;
            return fragment;
        }),
        cs => cs.join('\n'),
    );
    const transmuteData = fragment`let data =  unsafe { from_raw_parts(uninit_data.as_ptr() as _, ${offset}) };`;

    return mergeFragments([declareDataFragment, assignDataContentFragment, transmuteData], cs => cs.join('\n'));
}

// When there is a single byte array or string (e.g., `&[u8]`, `&str`) argument, there is
// no need to copy the data into a fixed-size array.
function getInstructionDataFromSingleArgumentFragment(
    instructionArguments: ParsedInstructionArgument[],
): Fragment | undefined {
    if (instructionArguments.length !== 1) return;
    const argument = instructionArguments[0];

    if (isNode(argument.type, 'bytesTypeNode')) {
        return argument.resolvedDefaultValue
            ? fragment`let data = &${argument.resolvedDefaultValue};`
            : fragment`let data = self.${argument.displayName};`;
    }

    if (isNode(argument.type, 'stringTypeNode')) {
        return argument.resolvedDefaultValue
            ? fragment`let data = ${argument.resolvedDefaultValue}.as_bytes();`
            : fragment`let data = self.${argument.displayName}.as_bytes();`;
    }

    // When there is a single byte argument, the instruction data is a single-element byte array.
    if (isNode(argument.type, 'numberTypeNode') && argument.type.format === 'u8') {
        return argument.resolvedDefaultValue
            ? fragment`let data = &[${argument.resolvedDefaultValue}${argument.type.format}];`
            : fragment`let data = &[self.${argument.displayName}];`;
    }

    // When there is a single number (e.g., `u16`, `u32`, `u64`) argument, the instruction data is the
    // little-endian representation of the number.
    if (
        isNode(argument.type, 'numberTypeNode') &&
        argument.type.format !== 'shortU16' &&
        argument.type.endian === 'le'
    ) {
        return argument.resolvedDefaultValue
            ? fragment`let data = &${argument.resolvedDefaultValue}${argument.type.format}.to_le_bytes();`
            : fragment`let data = &self.${argument.displayName}.to_le_bytes();`;
    }
}

export type ParsedInstructionArgument = InstructionArgumentNode & {
    displayName: SnakeCaseString;
    fixedSize: number | null;
    lifetime: string | null;
    manifest: TypeManifest;
    resolvedDefaultValue: Fragment | null;
    resolvedInnerOptionType: Fragment | null;
};

function getParsedInstructionArguments(
    instructionNode: InstructionNode,
    accountsAndArgsConflicts: string[],
    scope: Pick<RenderScope, 'byteSizeVisitor' | 'getImportFrom' | 'getTraitsFromNode'>,
): ParsedInstructionArgument[] {
    const lifetimeIterator = getLifetimeIterator(instructionNode);
    const argumentVisitor = getTypeManifestVisitor({
        ...scope,
        nestedStruct: true,
        parentName: `${pascalCase(instructionNode.name)}InstructionData`,
    });

    return instructionNode.arguments.map(argument => {
        const fixedSize = visit(argument.type, scope.byteSizeVisitor);
        const shouldUseLifetime = fixedSize === null || fixedSize > 8;

        return {
            ...argument,
            displayName: accountsAndArgsConflicts.includes(argument.name)
                ? (`${snakeCase(argument.name)}_arg` as SnakeCaseString)
                : snakeCase(argument.name),
            fixedSize,
            lifetime: shouldUseLifetime ? lifetimeIterator.next().value : null,
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

function getLifetimeIterator(instructionNode: InstructionNode): Iterator<string, string> {
    // Start from 'b instead of 'a if we have accounts.
    let lifetime = instructionNode.accounts.length > 0 ? 1 : 0;
    return {
        next: () => {
            if (lifetime >= 26) {
                throw new Error('Exceeded maximum number of lifetimes (26)');
            }
            return { done: false, value: String.fromCharCode(97 + lifetime++) };
        },
    };
}

function getLifetimeDeclarations(
    instructionNode: InstructionNode,
    instructionArguments: ParsedInstructionArgument[],
    useUnderscore = false,
): string {
    const lifetimes = [
        ...(instructionNode.accounts.length > 0 ? [useUnderscore ? `'_` : `'a`] : []),
        ...instructionArguments.flatMap(arg => (arg.lifetime ? [useUnderscore ? `'_` : `'${arg.lifetime}`] : [])),
    ];
    return lifetimes.length > 0 ? `<${lifetimes.join(', ')}>` : '';
}

function getConflictsBetweenAccountsAndArguments(instructionNode: InstructionNode): string[] {
    const allNames = [
        ...instructionNode.accounts.map(account => account.name),
        ...instructionNode.arguments.map(argument => argument.name),
    ];
    const duplicates = allNames.filter((e, i, a) => a.indexOf(e) !== i);
    return [...new Set(duplicates)];
}
