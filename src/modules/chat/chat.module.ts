import { HelperModule } from '@/common/helper/helper.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [HelperModule],
  providers: [],
})
export class ChatModule {}
