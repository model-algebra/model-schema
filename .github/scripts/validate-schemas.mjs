// Checks that the schemas compile and agree with each other:
// every canonical type matches type-descriptor.json and is allowed by model-schema.json.
import Ajv from 'ajv';
import { readFileSync } from 'node:fs';

const load = file => JSON.parse(readFileSync(file, 'utf-8'));

const modelSchema = load('model-schema.json');
const typeDescriptor = load('type-descriptor.json');
const canonicalTypes = load('canonical-types.json');

const ajv = new Ajv({ allErrors: true });
ajv.compile(modelSchema);
const validateType = ajv.compile(typeDescriptor);

const errors = [];
for (const type of canonicalTypes.types)
    if (!validateType(type))
        errors.push(`canonical type ${type.name}: ${ajv.errorsText(validateType.errors)}`);

const fieldTypes = modelSchema.properties.fields.items.properties.type.enum;
for (const { name } of canonicalTypes.types)
    if (!fieldTypes.includes(name))
        errors.push(`canonical type ${name} is missing from the field type enum in model-schema.json`);

const typeClasses = typeDescriptor.properties.class.enum;
for (const typeClass of canonicalTypes.typeClasses)
    if (!typeClasses.includes(typeClass))
        errors.push(`type class ${typeClass} is missing from the class enum in type-descriptor.json`);

if (errors.length > 0) {
    errors.forEach(error => console.error(error));
    process.exit(1);
}
console.log(`Schemas compile; all ${canonicalTypes.types.length} canonical types are valid and allowed in models.`);
