import {
    ArrayTypeNode,
    BooleanTypeNode, 
    BytesTypeNode,
    DefinedTypeNode,
    FieldNode,
    LinkNode,
    MapTypeNode,
    Node,
    NodeType,
    NullableTypeNode,
    NumberEnumValueNode,
    NumberLiteralTypeNode,
    NumberTypeNode,
    OptionTypeNode,
    PublicKeyTypeNode,
    SetTypeNode,
    StringEnumValueNode,
    StringLiteralTypeNode,
    StringTypeNode,
    StructTypeNode,
    TupleTypeNode,
    arrayTypeNodeVisitor,
    booleanTypeNodeVisitor,
    bytesTypeNodeVisitor,
    definedTypeNodeVisitor,
    fieldNodeVisitor,
    linkNodeVisitor,
    mapTypeNodeVisitor,
    nodeVisitor,
    nullableTypeNodeVisitor,
    numberEnumValueNodeVisitor,
    numberLiteralTypeNodeVisitor,
    numberTypeNodeVisitor,
    optionTypeNodeVisitor,
    publicKeyTypeNodeVisitor,
    setTypeNodeVisitor,
    stringEnumValueNodeVisitor,
    stringLiteralTypeNodeVisitor,
    stringTypeNodeVisitor,
    structTypeNodeVisitor,
    tupleTypeNodeVisitor,
  } from '@codama/nodes';
  import { rootNodeVisitor, visit } from '@codama/visitors-core';
  
  export type TypeManifest = Map<string, unknown>;
  
  export type PyType = {
    type: string;
    imports?: string[];
    fromJson?: string;
    toJson?: string;
    defaultValue?: string;
    nullable?: boolean;
  };
  
  export function getTypeManifestVisitor() {
    const typeManifest: TypeManifest = new Map();
  
    const getDefinedTypeVisitor = (field: FieldNode) => linkNodeVisitor(linkNode => {
      const typeName = linkNode.name;
      typeManifest.set(field.name, {
        type: typeName,
        imports: [`from ..types.${typeName.toLowerCase()} import ${typeName}`],
        fromJson: `${typeName}.from_json`,
        toJson: 'to_json',
        nullable: false,
      });
    });
  
    return rootNodeVisitor(root => {
      // Visit all field nodes to collect types.
      visit(
        root,
        fieldNodeVisitor(field => {
          // Visit the type node of this field.
          visit(
            field.valueType,
            // Boolean type.
            booleanTypeNodeVisitor(() => {
              typeManifest.set(field.name, {
                type: 'bool',
                imports: [],
                fromJson: '',
                toJson: '',
                defaultValue: 'False',
                nullable: false,
              });
            }),
  
            // Number type.
            numberTypeNodeVisitor(numberTypeNode => {
              const { size } = numberTypeNode;
              const isF64 = size === 64 && numberTypeNode.format === 'float';
  
              const type = isF64 ? 'float' : 'int';
              typeManifest.set(field.name, {
                type,
                imports: [],
                fromJson: '',
                toJson: '',
                defaultValue: isF64 ? '0.0' : '0',
                nullable: false,
              });
            }),
  
            // String type.
            stringTypeNodeVisitor(() => {
              typeManifest.set(field.name, {
                type: 'str',
                imports: [],
                fromJson: '',
                toJson: '',
                defaultValue: '""',
                nullable: false,
              });
            }),
  
            // Bytes type.
            bytesTypeNodeVisitor(() => {
              typeManifest.set(field.name, {
                type: 'bytes',
                imports: [],
                fromJson: 'bytes.fromhex',
                toJson: 'lambda b: b.hex()',
                defaultValue: 'b""',
                nullable: false,
              });
            }),
  
            // PublicKey type.
            publicKeyTypeNodeVisitor(() => {
              typeManifest.set(field.name, {
                type: 'Pubkey',
                imports: ['from solana.publickey import Pubkey'],
                fromJson: 'Pubkey',
                toJson: 'str',
                defaultValue: 'Pubkey("11111111111111111111111111111111")',
                nullable: false,
              });
            }),
  
            // Array type.
            arrayTypeNodeVisitor(arrayTypeNode => {
              visit(
                arrayTypeNode.items,
                nodeVisitor(itemTypeNode => {
                  const itemType = getPythonTypeFromNode(itemTypeNode);
                  const imports = itemType.imports ? [...itemType.imports] : [];
                  imports.push('from typing import List');
  
                  typeManifest.set(field.name, {
                    type: `List[${itemType.type}]`,
                    imports,
                    fromJson: itemType.fromJson ? `lambda items: [${itemType.fromJson}(item) for item in items]` : '',
                    toJson: itemType.toJson ? `lambda items: [${itemType.toJson}(item) for item in items]` : '',
                    defaultValue: '[]',
                    nullable: false,
                  });
                }),
              );
            }),
  
            // Tuple type.
            tupleTypeNodeVisitor(tupleTypeNode => {
              const items = tupleTypeNode.items.map(item => {
                const itemType = getPythonTypeFromNode(item);
                return itemType;
              });
  
              const imports = items.flatMap(item => item.imports || []);
              imports.push('from typing import Tuple');
  
              const types = items.map(item => item.type).join(', ');
              typeManifest.set(field.name, {
                type: `Tuple[${types}]`,
                imports,
                fromJson: '', // Custom handling needed for tuples
                toJson: '', // Custom handling needed for tuples
                defaultValue: `(${items.map(item => item.defaultValue || 'None').join(', ')})`,
                nullable: false,
              });
            }),
  
            // Set type.
            setTypeNodeVisitor(setTypeNode => {
              visit(
                setTypeNode.items,
                nodeVisitor(itemTypeNode => {
                  const itemType = getPythonTypeFromNode(itemTypeNode);
                  const imports = itemType.imports ? [...itemType.imports] : [];
                  imports.push('from typing import Set');
  
                  typeManifest.set(field.name, {
                    type: `Set[${itemType.type}]`,
                    imports,
                    fromJson: itemType.fromJson ? `lambda items: {${itemType.fromJson}(item) for item in items}` : '',
                    toJson: itemType.toJson ? `lambda items: {${itemType.toJson}(item) for item in items}` : '',
                    defaultValue: 'set()',
                    nullable: false,
                  });
                }),
              );
            }),
  
            // Map type.
            mapTypeNodeVisitor(mapTypeNode => {
              const keyType = getPythonTypeFromNode(mapTypeNode.keys);
              const valueType = getPythonTypeFromNode(mapTypeNode.values);
              const imports = [
                ...(keyType.imports || []),
                ...(valueType.imports || []),
                'from typing import Dict',
              ];
  
              typeManifest.set(field.name, {
                type: `Dict[${keyType.type}, ${valueType.type}]`,
                imports,
                fromJson: '', // Custom handling needed for maps
                toJson: '', // Custom handling needed for maps
                defaultValue: '{}',
                nullable: false,
              });
            }),
  
            // Nullable type.
            nullableTypeNodeVisitor(nullableTypeNode => {
              visit(
                nullableTypeNode.item,
                nodeVisitor(itemTypeNode => {
                  const itemType = getPythonTypeFromNode(itemTypeNode);
                  const imports = itemType.imports ? [...itemType.imports] : [];
                  imports.push('from typing import Optional');
  
                  typeManifest.set(field.name, {
                    type: `Optional[${itemType.type}]`,
                    imports,
                    fromJson: itemType.fromJson,
                    toJson: itemType.toJson,
                    defaultValue: 'None',
                    nullable: true,
                  });
                }),
              );
            }),
  
            // Option type.
            optionTypeNodeVisitor(optionTypeNode => {
              visit(
                optionTypeNode.item,
                nodeVisitor(itemTypeNode => {
                  const itemType = getPythonTypeFromNode(itemTypeNode);
                  const imports = itemType.imports ? [...itemType.imports] : [];
                  imports.push('from typing import Optional');
  
                  typeManifest.set(field.name, {
                    type: `Optional[${itemType.type}]`,
                    imports,
                    fromJson: itemType.fromJson,
                    toJson: itemType.toJson,
                    defaultValue: 'None',
                    nullable: true,
                  });
                }),
              );
            }),
  
            // Defined type.
            definedTypeNodeVisitor((definedTypeNode) => {
              const typeName = definedTypeNode.name;
              typeManifest.set(field.name, {
                type: typeName,
                imports: [`from ..types.${typeName.toLowerCase()} import ${typeName}`],
                fromJson: `${typeName}.from_json`,
                toJson: 'to_json',
                defaultValue: `${typeName}()`,
                nullable: false,
              });
            }),
  
            // Link type.
            getDefinedTypeVisitor(field),
  
            // String literal type.
            stringLiteralTypeNodeVisitor(stringLiteralNode => {
              typeManifest.set(field.name, {
                type: 'str',
                imports: [],
                fromJson: '',
                toJson: '',
                defaultValue: `"${stringLiteralNode.value}"`,
                nullable: false,
              });
            }),
  
            // Number literal type.
            numberLiteralTypeNodeVisitor(numberLiteralNode => {
              const isFloat = String(numberLiteralNode.value).includes('.');
              typeManifest.set(field.name, {
                type: isFloat ? 'float' : 'int',
                imports: [],
                fromJson: '',
                toJson: '',
                defaultValue: String(numberLiteralNode.value),
                nullable: false,
              });
            }),
          );
        }),
      );
  
      return typeManifest;
    });
  }
  
  function getPythonTypeFromNode(node: Node): PyType {
    const fallbackType: PyType = {
      type: 'Any',
      imports: ['from typing import Any'],
      fromJson: '',
      toJson: '',
      defaultValue: 'None',
      nullable: true,
    };
  
    switch (node.type) {
      case NodeType.BooleanType:
        return {
          type: 'bool',
          imports: [],
          fromJson: '',
          toJson: '',
          defaultValue: 'False',
          nullable: false,
        };
      case NodeType.NumberType:
        const numberNode = node as NumberTypeNode;
        const isF64 = numberNode.size === 64 && numberNode.format === 'float';
        return {
          type: isF64 ? 'float' : 'int',
          imports: [],
          fromJson: '',
          toJson: '',
          defaultValue: isF64 ? '0.0' : '0',
          nullable: false,
        };
      case NodeType.StringType:
        return {
          type: 'str',
          imports: [],
          fromJson: '',
          toJson: '',
          defaultValue: '""',
          nullable: false,
        };
      case NodeType.BytesType:
        return {
          type: 'bytes',
          imports: [],
          fromJson: 'bytes.fromhex',
          toJson: 'lambda b: b.hex()',
          defaultValue: 'b""',
          nullable: false,
        };
      case NodeType.PublicKeyType:
        return {
          type: 'Pubkey',
          imports: ['from solana.publickey import Pubkey'],
          fromJson: 'Pubkey',
          toJson: 'str',
          defaultValue: 'Pubkey("11111111111111111111111111111111")',
          nullable: false,
        };
      case NodeType.Link:
        const linkNode = node as LinkNode;
        const typeName = linkNode.name;
        return {
          type: typeName,
          imports: [`from ..types.${typeName.toLowerCase()} import ${typeName}`],
          fromJson: `${typeName}.from_json`,
          toJson: 'to_json',
          defaultValue: `${typeName}()`,
          nullable: false,
        };
      case NodeType.DefinedType:
        const definedTypeNode = node as DefinedTypeNode;
        const definedTypeName = definedTypeNode.name;
        return {
          type: definedTypeName,
          imports: [`from ..types.${definedTypeName.toLowerCase()} import ${definedTypeName}`],
          fromJson: `${definedTypeName}.from_json`,
          toJson: 'to_json',
          defaultValue: `${definedTypeName}()`,
          nullable: false,
        };
      default:
        return fallbackType;
    }
  }