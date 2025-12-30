import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '@/pages/LoginPage';
import { BiDashboard } from '@/pages/BiDashboard';
import { FormBuilderLayout } from '@/components/admin/FormBuilder/FormBuilderLayout';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProfilePage } from '@/pages/ProfilePage';
import { UsersPage } from '@/pages/UsersPage';
import { Toaster } from "@/components/ui/sonner"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected Routes wrapped in AppLayout */}
        <Route element={<AppLayout />}>
             <Route path="/admin/forms" element={<FormBuilderLayout />} />
             <Route path="/admin/users" element={<UsersPage />} />
             <Route path="/bi" element={<BiDashboard />} />
             <Route path="/profile" element={<ProfilePage />} />
        </Route>

        <Route path="/" element={<Navigate to="/admin/forms" replace />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  )
}

export default App
