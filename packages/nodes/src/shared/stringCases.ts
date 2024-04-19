import type {
    CamelCaseString,
    KebabCaseString,
    PascalCaseString,
    SnakeCaseString,
    TitleCaseString,
} from '@kinobi-so/node-types';

export function capitalize(str: string): string {
    if (str.length === 0) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function titleCase(str: string): TitleCaseString {
    return str
        .replace(/([A-Z])/g, ' $1')
        .split(/[-_\s+.]/)
        .filter(word => word.length > 0)
        .map(capitalize)
        .join(' ') as TitleCaseString;
}

export function pascalCase(str: string): PascalCaseString {
    return titleCase(str).split(' ').join('') as PascalCaseString;
}

export function camelCase(str: string): CamelCaseString {
    if (str.length === 0) return str as CamelCaseString;
    const pascalStr = pascalCase(str);
    return (pascalStr.charAt(0).toLowerCase() + pascalStr.slice(1)) as CamelCaseString;
}

export function kebabCase(str: string): KebabCaseString {
    return titleCase(str).split(' ').join('-').toLowerCase() as KebabCaseString;
}

export function snakeCase(str: string): SnakeCaseString {
    return titleCase(str).split(' ').join('_').toLowerCase() as SnakeCaseString;
}
