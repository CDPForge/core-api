import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Plugin } from './plugin.model';
import { PluginsService } from './plugins.service';
import { PluginsController } from './plugins.controller';

@Module({
  imports: [SequelizeModule.forFeature([Plugin])],
  providers: [PluginsService],
  controllers: [PluginsController],
  exports: [SequelizeModule], // Esporta il modulo Sequelize per poter utilizzare il modello in altri moduli
})
export class PluginsModule {}
