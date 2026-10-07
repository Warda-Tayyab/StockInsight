/** @module inventory/authentication/routes/AuthRoutes */

import { Routes, Route, Navigate } from 'react-router-dom';
import ActivateAccount from '../pages/ActivationAccount';
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import Login from '../pages/Login';
import Register from '../pages/Register';

const AuthRoutes = () => {
  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route path="activate" element={<ActivateAccount />} />
      <Route path="forgot-password" element={<ForgotPassword />} />
<Route path="reset-password/:token" element={<ResetPassword />} />
      <Route path="register" element={<Register />} />
      <Route path="*" element={<Navigate to="login" replace />} />
    </Routes>
  );
};

export default AuthRoutes;
