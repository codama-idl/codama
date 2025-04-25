export type IdlV01 = {
    accounts?: IdlV01Account[];
    address: string;
    constants?: IdlV01Const[];
    docs?: string[];
    errors?: IdlV01ErrorCode[];
    events?: IdlV01Event[];
    instructions: IdlV01Instruction[];
    metadata: IdlV01Metadata;
    types?: IdlV01TypeDef[];
};

export type IdlV01Metadata = {
    contact?: string;
    dependencies?: IdlV01Dependency[];
    deployments?: IdlV01Deployments;
    description?: string;
    name: string;
    repository?: string;
    spec: string;
    version: string;
};

export type IdlV01Dependency = {
    name: string;
    version: string;
};

export type IdlV01Deployments = {
    devnet?: string;
    localnet?: string;
    mainnet?: string;
    testnet?: string;
};

export type IdlV01Instruction = {
    accounts: IdlV01InstructionAccountItem[];
    args: IdlV01Field[];
    discriminator: IdlV01Discriminator;
    docs?: string[];
    name: string;
    returns?: IdlV01Type;
};

export type IdlV01InstructionAccountItem = IdlV01InstructionAccount | IdlV01InstructionAccounts;

export type IdlV01InstructionAccount = {
    address?: string;
    docs?: string[];
    name: string;
    optional?: boolean;
    pda?: IdlV01Pda;
    relations?: string[];
    signer?: boolean;
    writable?: boolean;
};

export type IdlV01InstructionAccounts = {
    accounts: IdlV01InstructionAccount[];
    name: string;
};

export type IdlV01Pda = {
    program?: IdlV01Seed;
    seeds: IdlV01Seed[];
};

export type IdlV01Seed = IdlV01SeedAccount | IdlV01SeedArg | IdlV01SeedConst;

export type IdlV01SeedConst = {
    kind: 'const';
    value: number[];
};

export type IdlV01SeedArg = {
    kind: 'arg';
    path: string;
};

export type IdlV01SeedAccount = {
    account?: string;
    kind: 'account';
    path: string;
};

export type IdlV01Account = {
    discriminator: IdlV01Discriminator;
    name: string;
};

export type IdlV01Event = {
    discriminator: IdlV01Discriminator;
    name: string;
};

export type IdlV01Const = {
    name: string;
    type: IdlV01Type;
    value: string;
};

export type IdlV01ErrorCode = {
    code: number;
    msg?: string;
    name: string;
};

export type IdlV01Field = {
    docs?: string[];
    name: string;
    type: IdlV01Type;
};

export type IdlV01TypeDef = {
    docs?: string[];
    generics?: IdlV01TypeDefGeneric[];
    name: string;
    repr?: IdlV01Repr;
    serialization?: IdlV01Serialization;
    type: IdlV01TypeDefTy;
};

export type IdlV01Serialization = 'borsh' | 'bytemuck' | 'bytemuckunsafe' | { custom: string };

export type IdlV01Repr = IdlV01ReprC | IdlV01ReprRust | IdlV01ReprTransparent;

export type IdlV01ReprRust = IdlV01ReprModifier & {
    kind: 'rust';
};

export type IdlV01ReprC = IdlV01ReprModifier & {
    kind: 'c';
};

export type IdlV01ReprTransparent = {
    kind: 'transparent';
};

export type IdlV01ReprModifier = {
    align?: number;
    packed?: boolean;
};

export type IdlV01TypeDefGeneric = IdlV01TypeDefGenericConst | IdlV01TypeDefGenericType;

export type IdlV01TypeDefGenericType = {
    kind: 'type';
    name: string;
};

export type IdlV01TypeDefGenericConst = {
    kind: 'const';
    name: string;
    type: string;
};

export type IdlV01TypeDefTy = IdlV01TypeDefTyAlias | IdlV01TypeDefTyEnum | IdlV01TypeDefTyStruct | IdlV01TypeDefTyType;

export type IdlV01TypeDefTyStruct = {
    fields?: IdlV01DefinedFields;
    kind: 'struct';
};

export type IdlV01TypeDefTyEnum = {
    kind: 'enum';
    variants: IdlV01EnumVariant[];
};

export type IdlV01TypeDefTyAlias = {
    kind: 'alias';
    value: IdlV01Type;
};

export type IdlV01TypeDefTyType = {
    alias: IdlV01Type;
    kind: 'type';
};

export type IdlV01EnumVariant = {
    fields?: IdlV01DefinedFields;
    name: string;
};

export type IdlV01DefinedFields = IdlV01DefinedFieldsNamed | IdlV01DefinedFieldsTuple;

export type IdlV01DefinedFieldsNamed = IdlV01Field[];

export type IdlV01DefinedFieldsTuple = IdlV01Type[];

export type IdlV01ArrayLen = IdlV01ArrayLenGeneric | IdlV01ArrayLenValue;

export type IdlV01ArrayLenGeneric = {
    generic: string;
};

export type IdlV01ArrayLenValue = number;

export type IdlV01GenericArg = IdlV01GenericArgConst | IdlV01GenericArgType;

export type IdlV01GenericArgType = { kind: 'type'; type: IdlV01Type };

export type IdlV01GenericArgConst = { kind: 'const'; value: string };

export type IdlV01Type =
    | IdlV01TypeArray
    | IdlV01TypeCOption
    | IdlV01TypeDefined
    | IdlV01TypeGeneric
    | IdlV01TypeNumber
    | IdlV01TypeOption
    | IdlV01TypeVec
    | 'bool'
    | 'bytes'
    | 'pubkey'
    | 'string';

export type IdlV01TypeUnsignedInteger = 'shortU16' | 'u8' | 'u16' | 'u32' | 'u64' | 'u128';
export type IdlV01TypeSignedInteger = 'i8' | 'i16' | 'i32' | 'i64' | 'i128';
export type IdlV01TypeInteger = IdlV01TypeSignedInteger | IdlV01TypeUnsignedInteger;
export type IdlV01TypeDecimals = 'f32' | 'f64';
export type IdlV01TypeNumber = IdlV01TypeDecimals | IdlV01TypeInteger;

export type IdlV01TypeOption = {
    option: IdlV01Type;
};

export type IdlV01TypeCOption = {
    coption: IdlV01Type;
};

export type IdlV01TypeVec = {
    vec: IdlV01Type;
};

export type IdlV01TypeArray = {
    array: [IdlV01Type: IdlV01Type, size: IdlV01ArrayLen];
};

export type IdlV01TypeDefined = {
    defined: {
        generics?: IdlV01GenericArg[];
        name: string;
    };
};

export type IdlV01TypeGeneric = {
    generic: string;
};

export type IdlV01Discriminator = number[];
