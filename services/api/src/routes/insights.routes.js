import { Router } from 'express';
import {
  getHotspotsController,
  getCausesController,
  getRecurringFailuresController
} from '../controllers/insights.controller.js';

const router = Router();

router.get('/hotspots', getHotspotsController);
router.get('/causes', getCausesController);
router.get('/recurring-failures', getRecurringFailuresController);

export default router;
