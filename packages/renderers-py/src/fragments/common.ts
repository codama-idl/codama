import { join } from 'node:path';

import { ConfigureOptions } from 'nunjucks';

import { ImportMap } from '../ImportMap';
import { render } from '../utils';

export function fragment(render: string, imports?: ImportMap): Fragment {
    return new Fragment(render, imports);
}

export function fragmentFromTemplate(fragmentFile: string, context?: object, options?: ConfigureOptions): Fragment {
    return fragment(render(join('fragments', fragmentFile), context, options));
}

export function mergeFragments(fragments: Fragment[], mergeRenders: (renders: string[]) => string): Fragment {
    return new Fragment(
        mergeRenders(fragments.map(f => f.render)),
        new ImportMap().mergeWith(...fragments),
        new Set(fragments.flatMap(f => [...f.features])),
    );
}

export class Fragment {
    public render: string;

    public imports: ImportMap;

    public features: Set<FragmentFeature>;

    constructor(render: string, imports?: ImportMap, features?: Set<FragmentFeature>) {
        this.render = render;
        this.imports = imports ? new ImportMap().mergeWith(imports) : new ImportMap();
        this.features = new Set([...(features ?? [])]);
    }

    setRender(render: string): this {
        this.render = render;
        return this;
    }

    mapRender(fn: (render: string) => string): this {
        this.render = fn(this.render);
        return this;
    }

    addImports(module: string, imports: Set<string> | string[] | string): this {
        this.imports.add(module, imports);
        return this;
    }

    removeImports(module: string, imports: Set<string> | string[] | string): this {
        this.imports.remove(module, imports);
        return this;
    }

    mergeImportsWith(...others: (Fragment | ImportMap)[]): this {
        this.imports.mergeWith(...others);
        return this;
    }

    addImportAlias(module: string, name: string, alias: string): this {
        this.imports.addAlias(module, name, alias);
        return this;
    }

    addFeatures(features: FragmentFeature | FragmentFeature[]): this {
        const featureArray = typeof features === 'string' ? [features] : features;
        featureArray.forEach(f => this.features.add(f));
        return this;
    }

    removeFeatures(features: FragmentFeature | FragmentFeature[]): this {
        const featureArray = typeof features === 'string' ? [features] : features;
        featureArray.forEach(f => this.features.delete(f));
        return this;
    }

    hasFeatures(features: FragmentFeature | FragmentFeature[]): boolean {
        const featureArray = typeof features === 'string' ? [features] : features;
        return featureArray.every(f => this.features.has(f));
    }

    mergeFeaturesWith(...others: Fragment[]): this {
        others.forEach(f => this.addFeatures([...f.features]));
        return this;
    }

    clone(): Fragment {
        return new Fragment(this.render).mergeImportsWith(this.imports);
    }

    toString(): string {
        return this.render;
    }
}

export type FragmentFeature = 'instruction:resolverScopeVariable';
