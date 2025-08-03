/*import { Module } from "@nestjs/common";
import { CacheModule } from "@nestjs/cache-manager";
import { ConfigModule, ConfigService } from "@nestjs/config";
import * as redisStore from "cache-manager-redis-store";

@Module({
  imports: [
    ConfigModule.forRoot(),
    CacheModule.registerAsync({
      isGlobal: true, // Rende il modulo disponibile globalmente
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get<string>("REDIS_HOST"),
        port: configService.get<number>("REDIS_PORT"),
        password: configService.get<string>("REDIS_PASSWORD"),
        ttl: 300, // Durata predefinita della cache in secondi
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [],
  providers: [],
})
export class RedisModule {}*/

import { Module } from "@nestjs/common";
import { CacheModule } from "@nestjs/cache-manager";
import { createKeyv } from "@keyv/redis";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
  imports: [
    ConfigModule.forRoot(),
    CacheModule.registerAsync({
      isGlobal: true, // Rende il modulo disponibile globalmente
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        return {
          stores: [
            createKeyv(
              "redis://:" +
                configService.get<string>("REDIS_PASSWORD") +
                "@" +
                configService.get<string>("REDIS_HOST", "localhost") +
                ":" +
                configService.get<number>("REDIS_PORT", 6379),
            ),
          ],
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class RedisModule {}
