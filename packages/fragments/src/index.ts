/**
 * `@codama/fragments`
 *
 * The root entrypoint exposes only the language-agnostic core primitives
 * (`BaseFragment`, `createFragmentTemplate`, `mapFragmentContent`, etc.).
 * Language-aware code — concrete `Fragment` types, `ImportMap` shapes, and
 * `fragment` tagged templates — lives under language subpaths:
 *
 *   import { fragment, use, renderPage } from '@codama/fragments/javascript';
 *   import { fragment, addFragmentImports } from '@codama/fragments/rust';
 *
 * Generators that don't need language-specific behavior — for example,
 * because they only manipulate the shared `BaseFragment` shape — should
 * import from this root entrypoint.
 */

export * from './core';
