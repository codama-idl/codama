import path from 'path';
import fs from 'fs';
import nunjucks, { Environment } from 'nunjucks';
import { RenderMap } from '@codama/renderers-core';
import {
  AccountNode,
  DefinedTypeNode,
  EnumTypeNode,
  ErrorGroupNode,
  ErrorNode,
  InstructionGroupNode,
  InstructionNode,
  LinkNode,
  PdaNode,
  ProgramNode,
  RootNode,
  StructTypeNode,
  TupleTypeNode,
  accountNodeVisitor,
  definedTypeNodeVisitor,
  enumTypeNodeVisitor,
  errorGroupNodeVisitor,
  errorNodeVisitor,
  instructionGroupNodeVisitor,
  instructionNodeVisitor,
  linkNodeVisitor,
  pdaNodeVisitor,
  programNodeVisitor,
  rootNodeVisitor,
  structTypeNodeVisitor,
  tupleTypeNodeVisitor,
} from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { LinkOverrides, ImportMap } from './ImportMap';
import { getTypeManifestVisitor } from './getTypeManifestVisitor';

export type GetRenderMapOptions = {
  importOverrides?: LinkOverrides;
  dependencyMap?: Record<string, string>;
  renderRootInit?: boolean;
  extraTemplatesPath?: string;
};

export function getRenderMapVisitor(options: GetRenderMapOptions = {}) {
  const importMap = new ImportMap(options.importOverrides, options.dependencyMap);
  const templatesPath = path.join(__dirname, '..', 'public', 'templates');
  const templates = getTemplates([templatesPath, options.extraTemplatesPath].filter(Boolean) as string[]);

  const render = (templateName: string, context: Record<string, unknown>) => {
    return templates.render(`${templateName}.njk`, { ...context });
  };

  return rootNodeVisitor(root => {
    const renderMap = new RenderMap();
    const typeManifest = visit(root, getTypeManifestVisitor());

    // Visit all nodes and populate the render map.
    visit(
      root,
      rootNodeVisitor(rootNode => {
        const program = rootNode.program;
        if (!program) return;

        // Create root module
        if (options.renderRootInit ?? true) {
          renderMap.add('__init__.py', render('rootInit', { rootNode }));
        }

        // Create program files
        visit(
          program,
          programNodeVisitor(programNode => {
            renderMap.add('programs.py', render('programsPage', { programNode }));

            createAccountRenderers(programNode, renderMap, render, importMap, typeManifest);
            createInstructionRenderers(programNode, renderMap, render, importMap, typeManifest);
            createErrorRenderers(programNode, renderMap, render, importMap, typeManifest);
            createDefinedTypeRenderers(programNode, renderMap, render, importMap, typeManifest);
            createPdaRenderers(programNode, renderMap, render, importMap, typeManifest);
          }),
        );
      }),
    );

    return renderMap;
  });
}

function createAccountRenderers(
  programNode: ProgramNode,
  renderMap: RenderMap,
  render: (templateName: string, context: Record<string, unknown>) => string,
  importMap: ImportMap,
  typeManifest: Map<string, unknown>,
) {
  // Skip if program has no accounts.
  if (!programNode.accounts.length) return;

  // Create accounts module.
  renderMap.add('accounts/__init__.py', render('accountsInit', { programNode }));

  // Create account files.
  visit(
    programNode,
    accountNodeVisitor(accountNode => {
      gatherImportsFromAccount(accountNode, importMap);
      renderMap.add(
        `accounts/${accountNode.name.toLowerCase()}.py`,
        render('accountsPage', {
          accountNode,
          programNode,
          imports: importMap.imports,
          typeManifest,
        }),
      );
    }),
  );
}

function createInstructionRenderers(
  programNode: ProgramNode,
  renderMap: RenderMap,
  render: (templateName: string, context: Record<string, unknown>) => string,
  importMap: ImportMap,
  typeManifest: Map<string, unknown>,
) {
  // Skip if program has no instructions.
  if (!programNode.instructions.length) return;

  // Create instructions module.
  renderMap.add('instructions/__init__.py', render('instructionsInit', { programNode }));

  // Create instruction files.
  visit(
    programNode,
    instructionGroupNodeVisitor(instructionGroupNode => {
      visit(
        instructionGroupNode,
        instructionNodeVisitor(instructionNode => {
          gatherImportsFromInstruction(instructionNode, importMap);
          renderMap.add(
            `instructions/${instructionNode.name.toLowerCase()}.py`,
            render('instructionsPage', {
              instructionNode,
              programNode,
              imports: importMap.imports,
              typeManifest,
            }),
          );
        }),
      );
    }),
  );
}

