import { type Fragment, fragment, getDocblockFragment, mergeFragments, pascalCase } from '@codama/fragments/javascript';
import type { EnumerationSpec, EnumerationVariantSpec } from '@codama/spec';

export function getEnumerationFragment(enumeration: EnumerationSpec): Fragment {
    const sortedVariants = [...enumeration.variants].sort((a, b) => a.name.localeCompare(b.name));
    const variantsBlock = getVariantsBlockFragment(sortedVariants);
    const docComment = getDocblockFragment(enumeration.docs, { withLineJump: true });
    return fragment`${docComment}export type ${pascalCase(enumeration.name)} =\n${variantsBlock};`;
}

function getVariantsBlockFragment(variants: readonly EnumerationVariantSpec[]): Fragment {
    const variantFragments = variants.map(v => {
        const literal = JSON.stringify(v.name);
        const docblock = getDocblockFragment(v.docs);
        return docblock ? fragment`${docblock}\n| ${literal}` : fragment`| ${literal}`;
    });
    return mergeFragments(variantFragments, parts => parts.join('\n'));
}
