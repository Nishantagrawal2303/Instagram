import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { OtpModule } from './otp/otp.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { PostModule } from './post/post.module';
import { FollowModule } from './follow/follow.module';
import { LikeModule } from './like/like.module';
import { CommentModule } from './comment/comment.module';
import { ChatModule } from './chat/chat.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isSsl =
          configService.get<string>('DB_SSL') === 'true' ||
          Boolean(configService.get<string>('DB_HOST')?.includes('supabase.com'));

        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST'),
          port: parseInt(configService.get<string>('DB_PORT') || '5432', 10),
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_NAME'),
          autoLoadEntities: true,
          synchronize: true,
          ssl: isSsl ? { rejectUnauthorized: false } : false,
        };
      },
    }),

    UserModule,

    AuthModule,

    MailModule,

    OtpModule,

    CloudinaryModule,

    PostModule,

    FollowModule,

    LikeModule,

    CommentModule,

    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }