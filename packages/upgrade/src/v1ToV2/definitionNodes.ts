import type * as v1 from '../v1';
import type * as v2 from '../v2';
import { discriminatorNodeFromV1 } from './discriminatorNodes';
import { linkNodeFromV1 } from './linkNodes';
import { getLastV1NodeFromPath, V1NodePath } from './paths';
import { compactAndFreeze, docsFromV1 } from './shared';
import { typeNodeFromV1 } from './typeNodes';
import { valueNodeFromV1 } from './valueNodes';

export function accountNodeFromV1(path: V1NodePath<v1.AccountNode>): v2.AccountNode {
    const account = getLastV1NodeFromPath(path);
    return compactAndFreeze({
        data: typeNodeFromV1([...path, account.data]),
        discriminators: account.discriminators?.map(discriminator => discriminatorNodeFromV1([...path, discriminator])),
        docs: docsFromV1(account.docs),
        identifier: account.name as string as v2.IdentifierString,
        kind: 'accountNode',
        pda: account.pda ? linkNodeFromV1(account.pda) : undefined,
        size: account.size,
    });
}

export function constantNodeFromV1(path: V1NodePath<v1.ConstantNode>): v2.ConstantNode {
    const constant = getLastV1NodeFromPath(path);
    return compactAndFreeze({
        docs: docsFromV1(constant.docs),
        identifier: constant.name as string as v2.IdentifierString,
        kind: 'constantNode',
        type: typeNodeFromV1([...path, constant.type]),
        value: valueNodeFromV1([...path, constant.value], [...path, constant.type]),
    });
}

export function definedTypeNodeFromV1(path: V1NodePath<v1.DefinedTypeNode>): v2.DefinedTypeNode {
    const definedType = getLastV1NodeFromPath(path);
    return compactAndFreeze({
        docs: docsFromV1(definedType.docs),
        identifier: definedType.name as string as v2.IdentifierString,
        kind: 'definedTypeNode',
        type: typeNodeFromV1([...path, definedType.type]),
    });
}

export function errorNodeFromV1(error: v1.ErrorNode): v2.ErrorNode {
    return compactAndFreeze({
        code: error.code,
        docs: docsFromV1(error.docs),
        identifier: error.name as string as v2.IdentifierString,
        kind: 'errorNode',
        message: error.message,
    });
}

export function eventNodeFromV1(path: V1NodePath<v1.EventNode>): v2.EventNode {
    const event = getLastV1NodeFromPath(path);
    return compactAndFreeze({
        data: typeNodeFromV1([...path, event.data]),
        discriminators: event.discriminators?.map(discriminator => discriminatorNodeFromV1([...path, discriminator])),
        docs: docsFromV1(event.docs),
        identifier: event.name as string as v2.IdentifierString,
        kind: 'eventNode',
    });
}

/** v1 plugin names become v2 plugin namespaces, and payloads are carried as is. */
export function pluginNodeFromV1(plugin: v1.PluginNode): v2.PluginNode {
    return compactAndFreeze({
        kind: 'pluginNode',
        namespace: plugin.name as string as v2.NamespaceString,
        payload: plugin.payload,
    });
}
