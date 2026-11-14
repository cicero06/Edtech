import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { FirebaseModule } from './firebase/firebase.module.js';
import { SessionsModule } from './sessions/sessions.module.js';
import { AtlasModule } from './atlas/atlas.module.js';
import { BlogModule } from './blog/blog.module.js';

@Module({
  imports: [FirebaseModule, SessionsModule, AtlasModule, BlogModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
