import type { Fragment } from './fragment';
import { fragment } from './fragment';

/**
 * Build a fragment that re-exports every binding from a module:
 * `export * from '<module>';`.
 *
 * The fragment carries no imports — `export * from` only forwards bindings
 * out, it does not bring `module` into local scope.
 *
 * @param module - The module specifier being re-exported.
 * @return A {@link Fragment} whose content is `export * from '<module>';`.
 *
 * @example
 * ```ts
 * import { getExportAllFragment } from '@codama/fragments/javascript';
 *
 * getExportAllFragment('./accounts').content;
 * // export * from './accounts';
 * ```
 */
export function getExportAllFragment(module: string): Fragment {
    return fragment`export * from '${module}';`;
}
