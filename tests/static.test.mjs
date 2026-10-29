import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('static preview serves the room without creating a database or accepting wishes', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'birthday-static-'));
  const child = spawn(process.execPath, ['server.mjs'], {
    env: { ...process.env, PORT: '0', DB_PATH: join(dir, 'unused.sqlite') },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  try {
    const output = await new Promise((resolve, reject) => {
      child.stdout.once('data', data => resolve(data.toString()));
      child.once('error', reject);
      child.once('exit', code => reject(new Error(`Server exited: ${code}`)));
    });
    const origin = output.match(/http:\/\/127\.0\.0\.1:\d+/)[0];
    for (const path of ['/', '/style.css', '/app.js', '/room.js', '/music-config.js', '/vendor/three.module.js']) {
      const res = await fetch(origin + path);
      assert.equal(res.status, 200, path);
      assert.ok((await res.text()).length > 0);
    }
    for (const method of ['GET', 'POST']) {
      assert.equal((await fetch(origin + '/api/wishes', { method })).status, 404);
    }
    assert.equal((await fetch(origin + '/api/status')).status, 404);
    assert.equal((await fetch(origin + '/', { method: 'HEAD' })).headers.get('content-type'), 'text/html; charset=utf-8');
    const audio = await fetch(origin + '/audio/birthday-v2.m4a');
    assert.equal(audio.headers.get('content-type'), 'audio/mp4');
    const bytes = Buffer.from(await audio.arrayBuffer());
    assert.equal(bytes.toString('ascii', 4, 8), 'ftyp');
    const partial = await fetch(origin + '/audio/birthday-v2.m4a', { headers: { Range: 'bytes=0-31' } });
    assert.equal(partial.status, 206);
    assert.equal(partial.headers.get('content-range'), `bytes 0-31/${bytes.length}`);
    assert.deepEqual(Buffer.from(await partial.arrayBuffer()), bytes.subarray(0, 32));
    const suffix = await fetch(origin + '/audio/birthday-v2.m4a', { headers: { Range: 'bytes=-16' } });
    assert.deepEqual(Buffer.from(await suffix.arrayBuffer()), bytes.subarray(-16));
    assert.equal((await fetch(origin + '/audio/birthday-v2.m4a', { headers: { Range: `bytes=${bytes.length}-` } })).status, 416);
    assert.deepEqual(await readdir(dir), []);
  } finally {
    child.kill();
    await new Promise(resolve => child.once('exit', resolve));
    await rm(dir, { recursive: true, force: true });
  }
});
