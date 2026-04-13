/**
 * Heavily inspired by @solana/errors.
 * @see https://github.com/anza-xyz/kit/blob/main/packages/errors
 */

import {
    AccountNode,
    AccountValueNode,
    CamelCaseString,
    EnumTypeNode,
    InstructionAccountNode,
    InstructionArgumentNode,
    InstructionNode,
    LinkNode,
    Node,
    NodeKind,
    PdaNode,
    PdaSeedValueNode,
    ProgramNode,
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
    [CODAMA_ERROR__DISCRIMINATOR_FIELD_HAS_NO_DEFAULT_VALUE]: {
        field: CamelCaseString;
    };
    [CODAMA_ERROR__DISCRIMINATOR_FIELD_NOT_FOUND]: {
        field: CamelCaseString;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_MISSING]: {
        accountName: CamelCaseString;
        instructionName: CamelCaseString;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_RESOLVER_MISSING]: {
        accountName: CamelCaseString;
        resolverName: CamelCaseString;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__ARGUMENT_MISSING]: {
        argumentName: CamelCaseString;
        instructionName: CamelCaseString;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__CANNOT_CONVERT_TO_ADDRESS]: {
        value: string;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__CIRCULAR_ACCOUNT_DEPENDENCY]: {
        chain: string;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__DEFAULT_VALUE_MISSING]: {
        argumentName: CamelCaseString;
        instructionName: CamelCaseString;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_DERIVE_PDA]: {
        accountName: CamelCaseString;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_ENCODE_ARGUMENT]: {
        argumentName: CamelCaseString;
        instructionName: CamelCaseString;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_EXECUTE_RESOLVER]: {
        resolverName: CamelCaseString;
        targetKind: NodeKind;
        targetName: CamelCaseString;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_VALIDATE_INPUT]: {
        message: string;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__INSTRUCTION_NOT_FOUND]: {
        availableIxs: string[];
        instructionName: string;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__INVALID_ACCOUNT_ADDRESS]: {
        accountName: CamelCaseString;
        value: string;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__INVALID_ARGUMENT_INPUT]: {
        argumentName: CamelCaseString;
        expectedType: string;
        value: string;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__INVARIANT_VIOLATION]: {
        message: string;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__NODE_REFERENCE_NOT_FOUND]: {
        instructionName: CamelCaseString;
        referencedName: CamelCaseString;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__PDA_NOT_FOUND]: {
        available: string;
        pdaName: string;
    };

    [CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_ADDRESS_TYPE]: {
        accountName: string;
        actualType: string;
        expectedType: string;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_ARGUMENT_TYPE]: {
        actualType: string;
        expectedType: string;
        nodeKind: NodeKind;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__UNSUPPORTED_NODE]: {
        nodeKind: NodeKind;
    };
    [CODAMA_ERROR__DYNAMIC_CLIENT__UNSUPPORTED_OPTIONAL_ACCOUNT_STRATEGY]: {
        accountName: CamelCaseString;
        instructionName: CamelCaseString;
        strategy: string;
    };
    [CODAMA_ERROR__ENUM_VARIANT_NOT_FOUND]: {
        enum: EnumTypeNode;
        enumName: CamelCaseString;
        variant: CamelCaseString;
    };
    [CODAMA_ERROR__LINKED_NODE_NOT_FOUND]: {
        kind: LinkNode['kind'];
        linkNode: LinkNode;
        name: CamelCaseString;
        path: readonly Node[];
    };
    [CODAMA_ERROR__NODE_FILESYSTEM_FUNCTION_UNAVAILABLE]: {
        fsFunction: string;
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
    [CODAMA_ERROR__VERSION_MISMATCH]: {
        codamaVersion: string;
        rootVersion: string;
    };
    [CODAMA_ERROR__VISITORS__ACCOUNT_FIELD_NOT_FOUND]: {
        account: AccountNode;
        missingField: CamelCaseString;
        name: CamelCaseString;
    };
    [CODAMA_ERROR__VISITORS__CANNOT_ADD_DUPLICATED_PDA_NAMES]: {
        duplicatedPdaNames: CamelCaseString[];
        program: ProgramNode;
        programName: CamelCaseString;
    };
    [CODAMA_ERROR__VISITORS__CANNOT_EXTEND_MISSING_VISIT_FUNCTION]: {
        visitFunction: string;
    };
    [CODAMA_ERROR__VISITORS__CANNOT_FLATTEN_STRUCT_WITH_CONFLICTING_ATTRIBUTES]: {
        conflictingAttributes: CamelCaseString[];
    };
    [CODAMA_ERROR__VISITORS__CANNOT_REMOVE_LAST_PATH_IN_NODE_STACK]: {
        path: readonly Node[];
    };
    [CODAMA_ERROR__VISITORS__CANNOT_USE_OPTIONAL_ACCOUNT_AS_PDA_SEED_VALUE]: {
        instruction: InstructionNode;
        instructionAccount: InstructionAccountNode;
        instructionAccountName: CamelCaseString;
        instructionName: CamelCaseString;
        seed: PdaSeedValueNode<AccountValueNode>;
        seedName: CamelCaseString;
        seedValueName: CamelCaseString;
    };
    [CODAMA_ERROR__VISITORS__CYCLIC_DEPENDENCY_DETECTED_WHEN_RESOLVING_INSTRUCTION_DEFAULT_VALUES]: {
        cycle: (InstructionAccountNode | InstructionArgumentNode)[];
        formattedCycle: string;
        instruction: InstructionNode;
        instructionName: CamelCaseString;
    };
    [CODAMA_ERROR__VISITORS__FAILED_TO_VALIDATE_NODE]: {
        formattedHistogram: string;
        validationItems: ValidationItem[];
    };
    [CODAMA_ERROR__VISITORS__INSTRUCTION_ENUM_ARGUMENT_NOT_FOUND]: {
        argumentName: CamelCaseString;
        instruction: InstructionNode;
        instructionName: CamelCaseString;
    };
    [CODAMA_ERROR__VISITORS__INVALID_INSTRUCTION_DEFAULT_VALUE_DEPENDENCY]: {
        dependency: InstructionAccountNode | InstructionArgumentNode;
        dependencyKind: 'instructionAccountNode' | 'instructionArgumentNode';
        dependencyName: CamelCaseString;
        instruction: InstructionNode;
        instructionName: CamelCaseString;
        parent: InstructionAccountNode | InstructionArgumentNode;
        parentKind: 'instructionAccountNode' | 'instructionArgumentNode';
        parentName: CamelCaseString;
    };
    [CODAMA_ERROR__VISITORS__INVALID_NUMBER_WRAPPER]: {
        wrapper: string;
    };
    [CODAMA_ERROR__VISITORS__INVALID_PDA_SEED_VALUES]: {
        instruction: InstructionNode;
        instructionName: CamelCaseString;
        pda: PdaNode;
        pdaName: CamelCaseString;
    };
    [CODAMA_ERROR__VISITORS__RENDER_MAP_KEY_NOT_FOUND]: {
        key: string;
    };
}>;

type ValidationItem = {
    level: 'debug' | 'error' | 'info' | 'trace' | 'warn';
    message: string;
    node: Node;
    path: Node[];
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
