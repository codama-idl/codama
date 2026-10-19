/**
 * Heavily inspired by @solana/errors.
 * @see https://github.com/anza-xyz/kit/blob/main/packages/errors
 */

import type {
    AccountValueNode,
    DataValueNode,
    IdentifierString,
    InstructionAccountNode,
    Node,
    NodeKind,
    PathString,
    StructFieldTypeNode,
} from '@codama/node-types';

import {
    CODAMA_ERROR__ANCHOR__ACCOUNT_TYPE_MISSING,
    CODAMA_ERROR__ANCHOR__ARGUMENT_TYPE_MISSING,
    CODAMA_ERROR__ANCHOR__EVENT_TYPE_MISSING,
    CODAMA_ERROR__ANCHOR__GENERIC_TYPE_MISSING,
    CODAMA_ERROR__ANCHOR__SEED_KIND_UNIMPLEMENTED,
    CODAMA_ERROR__ANCHOR__UNRECOGNIZED_IDL_TYPE,
    CODAMA_ERROR__CANNOT_RESOLVE_PATH,
    CODAMA_ERROR__DEFINED_TYPE_HAS_NO_FINITE_VALUE,
    CODAMA_ERROR__DISCRIMINATOR_FIELD_HAS_NO_DEFAULT_VALUE,
    CODAMA_ERROR__DISCRIMINATOR_FIELD_NOT_FOUND,
    CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_MISSING,
    CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_RESOLVER_MISSING,
    CODAMA_ERROR__DYNAMIC_CLIENT__CANNOT_CONVERT_TO_ADDRESS,
    CODAMA_ERROR__DYNAMIC_CLIENT__CIRCULAR_ACCOUNT_DEPENDENCY,
    CODAMA_ERROR__DYNAMIC_CLIENT__DATA_MISSING,
    CODAMA_ERROR__DYNAMIC_CLIENT__DUPLICATE_SET_ITEM,
    CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_DERIVE_PDA,
    CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_ENCODE_DATA,
    CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_EXECUTE_RESOLVER,
    CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_VALIDATE_INPUT,
    CODAMA_ERROR__DYNAMIC_CLIENT__INSTRUCTION_NOT_FOUND,
    CODAMA_ERROR__DYNAMIC_CLIENT__INVALID_ACCOUNT_ADDRESS,
    CODAMA_ERROR__DYNAMIC_CLIENT__INVALID_ACCOUNT_INPUT,
    CODAMA_ERROR__DYNAMIC_CLIENT__INVARIANT_VIOLATION,
    CODAMA_ERROR__DYNAMIC_CLIENT__NODE_REFERENCE_NOT_FOUND,
    CODAMA_ERROR__DYNAMIC_CLIENT__PDA_NOT_FOUND,
    CODAMA_ERROR__DYNAMIC_CLIENT__PDA_SEED_MISSING,
    CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_ADDRESS_TYPE,
    CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE,
    CODAMA_ERROR__DYNAMIC_CLIENT__UNSUPPORTED_NODE,
    CODAMA_ERROR__DYNAMIC_CLIENT__UNSUPPORTED_OPTIONAL_ACCOUNT_STRATEGY,
    CODAMA_ERROR__ENUM_VARIANT_NOT_FOUND,
    CODAMA_ERROR__INJECTED_VALUE_NOT_PROVIDED,
    CODAMA_ERROR__INVALID_BRANDED_STRING,
    CODAMA_ERROR__INVALID_INTERPOLATED_INTENT_PLACEHOLDER,
    CODAMA_ERROR__INVALID_TICKS_PER_SECOND,
    CODAMA_ERROR__LINKED_NODE_NOT_FOUND,
    CODAMA_ERROR__NODE_FILESYSTEM_FUNCTION_UNAVAILABLE,
    CODAMA_ERROR__NODE_PATH_PROGRAM_MISSING,
    CODAMA_ERROR__RENDERERS__MISSING_DEPENDENCY_VERSIONS,
    CODAMA_ERROR__RENDERERS__UNSUPPORTED_NODE,
    CODAMA_ERROR__UNEXPECTED_NODE_KIND,
    CODAMA_ERROR__UNRECOGNIZED_BYTES_ENCODING,
    CODAMA_ERROR__UNRECOGNIZED_NODE_KIND,
    CODAMA_ERROR__UNRECOGNIZED_NUMBER_FORMAT,
    CODAMA_ERROR__UNSUPPORTED_VERSION,
    CODAMA_ERROR__VERSION_MISMATCH,
    CODAMA_ERROR__VISITORS__ACCOUNT_FIELD_NOT_FOUND,
    CODAMA_ERROR__VISITORS__CANNOT_ADD_DUPLICATED_PDA_NAMES,
    CODAMA_ERROR__VISITORS__CANNOT_ADD_DUPLICATED_PROGRAM_NAMES,
    CODAMA_ERROR__VISITORS__CANNOT_EXTEND_MISSING_VISIT_FUNCTION,
    CODAMA_ERROR__VISITORS__CANNOT_FLATTEN_STRUCT_WITH_CONFLICTING_ATTRIBUTES,
    CODAMA_ERROR__VISITORS__CANNOT_FLATTEN_STRUCT_WITH_PLUGINS,
    CODAMA_ERROR__VISITORS__CANNOT_REMOVE_LAST_PATH_IN_NODE_STACK,
    CODAMA_ERROR__VISITORS__CANNOT_SET_INSTRUCTION_DISCRIMINATOR,
    CODAMA_ERROR__VISITORS__CANNOT_USE_OPTIONAL_ACCOUNT_AS_PDA_SEED_VALUE,
    CODAMA_ERROR__VISITORS__CYCLIC_DEPENDENCY_DETECTED_WHEN_RESOLVING_INSTRUCTION_DEFAULT_VALUES,
    CODAMA_ERROR__VISITORS__DEFINED_TYPE_MEMBER_NOT_FOUND,
    CODAMA_ERROR__VISITORS__FAILED_TO_VALIDATE_NODE,
    CODAMA_ERROR__VISITORS__INSTRUCTION_ACCOUNT_NOT_FOUND,
    CODAMA_ERROR__VISITORS__INSTRUCTION_DATA_FIELD_NOT_FOUND,
    CODAMA_ERROR__VISITORS__INSTRUCTION_ENUM_DATA_FIELD_NOT_FOUND,
    CODAMA_ERROR__VISITORS__INVALID_INSTRUCTION_DEFAULT_VALUE_DEPENDENCY,
    CODAMA_ERROR__VISITORS__INVALID_NUMBER_WRAPPER,
    CODAMA_ERROR__VISITORS__INVALID_PDA_SEED_VALUES,
    CODAMA_ERROR__VISITORS__INVALID_PROVIDED_VALUE,
    CODAMA_ERROR__VISITORS__RENDER_MAP_KEY_NOT_FOUND,
    CODAMA_ERROR__VISITORS__UNRECOGNIZED_UPDATE_KEYS,
    CodamaErrorCode,
} from './codes';
import { formatContextPath } from './node-path';

