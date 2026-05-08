/**
 * String-casing helpers used by code generators when emitting
 * identifiers. They normalise an arbitrary input string into a
 * conventional shape (camelCase, PascalCase, kebab-case, snake_case,
 * Title Case) by inserting word boundaries before uppercase letters and
 * splitting on any sequence of non-alphanumeric characters.
 *
 * Returned values are plain `string`. This package deliberately does
 * not depend on `@codama/node-types`, so the branded `CamelCaseString`
 * / `PascalCaseString` / … types are not applied here. Consumers that
 * want the brand (e.g. `@codama/nodes`) can wrap these helpers and
 * apply the cast at their own boundary.
 *
 * The implementations all run through {@link titleCase} as a common
 * intermediate form, so a single deterministic word-splitting policy
 * is shared across every output shape.
 */

/**
 * Uppercase the first character and lowercase the rest. Returns the
 * input unchanged when it is empty.
 */
export function capitalize(str: string): string {
    if (str.length === 0) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Normalise an arbitrary string into Title Case — a space-separated
 * sequence of {@link capitalize}d words. Inserts a space before each
 * uppercase letter, then splits on any run of non-alphanumeric
 * characters and re-joins with single spaces.
 */
export function titleCase(str: string): string {
    return str
        .replace(/([A-Z])/g, ' $1')
        .split(/[^a-zA-Z0-9]+/)
        .filter(word => word.length > 0)
        .map(capitalize)
        .join(' ');
}

/**
 * Normalise an arbitrary string into PascalCase by stripping the
 * spaces from its {@link titleCase} form.
 */
export function pascalCase(str: string): string {
    return titleCase(str).split(' ').join('');
}

/**
 * Normalise an arbitrary string into camelCase by lowercasing the
 * first character of its {@link pascalCase} form.
 */
export function camelCase(str: string): string {
    if (str.length === 0) return str;
    const pascalStr = pascalCase(str);
    return pascalStr.charAt(0).toLowerCase() + pascalStr.slice(1);
}

/**
 * Normalise an arbitrary string into kebab-case — lowercase words
 * joined with `-` — by replacing the spaces in its {@link titleCase}
 * form.
 */
export function kebabCase(str: string): string {
    return titleCase(str).split(' ').join('-').toLowerCase();
}

/**
 * Normalise an arbitrary string into snake_case — lowercase words
 * joined with `_` — by replacing the spaces in its {@link titleCase}
 * form.
 */
export function snakeCase(str: string): string {
    return titleCase(str).split(' ').join('_').toLowerCase();
}