function createErrorRenderers(
  programNode: ProgramNode,
  renderMap: RenderMap,
  render: (templateName: string, context: Record<string, unknown>) => string,
  importMap: ImportMap,
  typeManifest: Map<string, unknown>,
) {
  // Skip if program has no errors.
  if (!programNode.errors.length) return;

  // Create errors module.
  renderMap.add('errors/__init__.py', render('errorsInit', { programNode }));

  // Create error files.
  visit(
    programNode,
    errorGroupNodeVisitor(errorGroupNode => {
      visit(
        errorGroupNode,
        errorNodeVisitor(errorNode => {
          renderMap.add(
            `errors/${errorGroupNode.name.toLowerCase()}.py`,
            render('errorsPage', {
              errorGroupNode,
              programNode,
              imports: importMap.imports,
              typeManifest,
            }),
          );
        }),
      );
    }),
  );
}

function createDefinedTypeRenderers(
  programNode: ProgramNode,
  renderMap: RenderMap,
  render: (templateName: string, context: Record<string, unknown>) => string,
  importMap: ImportMap,
  typeManifest: Map<string, unknown>,
) {
  // Skip if program has no defined types.
  if (!programNode.definedTypes.length) return;

  // Create types module.
  renderMap.add('types/__init__.py', render('typesInit', { programNode }));

  // Create type files for structs.
  visit(
    programNode,
    structTypeNodeVisitor(structTypeNode => {
      gatherImportsFromStruct(structTypeNode, importMap);
      renderMap.add(
        `types/${structTypeNode.name.toLowerCase()}.py`,
        render('structPage', {
          structTypeNode,
          programNode,
          imports: importMap.imports,
          typeManifest,
        }),
      );
    }),
  );

  // Create type files for enums.
  visit(
    programNode,
    enumTypeNodeVisitor(enumTypeNode => {
      renderMap.add(
        `types/${enumTypeNode.name.toLowerCase()}.py`,
        render('enumPage', {
          enumTypeNode,
          programNode,
          imports: importMap.imports,
          typeManifest,
        }),
      );
    }),
  );
}

function createPdaRenderers(
  programNode: ProgramNode,
  renderMap: RenderMap,
  render: (templateName: string, context: Record<string, unknown>) => string,
  importMap: ImportMap,
  typeManifest: Map<string, unknown>,
) {
  // Skip if program has no PDAs.
  if (!programNode.pdas.length) return;

  // Create PDAs module.
  renderMap.add('pdas/__init__.py', render('pdasInit', { programNode }));

  // Create PDA files.
  visit(
    programNode,
    pdaNodeVisitor(pdaNode => {
      gatherImportsFromPda(pdaNode, importMap);
      renderMap.add(
        `pdas/${pdaNode.name.toLowerCase()}.py`,
        render('pdasPage', {
          pdaNode,
          programNode,
          imports: importMap.imports,
          typeManifest,
        }),
      );
    }),
  );
}

function gatherImportsFromAccount(accountNode: AccountNode, importMap: ImportMap) {
  visit(
    accountNode,
    linkNodeVisitor(linkNode => {
      importMap.addFromLinkNode(linkNode);
    }),
  );
}

function gatherImportsFromInstruction(instructionNode: InstructionNode, importMap: ImportMap) {
  visit(
    instructionNode,
    linkNodeVisitor(linkNode => {
      importMap.addFromLinkNode(linkNode);
    }),
  );
}

function gatherImportsFromStruct(structTypeNode: StructTypeNode, importMap: ImportMap) {
  visit(
    structTypeNode,
    linkNodeVisitor(linkNode => {
      importMap.addFromLinkNode(linkNode);
    }),
  );
}

function gatherImportsFromPda(pdaNode: PdaNode, importMap: ImportMap) {
  visit(
    pdaNode,
    linkNodeVisitor(linkNode => {
      importMap.addFromLinkNode(linkNode);
    }),
  );
}

function getTemplates(templatePaths: string[]): Environment {
  const env = new nunjucks.Environment(
    new nunjucks.FileSystemLoader(templatePaths, {
      noCache: true,
    }),
  );

  // Add custom filters if needed
  env.addFilter('camelCase', (str: string) => {
    return str.charAt(0).toLowerCase() + str.slice(1);
  });

  env.addFilter('pascalCase', (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  });

  env.addFilter('snakeCase', (str: string) => {
    return str
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
  });

  return env;
}