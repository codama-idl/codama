import { Codec, createCodec, getEncodedSize } from '@solana/codecs';

/**
 * A codec deferring to the codec returned by `getCodec`, which is only called
 * when the codec is first used. It lets a recursive type use its own codec
 * before that codec is fully created. Always variable-size, since the size of
 * the deferred codec is not known yet.
 */
export function getLazyCodec(getCodec: () => Codec<unknown>): Codec<unknown> {
    let codec: Codec<unknown> | undefined;
    const resolve = () => (codec ??= getCodec());
    return createCodec<unknown>({
        getSizeFromValue: value => getEncodedSize(value, resolve()),
        read: (bytes, offset) => resolve().read(bytes, offset),
        write: (value, bytes, offset) => resolve().write(value, bytes, offset),
    });
}
