import type { ImportInfo, ImportMap } from './ImportMap';
import { getDefaultUsedIdentifier } from './ImportMap';
import { resolveImportMap } from './resolveImportMap';

/**
 * Render an import map as a block of `use foo::Bar;` (and `use foo::Bar as Baz;`)
 * statements, one per local name: a path imported under several names
 * produces several statements.
 *
 * The map is first resolved against `dependencies` so symbolic prefixes
 * like `'generated::…'` expand to concrete crate paths. The output is
 * sorted alphabetically for stable, reviewable diffs.
 *
 * @param importMap - The import map to render.
 * @param dependencies - The dependency map to apply before rendering.
 * Defaults to no resolution.
 * @return The block of `use` statements joined by newlines, or the empty
 * string if the map is empty.
 *
 * @example
 * ```ts
 * import { addAliasToImportMap, addToImportMap, createImportMap, importMapToString } from '@codama/fragments/rust';
 *
 * let map = createImportMap();
 * map = addToImportMap(map, ['borsh::BorshSerialize', 'solana_program::pubkey::Pubkey']);
 * map = addAliasToImportMap(map, 'solana_program::program_error::ProgramError', 'ProgError');
 * map = addAliasToImportMap(map, 'solana_program::pubkey::Pubkey', 'Address');
 * importMapToString(map);
 * // use borsh::BorshSerialize;
 * // use solana_program::program_error::ProgramError as ProgError;
 * // use solana_program::pubkey::Pubkey as Address;
 * // use solana_program::pubkey::Pubkey;
 * ```
 */
export function importMapToString(importMap: ImportMap, dependencies: Record<string, string> = {}): string {
    const resolved = resolveImportMap(importMap, dependencies);
    return [...resolved.values()]
        .flatMap(infos => [...infos.values()].map(formatImportInfo))
        .sort((a, b) => a.localeCompare(b))
        .join('\n');
}

function formatImportInfo(info: ImportInfo): string {
    const isPlain = info.usedIdentifier === getDefaultUsedIdentifier(info.importedPath);
    return isPlain ? `use ${info.importedPath};` : `use ${info.importedPath} as ${info.usedIdentifier};`;
}
