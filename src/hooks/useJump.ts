import { useContext } from 'react';
import { JumpContext, JumpActionsContext } from '../contexts/jumpShared';

/** Full context – re-renders when isVisible changes. Use in JumpToBottom. */
export const useJump = () => {
  const context = useContext(JumpContext);
  if (!context) throw new Error('useJump must be used inside JumpProvider');
  return context;
};

/** Only ref + setters – stable, no re-renders on scroll. Use in MessageList. */
export const useJumpActions = () => {
  const context = useContext(JumpActionsContext);
  if (!context)
    throw new Error('useJumpActions must be used inside JumpProvider');
  return context;
};
