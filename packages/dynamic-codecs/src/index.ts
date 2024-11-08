import { LinkableDictionary, NodeStack } from '@codama/visitors-core';
import { containsBytes, ReadonlyUint8Array } from '@solana/codecs';

import { getNodeCodecVisitor } from './codecs';
import { getValueNodeVisitor } from './values';

export * from './codecs';
export * from './values';

export type { ReadonlyUint8Array };
export { containsBytes };

export type CodecAndValueVisitors = {
    codecVisitor: ReturnType<typeof getNodeCodecVisitor>;
    valueVisitor: ReturnType<typeof getValueNodeVisitor>;
};

export function getCodecAndValueVisitors(linkables: LinkableDictionary, options: { stack?: NodeStack } = {}) {
    const stack = options.stack ?? new NodeStack();
    const codecVisitor = getNodeCodecVisitor(linkables, { stack });
    const valueVisitor = getValueNodeVisitor(linkables, { codecVisitorFactory: () => codecVisitor, stack });
    return { codecVisitor, valueVisitor };
}
