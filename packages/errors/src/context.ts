/**
 * Heavily inspired by @solana/errors.
 * @see https://github.com/anza-xyz/kit/blob/main/packages/errors
 */

import {
    AccountNode,
    AccountValueNode,
    DataValueNode,
    DefinedTypeNode,
    EnumTypeNode,
    IdentifierString,
    InjectedValueNode,
    InstructionAccountNode,
    InstructionNode,
    LinkNode,
    Node,
    NodeKind,
    PathString,
    PdaNode,
    PdaSeedValueNode,
    ProgramNode,
    ProvidedNode,
    StructFieldTypeNode,
} from '@codama/node-types';

import {
    CODAMA_ERROR__ANCHOR__ACCOUNT_TYPE_MISSING,
    CODAMA_ERROR__ANCHOR__ARGUMENT_TYPE_MISSING,
    CODAMA_ERROR__ANCHOR__EVENT_TYPE_MISSING,
    CODAMA_ERROR__ANCHOR__GENERIC_TYPE_MISSING,
    CODAMA_ERROR__ANCHOR__PROGRAM_ID_KIND_UNIMPLEMENTED,
    CODAMA_ERROR__ANCHOR__SEED_KIND_UNIMPLEMENTED,
    CODAMA_ERROR__ANCHOR__TYPE_PATH_MISSING,
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
    CODAMA_ERROR__DYNAMIC_CLIENT__DEFAULT_VALUE_MISSING,
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
    CODAMA_ERROR__INVALID_TICKS_PER_SECOND,
    CODAMA_ERROR__LINKED_NODE_NOT_FOUND,
    CODAMA_ERROR__NODE_FILESYSTEM_FUNCTION_UNAVAILABLE,
    CODAMA_ERROR__NODE_PATH_PROGRAM_MISSING,
    CODAMA_ERROR__RENDERERS__MISSING_DEPENDENCY_VERSIONS,
    CODAMA_ERROR__RENDERERS__UNSUPPORTED_NODE,
    CODAMA_ERROR__UNEXPECTED_NESTED_NODE_KIND,
    CODAMA_ERROR__UNEXPECTED_NODE_KIND,
    CODAMA_ERROR__UNRECOGNIZED_BYTES_ENCODING,
    CODAMA_ERROR__UNRECOGNIZED_NODE_KIND,
    CODAMA_ERROR__UNRECOGNIZED_NUMBER_FORMAT,
    CODAMA_ERROR__UNSUPPORTED_VERSION,
    CODAMA_ERROR__VERSION_MISMATCH,
    CODAMA_ERROR__VISITORS__ACCOUNT_FIELD_NOT_FOUND,
    CODAMA_ERROR__VISITORS__CANNOT_ADD_DUPLICATED_PDA_NAMES,
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

type DefaultUnspecifiedErrorContextToUndefined<T> = {
    [P in CodamaErrorCode]: P extends keyof T ? T[P] : undefined;
};

/**
 * WARNING:
 *   - Don't change or remove members of an error's context.
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
    [CODAMA_ERROR__ANCHOR__PROGRAM_ID_KIND_UNIMPLEMENTED]: {
        kind: string;
    };
    [CODAMA_ERROR__ANCHOR__SEED_KIND_UNIMPLEMENTED]: {
        kind: string;
    };
    [CODAMA_ERROR__ANCHOR__TYPE_PATH_MISSING]: {
        idlType: string;
        path: string;
    };
    [CODAMA_ERROR__ANCHOR__UNRECOGNIZED_IDL_TYPE]: {
        idlType: string;
    };
    [CODAMA_ERROR__CANNOT_RESOLVE_PATH]: {
        /** The path of the node the segment could not be applied to, from the root. */
        nodePath: readonly Node[];
        /** The path expression being resolved, e.g. `config.fees[0]`. */
        path: PathString;
        /** The segment that could not be followed, e.g. `fees` or `[0]`. */
        segment: string;
    };
    [CODAMA_ERROR__DEFINED_TYPE_HAS_NO_FINITE_VALUE]: {
        /** The identifier of the defined type. */
        name: IdentifierString;
        /** The path of the defined type, from the root. */
        path: readonly Node[];
    };
    [CODAMA_ERROR__DISCRIMINATOR_FIELD_HAS_NO_DEFAULT_VALUE]: {
        field: PathString;
    };
    [CODAMA_ERROR__DISCRIMINATOR_FIELD_NOT_FOUND]: {
        field: PathString;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_MISSING]: {
        accountName: IdentifierString;
        instructionName: IdentifierString;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_RESOLVER_MISSING]: {
        accountName: IdentifierString;
        resolverName: IdentifierString;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__CANNOT_CONVERT_TO_ADDRESS]: {
        value: string;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__CIRCULAR_ACCOUNT_DEPENDENCY]: {
        chain: string;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__DATA_MISSING]: {
        instructionName: IdentifierString;
        path: PathString;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__DEFAULT_VALUE_MISSING]: {
        argumentName: IdentifierString;
        instructionName: IdentifierString;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__DUPLICATE_SET_ITEM]: {
        /** The index of the first item the duplicate is equal to. */
        firstIndex: number;
        /** The index of the duplicate item. */
        index: number;
        /** The path of the set type node that rejected the value, from the root. */
        nodePath: readonly Node[];
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_DERIVE_PDA]: {
        accountName: IdentifierString;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_ENCODE_DATA]: {
        instructionName: IdentifierString;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_EXECUTE_RESOLVER]: {
        resolverName: IdentifierString;
        targetKind: NodeKind;
        targetName: IdentifierString;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_VALIDATE_INPUT]: {
        message: string;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__INSTRUCTION_NOT_FOUND]: {
        availableIxs: string[];
        instructionName: string;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__INVALID_ACCOUNT_ADDRESS]: {
        accountName: IdentifierString;
        value: string;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__INVALID_ACCOUNT_INPUT]: {
        accountName: IdentifierString;
        expectedType: string;
        value: string;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__INVARIANT_VIOLATION]: {
        message: string;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__NODE_REFERENCE_NOT_FOUND]: {
        instructionName: IdentifierString;
        referencedName: IdentifierString;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__PDA_NOT_FOUND]: {
        available: string;
        pdaName: string;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__PDA_SEED_MISSING]: {
        pdaName: IdentifierString;
        seedName: IdentifierString;
    };

    [CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_ADDRESS_TYPE]: {
        accountName: string;
        actualType: string;
        expectedType: string;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE]: {
        actualType: string;
        expectedType: string;
        /** The kind of the node that rejected the value. */
        nodeKind: NodeKind;
        /** The path of the node that rejected the value, from the root. */
        nodePath: readonly Node[];
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__UNSUPPORTED_NODE]: {
        nodeKind: NodeKind;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__UNSUPPORTED_OPTIONAL_ACCOUNT_STRATEGY]: {
        accountName: IdentifierString;
        instructionName: IdentifierString;
        strategy: string;
    };
    [CODAMA_ERROR__ENUM_VARIANT_NOT_FOUND]: {
        enum: EnumTypeNode;
        enumName: IdentifierString;
        variant: IdentifierString;
    };
    [CODAMA_ERROR__INJECTED_VALUE_NOT_PROVIDED]: {
        injectedValue: InjectedValueNode;
        key: IdentifierString;
    };
    [CODAMA_ERROR__INVALID_BRANDED_STRING]: {
        actual: string;
        expected: string;
    };
    [CODAMA_ERROR__INVALID_TICKS_PER_SECOND]: {
        /** The path of the date-time or duration type, from the root. */
        path: readonly Node[];
        /** The invalid number of ticks per second, e.g. `0`. */
        ticksPerSecond: number;
    };
    [CODAMA_ERROR__LINKED_NODE_NOT_FOUND]: {
        kind: LinkNode['kind'];
        linkNode: LinkNode;
        name: IdentifierString;
        path: readonly Node[];
    };
    [CODAMA_ERROR__NODE_FILESYSTEM_FUNCTION_UNAVAILABLE]: {
        fsFunction: string;
    };
    [CODAMA_ERROR__NODE_PATH_PROGRAM_MISSING]: {
        /** The path that should contain a program node, e.g. to resolve links from. */
        path: readonly Node[];
    };
    [CODAMA_ERROR__RENDERERS__MISSING_DEPENDENCY_VERSIONS]: {
        dependencies: readonly string[];
        message: string;
    };
    [CODAMA_ERROR__RENDERERS__UNSUPPORTED_NODE]: {
        kind: NodeKind;
        node: Node | undefined;
    };
    [CODAMA_ERROR__UNEXPECTED_NESTED_NODE_KIND]: {
        expectedKinds: NodeKind[];
        kind: NodeKind | null;
        node: Node | null | undefined;
    };
    [CODAMA_ERROR__UNEXPECTED_NODE_KIND]: {
        expectedKinds: NodeKind[];
        kind: NodeKind | null;
        node: Node | null | undefined;
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
        account: AccountNode;
        missingField: IdentifierString;
        name: IdentifierString;
    };
    [CODAMA_ERROR__VISITORS__CANNOT_ADD_DUPLICATED_PDA_NAMES]: {
        duplicatedPdaNames: IdentifierString[];
        program: ProgramNode;
        programName: IdentifierString;
    };
    [CODAMA_ERROR__VISITORS__CANNOT_EXTEND_MISSING_VISIT_FUNCTION]: {
        visitFunction: string;
    };
    [CODAMA_ERROR__VISITORS__CANNOT_FLATTEN_STRUCT_WITH_CONFLICTING_ATTRIBUTES]: {
        conflictingAttributes: IdentifierString[];
    };
    [CODAMA_ERROR__VISITORS__CANNOT_FLATTEN_STRUCT_WITH_PLUGINS]: {
        field: StructFieldTypeNode;
        fieldName: IdentifierString;
    };
    [CODAMA_ERROR__VISITORS__CANNOT_REMOVE_LAST_PATH_IN_NODE_STACK]: {
        path: readonly Node[];
    };
    [CODAMA_ERROR__VISITORS__CANNOT_SET_INSTRUCTION_DISCRIMINATOR]: {
        instruction: InstructionNode;
        instructionName: IdentifierString;
        reason: string;
    };
    [CODAMA_ERROR__VISITORS__CANNOT_USE_OPTIONAL_ACCOUNT_AS_PDA_SEED_VALUE]: {
        instruction: InstructionNode;
        instructionAccount: InstructionAccountNode;
        instructionAccountName: IdentifierString;
        instructionName: IdentifierString;
        seed: PdaSeedValueNode<AccountValueNode>;
        seedName: IdentifierString;
        seedValueName: IdentifierString;
    };
    [CODAMA_ERROR__VISITORS__CYCLIC_DEPENDENCY_DETECTED_WHEN_RESOLVING_INSTRUCTION_DEFAULT_VALUES]: {
        cycle: (InstructionAccountNode | StructFieldTypeNode)[];
        formattedCycle: string;
        instruction: InstructionNode;
        instructionName: IdentifierString;
    };
    [CODAMA_ERROR__VISITORS__DEFINED_TYPE_MEMBER_NOT_FOUND]: {
        definedType: DefinedTypeNode;
        missingMember: string;
        name: IdentifierString;
    };
    [CODAMA_ERROR__VISITORS__FAILED_TO_VALIDATE_NODE]: {
        formattedHistogram: string;
        validationItems: readonly ValidationItem[];
    };
    [CODAMA_ERROR__VISITORS__INSTRUCTION_ACCOUNT_NOT_FOUND]: {
        accountName: string;
        instruction: InstructionNode;
        instructionName: IdentifierString;
    };
    [CODAMA_ERROR__VISITORS__INSTRUCTION_DATA_FIELD_NOT_FOUND]: {
        instruction: InstructionNode;
        instructionName: IdentifierString;
        path: string;
    };
    [CODAMA_ERROR__VISITORS__INSTRUCTION_ENUM_DATA_FIELD_NOT_FOUND]: {
        fieldName: IdentifierString;
        instruction: InstructionNode;
        instructionName: IdentifierString;
    };
    [CODAMA_ERROR__VISITORS__INVALID_INSTRUCTION_DEFAULT_VALUE_DEPENDENCY]: {
        dependency: AccountValueNode | DataValueNode;
        dependencyKind: 'accountValueNode' | 'dataValueNode';
        dependencyName: IdentifierString | PathString;
        instruction: InstructionNode;
        instructionName: IdentifierString;
        parent: InstructionAccountNode | StructFieldTypeNode;
        parentKind: 'instructionAccountNode' | 'structFieldTypeNode';
        parentName: IdentifierString | PathString;
    };
    [CODAMA_ERROR__VISITORS__INVALID_NUMBER_WRAPPER]: {
        kind: string;
        reason: string;
        wrapper: object;
    };
    [CODAMA_ERROR__VISITORS__INVALID_PDA_SEED_VALUES]: {
        instruction: InstructionNode;
        instructionName: IdentifierString;
        pda: PdaNode;
        pdaName: IdentifierString;
    };
    [CODAMA_ERROR__VISITORS__INVALID_PROVIDED_VALUE]: {
        expectedKinds: NodeKind[];
        key: IdentifierString;
        provider: ProvidedNode;
        providedKind: NodeKind;
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
    path: readonly Node[];
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
    return `${key}=${encodeValue(value)}`;
}

export function encodeContextObject(context: object): string {
    const searchParamsString = Object.entries(context).map(encodeObjectContextEntry).join('&');
    return __NODEJS__ ? Buffer.from(searchParamsString, 'utf8').toString('base64') : btoa(searchParamsString);
}
