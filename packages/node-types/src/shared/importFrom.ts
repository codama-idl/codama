/**
 * Tells Kinobi where a dependency is located.
 *
 * This could be a `hooked` dependency, or any other arbitrary dependency
 * as long as renderers know how to map them into real libraries.
 *
 * `hooked` means the dependency is located in the source code but outside of the `generated` code.
 * This is typically a dedicated folder that is used internally by the auto-generated code.
 */
export type ImportFrom = string | 'hooked';
