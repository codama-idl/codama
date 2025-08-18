import prompts from 'prompts';

import { CliError } from './errors';

export const PROMPT_OPTIONS: prompts.Options = {
    onCancel: () => {
        throw new CliError('Operation cancelled.');
    },
};
