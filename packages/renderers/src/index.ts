import { renderVisitor as renderersJs } from '@codama/renderers-js';
import { renderVisitor as renderersJsUmi } from '@codama/renderers-js-umi';
import { renderVisitor as renderersRust } from '@codama/renderers-rust';

/** @deprecated Use `renderVisitor` from `@codama/renderers-js` instead. */
export const renderJavaScriptVisitor = renderersJs;

/** @deprecated Use `renderVisitor` from `@codama/renderers-js-umi` instead. */
export const renderJavaScriptUmiVisitor = renderersJsUmi;

/** @deprecated Use `renderVisitor` from `@codama/renderers-rust` instead. */
export const renderRustVisitor = renderersRust;
