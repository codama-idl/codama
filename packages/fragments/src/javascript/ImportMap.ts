/**
 * The data model used by `@codama/fragments/javascript` to track imports
 * symbolically until they are stringified into actual `import { … } from '…';`
 * lines.
 *
 * Imports are accumulated as a `ReadonlyMap<Module, ReadonlyMap<UsedIdentifier, ImportInfo>>`:
 * outer key is the source module, inner key is the identifier used in the
 * consuming code (which may differ from the imported name via aliasing).
 *
 * The format accepted by {@link parseImportInput} is a single string with
 * the same shorthand TypeScript itself uses inside an `import { … }` block:
 *
 *   `Foo`                — value import; used as `Foo`
 *   `type Foo`           — type-only import; used as `Foo`
 *   `Foo as Bar`         — value import aliased; used as `Bar`
 *   `type Foo as Bar`    — type-only import aliased; used as `Bar`
 */

/** A single import shorthand string. See the file-level docblock for the accepted forms. */
export type ImportInput = string;

/** A module path: either an absolute (`@scope/pkg`, `pkg`, `pkg/sub`) or a relative (`./foo`, `../bar`) specifier. */
export type Module = string;

/** The identifier as it appears in the consuming code (after aliasing). */
export type UsedIdentifier = string;

/** A parsed import shorthand. */
export interface ImportInfo {
    readonly importedIdentifier: string;
    readonly isType: boolean;
    readonly usedIdentifier: UsedIdentifier;
}

/** A symbolic import map keyed by module, then by used identifier. */
export type ImportMap = ReadonlyMap<Module, ReadonlyMap<UsedIdentifier, ImportInfo>>;

/**
 * Construct an empty, frozen import map.
 *
 * @return A new {@link ImportMap} with no entries.
 *
 * @example
 * ```ts
 * import { createImportMap } from '@codama/fragments/javascript';
 *
 * const empty = createImportMap();
 * ```
 */
export function createImportMap(): ImportMap {
    return Object.freeze(new Map());
}

/**
 * Parse a single import shorthand (e.g. `'type Foo as Bar'`) into a
 * structured {@link ImportInfo}.
 *
 * @param input - The shorthand string to parse.
 * @return The parsed info. If the shorthand can't be matched (e.g. it
 * contains illegal whitespace), the entire string is returned unchanged as
 * both the imported and used identifier, with `isType: false`.
 *
 * @example
 * ```ts
 * parseImportInput('Foo');             // { importedIdentifier: 'Foo', usedIdentifier: 'Foo', isType: false }
 * parseImportInput('type Foo as Bar'); // { importedIdentifier: 'Foo', usedIdentifier: 'Bar', isType: true }
 * ```
 */
export function parseImportInput(input: ImportInput): ImportInfo {
    const matches = /^(type )?([^ ]+)(?: as (.+))?$/.exec(input);
    if (!matches) {
        return Object.freeze({
            importedIdentifier: input,
            isType: false,
            usedIdentifier: input,
        });
    }
    const [, isType, name, alias] = matches;
    return Object.freeze({
        importedIdentifier: name,
        isType: !!isType,
        usedIdentifier: alias ?? name,
    });
}
