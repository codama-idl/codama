import stringify from 'json-stable-stringify';

import { mapVisitor } from './mapVisitor';
import { removeDocsVisitor } from './removeDocsVisitor';
import { staticVisitor } from './staticVisitor';
import { Visitor } from './visitor';

export function getUniqueHashStringVisitor(options: { removeDocs?: boolean } = {}): Visitor<string> {
    const removeDocs = options.removeDocs ?? false;
    if (!removeDocs) {
        return staticVisitor(node => stringify(node) as string);
    }
    return mapVisitor(removeDocsVisitor(), node => stringify(node) as string);
}
