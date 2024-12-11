import { Text } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

export default function UserProfile() {
  const user = useSelector((state: RootState) => state.auth.user);

  return (
    <>
      <Text>userProfile page</Text>
      {user && (
        <>
          <Text>Token: {user.token}</Text>
          <Text>User Profile Id: {user.userProfileId}</Text>
          <Text>Username: {user.username}</Text>
          <Text>Email: {user.email}</Text>
          <Text>First Name: {user.firstName}</Text>
          <Text>Last Name: {user.lastName}</Text>
        </>
      )}
    </>
  );
}
