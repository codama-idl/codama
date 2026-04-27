/**
 * Heavily inspired by @solana/errors.
 * @see https://github.com/anza-xyz/kit/blob/main/packages/errors
 */

import {
    CODAMA_ERROR__ANCHOR__ACCOUNT_TYPE_MISSING,
    CODAMA_ERROR__ANCHOR__ARGUMENT_TYPE_MISSING,
    CODAMA_ERROR__ANCHOR__EVENT_TYPE_MISSING,
    CODAMA_ERROR__ANCHOR__GENERIC_TYPE_MISSING,
    CODAMA_ERROR__ANCHOR__PROGRAM_ID_KIND_UNIMPLEMENTED,
    CODAMA_ERROR__ANCHOR__SEED_KIND_UNIMPLEMENTED,
    CODAMA_ERROR__ANCHOR__TYPE_PATH_MISSING,
    CODAMA_ERROR__ANCHOR__UNRECOGNIZED_IDL_TYPE,
    CODAMA_ERROR__DISCRIMINATOR_FIELD_HAS_NO_DEFAULT_VALUE,
    CODAMA_ERROR__DISCRIMINATOR_FIELD_NOT_FOUND,
    CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_MISSING,
    CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_RESOLVER_MISSING,
    CODAMA_ERROR__DYNAMIC_CLIENT__ARGUMENT_MISSING,
    CODAMA_ERROR__DYNAMIC_CLIENT__CANNOT_CONVERT_TO_ADDRESS,
    CODAMA_ERROR__DYNAMIC_CLIENT__CIRCULAR_ACCOUNT_DEPENDENCY,
    CODAMA_ERROR__DYNAMIC_CLIENT__DEFAULT_VALUE_MISSING,
    CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_DERIVE_PDA,
    CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_ENCODE_ARGUMENT,
    CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_EXECUTE_RESOLVER,
    CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_VALIDATE_INPUT,
    CODAMA_ERROR__DYNAMIC_CLIENT__INSTRUCTION_NOT_FOUND,
    CODAMA_ERROR__DYNAMIC_CLIENT__INVALID_ACCOUNT_ADDRESS,
    CODAMA_ERROR__DYNAMIC_CLIENT__INVALID_ARGUMENT_INPUT,
    CODAMA_ERROR__DYNAMIC_CLIENT__INVARIANT_VIOLATION,
    CODAMA_ERROR__DYNAMIC_CLIENT__NODE_REFERENCE_NOT_FOUND,
    CODAMA_ERROR__DYNAMIC_CLIENT__PDA_NOT_FOUND,
    CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_ADDRESS_TYPE,
    CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_ARGUMENT_TYPE,
    CODAMA_ERROR__DYNAMIC_CLIENT__UNSUPPORTED_NODE,
    CODAMA_ERROR__DYNAMIC_CLIENT__UNSUPPORTED_OPTIONAL_ACCOUNT_STRATEGY,
    CODAMA_ERROR__ENUM_VARIANT_NOT_FOUND,
    CODAMA_ERROR__LINKED_NODE_NOT_FOUND,
    CODAMA_ERROR__NODE_FILESYSTEM_FUNCTION_UNAVAILABLE,
    CODAMA_ERROR__RENDERERS__MISSING_DEPENDENCY_VERSIONS,
    CODAMA_ERROR__RENDERERS__UNSUPPORTED_NODE,
    CODAMA_ERROR__UNEXPECTED_NESTED_NODE_KIND,
    CODAMA_ERROR__UNEXPECTED_NODE_KIND,
    CODAMA_ERROR__UNRECOGNIZED_BYTES_ENCODING,
    CODAMA_ERROR__UNRECOGNIZED_NODE_KIND,
    CODAMA_ERROR__UNRECOGNIZED_NUMBER_FORMAT,
    CODAMA_ERROR__VERSION_MISMATCH,
    CODAMA_ERROR__VISITORS__ACCOUNT_FIELD_NOT_FOUND,
    CODAMA_ERROR__VISITORS__CANNOT_ADD_DUPLICATED_PDA_NAMES,
    CODAMA_ERROR__VISITORS__CANNOT_EXTEND_MISSING_VISIT_FUNCTION,
    CODAMA_ERROR__VISITORS__CANNOT_FLATTEN_STRUCT_WITH_CONFLICTING_ATTRIBUTES,
    CODAMA_ERROR__VISITORS__CANNOT_REMOVE_LAST_PATH_IN_NODE_STACK,
    CODAMA_ERROR__VISITORS__CANNOT_USE_OPTIONAL_ACCOUNT_AS_PDA_SEED_VALUE,
    CODAMA_ERROR__VISITORS__CYCLIC_DEPENDENCY_DETECTED_WHEN_RESOLVING_INSTRUCTION_DEFAULT_VALUES,
    CODAMA_ERROR__VISITORS__FAILED_TO_VALIDATE_NODE,
    CODAMA_ERROR__VISITORS__INSTRUCTION_ENUM_ARGUMENT_NOT_FOUND,
    CODAMA_ERROR__VISITORS__INVALID_INSTRUCTION_DEFAULT_VALUE_DEPENDENCY,
    CODAMA_ERROR__VISITORS__INVALID_NUMBER_WRAPPER,
    CODAMA_ERROR__VISITORS__INVALID_PDA_SEED_VALUES,
    CODAMA_ERROR__VISITORS__RENDER_MAP_KEY_NOT_FOUND,
    CodamaErrorCode,
} from './codes';

