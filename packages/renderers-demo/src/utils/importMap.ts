import { camelCase } from '@codama/nodes';
import { joinPath, Path } from '@codama/renderers-core';

export type ImportMap = ReadonlyMap<Path, ReadonlySet<string>>;

export function createImportMap(imports: [Path, string[] | string][] = []): ImportMap {
    return Object.freeze(
        new Map(imports.map(([path, names]) => [path, new Set(typeof names === 'string' ? [names] : names)])),
    );
}

export function addToImportMap(map: ImportMap, path: Path, names: string[] | string): ImportMap {
    return mergeImportMaps([map, createImportMap([[path, names]])]);
}

export function mergeImportMaps(importMaps: ImportMap[]): ImportMap {
    const merged = new Map(importMaps[0]);
    for (const map of importMaps.slice(1)) {
        for (const [key, value] of map) {
            merged.set(key, new Set([...(merged.get(key) ?? []), ...value]));
        }
    }
    return Object.freeze(merged);
}

export type PathOverrides = Record<Path, Path>;

export function getImportMapLinks(importMap: ImportMap, pathOverrides: PathOverrides = {}): string[] {
    return [...resolvePaths(importMap, pathOverrides).entries()].flatMap(([path, names]) =>
        [...names].map(name => `- [${name}](${joinPath(path, camelCase(name))}.md)`),
    );
}

function resolvePaths(importMap: ImportMap, pathOverrides: PathOverrides = {}): ImportMap {
    const DEFAULT_PATH_OVERRIDES: PathOverrides = {
        generatedAccounts: joinPath('..', 'accounts'),
        generatedInstructions: joinPath('..', 'instructions'),
        generatedPdas: joinPath('..', 'pdas'),
        generatedTypes: joinPath('..', 'types'),
    };

    pathOverrides = { ...DEFAULT_PATH_OVERRIDES, ...pathOverrides };
    const newEntries = [...importMap.entries()].map(([path, names]) => {
        return [pathOverrides[path] ?? path, names] as const;
    });

    return Object.freeze(new Map(newEntries));
}
