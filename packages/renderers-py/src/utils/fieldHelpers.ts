import { InstructionArgumentNode, StructFieldTypeNode } from '@codama/nodes';
import { visit } from '@codama/visitors-core';

import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { ImportMap } from '../ImportMap';
import { TypeManifest } from '../TypeManifest';

/**
 * Common field processing interface
 */
export interface FieldProcessor<T> {
    (field: InstructionArgumentNode | StructFieldTypeNode, fieldType: TypeManifest, imports: ImportMap): T | null;
}

/**
 * Process fields with a common pattern to reduce code duplication
 */
export function processFields<T>(
    scope: Pick<GlobalFragmentScope, 'typeManifestVisitor'> & {
        fields: InstructionArgumentNode[] | StructFieldTypeNode[];
    },
    processor: FieldProcessor<T>,
): { fragments: T[]; imports: ImportMap } {
    const { fields, typeManifestVisitor } = scope;
    const fragments: T[] = [];
    const imports = new ImportMap();

    fields.forEach((field, _index) => {
        // Skip discriminator fields
        if (field.name.toLowerCase().includes('discriminator')) {
            return;
        }

        try {
            const fieldType = visit(field.type, typeManifestVisitor);
            const result = processor(field, fieldType, imports);

            if (result !== null) {
                fragments.push(result);
            }
        } catch (error) {
            console.warn(`Failed to process field ${field.name}:`, error);
        }
    });

    return { fragments, imports };
}

/**
 * Check if a field should be skipped during processing
 */
export function shouldSkipField(field: InstructionArgumentNode | StructFieldTypeNode): boolean {
    return field.name.toLowerCase().includes('discriminator');
}

/**
 * Safe field name that avoids Python keywords
 */
export function getSafeFieldName(fieldName: string): string {
    const pythonKeywords = new Set([
        'and',
        'as',
        'assert',
        'break',
        'class',
        'continue',
        'def',
        'del',
        'elif',
        'else',
        'except',
        'exec',
        'finally',
        'for',
        'from',
        'global',
        'if',
        'import',
        'in',
        'is',
        'lambda',
        'not',
        'or',
        'pass',
        'print',
        'raise',
        'return',
        'try',
        'while',
        'with',
        'yield',
        'None',
        'True',
        'False',
    ]);

    if (pythonKeywords.has(fieldName)) {
        return `${fieldName}_`;
    }

    return fieldName;
}

/**
 * Generate field validation logic
 */
export function generateFieldValidation(
    field: InstructionArgumentNode | StructFieldTypeNode,
    fieldType: TypeManifest,
): string {
    const fieldName = getSafeFieldName(field.name);

    // Basic validation patterns
    if (fieldType.pyType.render.includes('int')) {
        return `assert isinstance(${fieldName}, int), f"${fieldName} must be an integer"`;
    }

    if (fieldType.pyType.render.includes('str')) {
        return `assert isinstance(${fieldName}, str), f"${fieldName} must be a string"`;
    }

    if (fieldType.pyType.render.includes('bool')) {
        return `assert isinstance(${fieldName}, bool), f"${fieldName} must be a boolean"`;
    }

    if (fieldType.pyType.render.includes('SolPubkey')) {
        return `assert isinstance(${fieldName}, SolPubkey), f"${fieldName} must be a SolPubkey"`;
    }

    return `# No validation for ${fieldName}`;
}

/**
 * Common error handling wrapper for field processing
 */
export function withFieldErrorHandling<T>(fieldName: string, operation: () => T, defaultValue: T): T {
    try {
        return operation();
    } catch (error) {
        console.warn(`Error processing field ${fieldName}:`, error);
        return defaultValue;
    }
}

/**
 * Check if a type is a custom defined type
 */
export function isCustomDefinedType(field: InstructionArgumentNode | StructFieldTypeNode): boolean {
    return field.type.kind === 'definedTypeLinkNode';
}

/**
 * Check if a type is encodable (has to_encodable method)
 */
export function isEncodableType(fieldType: TypeManifest): boolean {
    return fieldType.isEncodable || fieldType.isEnum;
}

/**
 * Generate appropriate import statements for a field type
 */
export function getFieldImports(
    field: InstructionArgumentNode | StructFieldTypeNode,
    fieldType: TypeManifest,
): ImportMap {
    const imports = new ImportMap();

    // Add imports from the field type
    imports.mergeWith(fieldType.pyType);
    imports.mergeWith(fieldType.borshType);

    // Add specific imports based on field type
    if (isCustomDefinedType(field) && 'name' in field.type) {
        imports.add('..types', field.type.name);
    }

    return imports;
}
