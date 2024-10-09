import { KINOBI_ERROR__VISITORS__RENDER_MAP_KEY_NOT_FOUND, KinobiError } from '@codama/errors';

import { createFile } from './fs';

export class RenderMap {
    protected readonly _map: Map<string, string> = new Map();

    add(relativePath: string, code: string): RenderMap {
        this._map.set(relativePath, code);
        return this;
    }

    remove(relativePath: string): RenderMap {
        this._map.delete(relativePath);
        return this;
    }

    mergeWith(...others: RenderMap[]): RenderMap {
        others.forEach(other => {
            other._map.forEach((code, relativePath) => {
                this.add(relativePath, code);
            });
        });
        return this;
    }

    isEmpty(): boolean {
        return this._map.size === 0;
    }

    has(key: string): boolean {
        return this._map.has(key);
    }

    get(key: string): string {
        const value = this.safeGet(key);
        if (value === undefined) {
            throw new KinobiError(KINOBI_ERROR__VISITORS__RENDER_MAP_KEY_NOT_FOUND, { key });
        }
        return value;
    }

    safeGet(key: string): string | undefined {
        return this._map.get(key);
    }

    contains(key: string, value: RegExp | string): boolean {
        const content = this.get(key);
        return typeof value === 'string' ? content.includes(value) : value.test(content);
    }

    async mapContentAsync(fn: (content: string) => Promise<string>): Promise<RenderMap> {
        await Promise.all(
            [...this._map.entries()].map(async ([relativePath, code]) => {
                this._map.set(relativePath, await fn(code));
            }),
        );
        return this;
    }

    mapContent(fn: (content: string) => string): RenderMap {
        this._map.forEach((code, relativePath) => {
            this._map.set(relativePath, fn(code));
        });
        return this;
    }

    write(path: string): void {
        this._map.forEach((code, relativePath) => {
            createFile(`${path}/${relativePath}`, code);
        });
    }
}
