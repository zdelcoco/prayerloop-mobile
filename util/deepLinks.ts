import * as Linking from 'expo-linking';

/**
 * Generates a deep link URL for joining a group
 * @param inviteCode The group invite code (format: XXXX-XXXX)
 * @returns Deep link URL that opens the app to the join group flow
 */
export const generateGroupInviteLink = (inviteCode: string): string => {
  return Linking.createURL('join-group', {
    queryParams: { code: inviteCode },
  });
};

/**
 * Parses a group invite code from a deep link URL
 * @param url The deep link URL
 * @returns The invite code if found, undefined otherwise
 */
export const parseGroupInviteLink = (url: string): string | undefined => {
  const { queryParams } = Linking.parse(url);
  return queryParams?.code as string | undefined;
};
