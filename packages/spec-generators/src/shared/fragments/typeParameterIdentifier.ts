import { type Fragment, fragment, mergeFragments, pascalCase } from '@codama/fragments/javascript';
import { AttributeSpec } from '@codama/spec';

/** `data` → `TData` as a Fragment. Use inside `fragment\`…\`` templates to avoid the wrapper. */
export function getTypeParameterIdentifierFragment(attribute: AttributeSpec | string): Fragment {
    const attributeName = typeof attribute === 'string' ? attribute : attribute.name;
    const identifier = `T${pascalCase(attributeName)}`;
    return fragment`${identifier}`;
}

export function getTypeParameterIdentifierListFragment(attributes: readonly (AttributeSpec | string)[]): Fragment {
    return mergeFragments(attributes.map(getTypeParameterIdentifierFragment), parts => parts.join(', '));
}
