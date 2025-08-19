import { BaseFragment, joinPath, Path } from '@codama/renderers-core';
import { ConfigureOptions } from 'nunjucks';

import { ImportMap } from '../ImportMap';
import { render } from './render';

export type FragmentFeature = 'instruction:resolverScopeVariable';

export type Fragment = BaseFragment &
    Readonly<{
        features: ReadonlySet<FragmentFeature>;
        imports: ImportMap;
    }>;

export function fragment(content: string): Fragment {
    return Object.freeze({
        content,
        features: new Set<FragmentFeature>(),
        imports: new ImportMap(),
    });
}

export function fragmentFromTemplate(fragmentFile: Path, context?: object, options?: ConfigureOptions): Fragment {
    return fragment(render(joinPath('fragments', fragmentFile), context, options));
}

export function mergeFragments(fragments: Fragment[], mergeContent: (contents: string[]) => string) {
    return Object.freeze({
        content: mergeContent(fragments.map(fragment => fragment.content)),
        features: new Set(fragments.flatMap(f => [...f.features])),
        imports: new ImportMap().mergeWith(...fragments.map(f => f.imports)),
    });
}

export function mergeFragmentImports(fragment: Fragment, importMaps: ImportMap[]): Fragment {
    return Object.freeze({
        ...fragment,
        imports: new ImportMap().mergeWith(fragment.imports, ...importMaps),
    });
}

export function addFragmentImports(fragment: Fragment, module: string, imports: string[]): Fragment {
    return Object.freeze({
        ...fragment,
        imports: new ImportMap().mergeWith(fragment.imports).add(module, imports),
    });
}

export function addFragmentImportAlias(fragment: Fragment, module: string, name: string, alias: string): Fragment {
    return Object.freeze({
        ...fragment,
        imports: new ImportMap().mergeWith(fragment.imports).addAlias(module, name, alias),
    });
}

export function addFragmentFeatures(fragment: Fragment, features: FragmentFeature[]): Fragment {
    return Object.freeze({
        ...fragment,
        features: new Set([...fragment.features, ...features]),
    });
}
