/**
 * String-casing helpers used by code generators when emitting
 * identifiers. They normalise an arbitrary input string into a
 * conventional shape (camelCase, PascalCase, kebab-case, snake_case,
 * Title Case).
 *
 * Words follow the Codama spec's casing-collision rule, so every casing
 * derived here is consistent with how identifiers are validated:
 *
 * - any run of non-alphanumeric characters (including underscores)
 *   separates words, and empty words are discarded;
 * - a word also ends between a lowercase letter or digit and an
 *   uppercase letter (`fooBar` → `foo|Bar`, `foo1Bar` → `foo1|Bar`);
 * - and between an uppercase letter and an uppercase letter followed by
 *   a lowercase letter, so acronyms stay whole (`HTTPServer` →
 *   `HTTP|Server`).
 *
 * A digit never begins a new word on its own (`foo1bar` is one word).
 * The implementations all run through {@link titleCase} as a common
 * intermediate form, so this single word-splitting policy is shared
 * across every output shape.
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
 * sequence of {@link capitalize}d words, split as described at the top
 * of this module.
 *
 * @example
 * ```ts
 * titleCase('transfer_tokens'); // 'Transfer Tokens'
 * titleCase('HTTPServer'); // 'Http Server'
 * titleCase('MAX_SUPPLY'); // 'Max Supply'
 * ```
 */
export function titleCase(str: string): string {
    return str
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
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
