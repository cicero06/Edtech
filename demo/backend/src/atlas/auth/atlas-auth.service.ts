import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { AuthPrincipal } from './principal.js';

/**
 * Adult identity: Supabase Auth JWTs verified against the project's JWKS
 * (decision §8.1 — managed provider). SUPABASE_URL configures it; without
 * it only participant tokens and the dev header resolve.
 */
const SUPABASE_URL = process.env.SUPABASE_URL;
const supabaseJwks = SUPABASE_URL
  ? createRemoteJWKSet(
      new URL(`${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/.well-known/jwks.json`),
    )
  : null;

@Injectable()
export class AtlasAuthService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolution order:
   * 1. `Authorization: Bearer <participant token>` → participant principal
   *    (our own opaque tokens — 64 hex chars, never contain a dot).
   * 2. `Authorization: Bearer <JWT>` → Supabase-verified adult principal.
   * 3. `x-atlas-user: <authSubject>` header → adult principal (non-production
   *    only; the dev seam until the staff UI wires a real Supabase session).
   */
  async resolve(request: Request): Promise<AuthPrincipal | null> {
    const header = request.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      const raw = header.slice('Bearer '.length);
      const participant = await this.resolveParticipantToken(raw);
      if (participant) return participant;
      if (raw.includes('.')) return this.resolveSupabaseJwt(raw);
      return null;
    }
    if (process.env.NODE_ENV === 'production') return null;
    const subject = request.headers['x-atlas-user'];
    if (typeof subject !== 'string' || !subject.trim()) return null;
    const authSubject = subject.trim();
    const user = await this.prisma.adultUser.upsert({
      where: { authSubject },
      create: { authSubject, displayName: authSubject },
      update: {},
    });
    return { kind: 'adult', user };
  }

  private async resolveSupabaseJwt(
    token: string,
  ): Promise<AuthPrincipal | null> {
    if (!supabaseJwks || !SUPABASE_URL) return null;
    let payload: JWTPayload;
    try {
      const verified = await jwtVerify(token, supabaseJwks, {
        issuer: `${SUPABASE_URL.replace(/\/$/, '')}/auth/v1`,
        audience: 'authenticated',
      });
      payload = verified.payload;
    } catch {
      return null; // expired, wrong project, malformed — all just "not ours"
    }
    const authSubject = payload.sub;
    if (!authSubject) return null;
    const email =
      typeof payload.email === 'string' ? payload.email : undefined;
    const displayName =
      typeof payload.user_metadata === 'object' &&
      payload.user_metadata !== null &&
      typeof (payload.user_metadata as Record<string, unknown>).full_name ===
        'string'
        ? ((payload.user_metadata as Record<string, unknown>)
            .full_name as string)
        : (email ?? authSubject);
    const user = await this.prisma.adultUser.upsert({
      where: { authSubject },
      create: { authSubject, displayName, email },
      update: { displayName, email },
    });
    return { kind: 'adult', user };
  }

  private async resolveParticipantToken(
    raw: string,
  ): Promise<AuthPrincipal | null> {
    const tokenHash = createHash('sha256').update(raw).digest('hex');
    const token = await this.prisma.participantToken.findUnique({
      where: { tokenHash },
      include: { participant: true },
    });
    if (!token || token.revokedAt) return null;
    if (token.expiresAt && token.expiresAt.getTime() < Date.now()) return null;
    return {
      kind: 'participant',
      participant: token.participant,
      tokenId: token.id,
    };
  }

  async issueParticipantToken(
    participantId: string,
    label?: string,
  ): Promise<string> {
    const raw = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(raw).digest('hex');
    await this.prisma.participantToken.create({
      data: { participantId, tokenHash, label },
    });
    return raw;
  }
}
