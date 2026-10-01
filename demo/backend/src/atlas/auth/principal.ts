import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type {
  AdultUser,
  Participant,
} from '../../generated/prisma/client.js';

export type AuthPrincipal =
  | { kind: 'adult'; user: AdultUser }
  | { kind: 'participant'; participant: Participant; tokenId: string };

export const Principal = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthPrincipal => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { principal: AuthPrincipal }>();
    return request.principal;
  },
);
