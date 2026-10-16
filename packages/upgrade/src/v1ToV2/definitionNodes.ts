import type * as v1 from '../v1';
import type * as v2 from '../v2';
import { discriminatorNodeFromV1 } from './discriminatorNodes';
import { linkNodeFromV1 } from './linkNodes';
import { getLastV1NodeFromPath, V1NodePath } from './paths';
import { compactAndFreeze, docsFromV1, identifierFromV1, namespaceFromV1 } from './shared';
import { typeNodeFromV1 } from './typeNodes';
import { valueNodeFromV1 } from './valueNodes';

export function accountNodeFromV1(path: V1NodePath<v1.AccountNode>): v2.AccountNode {
    const account = getLastV1NodeFromPath(path);
    return compactAndFreeze({
        kind: 'accountNode',
        identifier: identifierFromV1(account.name),
        size: account.size,
        docs: docsFromV1(account.docs),
        data: typeNodeFromV1([...path, account.data]),
        pda: account.pda ? linkNodeFromV1(account.pda) : undefined,
        discriminators: account.discriminators?.map(discriminator => discriminatorNodeFromV1([...path, discriminator])),
    });
}

export function constantNodeFromV1(path: V1NodePath<v1.ConstantNode>): v2.ConstantNode {
    const constant = getLastV1NodeFromPath(path);
    return compactAndFreeze({
        kind: 'constantNode',
        identifier: identifierFromV1(constant.name),
        docs: docsFromV1(constant.docs),
        type: typeNodeFromV1([...path, constant.type]),
        value: valueNodeFromV1([...path, constant.value], [...path, constant.type]),
    });
}

export function definedTypeNodeFromV1(path: V1NodePath<v1.DefinedTypeNode>): v2.DefinedTypeNode {
    const definedType = getLastV1NodeFromPath(path);
    return compactAndFreeze({
        kind: 'definedTypeNode',
        identifier: identifierFromV1(definedType.name),
        docs: docsFromV1(definedType.docs),
        type: typeNodeFromV1([...path, definedType.type]),
    });
}

export function errorNodeFromV1(error: v1.ErrorNode): v2.ErrorNode {
    return compactAndFreeze({
        kind: 'errorNode',
        identifier: identifierFromV1(error.name),
        code: error.code,
        message: error.message,
        docs: docsFromV1(error.docs),
    });
}

export function eventNodeFromV1(path: V1NodePath<v1.EventNode>): v2.EventNode {
    const event = getLastV1NodeFromPath(path);
    return compactAndFreeze({
        kind: 'eventNode',
        identifier: identifierFromV1(event.name),
        docs: docsFromV1(event.docs),
        data: typeNodeFromV1([...path, event.data]),
        discriminators: event.discriminators?.map(discriminator => discriminatorNodeFromV1([...path, discriminator])),
    });
}

/** v1 plugin names become v2 plugin namespaces, and payloads are carried as is. */
export function pluginNodeFromV1(plugin: v1.PluginNode): v2.PluginNode {
    return compactAndFreeze({
        kind: 'pluginNode',
        namespace: namespaceFromV1(plugin.name),
        payload: plugin.payload,
    });
}
