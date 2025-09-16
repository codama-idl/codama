export type TitleCaseString = string & {
    readonly ['__stringCase:codama']: 'titleCase';
};

export type PascalCaseString = string & {
    readonly ['__stringCase:codama']: 'pascalCase';
};

export type CamelCaseString = string & {
    readonly ['__stringCase:codama']: 'camelCase';
};

export type KebabCaseString = string & {
    readonly ['__stringCase:codama']: 'kebabCase';
};

export type SnakeCaseString = string & {
    readonly ['__stringCase:codama']: 'snakeCase';
};
