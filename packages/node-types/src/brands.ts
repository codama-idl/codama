/**
 * Hand-written branded string types used throughout the generated
 * node-type surface to mark identifiers that must conform to a specific
 * casing convention.
 *
 * These types live outside `./generated/` because they're static — they
 * never change with the spec — so there's nothing to regenerate. The
 * generator's symbol map points at this file when emitting `import type
 * { CamelCaseString } from '../brands';` lines.
 *
 * The brand is purely a TypeScript marker; runtime parsing and
 * validation happen wherever string identifiers cross the package
 * boundary.
 */

/** A string asserted to be in camelCase form. */
export type CamelCaseString = string & {
    readonly ['__stringCase:codama']: 'camelCase';
};

/** A string asserted to be in kebabCase form. */
export type KebabCaseString = string & {
    readonly ['__stringCase:codama']: 'kebabCase';
};

/** A string asserted to be in pascalCase form. */
export type PascalCaseString = string & {
    readonly ['__stringCase:codama']: 'pascalCase';
};

/** A string asserted to be in snakeCase form. */
export type SnakeCaseString = string & {
    readonly ['__stringCase:codama']: 'snakeCase';
};

/** A string asserted to be in titleCase form. */
export type TitleCaseString = string & {
    readonly ['__stringCase:codama']: 'titleCase';
};
