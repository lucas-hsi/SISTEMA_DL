'use client';

import { useAuth as useAuthContext } from '@/context/AuthContext';

// Hook simplificado que apenas consome o AuthContext
export const useAuth = () => {
  return useAuthContext();
};

export default useAuth;