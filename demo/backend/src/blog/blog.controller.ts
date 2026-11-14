import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AtlasAuthGuard } from '../atlas/auth/atlas-auth.guard.js';
import { Principal, type AuthPrincipal } from '../atlas/auth/principal.js';
import type { AdultUser } from '../firebase/models.js';
import { BlogService } from './blog.service.js';
import { UpsertBlogPostDto } from './dto.js';

function asAdult(principal: AuthPrincipal): AdultUser {
  if (principal.kind !== 'adult') {
    throw new ForbiddenException('Author sign-in required');
  }
  return principal.user;
}

@Controller('v2/blog')
export class BlogController {
  constructor(private readonly blog: BlogService) {}

  // ---------- public ----------
  @Get('posts')
  listPublished() {
    return this.blog.listPublished();
  }

  @Get('posts/:slug')
  getPublished(@Param('slug') slug: string) {
    return this.blog.getPublished(slug);
  }

  // ---------- author area ----------
  @Get('mine')
  @UseGuards(AtlasAuthGuard)
  listMine(@Principal() principal: AuthPrincipal) {
    return this.blog.listMine(asAdult(principal));
  }

  @Post('posts')
  @UseGuards(AtlasAuthGuard)
  create(
    @Principal() principal: AuthPrincipal,
    @Body() dto: UpsertBlogPostDto,
  ) {
    return this.blog.create(asAdult(principal), dto);
  }

  @Patch('posts/:id')
  @UseGuards(AtlasAuthGuard)
  update(
    @Principal() principal: AuthPrincipal,
    @Param('id') id: string,
    @Body() dto: UpsertBlogPostDto,
  ) {
    return this.blog.update(asAdult(principal), id, dto);
  }

  @Post('posts/:id/publish')
  @UseGuards(AtlasAuthGuard)
  publish(@Principal() principal: AuthPrincipal, @Param('id') id: string) {
    return this.blog.publish(asAdult(principal), id);
  }
}
