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

function isByteArray(value: unknown): value is number[] {
    return Array.isArray(value) && value.every(n => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= 255);
}

export function parseConstantValue(valueString: string, type: TypeNode): { type: TypeNode; value: ValueNode } {
    if (isNode(type, 'bytesTypeNode')) {
        try {
            const parsed: unknown = JSON.parse(valueString);
            if (isByteArray(parsed)) {
                return { type, value: bytesValueNode('base16', hex(new Uint8Array(parsed))) };
            }
        } catch {
            // fall through to the string fallback below
        }
        return { type: stringTypeNode('utf8'), value: stringValueNode(valueString) };
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
