import { Router } from 'express';
import { createUser, listUsers } from '../controllers/userController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

// GET /api/users?role=ADMIN,SUPER_ADMIN — list users, optionally filtered by role.
router.get('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), listUsers);

// POST /api/users — create a TEACHER/ADMIN/SUPER_ADMIN/STUDENT account.
// Restricted to already-authenticated ADMIN/SUPER_ADMIN users.
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), createUser);

export default router;
