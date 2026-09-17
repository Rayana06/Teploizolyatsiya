const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { DataSource } = require('typeorm');
const { createInsulationApplication } = require('../dist/main');

let app, origin, dataSource;
before(async () => {
  app = await createInsulationApplication();
  await app.listen(0, '127.0.0.1');
  origin = await app.getUrl();
  dataSource = app.get(DataSource);
});
after(async () => app?.close());

const request = route => fetch(origin + route, { redirect: 'manual' });
const html = async route => {
  const response = await request(route);
  assert.equal(response.status, 200);
  return response.text();
};

test('PostgreSQL schema has three tables, restrictive foreign keys and one-draft index', async () => {
  const tables = await dataSource.query(`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('users','insulation_materials','insulation_material_likes')`);
  assert.equal(tables.length, 3);
  const cascading = await dataSource.query(`SELECT 1 FROM pg_constraint WHERE contype='f' AND confdeltype='c'`);
  assert.equal(cascading.length, 0);
  const draftIndex = await dataSource.query(`SELECT indexdef FROM pg_indexes WHERE indexname='uq_insulation_materials_one_draft_per_creator'`);
  assert.match(draftIndex[0].indexdef, /WHERE \(status = 'draft'/);
});

test('three GET pages use database data, hide deleted cards and render default media in HTML', async () => {
  const catalog = await html('/insulation-materials/catalog');
  assert.match(catalog, /class="insulation-card"/);
  assert.match(catalog, /action="\/insulation-materials\/\d+\/delete" method="post"/);
  assert.doesNotMatch(catalog, /data-insulation-id="8"/);
  assert.match(catalog, /default-insulation\.jpg/);
  const published = await dataSource.query(`SELECT insulation_material_id FROM insulation_materials WHERE status='published' ORDER BY insulation_material_id LIMIT 1`);
  const feed = await html(`/insulation-materials/feed/${published[0].insulation_material_id}`);
  assert.match(feed, /insulation-feed-likes/);
  const draft = await html('/insulation-materials/draft');
  assert.match(draft, /(Опубликовать|Далее)/);
  assert.equal((await request('/insulation-materials/feed/8')).status, 404);
  assert.equal((await request('/insulation-assets/default-media/default-insulation.jpg')).status, 200);
  assert.equal((await request('/insulation-assets/default-media/default-insulation.mp4')).status, 200);
});

test('ORM create/publish and SQL logical delete form one complete lifecycle', async () => {
  let drafts = await dataSource.query(`SELECT * FROM insulation_materials WHERE creator_id=1 AND status='draft'`);
  let temporaryOriginalDraft = false;
  if (drafts.length === 0) {
    drafts = await dataSource.query(
      `INSERT INTO insulation_materials (name, status, creator_id) VALUES ($1, 'draft', 1) RETURNING *`,
      ['Temporary lifecycle draft'],
    );
    temporaryOriginalDraft = true;
  }
  assert.equal(drafts.length, 1);
  const originalDraft = drafts[0];
  let createdId;
  try {
    const firstPublish = await fetch(origin + '/insulation-materials/publish', { method: 'POST', redirect: 'manual', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'insulationDescription=Original+draft&insulationType=Минвата&insulationThicknessMm=100&insulationPriceRubM2=500' });
    assert.equal(firstPublish.status, 303);
    const creation = await fetch(origin + '/insulation-materials/draft', { method: 'POST', redirect: 'manual', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'insulationName=Lifecycle+test' });
    assert.equal(creation.status, 303);
    const created = await dataSource.query(`SELECT insulation_material_id, image_url, video_url FROM insulation_materials WHERE creator_id=1 AND status='draft'`);
    assert.equal(created.length, 1);
    createdId = created[0].insulation_material_id;
    assert.equal(created[0].image_url, null);
    assert.equal(created[0].video_url, null);
    const publication = await fetch(origin + '/insulation-materials/publish', { method: 'POST', redirect: 'manual', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'insulationDescription=Published+from+ORM&insulationType=PIR-плита&insulationThicknessMm=80&insulationPriceRubM2=700' });
    assert.equal(publication.status, 303);
    assert.equal((await request(`/insulation-materials/feed/${createdId}`)).status, 200);
    const deletion = await fetch(origin + `/insulation-materials/${createdId}/delete`, { method: 'POST', redirect: 'manual' });
    assert.equal(deletion.status, 303);
    assert.equal((await request(`/insulation-materials/feed/${createdId}`)).status, 404);
    const row = await dataSource.query(`SELECT status FROM insulation_materials WHERE insulation_material_id=$1`, [createdId]);
    assert.equal(row[0].status, 'deleted');
  } finally {
    if (createdId) await dataSource.query(`DELETE FROM insulation_materials WHERE insulation_material_id=$1`, [createdId]);
    if (temporaryOriginalDraft) {
      await dataSource.query(`DELETE FROM insulation_materials WHERE insulation_material_id=$1`, [originalDraft.insulation_material_id]);
    } else {
      await dataSource.query(`UPDATE insulation_materials SET name=$1, short_description=$2, status='draft', insulation_type=$3, thickness_mm=$4, manufacturer=$5, application_area=$6, sku=$7, price_rub_m2=$8, published_at=$9 WHERE insulation_material_id=$10`, [originalDraft.name, originalDraft.short_description, originalDraft.insulation_type, originalDraft.thickness_mm, originalDraft.manufacturer, originalDraft.application_area, originalDraft.sku, originalDraft.price_rub_m2, originalDraft.published_at, originalDraft.insulation_material_id]);
    }
  }
});
