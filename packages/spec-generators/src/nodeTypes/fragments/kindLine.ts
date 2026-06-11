import { type Fragment, fragment } from '@codama/fragments/javascript';

/** Produce a node's `kind` discriminator line, e.g. `readonly kind: 'fooNode';`. */
export function getKindLineFragment(kind: string): Fragment {
    return fragment`readonly kind: '${kind}';`;
}
