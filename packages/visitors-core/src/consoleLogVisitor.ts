import { NodeKind } from '@codama/nodes';

import { mapVisitor } from './mapVisitor';
import { Visitor } from './visitor';

export function consoleLogVisitor<TNodeKind extends NodeKind = NodeKind>(
    visitor: Visitor<string, TNodeKind>,
): Visitor<void, TNodeKind> {
    // eslint-disable-next-line no-console
    return mapVisitor(visitor, value => console.log(value));
}
