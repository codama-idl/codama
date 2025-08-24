import { camelCase, capitalize, kebabCase, pascalCase, snakeCase, titleCase } from '@codama/nodes';

export type NameTransformerHelpers = {
    camelCase: (name: string) => string;
    capitalize: (name: string) => string;
    kebabCase: (name: string) => string;
    pascalCase: (name: string) => string;
    snakeCase: (name: string) => string;
    titleCase: (name: string) => string;
};

export type NameTransformer = (name: string, helpers: NameTransformerHelpers) => string;

export type NameTransformerKey =
    | 'accountDecodeFunction'
    | 'accountFetchAllFunction'
    | 'accountFetchAllMaybeFunction'
    | 'accountFetchFromSeedsFunction'
    | 'accountFetchFunction'
    | 'accountFetchMaybeFromSeedsFunction'
    | 'accountFetchMaybeFunction'
    | 'accountGetSizeFunction'
    | 'codecFunction'
    | 'constant'
    | 'constantFunction'
    | 'dataArgsType'
    | 'dataType'
    | 'decoderFunction'
    | 'discriminatedUnionDiscriminator'
    | 'discriminatedUnionFunction'
    | 'discriminatedUnionVariant'
    | 'encoderFunction'
    | 'enumLabels'
    | 'enumVariant'
    | 'instructionAsyncFunction'
    | 'instructionAsyncInputType'
    | 'instructionDataType'
    | 'instructionExtraType'
    | 'instructionParsedType'
    | 'instructionParseFunction'
    | 'instructionSyncFunction'
    | 'instructionSyncInputType'
    | 'instructionType'
    | 'isDiscriminatedUnionFunction'
    | 'pdaFindFunction'
    | 'pdaSeedsType'
    | 'programAccountsEnum'
    | 'programAccountsEnumVariant'
    | 'programAccountsIdentifierFunction'
    | 'programAddressConstant'
    | 'programErrorConstant'
    | 'programErrorConstantPrefix'
    | 'programErrorMessagesMap'
    | 'programErrorUnion'
    | 'programGetErrorMessageFunction'
    | 'programInstructionsEnum'
    | 'programInstructionsEnumVariant'
    | 'programInstructionsIdentifierFunction'
    | 'programInstructionsParsedUnionType'
    | 'programIsErrorFunction'
    | 'resolverFunction';

export type NameTransformers = Record<NameTransformerKey, NameTransformer>;

export type NameApi = Record<NameTransformerKey, (name: string) => string>;

export function getNameApi(transformers: NameTransformers): NameApi {
    const helpers = {
        camelCase,
        capitalize,
        kebabCase,
        pascalCase,
        snakeCase,
        titleCase,
    };
    return Object.fromEntries(
        Object.entries(transformers).map(([key, transformer]) => [key, (name: string) => transformer(name, helpers)]),
    ) as NameApi;
}

export const DEFAULT_NAME_TRANSFORMERS: NameTransformers = {
    accountDecodeFunction: name => `decode${pascalCase(name)}`,
    accountFetchAllFunction: name => `fetchAll${pascalCase(name)}`,
    accountFetchAllMaybeFunction: name => `fetchAllMaybe${pascalCase(name)}`,
    accountFetchFromSeedsFunction: name => `fetch${pascalCase(name)}FromSeeds`,
    accountFetchFunction: name => `fetch${pascalCase(name)}`,
    accountFetchMaybeFromSeedsFunction: name => `fetchMaybe${pascalCase(name)}FromSeeds`,
    accountFetchMaybeFunction: name => `fetchMaybe${pascalCase(name)}`,
    accountGetSizeFunction: name => `get${pascalCase(name)}Size`,
    codecFunction: name => `get${pascalCase(name)}Codec`,
    constant: name => snakeCase(name).toUpperCase(),
    constantFunction: name => `get${pascalCase(name)}Bytes`,
    dataArgsType: name => `${pascalCase(name)}Args`,
    dataType: name => `${pascalCase(name)}`,
    decoderFunction: name => `get${pascalCase(name)}Decoder`,
    discriminatedUnionDiscriminator: () => '__kind',
    discriminatedUnionFunction: name => `${camelCase(name)}`,
    discriminatedUnionVariant: name => `${pascalCase(name)}`,
    encoderFunction: name => `get${pascalCase(name)}Encoder`,
    enumLabels: name => `${snakeCase(name).toUpperCase()}_LABELS`,
    enumVariant: name => `${pascalCase(name)}`,
    instructionAsyncFunction: name => `get${pascalCase(name)}InstructionAsync`,
    instructionAsyncInputType: name => `${pascalCase(name)}AsyncInput`,
    instructionDataType: name => `${pascalCase(name)}InstructionData`,
    instructionExtraType: name => `${pascalCase(name)}InstructionExtra`,
    instructionParseFunction: name => `parse${pascalCase(name)}Instruction`,
    instructionParsedType: name => `Parsed${pascalCase(name)}Instruction`,
    instructionSyncFunction: name => `get${pascalCase(name)}Instruction`,
    instructionSyncInputType: name => `${pascalCase(name)}Input`,
    instructionType: name => `${pascalCase(name)}Instruction`,
    isDiscriminatedUnionFunction: name => `is${pascalCase(name)}`,
    pdaFindFunction: name => `find${pascalCase(name)}Pda`,
    pdaSeedsType: name => `${pascalCase(name)}Seeds`,
    programAccountsEnum: name => `${pascalCase(name)}Account`,
    programAccountsEnumVariant: name => `${pascalCase(name)}`,
    programAccountsIdentifierFunction: name => `identify${pascalCase(name)}Account`,
    programAddressConstant: name => `${snakeCase(name).toUpperCase()}_PROGRAM_ADDRESS`,
    programErrorConstant: name => snakeCase(name).toUpperCase(),
    programErrorConstantPrefix: name => `${snakeCase(name).toUpperCase()}_ERROR__`,
    programErrorMessagesMap: name => `${camelCase(name)}ErrorMessages`,
    programErrorUnion: name => `${pascalCase(name)}Error`,
    programGetErrorMessageFunction: name => `get${pascalCase(name)}ErrorMessage`,
    programInstructionsEnum: name => `${pascalCase(name)}Instruction`,
    programInstructionsEnumVariant: name => `${pascalCase(name)}`,
    programInstructionsIdentifierFunction: name => `identify${pascalCase(name)}Instruction`,
    programInstructionsParsedUnionType: name => `Parsed${pascalCase(name)}Instruction`,
    programIsErrorFunction: name => `is${pascalCase(name)}Error`,
    resolverFunction: name => `${camelCase(name)}`,
};
