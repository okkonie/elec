import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    Medium: require('../assets/fonts/SchibstedGrotesk-Medium.ttf'),
    Bold: require('../assets/fonts/SchibstedGrotesk-Bold.ttf'),
    Black: require('../assets/fonts/SchibstedGrotesk-Black.ttf')
  });

  if (loaded) {
    SplashScreen.hideAsync();
  }

  if (!loaded ) {
    return null;
  }

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}