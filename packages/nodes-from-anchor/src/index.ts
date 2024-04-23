import { RootNode } from '@kinobi-so/nodes';

import { IdlV00, rootNodeFromAnchorV00 } from './v00';

export * from './discriminators';
export * from './v00';

export type AnchorIdl = IdlV00;

export function rootNodeFromAnchor(idl: AnchorIdl): RootNode {
    return rootNodeFromAnchorV00(idl);
}
