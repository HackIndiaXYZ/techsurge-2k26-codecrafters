import { z } from 'zod';
import { createInvestigationCase, getInvestigations, updateInvestigationState } from '../services/investigationsService.js';

const createCaseSchema = z.object({
  transactionRef: z.string().min(1),
});

const updateCaseSchema = z.object({
  action: z.enum([
    'START_REVIEW',
    'REQUEST_AUTHORIZATION',
    'AUTHORIZE_REFERRAL',
    'ACKNOWLEDGE_REFERRAL',
    'CLOSE_CASE'
  ]),
}).strict();

export async function handleCreateCase(req, res, next) {
  try {
    const parsed = createCaseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        errors: parsed.error.format(),
      });
    }

    const result = await createInvestigationCase(parsed.data);
    res.status(201).json(result);
  } catch (error) {
    if (error.code) {
      return res.status(400).json({ code: error.code, message: error.message });
    }
    next(error);
  }
}

export async function handleGetCases(req, res, next) {
  try {
    // Optionally accept filtering by status or transactionRef in query
    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.transactionRef) filters.transactionRef = req.query.transactionRef;

    const cases = await getInvestigations(filters);
    res.status(200).json({ cases });
  } catch (error) {
    next(error);
  }
}

export async function handleUpdateCase(req, res, next) {
  try {
    const { caseId } = req.params;
    const parsed = updateCaseSchema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        errors: parsed.error.format(),
      });
    }

    const result = await updateInvestigationState(caseId, parsed.data.action);
    res.status(200).json(result);
  } catch (error) {
    if (error.code) {
      // Return 404 for NOT_FOUND
      if (error.code === 'NOT_FOUND') {
        return res.status(404).json({ code: error.code, message: error.message });
      }
      return res.status(400).json({ code: error.code, message: error.message });
    }
    next(error);
  }
}
