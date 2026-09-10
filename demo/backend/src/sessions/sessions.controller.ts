import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto.js';
import { CreateSessionDto } from './dto/create-session.dto.js';
import { SessionsService } from './sessions.service.js';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  create(@Body() dto: CreateSessionDto) {
    return this.sessionsService.create(dto.scenarioId);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.sessionsService.findOne(id);
  }

  @Post(':id/events')
  addEvent(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: CreateEventDto,
  ) {
    return this.sessionsService.addEvent(id, dto);
  }

  @Get(':id/events')
  findEvents(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.sessionsService.findEvents(id);
  }

  @Get(':id/summary')
  summary(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.sessionsService.summary(id);
  }
}
