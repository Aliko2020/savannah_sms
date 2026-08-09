import { Router } from 'express';
import {
  checkPaymentReference,
  getAuditTrail,
  getFeeSummary,
  getPaymentReceipt,
  getStudentFeeDetail,
  listFeeStructures,
  listStudentFees,
  recordPayment,
  sendFeeReminders,
  upsertFeeStructure,
} from '../controllers/feeController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.use(authenticate, authorize('SUPER_ADMIN'));

router.get('/structures', listFeeStructures);
router.put('/structures', upsertFeeStructure);
router.get('/students', listStudentFees);
router.get('/students/:studentId', getStudentFeeDetail);
router.get('/payments/check-reference', checkPaymentReference);
router.post('/payments', recordPayment);
router.get('/payments/:id/receipt', getPaymentReceipt);
router.get('/summary', getFeeSummary);
router.get('/audit-trail', getAuditTrail);
router.post('/reminders', sendFeeReminders);

export default router;
