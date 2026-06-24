import type { ReadonlyUint8Array } from '@solana/codecs';
import type { ProgramIdValueNode, ValueNode } from 'codama';
import { visitOrElse } from 'codama';

import {
    type ConstantPdaSeedValueVisitorContext,
    createConstantPdaSeedValueVisitor,
    unexpectedConstantPdaSeedNodeFallback,
} from '../visitors';

/**
 * Resolves a constant PDA seed value to raw bytes. Facade over `createConstantPdaSeedValueVisitor`.
 */
export async function resolveConstantPdaSeedValue(
    node: ProgramIdValueNode | ValueNode,
    ctx: ConstantPdaSeedValueVisitorContext,
): Promise<ReadonlyUint8Array> {
    const visitor = createConstantPdaSeedValueVisitor(ctx);
    return await visitOrElse(node, visitor, unexpectedConstantPdaSeedNodeFallback);
}
