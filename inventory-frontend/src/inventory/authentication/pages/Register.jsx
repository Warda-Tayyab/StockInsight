/** @module inventory/authentication/pages/Register */

import AuthForm from '../components/AuthForm';

const Register = () => {
  return (
    <div data-testid="register-page">
      <h1>Register</h1>
      <AuthForm mode="register" />
    </div>
  );
};

export default Register;
