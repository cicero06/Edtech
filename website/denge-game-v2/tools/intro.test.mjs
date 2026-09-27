import test from 'node:test';
import assert from 'node:assert/strict';
import { statSync } from 'node:fs';
import { readPng } from './png.mjs';
import { advanceIntro, INTRO_ART, INTRO_VIDEOS } from '../src/Game/data/intro.ts';

test('startup visits the splash, profile, town and Lina before the game', () => {
  let stage = 'splash';
  for (const next of ['profile', 'opening', 'lina', 'complete']) {
    stage = advanceIntro(stage, stage);
    assert.equal(stage, next);
  }
  assert.equal(advanceIntro(stage, stage), 'complete');
});

test('a repeated completion or skip cannot skip the next video', () => {
  const profile = advanceIntro('splash', 'splash');
  assert.equal(advanceIntro(profile, 'splash'), 'profile');
  const opening = advanceIntro(profile, 'profile');
  assert.equal(advanceIntro(opening, 'profile'), 'opening');
  const lina = advanceIntro(opening, 'opening');
  assert.equal(advanceIntro(lina, 'opening'), 'lina');
  assert.equal(advanceIntro('complete', 'lina'), 'complete');
});

test('out-of-order events do not advance the intro', () => {
  assert.equal(advanceIntro('splash', 'lina'), 'splash');
  assert.equal(advanceIntro('profile', 'lina'), 'profile');
  assert.equal(advanceIntro('opening', 'lina'), 'opening');
});

test('the intro uses the town video and the processed Lina mask video', () => {
  assert.deepEqual(Object.keys(INTRO_VIDEOS), ['opening', 'lina']);
  assert.equal(INTRO_VIDEOS.lina.path, 'assets/videos/lina-masked.mp4');
  assert.equal(INTRO_ART.lina, 'assets/videos/lina-poster.png');
  for (const clip of Object.values(INTRO_VIDEOS)) {
    const file = new URL(`../public/${clip.path}`, import.meta.url);
    assert.ok(statSync(file).size > 0);
    assert.ok(clip.path.endsWith('.mp4'));
  }
});

test('cloud, town and Lina poster assets exist', () => {
  assert.deepEqual(Object.keys(INTRO_ART), ['clouds', 'town', 'lina']);
  for (const path of Object.values(INTRO_ART)) {
    assert.ok(statSync(new URL(`../public/${path}`, import.meta.url)).size > 0);
  }
});

test('the Lina poster contains real transparent background and opaque foreground', () => {
  const poster = readPng(new URL(`../public/${INTRO_ART.lina}`, import.meta.url));
  assert.equal(poster.width, 1280);
  assert.equal(poster.height, 720);
  let transparent = 0;
  let opaque = 0;
  for (let i = 3; i < poster.data.length; i += 4) {
    if (poster.data[i] === 0) transparent++;
    if (poster.data[i] === 255) opaque++;
  }
  assert.ok(transparent > poster.width * poster.height / 3);
  assert.ok(opaque > poster.width * poster.height / 10);
});
