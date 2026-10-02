import { Module } from '@nestjs/common';
import { AtlasModule } from '../atlas/atlas.module.js';
import { BlogController } from './blog.controller.js';
import { BlogService } from './blog.service.js';

@Module({
  imports: [AtlasModule],
  controllers: [BlogController],
  providers: [BlogService],
})
export class BlogModule {}
