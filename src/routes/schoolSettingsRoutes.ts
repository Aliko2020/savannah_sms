import { Router } from 'express';
import { getSchoolSettings, updateSchoolSettings } from '../controllers/schoolSettingsController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

// Readable by any authenticated user — report cards and score sheets across
// every role (teacher, admin) need the letterhead to render.
router.get('/', authenticate, getSchoolSettings);
router.put('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), updateSchoolSettings);

export default router;
