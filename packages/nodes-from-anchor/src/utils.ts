import { bytesValueNode, numberValueNode, stringValueNode, ValueNode } from '@codama/nodes';

export function hex(bytes: number[] | Uint8Array): string {
    return Array.from(bytes).reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
}

export function parseConstantValue(valueString: string): ValueNode {
    if (valueString.startsWith('[') && valueString.endsWith(']')) {
        // It's a byte array
        try {
            const bytes = JSON.parse(valueString) as number[];
            const uint8Array = new Uint8Array(bytes);
            return bytesValueNode('base16', hex(uint8Array));
        } catch {
            // Fallback to string if parsing fails
            return stringValueNode(valueString);
        }
    }

    if (/^-?\d+$/.test(valueString)) {
        // It's a number
        return numberValueNode(Number(valueString));
    }

    // It's a string
    return stringValueNode(valueString);
}
