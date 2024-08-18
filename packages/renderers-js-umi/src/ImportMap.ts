import { TypeManifest } from './getTypeManifestVisitor';

const DEFAULT_MODULE_MAP: Record<string, string> = {
    errors: '../errors',
    shared: '../shared',
    types: '../types',
    umi: '@metaplex-foundation/umi',
    umiSerializers: '@metaplex-foundation/umi/serializers',
};

export class ImportMap {
    protected readonly _imports: Map<string, Set<string>> = new Map();

    protected readonly _aliases: Map<string, Record<string, string>> = new Map();

    add(module: string, imports: Set<string> | string[] | string): ImportMap {
        const currentImports = this._imports.get(module) ?? new Set();
        const newImports = typeof imports === 'string' ? [imports] : imports;
        newImports.forEach(i => currentImports.add(i));
        this._imports.set(module, currentImports);
        return this;
    }

    remove(module: string, imports: Set<string> | string[] | string): ImportMap {
        const currentImports = this._imports.get(module) ?? new Set();
        const importsToRemove = typeof imports === 'string' ? [imports] : imports;
        importsToRemove.forEach(i => currentImports.delete(i));
        if (currentImports.size === 0) {
            this._imports.delete(module);
        } else {
            this._imports.set(module, currentImports);
        }
        return this;
    }

    mergeWith(...others: ImportMap[]): ImportMap {
        others.forEach(other => {
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
        return this.mergeWith(manifest.strictImports, manifest.looseImports, manifest.serializerImports);
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

    toString(dependencies: Record<string, string>): string {
        const dependencyMap = { ...DEFAULT_MODULE_MAP, ...dependencies };
        const importStatements = [...this._imports.entries()]
            .map(([module, imports]) => {
                const mappedModule: string = dependencyMap[module] ?? module;
                return [mappedModule, module, imports] as const;
            })
            .sort(([a], [b]) => {
                const aIsRelative = a.startsWith('.');
                const bIsRelative = b.startsWith('.');
                if (aIsRelative && !bIsRelative) return 1;
                if (!aIsRelative && bIsRelative) return -1;
                return a.localeCompare(b);
            })
            .map(([mappedModule, module, imports]) => {
                const aliasMap = this._aliases.get(module) ?? {};
                const joinedImports = [...imports]
                    .sort()
                    .map(i => (aliasMap[i] ? `${i} as ${aliasMap[i]}` : i))
                    .join(', ');
                return `import { ${joinedImports} } from '${mappedModule}';`;
            });
        return importStatements.join('\n');
    }
}
