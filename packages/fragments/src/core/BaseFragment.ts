/**
 * The minimal shape every renderer's `Fragment` extends.
 *
 * A fragment is the unit of generated source — a string of code along with
 * any metadata (e.g. imports, features) the renderer wants to attach. The
 * `content` field is the only thing every flavor agrees on; everything else
 * is layered on top by the language-specific subpaths
 * (`@codama/fragments/javascript`, `@codama/fragments/rust`) or by the
 * renderers themselves.
 *
 * @example
 * ```ts
 * import type { BaseFragment } from '@codama/fragments';
 *
 * type MyFragment = BaseFragment & Readonly<{ tags: ReadonlySet<string> }>;
 * ```
 */
export type BaseFragment = Readonly<{ content: string }>;
