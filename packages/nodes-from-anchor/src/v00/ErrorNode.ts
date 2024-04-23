import { ErrorNode, errorNode } from '@kinobi-so/nodes';

import { IdlV00ErrorCode } from './idl';

export function errorNodeFromAnchorV00(idl: Partial<IdlV00ErrorCode>): ErrorNode {
    const name = idl.name ?? '';
    const msg = idl.msg ?? '';
    return errorNode({
        code: idl.code ?? -1,
        docs: idl.docs ?? [msg ? `${name}: ${msg}` : `${name}`],
        message: msg,
        name,
    });
}
