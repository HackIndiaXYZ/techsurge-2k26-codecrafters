import { Router } from 'express';
import {
  getHotspotsController,
  getCausesController,
  getRecurringFailuresController,
  getSummaryController
} from '../controllers/insights.controller.js';

const router = Router();

router.get('/hotspots', getHotspotsController);
router.get('/causes', getCausesController);
router.get('/recurring-failures', getRecurringFailuresController);
router.get('/summary', getSummaryController);

export default router;
