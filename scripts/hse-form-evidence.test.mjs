import test from 'node:test';
import assert from 'node:assert/strict';
import { preparePhotoAnswers, photoStoragePath } from '../mobile/src/services/form-evidence.ts';

const schema = {
  version: 1, title: 'Inspección', sections: [{ id: 's', title: 'Campo', fields: [
    { id: 'photo', label: 'Foto', type: 'photo' },
    { id: 'notes', label: 'Notas', type: 'text' },
    { id: 'steps', label: 'Pasos', type: 'repeater', fields: [
      { id: 'evidence', label: 'Evidencia', type: 'photo' },
      { id: 'detail', label: 'Texto', type: 'text' },
    ] },
  ] }],
};

test('only photo fields upload, including repeaters', async () => {
  const calls = [];
  const input = { photo: 'file:///document/photo.jpg', notes: 'file:// is text',
    steps: [{ evidence: 'file:///document/step.jpg', detail: 'file:// is still text' }] };
  const output = await preparePhotoAnswers(schema, input, async (key, uri) => {
    calls.push([key, uri]); return 'org/form-runs/id/' + key + '.jpg';
  });
  assert.equal(output.photo, 'hse-evidence:org/form-runs/id/photo.jpg');
  assert.equal(output.notes, 'file:// is text');
  assert.equal(output.steps[0].evidence, 'hse-evidence:org/form-runs/id/steps-0-evidence.jpg');
  assert.equal(output.steps[0].detail, 'file:// is still text');
  assert.equal(input.photo, 'file:///document/photo.jpg');
  assert.equal(calls.length, 2);
});

test('already-uploaded refs are not uploaded twice', async () => {
  const input = { photo: 'hse-evidence:org/form-runs/id/photo.jpg' };
  const output = await preparePhotoAnswers(schema, input, async () => { throw new Error('Unexpected'); });
  assert.deepEqual(output, input);
});

test('invalid photo refs fail closed without passing local URIs to DB', async () => {
  await assert.rejects(preparePhotoAnswers(schema, { photo: 'https://example.org/image.jpg' }, async () => 'x'));
  await assert.rejects(preparePhotoAnswers(schema, { photo: 'file:///photo.jpg' }, async () => ''), /ruta/);
  assert.equal(photoStoragePath('hse-evidence:../secret'), null);
  assert.equal(photoStoragePath('file:///local.jpg'), null);
});
