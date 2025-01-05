import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: "My App",
  owner: "delsuckahh",
  slug: "prayerloop",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "prayerloop",
  newArchEnabled: true,
  splash: {
    image: "./assets/images/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  updates: {
    fallbackToCacheTimeout: 0
  },
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.yourname.prayerloop.test"
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#FFFFFF"
    },
    package: "com.yourname.prayerloop.test",
  },
  web: {
    favicon: "./assets/favicon.png"
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    apiPort: process.env.EXPO_PUBLIC_API_PORT,
    eas: {
        projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
      }
 
  }
};

export default config;
