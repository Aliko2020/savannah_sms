import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/Login';
import { ForgotPasswordPage } from './pages/ForgotPassword';
import { DashboardPage } from './pages/Dashboard';
import { CreateUserPage } from './pages/CreateUser';
import { AcademicSetupPage } from './pages/AcademicSetup';
import { SubjectSetupPage } from './pages/SubjectSetup';
import { TeachersListPage } from './pages/TeachersList';
import { TeacherProfilePage } from './pages/TeacherProfile';
import { ClassListPage } from './pages/ClassList';
import { ClassAssessmentPage } from './pages/ClassAssessment';
import { ExamAssessmentPage } from './pages/ExamAssessment';
import { ClassAssessmentReportPage } from './pages/ClassAssessmentReport';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
              path="/users/new"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                  <CreateUserPage />
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
              path="/subjects"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                  <SubjectSetupPage />
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
              path="/teachers/assessment/class"
              element={
                <ProtectedRoute allowedRoles={['TEACHER']}>
                  <ClassAssessmentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teachers/assessment/exam"
              element={
                <ProtectedRoute allowedRoles={['TEACHER']}>
                  <ExamAssessmentPage />
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
          </Routes>
        </BrowserRouter>
        <ToastContainer position="top-right" autoClose={3000} newestOnTop />
      </AuthProvider>
    </QueryClientProvider>
  );
}
