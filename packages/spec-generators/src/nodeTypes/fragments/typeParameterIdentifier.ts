import { type Fragment, fragment, pascalCase } from '@codama/fragments/javascript';

/** Render the type-parameter identifier for an attribute: `data` → `TData`. */
export function getTypeParameterIdentifierFragment(attributeName: string): Fragment {
    return fragment`T${pascalCase(attributeName)}`;
}
