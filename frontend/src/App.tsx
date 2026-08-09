import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { TooltipProvider } from './components/ui/Tooltip';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/Login';
import { ForgotPasswordPage } from './pages/ForgotPassword';
import { DashboardPage } from './pages/Dashboard';
import { AcademicSetupPage } from './pages/AcademicSetup';
import { ClassSubjectsPage } from './pages/ClassSubjects';
import { SubjectSetupPage } from './pages/SubjectSetup';
import { TeachersListPage } from './pages/TeachersList';
import { TeacherProfilePage } from './pages/TeacherProfile';
import { ClassListPage } from './pages/ClassList';
import { GradeEntryPage } from './pages/GradeEntry';
import { ClassAssessmentReportPage } from './pages/ClassAssessmentReport';
import { StudentsListPage } from './pages/StudentsList';
import { StudentProfilePage } from './pages/StudentProfile';
import { ReportCardPage } from './pages/ReportCard';
import { BulkReportCardsPage } from './pages/BulkReportCards';
import { ScoreSheetPage } from './pages/ScoreSheet';
import { SchoolSettingsPage } from './pages/SchoolSettings';
import { FeeSetupPage } from './pages/FeeSetup';
import { PromotionSetupPage } from './pages/PromotionSetup';
import { PromotionRunsPage } from './pages/PromotionRuns';
import { PromotionRunDetailPage } from './pages/PromotionRunDetail';
import { FeeManagementPage } from './pages/FeeManagement';
import { FeeStudentDetailPage } from './pages/FeeStudentDetail';
import { DesignSystemPage } from './pages/DesignSystem';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/classes"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                  <AcademicSetupPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/classes/:classId/subjects"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                  <ClassSubjectsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/subjects"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                  <SubjectSetupPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/students"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                  <StudentsListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/students/:id"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                  <StudentProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/students/:id/report-card"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN', 'TEACHER']}>
                  <ReportCardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/report-cards"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                  <BulkReportCardsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/score-sheet"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                  <ScoreSheetPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/school"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                  <SchoolSettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teachers"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                  <TeachersListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teachers/me"
              element={
                <ProtectedRoute allowedRoles={['TEACHER']}>
                  <TeacherProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teachers/class-list"
              element={
                <ProtectedRoute allowedRoles={['TEACHER']}>
                  <ClassListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teachers/assessment/entry"
              element={
                <ProtectedRoute allowedRoles={['TEACHER']}>
                  <GradeEntryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teachers/assessment/view"
              element={
                <ProtectedRoute allowedRoles={['TEACHER']}>
                  <ClassAssessmentReportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teachers/:id"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                  <TeacherProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/fees"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <FeeManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/fees/setup"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <FeeSetupPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/promotion-setup"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <PromotionSetupPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/promotion-runs"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <PromotionRunsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/promotion-runs/:id"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <PromotionRunDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/fees/students/:id"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <FeeStudentDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/design-system"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <DesignSystemPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
        <ToastContainer position="top-right" autoClose={3000} newestOnTop />
      </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
