import { HelperModule } from '@/common/helper/helper.module';
import { Module } from '@nestjs/common';
import { UserModule } from '../users/user.module';
import { ChatGateway } from './gateways/chat.gateway';

@Module({
  imports: [HelperModule, UserModule],
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class ChatModule {}