/**
 * A path of nodes, ending at the node an error is about. It starts at the root whenever the
 * thrower knows it, and is otherwise only made of the last node(s), e.g. `[node]`. Messages
 * render it as node selectors, e.g. `[programNode]token.[accountNode]mint`.
 */
type NodePath = readonly Node[];

type DefaultUnspecifiedErrorContextToUndefined<T> = {
    [P in CodamaErrorCode]: P extends keyof T ? T[P] : undefined;
};

/**
 * WARNING:
 *   - Don't change or remove members of an error's context within a major version.
 *   - Errors about nodes carry the `path` of the node, rather than the node itself, its kind or its identifier.
 */
export type CodamaErrorContext = DefaultUnspecifiedErrorContextToUndefined<{
    [CODAMA_ERROR__ANCHOR__ACCOUNT_TYPE_MISSING]: {
        name: string;
    };
    [CODAMA_ERROR__ANCHOR__ARGUMENT_TYPE_MISSING]: {
        name: string;
    };
    [CODAMA_ERROR__ANCHOR__EVENT_TYPE_MISSING]: {
        name: string;
    };
    [CODAMA_ERROR__ANCHOR__GENERIC_TYPE_MISSING]: {
        name: string;
    };
    [CODAMA_ERROR__ANCHOR__SEED_KIND_UNIMPLEMENTED]: {
        kind: string;
    };
    [CODAMA_ERROR__ANCHOR__UNRECOGNIZED_IDL_TYPE]: {
        idlType: string;
    };
    [CODAMA_ERROR__CANNOT_RESOLVE_PATH]: {
        /** The path of the node the segment could not be applied to. */
        path: NodePath;
        /** The path expression being resolved, e.g. `config.fees[0]`. */
        pathString: PathString;
        /** The segment that could not be followed, e.g. `fees` or `[0]`. */
        segment: string;
    };
    [CODAMA_ERROR__DEFINED_TYPE_HAS_NO_FINITE_VALUE]: {
        /** The path of the defined type. */
        path: NodePath;
    };
    [CODAMA_ERROR__DISCRIMINATOR_FIELD_HAS_NO_DEFAULT_VALUE]: {
        /** The path of the discriminator field. */
        path: NodePath;
    };
    [CODAMA_ERROR__DISCRIMINATOR_FIELD_NOT_FOUND]: {
        /** The path of the field the discriminator refers to, e.g. `discriminator`. */
        field: PathString;
        /** The path of the field discriminator node. */
        path: NodePath;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_MISSING]: {
        /** The path of the missing instruction account, or remaining accounts. */
        path: NodePath;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_RESOLVER_MISSING]: {
        /** The path of the account the resolver resolves. */
        path: NodePath;
        resolverName: IdentifierString;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__CANNOT_CONVERT_TO_ADDRESS]: {
        value: string;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__CIRCULAR_ACCOUNT_DEPENDENCY]: {
        chain: string;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__DATA_MISSING]: {
        /** The path of the instruction. */
        path: NodePath;
        /** The path of the missing data, e.g. `config.fee`. */
        pathString: PathString;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__DUPLICATE_SET_ITEM]: {
        /** The index of the first item the duplicate is equal to. */
        firstIndex: number;
        /** The index of the duplicate item. */
        index: number;
        /** The path of the set type node that rejected the value. */
        path: NodePath;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_DERIVE_PDA]: {
        /**
         * The path of what an account value resolved to null for: a seed of the PDA, ending at the
         * seed, or its program ID, ending at the PDA.
         */
        path: NodePath;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_ENCODE_DATA]: {
        /** The path of the instruction. */
        path: NodePath;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_EXECUTE_RESOLVER]: {
        /** The path of the node being resolved. */
        path: NodePath;
        resolverName: IdentifierString;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_VALIDATE_INPUT]: {
        message: string;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__INSTRUCTION_NOT_FOUND]: {
        availableIxs: string[];
        instructionName: string;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__INVALID_ACCOUNT_ADDRESS]: {
        /** The path of the instruction account. */
        path: NodePath;
        value: string;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__INVALID_ACCOUNT_INPUT]: {
        expectedType: string;
        /** The path of the instruction account, or remaining accounts. */
        path: NodePath;
        value: string;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__INVARIANT_VIOLATION]: {
        message: string;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__NODE_REFERENCE_NOT_FOUND]: {
        /** The path of the node holding the reference, or of its instruction. */
        path: NodePath;
        referencedName: IdentifierString;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__PDA_NOT_FOUND]: {
        available: string;
        pdaName: string;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__PDA_SEED_MISSING]: {
        /** The path of the missing seed. */
        path: NodePath;
    };

    [CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_ADDRESS_TYPE]: {
        accountName: string;
        actualType: string;
        expectedType: string;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE]: {
        actualType: string;
        expectedType: string;
        /** The path of the node that rejected the value. */
        path: NodePath;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__UNSUPPORTED_NODE]: {
        /** The path of the unsupported node. */
        path: NodePath;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__UNSUPPORTED_OPTIONAL_ACCOUNT_STRATEGY]: {
        /** The path of the instruction account. */
        path: NodePath;
        strategy: string;
    };
    [CODAMA_ERROR__ENUM_VARIANT_NOT_FOUND]: {
        /** The path of the enum type. */
        path: NodePath;
        variant: IdentifierString;
    };
    [CODAMA_ERROR__INJECTED_VALUE_NOT_PROVIDED]: {
        /** The key of the injected value. */
        key: IdentifierString;
        /** The path of the injected value node. */
        path: NodePath;
    };
    [CODAMA_ERROR__INVALID_BRANDED_STRING]: {
        actual: string;
        expected: string;
    };
    [CODAMA_ERROR__INVALID_INTERPOLATED_INTENT_PLACEHOLDER]: {
        /** The invalid placeholder, e.g. `${accounts.mint.lamports}`. */
        placeholder: string;
        /** The interpolated intent containing the placeholder. */
        template: string;
    };
    [CODAMA_ERROR__INVALID_TICKS_PER_SECOND]: {
        /** The path of the date-time or duration type. */
        path: NodePath;
        /** The invalid number of ticks per second, e.g. `0`. */
        ticksPerSecond: number;
    };
    [CODAMA_ERROR__LINKED_NODE_NOT_FOUND]: {
        /** The path of the link node whose target could not be found. */
        path: NodePath;
    };
    [CODAMA_ERROR__NODE_FILESYSTEM_FUNCTION_UNAVAILABLE]: {
        fsFunction: string;
    };
    [CODAMA_ERROR__NODE_PATH_PROGRAM_MISSING]: {
        /** The path that should contain a program node, e.g. to resolve links from. */
        path: NodePath;
    };
    [CODAMA_ERROR__RENDERERS__MISSING_DEPENDENCY_VERSIONS]: {
        dependencies: readonly string[];
        message: string;
    };
    [CODAMA_ERROR__RENDERERS__UNSUPPORTED_NODE]: {
        /** The path of the node that cannot be rendered. */
        path: NodePath;
    };
    [CODAMA_ERROR__UNEXPECTED_NODE_KIND]: {
        expectedKinds: NodeKind[];
        /** The path of the unexpected node, or an empty path when no node was found. */
        path: NodePath;
    };
    [CODAMA_ERROR__UNRECOGNIZED_BYTES_ENCODING]: {
        encoding: string;
    };
    [CODAMA_ERROR__UNRECOGNIZED_NODE_KIND]: {
        kind: string;
    };
    [CODAMA_ERROR__UNRECOGNIZED_NUMBER_FORMAT]: {
        format: string;
    };
    [CODAMA_ERROR__UNSUPPORTED_VERSION]: {
        version: string;
    };
    [CODAMA_ERROR__VERSION_MISMATCH]: {
        codamaVersion: string;
        rootVersion: string;
    };
    [CODAMA_ERROR__VISITORS__ACCOUNT_FIELD_NOT_FOUND]: {
        missingField: IdentifierString;
        /** The path of the account. */
        path: NodePath;
    };
    [CODAMA_ERROR__VISITORS__CANNOT_ADD_DUPLICATED_PDA_NAMES]: {
        duplicatedPdaNames: IdentifierString[];
        /** The path of the program. */
        path: NodePath;
    };
    [CODAMA_ERROR__VISITORS__CANNOT_ADD_DUPLICATED_PROGRAM_NAMES]: {
        duplicatedProgramNames: IdentifierString[];
        /** The path of the root. */
        path: NodePath;
    };
    [CODAMA_ERROR__VISITORS__CANNOT_EXTEND_MISSING_VISIT_FUNCTION]: {
        visitFunction: string;
    };
    [CODAMA_ERROR__VISITORS__CANNOT_FLATTEN_STRUCT_WITH_CONFLICTING_ATTRIBUTES]: {
        conflictingAttributes: IdentifierString[];
        /** The path of the struct to flatten. */
        path: NodePath;
    };
    [CODAMA_ERROR__VISITORS__CANNOT_FLATTEN_STRUCT_WITH_PLUGINS]: {
        /** The path of the struct field whose struct carries plugins. */
        path: NodePath;
    };
    [CODAMA_ERROR__VISITORS__CANNOT_REMOVE_LAST_PATH_IN_NODE_STACK]: {
        path: NodePath;
    };
    [CODAMA_ERROR__VISITORS__CANNOT_SET_INSTRUCTION_DISCRIMINATOR]: {
        /** The path of the instruction. */
        path: NodePath;
        reason: string;
    };
    [CODAMA_ERROR__VISITORS__CANNOT_USE_OPTIONAL_ACCOUNT_AS_PDA_SEED_VALUE]: {
        /** The path of the PDA seed value using the optional account. */
        path: NodePath;
        /** The identifier of the optional account. */
        seedValueName: IdentifierString;
    };
    [CODAMA_ERROR__VISITORS__CYCLIC_DEPENDENCY_DETECTED_WHEN_RESOLVING_INSTRUCTION_DEFAULT_VALUES]: {
        cycle: (InstructionAccountNode | StructFieldTypeNode)[];
        formattedCycle: string;
        /** The path of the instruction. */
        path: NodePath;
    };
    [CODAMA_ERROR__VISITORS__DEFINED_TYPE_MEMBER_NOT_FOUND]: {
        missingMember: string;
        /** The path of the defined type. */
        path: NodePath;
    };
    [CODAMA_ERROR__VISITORS__FAILED_TO_VALIDATE_NODE]: {
        formattedHistogram: string;
        validationItems: readonly ValidationItem[];
    };
    [CODAMA_ERROR__VISITORS__INSTRUCTION_ACCOUNT_NOT_FOUND]: {
        accountName: string;
        /** The path of the instruction. */
        path: NodePath;
    };
    [CODAMA_ERROR__VISITORS__INSTRUCTION_DATA_FIELD_NOT_FOUND]: {
        /** The path of the instruction. */
        path: NodePath;
        /** The path of the missing data field, e.g. `config.fee`. */
        pathString: string;
    };
    [CODAMA_ERROR__VISITORS__INSTRUCTION_ENUM_DATA_FIELD_NOT_FOUND]: {
        fieldName: IdentifierString;
        /** The path of the instruction. */
        path: NodePath;
    };
    [CODAMA_ERROR__VISITORS__INVALID_INSTRUCTION_DEFAULT_VALUE_DEPENDENCY]: {
        /** The invalid dependency, which is not part of the tree. */
        dependency: AccountValueNode | DataValueNode;
        dependencyKind: 'accountValueNode' | 'dataValueNode';
        dependencyName: IdentifierString | PathString;
        /**
         * The instruction account or data field depending on it, e.g. `owner` or `config.fee`. Data
         * fields within a linked defined type are not on the path of their instruction, so they are
         * named rather than given as a path.
         */
        dependent: IdentifierString | PathString;
        /** The path of the instruction, whose `provides` may have injected the dependency. */
        path: NodePath;
    };
    [CODAMA_ERROR__VISITORS__INVALID_NUMBER_WRAPPER]: {
        kind: string;
        reason: string;
        wrapper: object;
    };
    [CODAMA_ERROR__VISITORS__INVALID_PDA_SEED_VALUES]: {
        /** The path of the instruction. */
        path: NodePath;
        pdaName: IdentifierString;
    };
    [CODAMA_ERROR__VISITORS__INVALID_PROVIDED_VALUE]: {
        expectedKinds: NodeKind[];
        /** The path of the provided node, ending at the value it provides. */
        path: NodePath;
    };
    [CODAMA_ERROR__VISITORS__RENDER_MAP_KEY_NOT_FOUND]: {
        key: string;
    };
    [CODAMA_ERROR__VISITORS__UNRECOGNIZED_UPDATE_KEYS]: {
        allowedKeys: string[];
        selector: string;
        unrecognizedKeys: string[];
    };
}>;

