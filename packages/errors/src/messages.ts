/**
 * Heavily inspired by @solana/errors.
 * @see https://github.com/solana-labs/solana-web3.js/blob/master/packages/errors
 */

import {
    KINOBI_ERROR__ANCHOR__ACCOUNT_TYPE_MISSING,
    KINOBI_ERROR__ANCHOR__ARGUMENT_TYPE_MISSING,
    KINOBI_ERROR__ANCHOR__SEED_KIND_UNIMPLEMENTED,
    KINOBI_ERROR__ANCHOR__TYPE_PATH_MISSING,
    KINOBI_ERROR__ANCHOR__UNRECOGNIZED_IDL_TYPE,
    KINOBI_ERROR__LINKED_NODE_NOT_FOUND,
    KINOBI_ERROR__NODE_FILESYSTEM_FUNCTION_UNAVAILABLE,
    KINOBI_ERROR__RENDERERS__UNSUPPORTED_NODE,
    KINOBI_ERROR__UNEXPECTED_NESTED_NODE_KIND,
    KINOBI_ERROR__UNEXPECTED_NODE_KIND,
    KINOBI_ERROR__UNRECOGNIZED_NODE_KIND,
    KINOBI_ERROR__VERSION_MISMATCH,
    KINOBI_ERROR__VISITORS__ACCOUNT_FIELD_NOT_FOUND,
    KINOBI_ERROR__VISITORS__CANNOT_ADD_DUPLICATED_PDA_NAMES,
    KINOBI_ERROR__VISITORS__CANNOT_EXTEND_MISSING_VISIT_FUNCTION,
    KINOBI_ERROR__VISITORS__CANNOT_FLATTEN_STRUCT_WITH_CONFLICTING_ATTRIBUTES,
    KINOBI_ERROR__VISITORS__CANNOT_USE_OPTIONAL_ACCOUNT_AS_PDA_SEED_VALUE,
    KINOBI_ERROR__VISITORS__CYCLIC_DEPENDENCY_DETECTED_WHEN_RESOLVING_INSTRUCTION_DEFAULT_VALUES,
    KINOBI_ERROR__VISITORS__FAILED_TO_VALIDATE_NODE,
    KINOBI_ERROR__VISITORS__INSTRUCTION_ENUM_ARGUMENT_NOT_FOUND,
    KINOBI_ERROR__VISITORS__INVALID_INSTRUCTION_DEFAULT_VALUE_DEPENDENCY,
    KINOBI_ERROR__VISITORS__INVALID_NUMBER_WRAPPER,
    KINOBI_ERROR__VISITORS__INVALID_PDA_SEED_VALUES,
    KINOBI_ERROR__VISITORS__RENDER_MAP_KEY_NOT_FOUND,
    KinobiErrorCode,
} from './codes';

/**
 * WARNING:
 *   - Don't change the meaning of an error message.
 */
export const KinobiErrorMessages: Readonly<{
    // This type makes this data structure exhaustive with respect to `SolanaErrorCode`.
    // TypeScript will fail to build this project if add an error code without a message.
    [P in KinobiErrorCode]: string;
}> = {
    [KINOBI_ERROR__ANCHOR__ACCOUNT_TYPE_MISSING]: 'Account type [$name] is missing from the IDL types.',
    [KINOBI_ERROR__ANCHOR__ARGUMENT_TYPE_MISSING]: 'Argument name [$name] is missing from the instruction definition.',
    [KINOBI_ERROR__ANCHOR__SEED_KIND_UNIMPLEMENTED]: 'Seed kind [$kind] is not implemented.',
    [KINOBI_ERROR__ANCHOR__TYPE_PATH_MISSING]: 'Field type is missing for path [$path] in [$idlType].',
    [KINOBI_ERROR__ANCHOR__UNRECOGNIZED_IDL_TYPE]: 'Unrecognized Anchor IDL type [$idlType].',
    [KINOBI_ERROR__LINKED_NODE_NOT_FOUND]: 'Could not find linked node [$name] from [$kind].',
    [KINOBI_ERROR__NODE_FILESYSTEM_FUNCTION_UNAVAILABLE]:
        'Node.js filesystem function [$fsFunction] is not available in your environment.',
    [KINOBI_ERROR__RENDERERS__UNSUPPORTED_NODE]: 'Cannot render the encountered node of kind [$kind].',
    [KINOBI_ERROR__UNEXPECTED_NESTED_NODE_KIND]: 'Expected nested node of kind [$expectedKinds], got [$kind]',
    [KINOBI_ERROR__UNEXPECTED_NODE_KIND]: 'Expected node of kind [$expectedKinds], got [$kind].',
    [KINOBI_ERROR__UNRECOGNIZED_NODE_KIND]: 'Unrecognized node kind [$kind].',
    [KINOBI_ERROR__VERSION_MISMATCH]:
        'The provided RootNode version [$rootVersion] is not compatible with the installed Kinobi version [$kinobiVersion].',
    [KINOBI_ERROR__VISITORS__ACCOUNT_FIELD_NOT_FOUND]: 'Account [$name] does not have a field named [$missingField].',
    [KINOBI_ERROR__VISITORS__CANNOT_ADD_DUPLICATED_PDA_NAMES]:
        'Cannot add PDAs to program [$programName] because the following PDA names already exist [$duplicatedPdaNames].',
    [KINOBI_ERROR__VISITORS__CANNOT_EXTEND_MISSING_VISIT_FUNCTION]:
        'Cannot extend visitor with function [$visitFunction] as the base visitor does not support it.',
    [KINOBI_ERROR__VISITORS__CANNOT_FLATTEN_STRUCT_WITH_CONFLICTING_ATTRIBUTES]:
        'Cannot flatten struct since this would cause the following attributes to conflict [$conflictingAttributes].',
    [KINOBI_ERROR__VISITORS__CANNOT_USE_OPTIONAL_ACCOUNT_AS_PDA_SEED_VALUE]:
        'Cannot use optional account [$seedValueName] as the [$seedName] PDA seed for the [$instructionAccountName] account of the [$instructionName] instruction.',
    [KINOBI_ERROR__VISITORS__CYCLIC_DEPENDENCY_DETECTED_WHEN_RESOLVING_INSTRUCTION_DEFAULT_VALUES]:
        "Circular dependency detected when resolving the accounts and arguments' default values of the [$instructionName] instruction. Got the following dependency cycle [$formattedCycle].",
    [KINOBI_ERROR__VISITORS__FAILED_TO_VALIDATE_NODE]: 'Failed to validate the given node [$formattedHistogram].',
    [KINOBI_ERROR__VISITORS__INSTRUCTION_ENUM_ARGUMENT_NOT_FOUND]:
        'Could not find an enum argument named [$argumentName] for instruction [$instructionName].',
    [KINOBI_ERROR__VISITORS__INVALID_INSTRUCTION_DEFAULT_VALUE_DEPENDENCY]:
        'Dependency [$dependencyName] of kind [$dependencyKind] is not a valid dependency of [$parentName] of kind [$parentKind] in the [$instructionName] instruction.',
    [KINOBI_ERROR__VISITORS__INVALID_NUMBER_WRAPPER]: 'Invalid number wrapper kind [$wrapper].',
    [KINOBI_ERROR__VISITORS__INVALID_PDA_SEED_VALUES]:
        'Invalid seed values for PDA [$pdaName] in instruction [$instructionName].',
    [KINOBI_ERROR__VISITORS__RENDER_MAP_KEY_NOT_FOUND]: 'Cannot find key [$key] in RenderMap.',
};
