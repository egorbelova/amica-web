import { useContext } from 'react';
import { JumpContext } from '../contexts/jumpShared';

export const useJump = () => {
  const context = useContext(JumpContext);
  if (!context) throw new Error('useJump must be used inside JumpProvider');
  return context;
};
