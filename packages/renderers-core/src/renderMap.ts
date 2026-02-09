import { CODAMA_ERROR__VISITORS__RENDER_MAP_KEY_NOT_FOUND, CodamaError } from '@codama/errors';
import { NodeKind } from '@codama/nodes';
import { writeFile } from '@codama/runtime-utils';
import { joinPath, Path } from '@codama/runtime-utils';
import { mapVisitor, Visitor } from '@codama/visitors-core';

import { BaseFragment, mapFragmentContent, mapFragmentContentAsync } from './fragment';

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
    if (typeof pathOrEntries === 'string' && pathOrEntries !== undefined && content !== undefined) {
        entries = [[pathOrEntries, content]];
    } else if (typeof pathOrEntries === 'object' && pathOrEntries !== null) {
        entries = Object.entries(pathOrEntries).flatMap(([key, value]) =>
            value === undefined ? [] : ([[key, value]] as const),
        );
    }
    return Object.freeze(new Map(entries));
}

export function addToRenderMap<TFragment extends BaseFragment>(
    renderMap: RenderMap<TFragment>,
    path: Path,
    content: TFragment,
): RenderMap<TFragment> {
    return mergeRenderMaps([renderMap, createRenderMap(path, content)]);
}

export function removeFromRenderMap<TFragment extends BaseFragment>(
    renderMap: RenderMap<TFragment>,
    path: Path,
): RenderMap<TFragment> {
    const newMap = new Map(renderMap);
    newMap.delete(path);
    return Object.freeze(newMap);
}

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

export function mapRenderMapFragment<TFragment extends BaseFragment>(
    renderMap: RenderMap<TFragment>,
    fn: (fragment: TFragment, path: Path) => TFragment,
): RenderMap<TFragment> {
    return Object.freeze(new Map([...[...renderMap.entries()].map(([key, value]) => [key, fn(value, key)] as const)]));
}

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

export function mapRenderMapContent<TFragment extends BaseFragment>(
    renderMap: RenderMap<TFragment>,
    fn: (content: string, path: Path) => string,
): RenderMap<TFragment> {
    return mapRenderMapFragment(renderMap, (fragment, path) =>
        mapFragmentContent(fragment, content => fn(content, path)),
    );
}

export async function mapRenderMapContentAsync<TFragment extends BaseFragment>(
    renderMap: RenderMap<TFragment>,
    fn: (content: string, path: Path) => Promise<string>,
): Promise<RenderMap<TFragment>> {
    return await mapRenderMapFragmentAsync(renderMap, (fragment, path) =>
        mapFragmentContentAsync(fragment, content => fn(content, path)),
    );
}

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

export function renderMapContains<TFragment extends BaseFragment>(
    renderMap: RenderMap<TFragment>,
    path: Path,
    value: RegExp | string,
): boolean {
    const { content } = getFromRenderMap(renderMap, path);
    return typeof value === 'string' ? content.includes(value) : value.test(content);
}

export function writeRenderMap<TFragment extends BaseFragment>(renderMap: RenderMap<TFragment>, basePath: Path): void {
    renderMap.forEach(({ content }, relativePath) => {
        writeFile(joinPath(basePath, relativePath), content);
    });
}

export function writeRenderMapVisitor<
    TFragment extends BaseFragment = BaseFragment,
    TNodeKind extends NodeKind = NodeKind,
>(visitor: Visitor<RenderMap<TFragment>, TNodeKind>, basePath: Path): Visitor<void, TNodeKind> {
    return mapVisitor(visitor, renderMap => writeRenderMap(renderMap, basePath));
}
