import { type CustomResolversTestProgramClient } from '../generated/custom-resolvers-test-idl-types';
import { createTestProgramClient } from '../test-utils';

export const programClient = createTestProgramClient<CustomResolversTestProgramClient>(
    'custom-resolvers-test-idl.json',
);
