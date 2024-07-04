export function hex(bytes: number[] | Uint8Array): string {
    return (bytes as number[]).reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
}
