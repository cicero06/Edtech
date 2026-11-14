import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import type { Request } from 'express';
import { FieldValue } from 'firebase-admin/firestore';
import { C } from '../../firebase/collections.js';
import {
  FirebaseService,
  fromDoc,
} from '../../firebase/firebase.service.js';
import type { AdultUser, Participant } from '../../firebase/models.js';
import type { AuthPrincipal } from './principal.js';

/**
 * Identity resolution for the Atlas v2 API.
 *
 * 1. `Authorization: Bearer <participant token>` → participant principal
 *    (our own opaque tokens — 64 hex chars, never contain a dot).
 * 2. `Authorization: Bearer <Firebase ID token>` → adult principal, verified
 *    by firebase-admin against the HarmonyTown project.
 * 3. `x-atlas-user: <handle>` → adult principal, non-production only (dev
 *    seam for local testing and e2e).
 */
@Injectable()
export class AtlasAuthService {
  constructor(private readonly firebase: FirebaseService) {}

  private get db() {
    return this.firebase.db;
  }

  async resolve(request: Request): Promise<AuthPrincipal | null> {
    const header = request.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      const raw = header.slice('Bearer '.length).trim();
      if (/^[0-9a-f]{64}$/.test(raw)) {
        return this.resolveParticipantToken(raw);
      }
      if (raw.includes('.')) return this.resolveFirebaseIdToken(raw);
      return null;
    }
    if (process.env.NODE_ENV === 'production') return null;
    const subject = request.headers['x-atlas-user'];
    if (typeof subject !== 'string' || !subject.trim()) return null;
    const handle = subject.trim().replace(/[/\s]+/g, '-').slice(0, 100);
    const user = await this.upsertAdult(`dev:${handle}`, handle, null);
    return { kind: 'adult', user };
  }

  private async resolveFirebaseIdToken(
    token: string,
  ): Promise<AuthPrincipal | null> {
    let decoded;
    try {
      decoded = await this.firebase.auth.verifyIdToken(token);
    } catch {
      return null; // expired, wrong project, malformed — all just "not ours"
    }
    const email = decoded.email ?? null;
    const displayName =
      (typeof decoded.name === 'string' && decoded.name) ||
      email ||
      decoded.uid;
    const user = await this.upsertAdult(decoded.uid, displayName, email);
    return { kind: 'adult', user };
  }

  private async upsertAdult(
    authSubject: string,
    displayName: string,
    email: string | null,
  ): Promise<AdultUser> {
    const ref = this.db.collection(C.adultUsers).doc(authSubject);
    const snap = await ref.get();
    const existing = fromDoc<AdultUser>(snap);
    if (
      existing &&
      existing.displayName === displayName &&
      existing.email === email
    ) {
      return existing;
    }
    await ref.set(
      {
        authSubject,
        displayName,
        email,
        ...(existing ? {} : { createdAt: FieldValue.serverTimestamp() }),
      },
      { merge: true },
    );
    return {
      id: authSubject,
      authSubject,
      displayName,
      email,
      createdAt: existing?.createdAt ?? new Date(),
    };
  }

  private async resolveParticipantToken(
    raw: string,
  ): Promise<AuthPrincipal | null> {
    const tokenHash = createHash('sha256').update(raw).digest('hex');
    const tokenSnap = await this.db
      .collection(C.participantTokens)
      .doc(tokenHash)
      .get();
    const token = tokenSnap.data() as
      | {
          participantId: string;
          revokedAt?: unknown;
          expiresAt?: { toMillis(): number } | null;
        }
      | undefined;
    if (!token || token.revokedAt) return null;
    if (token.expiresAt && token.expiresAt.toMillis() < Date.now()) return null;
    const participant = fromDoc<Participant>(
      await this.db.collection(C.participants).doc(token.participantId).get(),
    );
    if (!participant) return null;
    return { kind: 'participant', participant, tokenId: tokenHash };
  }

  async issueParticipantToken(
    participantId: string,
    label?: string,
  ): Promise<string> {
    const raw = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(raw).digest('hex');
    await this.db.collection(C.participantTokens).doc(tokenHash).set({
      participantId,
      label: label ?? null,
      expiresAt: null,
      revokedAt: null,
      createdAt: FieldValue.serverTimestamp(),
    });
    return raw;
  }
}
