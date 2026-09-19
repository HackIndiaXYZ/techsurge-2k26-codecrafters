import { z } from 'zod';
import { getHotspots, getCauses, getRecurringFailures, getSummary } from '../services/aggregationService.js';

const filterSchema = z.object({
  state: z.string().optional(),
  district: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export async function getHotspotsController(req, res, next) {
  try {
    const filters = filterSchema.parse(req.query);
    const result = await getHotspots(filters);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters', details: error.errors });
    }
    next(error);
  }
}

export async function getCausesController(req, res, next) {
  try {
    const filters = filterSchema.parse(req.query);
    const result = await getCauses(filters);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters', details: error.errors });
    }
    next(error);
  }
}

export async function getRecurringFailuresController(req, res, next) {
  try {
    const filters = filterSchema.parse(req.query);
    const result = await getRecurringFailures(filters);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters', details: error.errors });
    }
    next(error);
  }
}

export async function getSummaryController(req, res, next) {
  try {
    const filters = filterSchema.parse(req.query);
    const result = await getSummary(filters);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters', details: error.errors });
    }
    next(error);
  }
}
