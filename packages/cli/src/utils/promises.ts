export function promisify<T>(value: Promise<T> | T): Promise<T> {
    return Promise.resolve(value);
}
