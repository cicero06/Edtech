import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AtlasAuthService } from './atlas-auth.service.js';
import type { AuthPrincipal } from './principal.js';

@Injectable()
export class AtlasAuthGuard implements CanActivate {
  constructor(private readonly auth: AtlasAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { principal?: AuthPrincipal }>();
    const principal = await this.auth.resolve(request);
    if (!principal) {
      throw new UnauthorizedException('Authentication required');
    }
    request.principal = principal;
    return true;
  }
}
