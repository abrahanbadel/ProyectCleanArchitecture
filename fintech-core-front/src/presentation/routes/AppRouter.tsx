import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { MainLayout } from '../components/layout/MainLayout';
import { AuthGuard } from './AuthGuard';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { DashboardPage } from '../pages/DashboardPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Páginas públicas de autenticación: pantalla completa, sin navbar */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Rutas Protegidas mediante AuthGuard con Outlet (con navbar) */}
          <Route element={<AuthGuard />}>
            <Route
              path="/dashboard"
              element={
                <MainLayout>
                  <DashboardPage />
                </MainLayout>
              }
            />
          </Route>

          <Route
            path="*"
            element={
              <MainLayout>
                <NotFoundPage />
              </MainLayout>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};
