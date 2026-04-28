import {
    booleanValueNode,
    bytesValueNode,
    isNode,
    numberValueNode,
    publicKeyValueNode,
    stringTypeNode,
    stringValueNode,
    TypeNode,
    ValueNode,
} from '@codama/nodes';

export function hex(bytes: number[] | Uint8Array): string {
    return Array.from(bytes).reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
}

export function parseConstantValue(valueString: string, type: TypeNode): { type: TypeNode; value: ValueNode } {
    if (isNode(type, 'bytesTypeNode')) {
        try {
            const bytes = JSON.parse(valueString) as number[];
            return { type, value: bytesValueNode('base16', hex(new Uint8Array(bytes))) };
        } catch {
            return { type: stringTypeNode('utf8'), value: stringValueNode(valueString) };
        }
    }

    if (isNode(type, 'numberTypeNode')) {
        if (/^-?\d+$/.test(valueString)) {
            return { type, value: numberValueNode(Number(valueString)) };
        }
        return { type: stringTypeNode('utf8'), value: stringValueNode(valueString) };
    }

    if (isNode(type, 'booleanTypeNode')) {
        if (valueString === 'true') return { type, value: booleanValueNode(true) };
        if (valueString === 'false') return { type, value: booleanValueNode(false) };
        return { type: stringTypeNode('utf8'), value: stringValueNode(valueString) };
    }

    if (isNode(type, 'publicKeyTypeNode')) {
        return { type, value: publicKeyValueNode(valueString) };
    }

    return { type, value: stringValueNode(valueString) };
}
