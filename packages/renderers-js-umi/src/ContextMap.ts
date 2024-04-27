export type ContextInterface =
    | 'downloader'
    | 'eddsa'
    | 'http'
    | 'identity'
    | 'payer'
    | 'programs'
    | 'rpc'
    | 'transactions'
    | 'uploader';

export class ContextMap {
    protected readonly _interfaces: Set<ContextInterface> = new Set();

    add(contextInterface: ContextInterface | ContextInterface[]): ContextMap {
        if (Array.isArray(contextInterface)) {
            contextInterface.forEach(i => this._interfaces.add(i));
        } else {
            this._interfaces.add(contextInterface);
        }
        return this;
    }

    remove(contextInterface: ContextInterface | ContextInterface[]): ContextMap {
        if (Array.isArray(contextInterface)) {
            contextInterface.forEach(i => this._interfaces.delete(i));
        } else {
            this._interfaces.delete(contextInterface);
        }
        return this;
    }

    mergeWith(...others: ContextMap[]): ContextMap {
        others.forEach(other => this.add([...other._interfaces]));
        return this;
    }

    isEmpty(): boolean {
        return this._interfaces.size === 0;
    }

    toString(): string {
        const contextInterfaces = [...this._interfaces]
            .sort()
            .map(i => `"${i}"`)
            .join(' | ');
        return `Pick<Context, ${contextInterfaces}>`;
    }
}
