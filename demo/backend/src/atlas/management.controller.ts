import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { AdultUser } from '../firebase/models.js';
import { AtlasAuthGuard } from './auth/atlas-auth.guard.js';
import { Principal, type AuthPrincipal } from './auth/principal.js';
import { ManagementService } from './management.service.js';
import {
  CreateActivityDto,
  CreateGroupDto,
  CreateParticipantDto,
  CreateWorkspaceDto,
} from './dto/management.dto.js';

function asAdult(principal: AuthPrincipal): AdultUser {
  if (principal.kind !== 'adult') {
    throw new ForbiddenException('Staff access required');
  }
  return principal.user;
}

const uuid = () => new ParseUUIDPipe({ version: '4' });

@Controller('v2')
@UseGuards(AtlasAuthGuard)
export class ManagementController {
  constructor(private readonly management: ManagementService) {}

  @Post('workspaces')
  createWorkspace(
    @Principal() principal: AuthPrincipal,
    @Body() dto: CreateWorkspaceDto,
  ) {
    return this.management.createWorkspace(asAdult(principal), dto);
  }

  @Get('workspaces')
  listWorkspaces(@Principal() principal: AuthPrincipal) {
    return this.management.listWorkspaces(asAdult(principal));
  }

  @Get('workspaces/:id/groups')
  listGroups(
    @Principal() principal: AuthPrincipal,
    @Param('id', uuid()) id: string,
  ) {
    return this.management.listGroups(asAdult(principal), id);
  }

  @Post('workspaces/:id/groups')
  createGroup(
    @Principal() principal: AuthPrincipal,
    @Param('id', uuid()) id: string,
    @Body() dto: CreateGroupDto,
  ) {
    return this.management.createGroup(asAdult(principal), id, dto);
  }

  @Get('groups/:id')
  getGroup(
    @Principal() principal: AuthPrincipal,
    @Param('id', uuid()) id: string,
  ) {
    return this.management.getGroup(asAdult(principal), id);
  }

  @Delete('workspaces/:workspaceId/groups/:groupId')
  deleteGroup(
    @Principal() principal: AuthPrincipal,
    @Param('workspaceId', uuid()) workspaceId: string,
    @Param('groupId', uuid()) groupId: string,
  ) {
    return this.management.deleteGroup(
      asAdult(principal),
      workspaceId,
      groupId,
    );
  }

  @Post('groups/:id/participants')
  addParticipant(
    @Principal() principal: AuthPrincipal,
    @Param('id', uuid()) id: string,
    @Body() dto: CreateParticipantDto,
  ) {
    return this.management.addParticipant(asAdult(principal), id, dto);
  }

  @Delete('groups/:groupId/participants/:participantId')
  deleteParticipant(
    @Principal() principal: AuthPrincipal,
    @Param('groupId', uuid()) groupId: string,
    @Param('participantId', uuid()) participantId: string,
  ) {
    return this.management.deleteParticipant(
      asAdult(principal),
      groupId,
      participantId,
    );
  }

  @Get('participants/:participantId/report')
  getParticipantReport(
    @Principal() principal: AuthPrincipal,
    @Param('participantId', uuid()) participantId: string,
  ) {
    return this.management.getParticipantReport(
      asAdult(principal),
      participantId,
    );
  }

  @Post('groups/:id/activities')
  createActivity(
    @Principal() principal: AuthPrincipal,
    @Param('id', uuid()) id: string,
    @Body() dto: CreateActivityDto,
  ) {
    return this.management.createActivity(asAdult(principal), id, dto);
  }

  @Post('activities/:id/open')
  openActivity(
    @Principal() principal: AuthPrincipal,
    @Param('id', uuid()) id: string,
  ) {
    return this.management.setActivityStatus(asAdult(principal), id, 'open');
  }

  @Post('activities/:id/close')
  closeActivity(
    @Principal() principal: AuthPrincipal,
    @Param('id', uuid()) id: string,
  ) {
    return this.management.setActivityStatus(asAdult(principal), id, 'close');
  }

  @Get('activities/:id')
  getActivity(
    @Principal() principal: AuthPrincipal,
    @Param('id', uuid()) id: string,
  ) {
    return this.management.getActivity(asAdult(principal), id);
  }
}
