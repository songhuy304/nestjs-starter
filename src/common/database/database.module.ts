import { DatabaseService } from './services/database.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ALL_ENTITIES } from './entities';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],

      useFactory: () => ({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        entities: ALL_ENTITIES,
        autoLoadEntities: true,
        synchronize: false,
        // Postgres local/Docker không có SSL; Supabase/cloud cần SSL
        ssl:
          process.env.APP_ENV === 'local'
            ? false
            : { rejectUnauthorized: false },
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        migrationsRun: false,
        logging: ['error', 'warn'],
        extra: {
          max: 10,
        },
      }),
    }),
  ],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
