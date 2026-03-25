import { createValueNodeVisitor } from '../../../../src/instruction-encoding/visitors/value-node-value';

export function makeVisitor() {
    return createValueNodeVisitor();
}
