import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from '@/app/health.controller';
import { CommonModule } from '@/common/common.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { NotificationModule } from '@/modules/notifications/notification.module';
import { ChatModule } from '@/modules/chat/chat.module';

@Module({
  imports: [
    TerminusModule,
    CommonModule,
    AuthModule,
    NotificationModule,
    ChatModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
