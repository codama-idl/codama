import { Node } from '@codama/nodes';
import { NodeStack } from '@codama/visitors-core';

export const LOG_LEVELS = ['debug', 'trace', 'info', 'warn', 'error'] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

export type ValidationItem = {
    level: LogLevel;
    message: string;
    node: Node;
    stack: readonly Node[];
};

export function validationItem(
    level: LogLevel,
    message: string,
    node: Node,
    stack: Node[] | NodeStack,
): ValidationItem {
    return {
        level,
        message,
        node,
        stack: Array.isArray(stack) ? [...stack] : stack.all(),
    };
}

export const getLevelIndex = (level: LogLevel): number => LOG_LEVELS.indexOf(level);
