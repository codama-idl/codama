import { Node } from '@codama/nodes';
import { NodePath, NodeStack } from '@codama/visitors-core';

export const LOG_LEVELS = ['debug', 'trace', 'info', 'warn', 'error'] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

export type ValidationItem = {
    level: LogLevel;
    message: string;
    node: Node;
    path: NodePath;
};

export function validationItem(
    level: LogLevel,
    message: string,
    node: Node,
    path: NodePath | NodeStack,
): ValidationItem {
    return {
        level,
        message,
        node,
        path: Array.isArray(path) ? path : (path as NodeStack).getPath(),
    };
}

export const getLevelIndex = (level: LogLevel): number => LOG_LEVELS.indexOf(level);
