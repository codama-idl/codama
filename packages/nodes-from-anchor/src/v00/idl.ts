export type IdlV00 = {
    accounts?: IdlV00AccountDef[];
    constants?: IdlV00Constant[];
    docs?: string[];
    errors?: IdlV00ErrorCode[];
    events?: IdlV00Event[];
    instructions: IdlV00Instruction[];
    metadata?: IdlV00Metadata;
    name: string;
    types?: IdlV00TypeDef[];
    version: string;
};

export type IdlV00Metadata = object;

export type IdlV00Constant = {
    name: string;
    type: IdlV00Type;
    value: string;
};

export type IdlV00Event = {
    fields: IdlV00EventField[];
    name: string;
};

export type IdlV00EventField = {
    index: boolean;
    name: string;
    type: IdlV00Type;
};

export type IdlV00Instruction = {
    accounts: IdlV00AccountItem[];
    args: IdlV00Field[];
    discriminant?: IdlV00InstructionDiscriminant;
    docs?: string[];
    legacyOptionalAccountsStrategy?: boolean;
    name: string;
    returns?: IdlV00Type;
};

export type IdlV00InstructionDiscriminant = {
    type: IdlV00Type;
    value: number;
};

export type IdlV00StateMethod = IdlV00Instruction;

export type IdlV00AccountItem = IdlV00Account | IdlV00Accounts;

export type IdlV00Account = {
    desc?: string;
    docs?: string[];
    isMut: boolean;
    isOptional?: boolean;
    isOptionalSigner?: boolean;
    isSigner: boolean;
    name: string;
    optional?: boolean;
    pda?: IdlV00Pda;
    relations?: string[];
};

export type IdlV00Pda = {
    programId?: IdlV00Seed;
    seeds: IdlV00Seed[];
};

export type IdlV00Seed = IdlV00SeedAccount | IdlV00SeedArg | IdlV00SeedConst;

export type IdlV00SeedConst = {
    kind: 'const';
    type: IdlV00Type;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any;
};

export type IdlV00SeedArg = {
    kind: 'arg';
    path: string;
    type: IdlV00Type;
};

export type IdlV00SeedAccount = {
    account?: string;
    kind: 'account';
    path: string;
    type: IdlV00Type;
};

// A nested/recursive version of IdlV00Account.
export type IdlV00Accounts = {
    accounts: IdlV00AccountItem[];
    docs?: string[];
    name: string;
};

export type IdlV00Field = {
    docs?: string[];
    name: string;
    type: IdlV00Type;
};

export type IdlV00TypeDef = {
    docs?: string[];
    name: string;
    type: IdlV00TypeDefTy;
};

export type IdlV00AccountDef = {
    docs?: string[];
    name: string;
    seeds?: IdlV00PdaSeedDef[];
    size?: number;
    type: IdlV00TypeDefTyStruct;
};

export type IdlV00PdaDef = {
    docs?: string[];
    name: string;
    seeds?: IdlV00PdaSeedDef[];
};

export type IdlV00PdaSeedDef =
    | { description: string; kind: 'variable'; name: string; type: IdlV00Type }
    | { kind: 'constant'; type: IdlV00Type; value: boolean | number | string }
    | { kind: 'programId' };

export type IdlV00TypeDefTyStruct = {
    fields: Array<IdlV00Field>;
    kind: 'struct';
};

export type IdlV00TypeDefTyEnum = {
    kind: 'enum';
    size?: IdlV00TypeUnsignedInteger;
    variants: IdlV00EnumVariant[];
};

export type IdlV00TypeDefTyAlias = {
    kind: 'alias';
    value: IdlV00Type;
};

export type IdlV00TypeDefTy = IdlV00TypeDefTyAlias | IdlV00TypeDefTyEnum | IdlV00TypeDefTyStruct;

export type IdlV00Type =
    | IdlV00TypeArray
    | IdlV00TypeDefined
    | IdlV00TypeMap
    | IdlV00TypeNumber
    | IdlV00TypeOption
    | IdlV00TypeSet
    | IdlV00TypeTuple
    | IdlV00TypeVec
    | 'bool'
    | 'bytes'
    | 'publicKey'
    | 'string';

export type IdlV00TypeUnsignedInteger = 'shortU16' | 'u8' | 'u16' | 'u32' | 'u64' | 'u128';
export type IdlV00TypeSignedInteger = 'i8' | 'i16' | 'i32' | 'i64' | 'i128';
export type IdlV00TypeInteger = IdlV00TypeSignedInteger | IdlV00TypeUnsignedInteger;
export type IdlV00TypeDecimals = 'f32' | 'f64';
export type IdlV00TypeNumber = IdlV00TypeDecimals | IdlV00TypeInteger;

// User defined type.
export type IdlV00TypeDefined = {
    defined: string;
};

export type IdlV00TypeOption = {
    fixed?: boolean;
    prefix?: IdlV00TypeUnsignedInteger;
} & ({ coption: IdlV00Type } | { option: IdlV00Type });

export type IdlV00TypeVec = {
    size?: IdlV00TypeUnsignedInteger | 'remainder';
    vec: IdlV00Type;
};
export type IdlV00TypeTuple = { tuple: IdlV00Type[] };

export type IdlV00TypeArray = {
    array: [idlV00Type: IdlV00Type, size: number];
};

export type IdlV00TypeHashMap = { hashMap: [IdlV00Type, IdlV00Type] };
export type IdlV00TypeBTreeMap = { bTreeMap: [IdlV00Type, IdlV00Type] };
export type IdlV00TypeMap = {
    size?: IdlV00TypeUnsignedInteger | number | 'remainder';
} & (IdlV00TypeBTreeMap | IdlV00TypeHashMap);

export type IdlV00TypeHashSet = { hashSet: IdlV00Type };
export type IdlV00TypeBTreeSet = { bTreeSet: IdlV00Type };
export type IdlV00TypeSet = {
    size?: IdlV00TypeUnsignedInteger | number | 'remainder';
} & (IdlV00TypeBTreeSet | IdlV00TypeHashSet);

export type IdlV00EnumVariant = {
    fields?: IdlV00EnumFields;
    name: string;
};

export type IdlV00EnumFields = IdlV00EnumFieldsNamed | IdlV00EnumFieldsTuple;

export type IdlV00EnumFieldsNamed = IdlV00Field[];

export type IdlV00EnumFieldsTuple = IdlV00Type[];

export type IdlV00ErrorCode = {
    code: number;
    docs?: string[];
    msg?: string;
    name: string;
};
