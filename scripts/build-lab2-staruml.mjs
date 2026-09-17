import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

let sequence = 0;
const id = prefix => `LAB2-${prefix}-${String(++sequence).padStart(4, '0')}`;
const ref = value => ({ $ref: value });
const projectId = id('project');
const modelId = id('model');
const diagramId = id('diagram');

const definitions = [
  { name: 'users', x: 40, y: 80, width: 280, columns: [
    ['user_id', 'INTEGER', 0, true, false], ['email', 'VARCHAR', '254'], ['display_name', 'VARCHAR', '100'], ['created_at', 'TIMESTAMPTZ', 0],
  ] },
  { name: 'insulation_materials', x: 390, y: 35, width: 380, columns: [
    ['insulation_material_id', 'INTEGER', 0, true, false], ['name', 'VARCHAR', '120'], ['short_description', 'VARCHAR', '300'], ['status', 'ENUM', 'draft|published|deleted'], ['image_url', 'VARCHAR', '500'], ['video_url', 'VARCHAR', '500'], ['insulation_type', 'VARCHAR', '50'], ['thickness_mm', 'SMALLINT', 0], ['manufacturer', 'VARCHAR', '100'], ['application_area', 'VARCHAR', '120'], ['sku', 'VARCHAR', '40'], ['price_rub_m2', 'NUMERIC', '10,2'], ['source_url', 'VARCHAR', '500'], ['created_at', 'TIMESTAMPTZ', 0], ['published_at', 'TIMESTAMPTZ', 0], ['creator_id', 'INTEGER', 0, false, true],
  ] },
  { name: 'insulation_material_likes', x: 40, y: 350, width: 320, columns: [
    ['insulation_material_like_id', 'INTEGER', 0, true, false], ['user_id', 'INTEGER', 0, false, true], ['insulation_material_id', 'INTEGER', 0, false, true], ['created_at', 'TIMESTAMPTZ', 0],
  ] },
];

const entities = definitions.map(definition => {
  const entityId = id('entity');
  const columns = definition.columns.map(([name, type, length, primaryKey = false, foreignKey = false]) => ({
    _type: 'ERDColumn', _id: id('column'), _parent: ref(entityId), name, type, length,
    ...(primaryKey ? { primaryKey: true } : {}), ...(foreignKey ? { foreignKey: true } : {}),
  }));
  return { ...definition, entityId, model: { _type: 'ERDEntity', _id: entityId, _parent: ref(modelId), name: definition.name, columns } };
});

const entityViews = entities.map(entity => {
  const viewId = id('entity-view');
  const labelId = id('label');
  const compartmentId = id('compartment');
  const rowHeight = 18;
  const height = 31 + entity.model.columns.length * rowHeight;
  const columnViews = entity.model.columns.map((column, index) => ({
    _type: 'ERDColumnView', _id: id('column-view'), _parent: ref(compartmentId), model: ref(column._id), font: 'Arial;12;0',
    left: entity.x + 5, top: entity.y + 27 + index * rowHeight, width: entity.width - 10, height: rowHeight,
  }));
  return {
    _type: 'ERDEntityView', _id: viewId, _parent: ref(diagramId), model: ref(entity.entityId),
    subViews: [
      { _type: 'LabelView', _id: labelId, _parent: ref(viewId), font: 'Arial;13;1', left: entity.x + 5, top: entity.y + 4, width: entity.width - 10, height: 18, text: entity.name },
      { _type: 'ERDColumnCompartmentView', _id: compartmentId, _parent: ref(viewId), model: ref(entity.entityId), subViews: columnViews, font: 'Arial;12;0', left: entity.x, top: entity.y + 23, width: entity.width, height: height - 23 },
    ],
    font: 'Arial;12;0', left: entity.x, top: entity.y, width: entity.width, height,
    nameLabel: ref(labelId), columnCompartment: ref(compartmentId),
  };
});

const relationDefinitions = [
  { owner: 1, target: 0, name: 'created_by', points: '390:145;320:145' },
  { owner: 2, target: 0, name: 'liked_by', points: '200:350;200:175' },
  { owner: 2, target: 1, name: 'belongs_to', points: '360:420;580:420;580:354' },
];

const relationViews = [];
for (const definition of relationDefinitions) {
  const owner = entities[definition.owner];
  const target = entities[definition.target];
  const relationshipId = id('relationship');
  const relationship = {
    _type: 'ERDRelationship', _id: relationshipId, _parent: ref(owner.entityId), name: definition.name,
    end1: { _type: 'ERDRelationshipEnd', _id: id('end'), _parent: ref(relationshipId), reference: ref(owner.entityId), cardinality: '0..*' },
    end2: { _type: 'ERDRelationshipEnd', _id: id('end'), _parent: ref(relationshipId), reference: ref(target.entityId), cardinality: '1' },
  };
  owner.model.ownedElements ??= [];
  owner.model.ownedElements.push(relationship);
  relationViews.push({
    _type: 'ERDRelationshipView', _id: id('relationship-view'), _parent: ref(diagramId), model: ref(relationshipId),
    font: 'Arial;12;0', head: ref(entityViews[definition.target]._id), tail: ref(entityViews[definition.owner]._id), lineStyle: 2, points: definition.points,
  });
}

const diagram = {
  _type: 'ERDDiagram', _id: diagramId, _parent: ref(modelId), name: 'Теплощит — база данных', defaultDiagram: true,
  ownedViews: [...entityViews, ...relationViews],
};
const project = {
  _type: 'Project', _id: projectId, name: 'Теплощит — лабораторная №2',
  ownedElements: [{ _type: 'ERDDataModel', _id: modelId, _parent: ref(projectId), name: 'PostgreSQL Data Model', ownedElements: [diagram, ...entities.map(entity => entity.model)] }],
};

const output = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'lab2', 'insulation-database.mdj');
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(project, null, 2)}\n`, 'utf8');
console.log(output);
