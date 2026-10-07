import { LinkableDictionary, NodeStack, ProvidedScope } from '@codama/visitors-core';
import { containsBytes, ReadonlyUint8Array } from '@solana/codecs';

import { CodecVisitorOptions, getNodeValueCodecVisitor } from './codecs';
import { getValueNodeVisitor } from './values';

export * from './codecs';
export * from './decoded';
export * from './format';
export * from './values';

export type { ReadonlyUint8Array };
export { containsBytes };

/** A codec visitor and a value visitor sharing the same stack and scope. */
export type CodecAndValueVisitors = {
    codecVisitor: ReturnType<typeof getNodeValueCodecVisitor>;
    valueVisitor: ReturnType<typeof getValueNodeVisitor>;
};

/**
 * Get a codec visitor and a value visitor sharing the same stack and scope, so values
 * can be encoded with the codecs of their types, e.g. to compare discriminators.
 */
export function getCodecAndValueVisitors(
    linkables: LinkableDictionary,
    options: CodecVisitorOptions & { scope?: ProvidedScope; stack?: NodeStack } = {},
): CodecAndValueVisitors {
    const stack = options.stack ?? new NodeStack();
    const scope = options.scope ?? new ProvidedScope();
    const codecVisitor = getNodeValueCodecVisitor(linkables, { ...options, scope, stack });
    const valueVisitor = getValueNodeVisitor(linkables, { codecVisitorFactory: () => codecVisitor, scope, stack });
    return { codecVisitor, valueVisitor };
}