/**
 * WARNING:
 *   - Don't change the meaning of an error message.
 */
export const CodamaErrorMessages: Readonly<{
    // This type makes this data structure exhaustive with respect to `SolanaErrorCode`.
    // TypeScript will fail to build this project if add an error code without a message.
    [P in CodamaErrorCode]: string;
}> = {
    [CODAMA_ERROR__ANCHOR__ACCOUNT_TYPE_MISSING]: 'Account type [$name] is missing from the IDL types.',
    [CODAMA_ERROR__ANCHOR__ARGUMENT_TYPE_MISSING]: 'Argument name [$name] is missing from the instruction definition.',
    [CODAMA_ERROR__ANCHOR__EVENT_TYPE_MISSING]: 'Event type [$name] is missing from the IDL types.',
    [CODAMA_ERROR__ANCHOR__GENERIC_TYPE_MISSING]: 'Generic type [$name] is missing from the IDL types.',
    [CODAMA_ERROR__ANCHOR__PROGRAM_ID_KIND_UNIMPLEMENTED]: 'Program ID kind [$kind] is not implemented.',
    [CODAMA_ERROR__ANCHOR__SEED_KIND_UNIMPLEMENTED]: 'Seed kind [$kind] is not implemented.',
    [CODAMA_ERROR__ANCHOR__TYPE_PATH_MISSING]: 'Field type is missing for path [$path] in [$idlType].',
    [CODAMA_ERROR__ANCHOR__UNRECOGNIZED_IDL_TYPE]: 'Unrecognized Anchor IDL type [$idlType].',
    [CODAMA_ERROR__DISCRIMINATOR_FIELD_HAS_NO_DEFAULT_VALUE]: 'Discriminator field [$field] has no default value.',
    [CODAMA_ERROR__DISCRIMINATOR_FIELD_NOT_FOUND]: 'Could not find discriminator field [$field]',
    [CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_MISSING]:
        'Missing account [$accountName] in [$instructionName] instruction.',
    [CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_RESOLVER_MISSING]:
        'Resolver [$resolverName] not provided for account [$accountName].',
    [CODAMA_ERROR__DYNAMIC_CLIENT__ARGUMENT_MISSING]:
        'Missing argument [$argumentName$argumentPath] in [$instructionName].',
    [CODAMA_ERROR__DYNAMIC_CLIENT__CANNOT_CONVERT_TO_ADDRESS]: 'Cannot convert value to Address: [$value].',
    [CODAMA_ERROR__DYNAMIC_CLIENT__CIRCULAR_ACCOUNT_DEPENDENCY]: 'Circular dependency detected: [$chain].',
    [CODAMA_ERROR__DYNAMIC_CLIENT__DEFAULT_VALUE_MISSING]:
        'Default value is missing for argument [$argumentName] in [$instructionName].',
    [CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_DERIVE_PDA]: 'Failed to derive PDA for account [$accountName].',
    [CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_ENCODE_ARGUMENT]:
        'Failed to encode argument [$argumentName] in [$instructionName].',
    [CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_EXECUTE_RESOLVER]:
        'Resolver [$resolverName] threw an error while resolving [$targetKind] [$targetName].',
    [CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_VALIDATE_INPUT]: 'Failed to validate input: [$message].',
    [CODAMA_ERROR__DYNAMIC_CLIENT__INSTRUCTION_NOT_FOUND]:
        'Instruction [$instructionName] not found in IDL. Available: [$availableIxs].',
    [CODAMA_ERROR__DYNAMIC_CLIENT__INVALID_ACCOUNT_ADDRESS]: 'Invalid account address [$accountName]: [$value].',
    [CODAMA_ERROR__DYNAMIC_CLIENT__INVALID_ARGUMENT_INPUT]:
        'Invalid argument input [$argumentName]: [$value]. Expected [$expectedType].',
    [CODAMA_ERROR__DYNAMIC_CLIENT__INVARIANT_VIOLATION]: 'Internal invariant violation: [$message].',
    [CODAMA_ERROR__DYNAMIC_CLIENT__NODE_REFERENCE_NOT_FOUND]:
        'Referenced node [$referencedName] not found in [$instructionName].',
    [CODAMA_ERROR__DYNAMIC_CLIENT__PDA_NOT_FOUND]: 'PDA [$pdaName] not found in IDL. Available: [$available].',

    [CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_ADDRESS_TYPE]:
        'Expected [$expectedType] for account [$accountName], but received [$actualType].',
    [CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_ARGUMENT_TYPE]:
        'Expected [$expectedType] for [$nodeKind], but received [$actualType].',
    [CODAMA_ERROR__DYNAMIC_CLIENT__UNSUPPORTED_NODE]: 'Unsupported node kind [$nodeKind].',
    [CODAMA_ERROR__DYNAMIC_CLIENT__UNSUPPORTED_OPTIONAL_ACCOUNT_STRATEGY]:
        'Unsupported optional account strategy [$strategy] for account [$accountName] in [$instructionName].',
    [CODAMA_ERROR__ENUM_VARIANT_NOT_FOUND]: 'Enum variant [$variant] not found in enum type [$enumName].',
    [CODAMA_ERROR__LINKED_NODE_NOT_FOUND]: 'Could not find linked node [$name] from [$kind].',
    [CODAMA_ERROR__NODE_FILESYSTEM_FUNCTION_UNAVAILABLE]:
        'Node.js filesystem function [$fsFunction] is not available in your environment.',
    [CODAMA_ERROR__RENDERERS__MISSING_DEPENDENCY_VERSIONS]:
        'No version specified for the following dependencies: [$dependencies]. $message',
    [CODAMA_ERROR__RENDERERS__UNSUPPORTED_NODE]: 'Cannot render the encountered node of kind [$kind].',
    [CODAMA_ERROR__UNEXPECTED_NESTED_NODE_KIND]: 'Expected nested node of kind [$expectedKinds], got [$kind]',
    [CODAMA_ERROR__UNEXPECTED_NODE_KIND]: 'Expected node of kind [$expectedKinds], got [$kind].',
    [CODAMA_ERROR__UNRECOGNIZED_BYTES_ENCODING]: 'Unrecognized bytes encoding [$encoding].',
    [CODAMA_ERROR__UNRECOGNIZED_NODE_KIND]: 'Unrecognized node kind [$kind].',
    [CODAMA_ERROR__UNRECOGNIZED_NUMBER_FORMAT]: 'Unrecognized number format [$format].',
    [CODAMA_ERROR__VERSION_MISMATCH]:
        'The provided RootNode version [$rootVersion] is not compatible with the installed Codama version [$codamaVersion].',
    [CODAMA_ERROR__VISITORS__ACCOUNT_FIELD_NOT_FOUND]: 'Account [$name] does not have a field named [$missingField].',
    [CODAMA_ERROR__VISITORS__CANNOT_ADD_DUPLICATED_PDA_NAMES]:
        'Cannot add PDAs to program [$programName] because the following PDA names already exist [$duplicatedPdaNames].',
    [CODAMA_ERROR__VISITORS__CANNOT_EXTEND_MISSING_VISIT_FUNCTION]:
        'Cannot extend visitor with function [$visitFunction] as the base visitor does not support it.',
    [CODAMA_ERROR__VISITORS__CANNOT_FLATTEN_STRUCT_WITH_CONFLICTING_ATTRIBUTES]:
        'Cannot flatten struct since this would cause the following attributes to conflict [$conflictingAttributes].',
    [CODAMA_ERROR__VISITORS__CANNOT_REMOVE_LAST_PATH_IN_NODE_STACK]: 'Cannot remove the last path in the node stack.',
    [CODAMA_ERROR__VISITORS__CANNOT_USE_OPTIONAL_ACCOUNT_AS_PDA_SEED_VALUE]:
        'Cannot use optional account [$seedValueName] as the [$seedName] PDA seed for the [$instructionAccountName] account of the [$instructionName] instruction.',
    [CODAMA_ERROR__VISITORS__CYCLIC_DEPENDENCY_DETECTED_WHEN_RESOLVING_INSTRUCTION_DEFAULT_VALUES]:
        "Circular dependency detected when resolving the accounts and arguments' default values of the [$instructionName] instruction. Got the following dependency cycle [$formattedCycle].",
    [CODAMA_ERROR__VISITORS__FAILED_TO_VALIDATE_NODE]: 'Failed to validate the given node [$formattedHistogram].',
    [CODAMA_ERROR__VISITORS__INSTRUCTION_ENUM_ARGUMENT_NOT_FOUND]:
        'Could not find an enum argument named [$argumentName] for instruction [$instructionName].',
    [CODAMA_ERROR__VISITORS__INVALID_INSTRUCTION_DEFAULT_VALUE_DEPENDENCY]:
        'Dependency [$dependencyName] of kind [$dependencyKind] is not a valid dependency of [$parentName] of kind [$parentKind] in the [$instructionName] instruction.',
    [CODAMA_ERROR__VISITORS__INVALID_NUMBER_WRAPPER]: 'Invalid number wrapper kind [$wrapper].',
    [CODAMA_ERROR__VISITORS__INVALID_PDA_SEED_VALUES]:
        'Invalid seed values for PDA [$pdaName] in instruction [$instructionName].',
    [CODAMA_ERROR__VISITORS__RENDER_MAP_KEY_NOT_FOUND]: 'Cannot find key [$key] in RenderMap.',
};
