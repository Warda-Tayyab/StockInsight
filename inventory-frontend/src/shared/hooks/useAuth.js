/** @module shared/hooks/useAuth */

import { useAuthContext } from '../context/AuthContext';

const useAuth = () => {
  return useAuthContext();
};

export default useAuth;
