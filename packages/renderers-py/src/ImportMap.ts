import { Fragment, PyFragment } from './fragments';
import { TypeManifest } from './TypeManifest';

const DEFAULT_EXTERNAL_MODULE_MAP: Record<string, string> = {
    solanaAccounts: '@solana/kit',
    solanaAddresses: '@solana/kit',
    solanaCodecsCore: '@solana/kit',
    solanaCodecsDataStructures: '@solana/kit',
    solanaCodecsNumbers: '@solana/kit',
    solanaCodecsStrings: '@solana/kit',
    solanaErrors: '@solana/kit',
    solanaInstructions: '@solana/kit',
    solanaOptions: '@solana/kit',
    solanaPrograms: '@solana/kit',
    solanaRpcTypes: '@solana/kit',
    solanaSigners: '@solana/kit',
};

const DEFAULT_GRANULAR_EXTERNAL_MODULE_MAP: Record<string, string> = {
    solanaAccounts: '@solana/accounts',
    solanaAddresses: '@solana/addresses',
    solanaCodecsCore: '@solana/codecs',
    solanaCodecsDataStructures: '@solana/codecs',
    solanaCodecsNumbers: '@solana/codecs',
    solanaCodecsStrings: '@solana/codecs',
    solanaErrors: '@solana/errors',
    solanaInstructions: '@solana/instructions',
    solanaOptions: '@solana/codecs',
    solanaPrograms: '@solana/programs',
    solanaRpcTypes: '@solana/rpc-types',
    solanaSigners: '@solana/signers',
};

const DEFAULT_INTERNAL_MODULE_MAP: Record<string, string> = {
    errors: '../errors',
    generated: '..',
    generatedAccounts: '../accounts',
    generatedErrors: '../errors',
    generatedInstructions: '../instructions',
    generatedPdas: '../pdas',
    generatedPrograms: '../programs',
    generatedTypes: '../types',
    hooked: '../../hooked',
    shared: '../shared',
    types: '../types',
};

export class ImportMap {
    protected readonly _imports: Map<string, Set<string>> = new Map();

    protected readonly _aliases: Map<string, Record<string, string>> = new Map();

    add(module: string, imports: Set<string> | string[] | string): ImportMap {
        const newImports = new Set(typeof imports === 'string' ? [imports] : imports);
        if (newImports.size === 0) return this;
        const currentImports = this._imports.get(module) ?? new Set();
        newImports.forEach(i => currentImports.add(i));
        this._imports.set(module, currentImports);
        return this;
    }

    remove(module: string, imports: Set<string> | string[] | string): ImportMap {
        const importsToRemove = new Set(typeof imports === 'string' ? [imports] : imports);
        if (importsToRemove.size === 0) return this;
        const currentImports = this._imports.get(module) ?? new Set();
        importsToRemove.forEach(i => currentImports.delete(i));
        if (currentImports.size === 0) {
            this._imports.delete(module);
        } else {
            this._imports.set(module, currentImports);
        }
        return this;
    }

    mergeWith(...others: (Fragment | ImportMap | PyFragment | null)[]): ImportMap {
        others.forEach(rawOther => {
            if (!rawOther) return;
            const other = 'imports' in rawOther ? rawOther.imports : rawOther;
            other._imports.forEach((imports, module) => {
                this.add(module, imports);
            });
            other._aliases.forEach((aliases, module) => {
                Object.entries(aliases).forEach(([name, alias]) => {
                    this.addAlias(module, name, alias);
                });
            });
        });
        return this;
    }

    mergeWithManifest(manifest: TypeManifest): ImportMap {
        return this.mergeWith(manifest.fromJSON, manifest.borshType, manifest.pyType);
    }

    addAlias(module: string, name: string, alias: string): ImportMap {
        const currentAliases = this._aliases.get(module) ?? {};
        currentAliases[name] = alias;
        this._aliases.set(module, currentAliases);
        return this;
    }

    isEmpty(): boolean {
        return this._imports.size === 0;
    }

    resolve(dependencies: Record<string, string> = {}, useGranularImports = false): Map<string, Set<string>> {
        // Resolve aliases.
        const aliasedMap = new Map<string, Set<string>>(
            [...this._imports.entries()].map(([module, imports]) => {
                const aliasMap = this._aliases.get(module) ?? {};
                const joinedImports = [...imports].map(i => (aliasMap[i] ? `${i} as ${aliasMap[i]}` : i));
                return [module, new Set(joinedImports)];
            }),
        );

        // Resolve dependency mappings.
        const dependencyMap = {
            ...(useGranularImports ? DEFAULT_GRANULAR_EXTERNAL_MODULE_MAP : DEFAULT_EXTERNAL_MODULE_MAP),
            ...DEFAULT_INTERNAL_MODULE_MAP,
            ...dependencies,
        };
        const resolvedMap = new Map<string, Set<string>>();
        aliasedMap.forEach((imports, module) => {
            const resolvedModule: string = dependencyMap[module] ?? module;
            const currentImports = resolvedMap.get(resolvedModule) ?? new Set();
            imports.forEach(i => currentImports.add(i));
            resolvedMap.set(resolvedModule, currentImports);
        });

        return resolvedMap;
    }

    toString(dependencies: Record<string, string> = {}, useGranularImports = false): string {
        return [...this.resolve(dependencies, useGranularImports).entries()]
            .sort(([a], [b]) => this.compareModuleNames(a, b))
            .map(([module, imports]) => this.formatModuleImports(module, imports))
            .filter(line => line.length > 0)
            .join('\n');
    }

    private compareModuleNames(a: string, b: string): number {
        const aIsRelative = a.startsWith('.');
        const bIsRelative = b.startsWith('.');
        if (aIsRelative && !bIsRelative) return 1;
        if (!aIsRelative && bIsRelative) return -1;
        return a.localeCompare(b);
    }

    private formatModuleImports(module: string, imports: Set<string>): string {
        const filteredImports = this.filterDuplicateImports(imports);

        if (module.length === 0) {
            return filteredImports.map(name => `import ${name}`).join('\n');
        } else {
            const joinedImports = filteredImports.join(', ');
            return joinedImports ? `from ${module} import ${joinedImports}` : '';
        }
    }

    private filterDuplicateImports(imports: Set<string>): string[] {
        return [...imports].sort().filter(importName => {
            // Filter out 'type <Type>' variation if there is a '<Type>'
            const parts = importName.split(' ');
            if (parts.length > 1 && parts[0] === 'type') {
                return !imports.has(parts[1]);
            }
            return true;
        });
    }
}
