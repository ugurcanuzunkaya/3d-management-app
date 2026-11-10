import React from 'react';
import { PrivacyContext, usePrivacyController } from './PrivacyContext';

export const PrivacyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value = usePrivacyController();
  return <PrivacyContext.Provider value={value}>{children}</PrivacyContext.Provider>;
};