type ValidationItem = {
    cause?: Error;
    level: 'debug' | 'error' | 'info' | 'trace' | 'warn';
    message: string;
    path: NodePath;
};

export function decodeEncodedContext(encodedContext: string): object {
    const decodedUrlString = __NODEJS__ ? Buffer.from(encodedContext, 'base64').toString('utf8') : atob(encodedContext);
    return Object.fromEntries(new URLSearchParams(decodedUrlString).entries());
}

function encodeValue(value: unknown): string {
    if (Array.isArray(value)) {
        const commaSeparatedValues = value.map(encodeValue).join('%2C%20' /* ", " */);
        return '%5B' /* "[" */ + commaSeparatedValues + /* "]" */ '%5D';
    } else if (typeof value === 'bigint') {
        // eslint-disable-next-line typescript/no-base-to-string -- `value` is narrowed to `bigint` here.
        return `${value}n`;
    } else {
        return encodeURIComponent(
            String(
                value != null && Object.getPrototypeOf(value) === null
                    ? // Plain objects with no protoype don't have a `toString` method.
                      // Convert them before stringifying them.
                      { ...(value as object) }
                    : value,
            ),
        );
    }
}

function encodeObjectContextEntry([key, value]: [string, unknown]): `${typeof key}=${string}` {
    // Node paths are encoded as node selectors, since nodes cannot be encoded as strings.
    if (key === 'path' && Array.isArray(value)) return `${key}=${encodeURIComponent(formatContextPath(value))}`;
    return `${key}=${encodeValue(value)}`;
}

export function encodeContextObject(context: object): string {
    const searchParamsString = Object.entries(context).map(encodeObjectContextEntry).join('&');
    return __NODEJS__ ? Buffer.from(searchParamsString, 'utf8').toString('base64') : btoa(searchParamsString);
}
