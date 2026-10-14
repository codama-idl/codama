import { getLastNodeFromPath, getTextNodeContent, titleCase } from 'codama';

import type { DisplayContext } from './accounts';
import { getDisplayFields } from './fields';
import { getInterpolatedIntent } from './interpolated-intent';
import type { InstructionDisplay } from './types';

/** Present a parsed instruction within the given context, see `getInstructionDisplayFromParsedInstruction`. */
export function displayInstruction(context: DisplayContext): InstructionDisplay {
    const instruction = getLastNodeFromPath(context.parsed.path);
    const intent = instruction.display?.intent;
    return {
        fields: getDisplayFields(context),
        intent: intent === undefined ? titleCase(instruction.identifier) : getTextNodeContent(intent),
        interpolatedIntent: getInterpolatedIntent(context),
    };
}
