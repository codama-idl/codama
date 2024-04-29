import { ErrorNode, errorNode } from '@kinobi-so/nodes';

import { IdlV01ErrorCode } from './idl';

export function errorNodeFromAnchorV01(idl: Partial<IdlV01ErrorCode>): ErrorNode {
    const name = idl.name ?? '';
    const msg = idl.msg ?? '';
    return errorNode({
        code: idl.code ?? -1,
        docs: `${name}: ${msg}`,
        message: msg,
        name,
    });
}
