import { ImportFrom } from '@kinobi-so/nodes';

import { Fragment } from './fragments';
import { TypeManifest } from './TypeManifest';

const DEFAULT_EXTERNAL_MODULE_MAP: Record<string, string> = {
    solanaAccounts: '@solana/web3.js',
    solanaAddresses: '@solana/web3.js',
    solanaCodecsCore: '@solana/web3.js',
    solanaCodecsDataStructures: '@solana/web3.js',
    solanaCodecsNumbers: '@solana/web3.js',
    solanaCodecsStrings: '@solana/web3.js',
    solanaInstructions: '@solana/web3.js',
    solanaOptions: '@solana/web3.js',
    solanaSigners: '@solana/web3.js',
};

const DEFAULT_GRANULAR_EXTERNAL_MODULE_MAP: Record<string, string> = {
    solanaAccounts: '@solana/accounts',
    solanaAddresses: '@solana/addresses',
    solanaCodecsCore: '@solana/codecs',
    solanaCodecsDataStructures: '@solana/codecs',
    solanaCodecsNumbers: '@solana/codecs',
    solanaCodecsStrings: '@solana/codecs',
    solanaInstructions: '@solana/instructions',
    solanaOptions: '@solana/codecs',
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
    protected readonly _imports: Map<ImportFrom, Set<string>> = new Map();

    protected readonly _aliases: Map<ImportFrom, Record<string, string>> = new Map();

    add(module: ImportFrom, imports: Set<string> | string[] | string): ImportMap {
        const newImports = new Set(typeof imports === 'string' ? [imports] : imports);
        if (newImports.size === 0) return this;
        const currentImports = this._imports.get(module) ?? new Set();
        newImports.forEach(i => currentImports.add(i));
        this._imports.set(module, currentImports);
        return this;
    }

    remove(module: ImportFrom, imports: Set<string> | string[] | string): ImportMap {
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

    mergeWith(...others: (Fragment | ImportMap)[]): ImportMap {
        others.forEach(rawOther => {
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
        return this.mergeWith(manifest.strictType, manifest.looseType, manifest.encoder, manifest.decoder);
    }

    addAlias(module: ImportFrom, name: string, alias: string): ImportMap {
        const currentAliases = this._aliases.get(module) ?? {};
        currentAliases[name] = alias;
        this._aliases.set(module, currentAliases);
        return this;
    }

    isEmpty(): boolean {
        return this._imports.size === 0;
    }

    resolve(dependencies: Record<ImportFrom, string> = {}, useGranularImports = false): Map<ImportFrom, Set<string>> {
        // Resolve aliases.
        const aliasedMap = new Map<ImportFrom, Set<string>>(
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
        const resolvedMap = new Map<ImportFrom, Set<string>>();
        aliasedMap.forEach((imports, module) => {
            const resolvedModule: string = dependencyMap[module] ?? module;
            const currentImports = resolvedMap.get(resolvedModule) ?? new Set();
            imports.forEach(i => currentImports.add(i));
            resolvedMap.set(resolvedModule, currentImports);
        });

        return resolvedMap;
    }

    toString(dependencies: Record<ImportFrom, string> = {}, useGranularImports = false): string {
        return [...this.resolve(dependencies, useGranularImports).entries()]
            .sort(([a], [b]) => {
                const aIsRelative = a.startsWith('.');
                const bIsRelative = b.startsWith('.');
                if (aIsRelative && !bIsRelative) return 1;
                if (!aIsRelative && bIsRelative) return -1;
                return a.localeCompare(b);
            })
            .map(([module, imports]) => {
                const joinedImports = [...imports]
                    .sort()
                    .filter(i => {
                        // import of a type can either be '<Type>' or 'type <Type>', so
                        // we filter out 'type <Type>' variation if there is a '<Type>'
                        const name = i.split(' ');
                        if (name.length > 1) {
                            return !imports.has(name[1]);
                        }
                        return true;
                    })
                    .join(', ');
                return `import { ${joinedImports} } from '${module}';`;
            })
            .join('\n');
    }
}
