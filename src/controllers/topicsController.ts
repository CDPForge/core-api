import { RequestHandler } from 'express';
import { esClient, getIndexPattern, buildBaseQuery, esMapping } from '../utils/elasticHelper';
import { SearchResponse } from '@elastic/elasticsearch/lib/api/types';

//TODO: Implementare la logica per la gestione dei topic