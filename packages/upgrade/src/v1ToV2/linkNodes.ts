import type * as v1 from '../v1';
import type * as v2 from '../v2';
import { compactAndFreeze, identifierFromV1 } from './shared';

/** v1 link nodes that have a v2 counterpart of the same kind. */
export type V1LinkNode = Exclude<v1.LinkNode, v1.InstructionArgumentLinkNode>;

/** Convert a v1 link into the v2 link of the same kind, along with the links it holds. */
export function linkNodeFromV1<T extends V1LinkNode>(link: T): Extract<v2.LinkNode, { kind: T['kind'] }> {
    const node: V1LinkNode = link;
    const identifier = identifierFromV1(node.name);
    switch (node.kind) {
        case 'programLinkNode':
            return compactAndFreeze({ kind: node.kind, identifier }) as Extract<v2.LinkNode, { kind: T['kind'] }>;
        case 'instructionAccountLinkNode':
            return compactAndFreeze({
                kind: node.kind,
                identifier,
                instruction: node.instruction ? linkNodeFromV1(node.instruction) : undefined,
            }) as Extract<v2.LinkNode, { kind: T['kind'] }>;
        default:
            return compactAndFreeze({
                kind: node.kind,
                identifier,
                program: node.program ? linkNodeFromV1(node.program) : undefined,
            }) as Extract<v2.LinkNode, { kind: T['kind'] }>;
    }
}
