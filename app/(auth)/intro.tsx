import { useRouter } from 'expo-router';

import IntroView from '../../components/ui/IntroView';

export default function Intro() {
  const router = useRouter();

  function onPressHandler() {
    router.navigate('./login');
  }

  return (
    <IntroView onPress={onPressHandler}/>
  );
}

