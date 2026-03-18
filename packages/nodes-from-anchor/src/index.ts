import { RootNode } from '@codama/nodes';
import { visit } from '@codama/visitors';

import { defaultVisitor } from './defaultVisitor';
import { IdlV00, rootNodeFromAnchorV00 } from './v00';
import { IdlV01, rootNodeFromAnchorV01, type RootNodeFromAnchorV01Options } from './v01';

export * from './defaultVisitor';
export * from './discriminators';
export * from './v00';
export * from './v01';

export type AnchorIdl = IdlV00 | IdlV01;

export type RootNodeFromAnchorOptions = RootNodeFromAnchorV01Options;

export function rootNodeFromAnchor(idl: AnchorIdl, options?: RootNodeFromAnchorOptions): RootNode {
    return visit(rootNodeFromAnchorWithoutDefaultVisitor(idl, options), defaultVisitor());
}

export function rootNodeFromAnchorWithoutDefaultVisitor(idl: AnchorIdl, options?: RootNodeFromAnchorOptions): RootNode {
    if ((idl.metadata as { spec?: string })?.spec === '0.1.0') {
        return rootNodeFromAnchorV01(idl as IdlV01, [], options);
    }

    return rootNodeFromAnchorV00(idl as IdlV00);
}
