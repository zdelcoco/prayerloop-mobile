import { User } from './shared.types';

export const formatGroupMembersString = (users: User[]): string => {
  if (!users || users.length === 0) {
    return 'No members';
  }
  
  const memberNames = users.map(user => user.firstName);
  return memberNames.join(', ');
};