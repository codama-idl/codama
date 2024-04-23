import { KINOBI_ERROR__VISITORS__FAILED_TO_VALIDATE_NODE, KinobiError } from '@kinobi-so/errors';
import { NodeKind } from '@kinobi-so/nodes';
import { mapVisitor, Visitor } from '@kinobi-so/visitors-core';

import { getLevelIndex, LogLevel, ValidationItem } from './ValidationItem';

export function throwValidatorItemsVisitor<TNodeKind extends NodeKind = NodeKind>(
    visitor: Visitor<readonly ValidationItem[], TNodeKind>,
    throwLevel: LogLevel = 'error',
): Visitor<void, TNodeKind> {
    return mapVisitor(visitor, validationItems => {
        const levelHistogram = [...validationItems]
            .sort((a, b) => getLevelIndex(b.level) - getLevelIndex(a.level))
            .reduce(
                (acc, item) => {
                    acc[item.level] = (acc[item.level] ?? 0) + 1;
                    return acc;
                },
                {} as Record<LogLevel, number>,
            );
        const maxLevel = Object.keys(levelHistogram)
            .map(level => getLevelIndex(level as LogLevel))
            .sort((a, b) => b - a)[0];

        if (maxLevel >= getLevelIndex(throwLevel)) {
            const formattedHistogram = Object.keys(levelHistogram)
                .map(level => `${level}s: ${levelHistogram[level as LogLevel]}`)
                .join(', ');
            throw new KinobiError(KINOBI_ERROR__VISITORS__FAILED_TO_VALIDATE_NODE, {
                formattedHistogram,
                validationItems,
            });
        }
    });
}
