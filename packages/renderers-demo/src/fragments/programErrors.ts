import { ErrorNode, titleCase } from '@codama/nodes';

import { Fragment, getTableFragment } from '../utils';

export function getProgramErrorsFragment(errors: ErrorNode[]): Fragment | undefined {
    if (errors.length === 0) return;

    const errorHeaders = ['Name', 'Code', 'Message'];
    const errorRows = errors.map(error => [titleCase(error.name), `\`${error.code}\``, error.message]);

    return getTableFragment(errorHeaders, errorRows);
}
