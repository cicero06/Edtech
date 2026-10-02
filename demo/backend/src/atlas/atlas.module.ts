import { Module } from '@nestjs/common';
import { AccessService } from './auth/access.service.js';
import { AtlasAuthGuard } from './auth/atlas-auth.guard.js';
import { AtlasAuthService } from './auth/atlas-auth.service.js';
import { AttemptsService } from './attempts.service.js';
import { AttemptsController, JoinController } from './attempts.controller.js';
import { ManagementController } from './management.controller.js';
import { ManagementService } from './management.service.js';

@Module({
  controllers: [ManagementController, AttemptsController, JoinController],
  providers: [
    AtlasAuthService,
    AtlasAuthGuard,
    AccessService,
    ManagementService,
    AttemptsService,
  ],
  exports: [AtlasAuthService, AtlasAuthGuard],
})
export class AtlasModule {}
