export type { ProgramDerivedAddress } from '@solana/addresses';

export { isPublicKeyLike, toAddress } from './shared/address';
export type { AddressInput, PublicKeyLike } from './shared/address';

export { CodamaError, isCodamaError } from '@codama/errors';
export {
    CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_MISSING,
    CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_RESOLVER_MISSING,
    CODAMA_ERROR__DYNAMIC_CLIENT__ARGUMENT_MISSING,
    CODAMA_ERROR__DYNAMIC_CLIENT__CANNOT_CONVERT_TO_ADDRESS,
    CODAMA_ERROR__DYNAMIC_CLIENT__CIRCULAR_ACCOUNT_DEPENDENCY,
    CODAMA_ERROR__DYNAMIC_CLIENT__DEFAULT_VALUE_MISSING,
    CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_DERIVE_PDA,
    CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_ENCODE_ARGUMENT,
    CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_EXECUTE_RESOLVER,
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
    CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_VALIDATE_INPUT,
} from '@codama/errors';

export type { AccountsInput, ArgumentsInput } from './shared/types';

export { createProgramClient } from './program-client/create-program-client';
export type {
    CreateProgramClientOptions,
    IdlInput,
    ProgramClient,
    ProgramMethodBuilder,
} from './program-client/create-program-client';

export { generateClientTypes } from './cli/commands/generate-client-types/generate-client-types';
