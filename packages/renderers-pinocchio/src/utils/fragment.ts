import { BaseFragment } from '@codama/renderers-core';

import { ImportMap } from '../ImportMap';

export type FragmentFeature = 'instruction:resolverScopeVariable';

export type Fragment = BaseFragment & Readonly<{ imports: ImportMap }>;

function isFragment(value: unknown): value is Fragment {
    return typeof value === 'object' && value !== null && 'content' in value && 'imports' in value;
}

export function fragment(template: TemplateStringsArray, items: unknown[]): Fragment {
    return createFragmentTemplate(template, items, isFragment, mergeFragments);
}

export function mergeFragments(fragments: Fragment[], mergeContent: (contents: string[]) => string) {
    return Object.freeze({
        content: mergeContent(fragments.map(fragment => fragment.content)),
        imports: new ImportMap().mergeWith(...fragments.map(f => f.imports)),
    });
}

export function mergeFragmentImports(fragment: Fragment, importMaps: ImportMap[]): Fragment {
    return Object.freeze({
        ...fragment,
        imports: new ImportMap().mergeWith(fragment.imports, ...importMaps),
    });
}

export function addFragmentImports(fragment: Fragment, imports: string[]): Fragment {
    return Object.freeze({
        ...fragment,
        imports: new ImportMap().mergeWith(fragment.imports).add(imports),
    });
}

export function addFragmentImportAlias(fragment: Fragment, importName: string, alias: string): Fragment {
    return Object.freeze({
        ...fragment,
        imports: new ImportMap().mergeWith(fragment.imports).addAlias(importName, alias),
    });
}

// TODO: Will be part of renderers-core soon.
function createFragmentTemplate<TFragment extends BaseFragment>(
    template: TemplateStringsArray,
    items: unknown[],
    isFragment: (value: unknown) => value is TFragment,
    mergeFragments: (fragments: TFragment[], mergeContent: (contents: string[]) => string) => TFragment,
): TFragment {
    const fragments = items.filter(isFragment);
    const zippedItems = items.map((item, i) => {
        const itemPrefix = template[i];
        if (typeof item === 'undefined') return itemPrefix;
        if (isFragment(item)) return itemPrefix + item.content;
        return itemPrefix + String(item);
    });
    return mergeFragments(fragments, () => zippedItems.join('') + template[template.length - 1]);
}
