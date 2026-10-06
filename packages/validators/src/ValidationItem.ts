import type { CodamaError } from '@codama/errors';
import { type Node, REGISTERED_NODE_KINDS } from '@codama/nodes';
import { assertIsNodePath, NodePath, NodeStack } from '@codama/visitors-core';

export const LOG_LEVELS = ['debug', 'trace', 'info', 'warn', 'error'] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

/**
 * A diagnostic reported when validating a Codama IDL.
 *
 * The `path` leads to the node the diagnostic is about, which is its last
 * node. When the diagnostic corresponds to a `CodamaError`, that error is
 * kept as its `cause`, so consumers can match its code and context rather
 * than its message. It may be thrown while validating, e.g. a cyclic
 * dependency between instruction inputs, or be the error that creating a
 * codec would throw.
 */
export type ValidationItem<TNode extends Node = Node> = {
    cause?: CodamaError;
    level: LogLevel;
    message: string;
    path: NodePath<TNode>;
};

/**
 * Create a {@link ValidationItem}.
 *
 * @param level - The severity of the diagnostic.
 * @param message - A human-readable description of the diagnostic.
 * @param path - The path to the node the diagnostic is about, or the stack
 * whose current path leads to it.
 * @param cause - The `CodamaError` the diagnostic matches, if any.
 * @throws `CODAMA_ERROR__UNEXPECTED_NODE_KIND` when given a stack with an
 * empty path, since a diagnostic must be about a node.
 *
 * @example
 * ```ts
 * validationItem('warn', 'Program has no version.', [root, program]);
 * ```
 */
export function validationItem<TNode extends Node = Node>(
    level: LogLevel,
    message: string,
    path: NodePath<TNode> | NodeStack,
    cause?: CodamaError,
): ValidationItem<TNode> {
    const nodePath = Array.isArray(path) ? path : (path as NodeStack).getPath();
    assertIsNodePath(nodePath, REGISTERED_NODE_KINDS);
    return {
        ...(cause ? { cause } : {}),
        level,
        message,
        path: nodePath as NodePath<TNode>,
    };
}

export const getLevelIndex = (level: LogLevel): number => LOG_LEVELS.indexOf(level);
