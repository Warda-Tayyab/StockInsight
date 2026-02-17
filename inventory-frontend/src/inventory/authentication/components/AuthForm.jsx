/** @module inventory/authentication/components/AuthForm */

import { useState } from 'react';

const AuthForm = ({ mode = 'login', onSubmit }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.({ email, password });
  };

  return (
    <form data-testid="auth-form" onSubmit={handleSubmit} aria-label={mode === 'login' ? 'Login form' : 'Register form'}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">{mode === 'login' ? 'Login' : 'Register'}</button>
    </form>
  );
};

export default AuthForm;
