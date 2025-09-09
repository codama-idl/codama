import { CODAMA_ERROR__VISITORS__RENDER_MAP_KEY_NOT_FOUND, CodamaError } from '@codama/errors';
import { NodeKind } from '@codama/nodes';
import { mapVisitor, Visitor } from '@codama/visitors-core';

import { BaseFragment } from './fragment';
import { writeFile } from './fs';
import { joinPath, Path } from './path';

export type RenderMap = ReadonlyMap<Path, string>;

export function createRenderMap(): RenderMap;
export function createRenderMap(path: Path, content: BaseFragment | string): RenderMap;
export function createRenderMap(entries: Record<Path, BaseFragment | string | undefined>): RenderMap;
export function createRenderMap(
    pathOrEntries?: Path | Record<Path, BaseFragment | string | undefined>,
    content?: BaseFragment | string,
): RenderMap {
    let entries: [Path, string][] = [];
    if (typeof pathOrEntries === 'string' && pathOrEntries !== undefined && content !== undefined) {
        entries = [[pathOrEntries, typeof content === 'string' ? content : content.content]];
    } else if (typeof pathOrEntries === 'object' && pathOrEntries !== null) {
        entries = Object.entries(pathOrEntries).flatMap(([key, value]) => {
            if (value === undefined) return [];
            return [[key, typeof value === 'string' ? value : value.content]] as const;
        });
    }
    return Object.freeze(new Map<Path, string>(entries));
}

export function addToRenderMap(renderMap: RenderMap, path: Path, content: BaseFragment | string): RenderMap {
    return mergeRenderMaps([renderMap, createRenderMap(path, content)]);
}

export function removeFromRenderMap(renderMap: RenderMap, path: Path): RenderMap {
    const newMap = new Map(renderMap);
    newMap.delete(path);
    return Object.freeze(newMap);
}

export function mergeRenderMaps(renderMaps: RenderMap[]): RenderMap {
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

export function mapRenderMapContent(renderMap: RenderMap, fn: (content: string) => string): RenderMap {
    const newMap = new Map<Path, string>();
    for (const [key, value] of renderMap) {
        newMap.set(key, fn(value));
    }
    return Object.freeze(newMap);
}

export async function mapRenderMapContentAsync(
    renderMap: RenderMap,
    fn: (content: string) => Promise<string>,
): Promise<RenderMap> {
    const entries = await Promise.all([
        ...[...renderMap.entries()].map(async ([key, value]) => [key, await fn(value)] as const),
    ]);
    return Object.freeze(new Map<Path, string>(entries));
}

export function getFromRenderMap(renderMap: RenderMap, path: Path): string {
    const value = renderMap.get(path);
    if (value === undefined) {
        throw new CodamaError(CODAMA_ERROR__VISITORS__RENDER_MAP_KEY_NOT_FOUND, { key: path });
    }
    return value;
}

export function renderMapContains(renderMap: RenderMap, path: Path, value: RegExp | string): boolean {
    const content = getFromRenderMap(renderMap, path);
    return typeof value === 'string' ? content.includes(value) : value.test(content);
}

export function writeRenderMap(renderMap: RenderMap, basePath: Path): void {
    renderMap.forEach((content, relativePath) => {
        writeFile(joinPath(basePath, relativePath), content);
    });
}

export function writeRenderMapVisitor<TNodeKind extends NodeKind = NodeKind>(
    visitor: Visitor<RenderMap, TNodeKind>,
    basePath: Path,
): Visitor<void, TNodeKind> {
    return mapVisitor(visitor, renderMap => writeRenderMap(renderMap, basePath));
}
