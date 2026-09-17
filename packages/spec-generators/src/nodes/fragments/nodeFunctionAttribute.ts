import { type Fragment, fragment, use } from '@codama/fragments/javascript';
import type { AttributeSpec } from '@codama/spec';

import { getTypeParameterIdentifierFragment } from '../../shared';
import type { AttributeOverride } from '../config';
import { getBrandedStringHelper } from '../paramIdentifier';

/**
 * Render one attribute as a field of the node function's
 * `return Object.freeze({ … })` literal. Rules, in priority order:
 *
 *   1. `hidden`-defaulted → emit the default expression directly.
 *      Hidden attributes are never exposed to the caller, so no
 *      other rule applies.
 *   2. `value` override → emit the override's expression verbatim.
 *   3. Array-typed attribute → skip-when-empty conditional spread,
 *      regardless of `optional`. An empty or absent array is omitted
 *      from the node entirely (see the "Array attributes are omitted
 *      when empty" convention in the `@codama/spec` README). The
 *      generic cast (`as TGeneric`) is preserved for type-parameter
 *      arrays so callers keep their narrowed tuple type.
 *   4. Constrained-`string` attribute (identifier/namespace/path/integer/
 *      decimal) → wrap reader in the matching branded-string validator
 *      (e.g. `identifierString(...)`), which asserts the format and throws
 *      on a malformed value, under a conditional spread when optional.
 *   5. `coerce` override → emit the coerce fragment, with `as TGeneric`
 *      cast when the attribute is a type parameter, under a conditional
 *      spread when optional.
 *   6. `default` override → bare positional args carry the default at
 *      the signature level; bag/object-input attributes get a
 *      body-level `?? <default>` fallback.
 *   7. Optional attribute → conditional spread.
 *   8. Required attribute → pass-through, with shorthand `{ key }` when
 *      the reader equals the key.
 */
export function getNodeFunctionAttributeFragment(
    attr: AttributeSpec,
    reader: string,
    override: AttributeOverride | undefined,
    typeParameterAttribute: AttributeSpec | undefined,
    isBarePositional: boolean,
): Fragment {
    const key = attr.name;

    if (override && 'default' in override && override.hidden) {
        return fragment`${key}: ${override.default},`;
    }

    if (override && 'value' in override) {
        return fragment`${key}: ${override.value},`;
    }

    if (attr.type.kind === 'array') {
        // Arrays skip-when-empty: an empty or absent array is omitted
        // from the node. `reader` may be `undefined` (optional or
        // defaulted-at-signature positional), so coalesce to `[]` before
        // testing length. Type-parameter arrays keep their `as TGeneric`
        // cast so a caller's narrowed tuple type survives.
        const value = typeParameterAttribute
            ? fragment`${reader} as ${getTypeParameterIdentifierFragment(typeParameterAttribute)}`
            : fragment`${reader}`;
        return fragment`...(${reader} !== undefined && ${reader}.length > 0 && { ${key}: ${value} }),`;
    }

    const brandHelper = getBrandedStringHelper(attr);
    if (brandHelper) {
        const brandRef = use(brandHelper, `shared:${brandHelper}`);
        if (attr.optional) {
            return fragment`...(${reader} !== undefined && { ${key}: ${brandRef}(${reader}) }),`;
        }
        return fragment`${key}: ${brandRef}(${reader}),`;
    }

    if (override && 'coerce' in override) {
        const valueExpr = typeParameterAttribute
            ? fragment`(${override.coerce}) as ${getTypeParameterIdentifierFragment(typeParameterAttribute)}`
            : override.coerce;
        if (attr.optional) {
            return fragment`...(${reader} !== undefined && { ${key}: ${valueExpr} }),`;
        }
        return fragment`${key}: ${valueExpr},`;
    }

    if (override && 'default' in override) {
        if (isBarePositional) {
            return reader === key ? fragment`${key},` : fragment`${key}: ${reader},`;
        }
        const valueExpr = typeParameterAttribute
            ? fragment`(${reader} ?? ${override.default}) as ${getTypeParameterIdentifierFragment(typeParameterAttribute)}`
            : fragment`${reader} ?? ${override.default}`;
        return fragment`${key}: ${valueExpr},`;
    }

    if (attr.optional) {
        return reader === key
            ? fragment`...(${reader} !== undefined && { ${key} }),`
            : fragment`...(${reader} !== undefined && { ${key}: ${reader} }),`;
    }

    return reader === key ? fragment`${key},` : fragment`${key}: ${reader},`;
}
