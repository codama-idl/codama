import { Docs } from '@codama/nodes';
import { BaseFragment, mapFragmentContent, Path } from '@codama/renderers-core';

import { addToImportMap, getImportMapLinks, ImportMap, importMap, mergeImportMaps, PathOverrides } from './importMap';

export type Fragment = BaseFragment & Readonly<{ imports: ImportMap }>;

export function fragment(content: string): Fragment {
    return Object.freeze({ content, imports: importMap() });
}

export function mergeFragments(fragments: Fragment[], mergeContent: (contents: string[]) => string) {
    return Object.freeze({
        content: mergeContent(fragments.map(fragment => fragment.content)),
        imports: mergeImportMaps(fragments.map(fragment => fragment.imports)),
    });
}

export function addFragmentImports(fragment: Fragment, path: Path, names: string[] | string): Fragment {
    return Object.freeze({ ...fragment, imports: addToImportMap(fragment.imports, path, names) });
}

export function getFrontmatterFragment(title: string, description: string): Fragment {
    return fragment(`---\ntitle: ${title}\ndescription: ${description}\n---`);
}

export function getTitleAndDescriptionFragment(title: string, docs?: Docs): Fragment {
    return mergeFragments(
        [fragment(`# ${title}`), ...(docs && docs.length > 0 ? [fragment(docs.join('\n'))] : [])],
        cs => cs.join('\n\n'),
    );
}

export function getCodeBlockFragment(code: Fragment, language: string = ''): Fragment {
    return mapFragmentContent(code, c => `\`\`\`${language}\n${c}\n\`\`\``);
}

export function getTableFragment(headers: (Fragment | string)[], rows: (Fragment | string)[][]): Fragment {
    const toFragment = (cell: Fragment | string) => (typeof cell === 'string' ? fragment(cell) : cell);
    const headerFragments = headers.map(toFragment);
    const rowFragments = rows.map(row => row.map(toFragment));
    const colWidths = headerFragments.map((header, colIndex) =>
        Math.max(header.content.length, ...rowFragments.map(row => row[colIndex]?.content?.length ?? 0)),
    );
    const padCells = (f: Fragment, colIndex: number) => mapFragmentContent(f, c => c.padEnd(colWidths[colIndex] ?? 0));
    const mergeCells = (fs: Fragment[]) => mergeFragments(fs, cs => cs.join(' | '));
    const lines = [
        mergeCells(headerFragments.map(padCells)),
        mergeCells(headerFragments.map((_, colIndex) => fragment('-'.repeat(colWidths[colIndex])))),
        ...rowFragments.map(row => mergeCells(row.map(padCells))),
    ];
    return mergeFragments(
        lines.map(line => mapFragmentContent(line, c => `| ${c} |`)),
        cs => cs.join('\n'),
    );
}

export function getCommentFragment(lines: string[]): Fragment {
    return fragment(`<!--\n${lines.join('\n')}\n-->`);
}

export function getPageFragment(fragments: Fragment[], pathOverrides: PathOverrides = {}): Fragment {
    const page = mergeFragments(fragments, cs => cs.join('\n\n'));
    const links = getImportMapLinks(page.imports, pathOverrides);
    if (links.length === 0) return page;
    return mapFragmentContent(page, c => `${c}\n\n## See also\n\n${links.join('\n')}`);
}
