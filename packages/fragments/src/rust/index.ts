/**
 * `@codama/fragments/rust`
 *
 * The Rust flavor of the fragment library: a concrete `Fragment` type
 * carrying a frozen, functional `ImportMap`, a `fragment` tagged template
 * that propagates imports through interpolation, and helpers for
 * building, merging, resolving, and rendering.
 *
 * Re-exports the language-agnostic core too, so consumers only need a
 * single import in the typical case.
 */

export * from '../core';
export * from './ImportMap';
export * from './addToImportMap';
export * from './addAliasToImportMap';
export * from './mergeImportMaps';
export * from './removeFromImportMap';
export * from './resolveImportMap';
export * from './getExternalDependencies';
export * from './importMapToString';
export * from './fragment';
export * from './getDocblockFragment';
