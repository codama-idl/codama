import prompts from 'prompts';

export const PROMPT_OPTIONS: prompts.Options = {
    onCancel: () => {
        throw new Error('Operation cancelled.');
    },
};
