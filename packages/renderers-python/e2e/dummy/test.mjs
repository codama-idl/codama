import fs from 'fs';
import path from 'path';
import { createFromRoot } from 'codama';
import { rootNodeFromJson } from '@codama/nodes-from-json';
import { renderVisitor } from '../../src/renderVisitor.js';

// Load test data and create a Codama object.
const codamaJson = JSON.parse(
  fs.readFileSync(path.resolve('./packages/renderers-python/e2e/dummy/codama.json'), 'utf8')
);
const codama = createFromRoot(rootNodeFromJson(codamaJson));

// Render the Python client code.
codama.accept(
  renderVisitor('./packages/renderers-python/e2e/dummy/src/generated', {
    // Set formatCode to false to skip running black formatter for tests
    formatCode: false,
  })
);

console.log('Python client code generation completed!'); 