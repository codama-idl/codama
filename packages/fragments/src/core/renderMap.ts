/**
 * A `RenderMap` is the in-memory data structure a code generator builds
 * up before writing anything to disk: a frozen `ReadonlyMap` keyed by
 * output path, with a `BaseFragment` (or a concrete subtype carrying
 * imports / features / …) as the value. The helpers in this module are
 * pure data operations — they construct, merge, transform, and query
 * render maps without touching the filesystem.
 *
 * {@link writeRenderMap} is the single filesystem-touching entry point
 * here: it walks a finished map and writes every entry. Renderers that
 * tie a render map to a `Visitor` (see `@codama/renderers-core`) layer
 * that on top.
 */

import { CODAMA_ERROR__VISITORS__RENDER_MAP_KEY_NOT_FOUND, CodamaError } from '@codama/errors';

import type { BaseFragment } from './BaseFragment';
import { writeFile } from './fs';
import { mapFragmentContent, mapFragmentContentAsync } from './mapFragmentContent';
import { joinPath, type Path } from './path';

/**
 * A frozen map keyed by output {@link Path}, with each entry holding a
 * fragment that will be written to that path. `TFragment` defaults to
 * {@link BaseFragment} but generators typically pass a richer flavor
 * (e.g. `Fragment` from `@codama/fragments/javascript`) to carry
 * imports and other per-file metadata.
 */
export type RenderMap<TFragment extends BaseFragment> = ReadonlyMap<Path, TFragment>;

export function createRenderMap<TFragment extends BaseFragment = BaseFragment>(): RenderMap<TFragment>;
export function createRenderMap<TFragment extends BaseFragment>(path: Path, content: TFragment): RenderMap<TFragment>;
export function createRenderMap<TFragment extends BaseFragment>(
    entries: Record<Path, TFragment | undefined>,
): RenderMap<TFragment>;
export function createRenderMap<TFragment extends BaseFragment>(
    pathOrEntries?: Path | Record<Path, TFragment | undefined>,
    content?: TFragment,
): RenderMap<TFragment> {
    let entries: [Path, TFragment][] = [];
    if (typeof pathOrEntries === 'string' && content !== undefined) {
        entries = [[pathOrEntries, content]];
    } else if (typeof pathOrEntries === 'object' && pathOrEntries !== null) {
        entries = Object.entries(pathOrEntries).flatMap(([key, value]) =>
            value === undefined ? [] : ([[key, value]] as const),
        );
    }
    return Object.freeze(new Map(entries));
}

/** Add or overwrite a single `(path, fragment)` entry. */
export function addToRenderMap<TFragment extends BaseFragment>(
    renderMap: RenderMap<TFragment>,
    path: Path,
    content: TFragment,
): RenderMap<TFragment> {
    return mergeRenderMaps([renderMap, createRenderMap(path, content)]);
}

/** Remove the entry at `path`, returning a new frozen map. */
export function removeFromRenderMap<TFragment extends BaseFragment>(
    renderMap: RenderMap<TFragment>,
    path: Path,
): RenderMap<TFragment> {
    const newMap = new Map(renderMap);
    newMap.delete(path);
    return Object.freeze(newMap);
}

/**
 * Combine multiple render maps into one. Later maps overwrite earlier
 * entries at the same path.
 */
export function mergeRenderMaps<TFragment extends BaseFragment>(
    renderMaps: RenderMap<TFragment>[],
): RenderMap<TFragment> {
    if (renderMaps.length === 0) return createRenderMap();
    if (renderMaps.length === 1) return renderMaps[0];
    const merged = new Map(renderMaps[0]);
    for (const map of renderMaps.slice(1)) {
        for (const [key, value] of map) {
            merged.set(key, value);
        }
    }
    return Object.freeze(merged);
}

/** Transform every fragment in the map, preserving the keys. */
export function mapRenderMapFragment<TFragment extends BaseFragment>(
    renderMap: RenderMap<TFragment>,
    fn: (fragment: TFragment, path: Path) => TFragment,
): RenderMap<TFragment> {
    return Object.freeze(new Map([...[...renderMap.entries()].map(([key, value]) => [key, fn(value, key)] as const)]));
}

/** Async variant of {@link mapRenderMapFragment}. */
export async function mapRenderMapFragmentAsync<TFragment extends BaseFragment>(
    renderMap: RenderMap<TFragment>,
    fn: (fragment: TFragment, path: Path) => Promise<TFragment>,
): Promise<RenderMap<TFragment>> {
    return Object.freeze(
        new Map(
            await Promise.all([
                ...[...renderMap.entries()].map(async ([key, value]) => [key, await fn(value, key)] as const),
            ]),
        ),
    );
}

/** Transform the `content` of every fragment in the map. */
export function mapRenderMapContent<TFragment extends BaseFragment>(
    renderMap: RenderMap<TFragment>,
    fn: (content: string, path: Path) => string,
): RenderMap<TFragment> {
    return mapRenderMapFragment(renderMap, (fragment, path) =>
        mapFragmentContent(fragment, content => fn(content, path)),
    );
}

/** Async variant of {@link mapRenderMapContent}. */
export async function mapRenderMapContentAsync<TFragment extends BaseFragment>(
    renderMap: RenderMap<TFragment>,
    fn: (content: string, path: Path) => Promise<string>,
): Promise<RenderMap<TFragment>> {
    return await mapRenderMapFragmentAsync(renderMap, (fragment, path) =>
        mapFragmentContentAsync(fragment, content => fn(content, path)),
    );
}

/**
 * Look up the fragment at `path`, throwing a structured
 * {@link CodamaError} when the key is missing.
 */
export function getFromRenderMap<TFragment extends BaseFragment>(
    renderMap: RenderMap<TFragment>,
    path: Path,
): TFragment {
    const value = renderMap.get(path);
    if (value === undefined) {
        throw new CodamaError(CODAMA_ERROR__VISITORS__RENDER_MAP_KEY_NOT_FOUND, { key: path });
    }
    return value;
}

/**
 * Test whether the fragment at `path` contains `value`. Accepts either
 * a plain substring or a regular expression.
 */
export function renderMapContains<TFragment extends BaseFragment>(
    renderMap: RenderMap<TFragment>,
    path: Path,
    value: RegExp | string,
): boolean {
    const { content } = getFromRenderMap(renderMap, path);
    return typeof value === 'string' ? content.includes(value) : value.test(content);
}

/**
 * Walk the render map and write every entry to disk, rooted at
 * `basePath`. Each path is joined with `basePath` via {@link joinPath}
 * and written via {@link writeFile}; the directory structure is
 * created on demand.
 */
export function writeRenderMap<TFragment extends BaseFragment>(renderMap: RenderMap<TFragment>, basePath: Path): void {
    renderMap.forEach(({ content }, relativePath) => {
        writeFile(joinPath(basePath, relativePath), content);
    });
}
