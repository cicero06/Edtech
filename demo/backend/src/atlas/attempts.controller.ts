import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AttemptsService } from './attempts.service.js';
import { AtlasAuthGuard } from './auth/atlas-auth.guard.js';
import { Principal, type AuthPrincipal } from './auth/principal.js';
import { JoinActivityDto, SyncAttemptDto } from './dto/sync.dto.js';

const uuid = () => new ParseUUIDPipe({ version: '4' });

@Controller('v2')
export class JoinController {
  constructor(private readonly attempts: AttemptsService) {}

  /** Public roster entry: joinCode + roster displayName → participant token. */
  @Post('join')
  join(@Body() dto: JoinActivityDto) {
    return this.attempts.join(dto);
  }

  /** Public parent/student report lookup by shareCode (e.g. DNGA-4FA7C8). */
  @Get('reports/:shareCode')
  getPublicReport(@Param('shareCode') shareCode: string) {
    return this.attempts.getPublicReport(shareCode);
  }
}

@Controller('v2/attempts')
@UseGuards(AtlasAuthGuard)
export class AttemptsController {
  constructor(private readonly attempts: AttemptsService) {}

  @Get(':id')
  getAttempt(
    @Principal() principal: AuthPrincipal,
    @Param('id', uuid()) id: string,
  ) {
    return this.attempts.getAttempt(principal, id);
  }

  @Get(':id/events')
  listEvents(
    @Principal() principal: AuthPrincipal,
    @Param('id', uuid()) id: string,
  ) {
    return this.attempts.listEvents(principal, id);
  }

  @Post(':id/sync')
  sync(
    @Principal() principal: AuthPrincipal,
    @Param('id', uuid()) id: string,
    @Body() dto: SyncAttemptDto,
  ) {
    return this.attempts.sync(principal, id, dto);
  }
}
