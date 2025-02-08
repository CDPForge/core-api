import path from 'path';
import Config from './config';
import { Sequelize } from 'sequelize-typescript';

const sequelize = new Sequelize(Config.getInstance().config.mysqlConfig.uri,{models: [path.join(__dirname, './models')]});