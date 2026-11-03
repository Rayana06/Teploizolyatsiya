const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { DataSource } = require('typeorm');
const { createInsulationApplication } = require('../dist/main');
const { SessionService } = require('../dist/session/session.service');

let app, origin, dataSource, sessions;
const createdUserIds = [];
const createdMaterialIds = [];
const createdSessionIds = [];

before(async () => {
  app = await createInsulationApplication();
  await app.listen(0, '127.0.0.1');
  origin = await app.getUrl();
  dataSource = app.get(DataSource);
  sessions = app.get(SessionService);
});

after(async () => {
  for (const sessionId of createdSessionIds) await sessions.destroy(sessionId);
  if (createdMaterialIds.length) {
    await dataSource.query(`DELETE FROM insulation_material_likes WHERE insulation_material_id = ANY($1::int[])`, [createdMaterialIds]);
    await dataSource.query(`DELETE FROM insulation_materials WHERE insulation_material_id = ANY($1::int[])`, [createdMaterialIds]);
  }
  if (createdUserIds.length) await dataSource.query(`DELETE FROM users WHERE user_id = ANY($1::int[])`, [createdUserIds]);
  await app?.close();
});

async function register(email) {
  const response = await fetch(origin + '/api/users/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, displayName: email.split('@')[0], password: 'Teplo123!' }),
  });
  const responseText = await response.text();
  assert.equal(response.status, 201, responseText);
  const user = JSON.parse(responseText);
  createdUserIds.push(user.id);
  return user;
}

async function authenticate(email) {
  const response = await fetch(origin + '/api/users/authenticate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: 'Teplo123!' }),
  });
  const responseText = await response.text();
  assert.equal(response.status, 200, responseText);
  const setCookie = response.headers.get('set-cookie');
  assert.ok(setCookie?.startsWith('sessionId='));
  const cookie = setCookie.split(';', 1)[0];
  const sessionId = cookie.slice('sessionId='.length);
  createdSessionIds.push(sessionId);
  return { cookie, sessionId };
}

async function createDraft(creatorId, name) {
  const rows = await dataSource.query(
    `INSERT INTO insulation_materials
      (name, short_description, status, insulation_type, thickness_mm, creator_id)
     VALUES ($1, 'Integration test', 'draft', 'Минвата', 100, $2)
     RETURNING insulation_material_id`,
    [name, creatorId],
  );
  const id = rows[0].insulation_material_id;
  createdMaterialIds.push(id);
  return id;
}

test('Lab 4: public reading, 401 for guest, success for owner, 403 for another user and Redis session', async () => {
  const swaggerResponse = await fetch(origin + '/swagger-json');
  assert.equal(swaggerResponse.status, 200);
  const swagger = await swaggerResponse.json();
  assert.equal(swagger.components.securitySchemes.sessionId.in, 'cookie');
  assert.equal(swagger.paths['/api/insulation-materials'].get.security, undefined);
  assert.deepEqual(swagger.paths['/api/insulation-materials/{id}/publish'].put.security, [{ sessionId: [] }]);

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const ownerEmail = `owner-${suffix}@teploshchit.local`;
  const otherEmail = `other-${suffix}@teploshchit.local`;
  const owner = await register(ownerEmail);
  const other = await register(otherEmail);

  assert.equal((await fetch(origin + '/api/insulation-materials')).status, 200);

  const ownerDraftId = await createDraft(owner.id, 'Owner draft');
  const guestPublication = await fetch(origin + `/api/insulation-materials/${ownerDraftId}/publish`, {
    method: 'PUT', headers: { 'content-type': 'application/json' }, body: '{}',
  });
  assert.equal(guestPublication.status, 401);

  const ownerAuth = await authenticate(ownerEmail);
  assert.equal(await sessions.getUserId(ownerAuth.sessionId), owner.id);
  const ownerPublication = await fetch(origin + `/api/insulation-materials/${ownerDraftId}/publish`, {
    method: 'PUT', headers: { 'content-type': 'application/json', cookie: ownerAuth.cookie }, body: '{}',
  });
  const ownerPublicationText = await ownerPublication.text();
  assert.equal(ownerPublication.status, 200, ownerPublicationText);
  assert.equal(JSON.parse(ownerPublicationText).status, 'published');

  const secondOwnerDraftId = await createDraft(owner.id, 'Foreign draft');
  const otherAuth = await authenticate(otherEmail);
  assert.equal(await sessions.getUserId(otherAuth.sessionId), other.id);
  const foreignPublication = await fetch(origin + `/api/insulation-materials/${secondOwnerDraftId}/publish`, {
    method: 'PUT', headers: { 'content-type': 'application/json', cookie: otherAuth.cookie }, body: '{}',
  });
  assert.equal(foreignPublication.status, 403);

  const logout = await fetch(origin + '/api/users/logout', { method: 'POST', headers: { cookie: ownerAuth.cookie } });
  assert.equal(logout.status, 200);
  assert.equal(await sessions.getUserId(ownerAuth.sessionId), null);
  const afterLogout = await fetch(origin + `/api/insulation-materials/${secondOwnerDraftId}/publish`, {
    method: 'PUT', headers: { 'content-type': 'application/json', cookie: ownerAuth.cookie }, body: '{}',
  });
  assert.equal(afterLogout.status, 401);
});
