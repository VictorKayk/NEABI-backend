import { Express, Router } from 'express';
import { user } from '@/main/routes';

export default (app: Express): void => {
  const router = Router();
  app.use('/api', router);
  user(router);
};
