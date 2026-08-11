import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { login, verifyLoginOtp } from './controllers/authController';
import userRoutes from './routes/userRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import academicYearRoutes from './routes/academicYearRoutes';
import classRoutes from './routes/classRoutes';
import teacherRoutes from './routes/teacherRoutes';
import subjectRoutes from './routes/subjectRoutes';
import termRoutes from './routes/termRoutes';
import classSubjectRoutes from './routes/classSubjectRoutes';
import scoreRoutes from './routes/scoreRoutes';
import studentRoutes from './routes/studentRoutes';
import feeRoutes from './routes/feeRoutes';
import gradeLevelRoutes from './routes/gradeLevelRoutes';
import promotionRuleRoutes from './routes/promotionRuleRoutes';
import promotionRunRoutes from './routes/promotionRunRoutes';
import schoolSettingsRoutes from './routes/schoolSettingsRoutes';
import healthRoutes from './routes/health';
import { globalErrorHandler } from './middlewares/errorHandler';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware configuration
app.use(cors());
app.use(express.json());

// Authentication System Routes
app.post('/api/auth/login', login);
app.post('/api/auth/verify-login-otp', verifyLoginOtp);

// Admin-only user management (create TEACHER/ADMIN/SUPER_ADMIN/STUDENT accounts)
app.use('/api/users', userRoutes);

app.use('/api/dashboard', dashboardRoutes);
app.use('/api/academic-years', academicYearRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/terms', termRoutes);
app.use('/api/class-subjects', classSubjectRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/grade-levels', gradeLevelRoutes);
app.use('/api/promotion-rules', promotionRuleRoutes);
app.use('/api/promotion-runs', promotionRunRoutes);
app.use('/api/school-settings', schoolSettingsRoutes);
app.use('/health', healthRoutes);

app.get('/status', (req, res) => {
  res.status(200).json({
    message: "Welcome to SavannaSMS API backend!",
    documentation: "https://github.com/Aliko2020/savannah_sms"
  });
});

app.use(globalErrorHandler);

app.listen(Number(PORT) || 3000, '0.0.0.0');