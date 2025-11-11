import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: "prayerloop",
  owner: "delsuckahh",
  slug: "prayerloop",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "prayerloop",
  sdkVersion: "53.0.0",
  splash: {
    image: "./assets/images/splash.png",
    resizeMode: "cover",
    backgroundColor: "#90C590"
  },
  updates: {
    fallbackToCacheTimeout: 0
  },
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.prayerloop.app",
    googleServicesFile: "./GoogleService-Info.plist",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#FFFFFF"
    },
    package: "com.prayerloop.app",
  },
  web: {
    favicon: "./assets/favicon.png"
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    apiPort: process.env.EXPO_PUBLIC_API_PORT,
    eas: {
        //projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
        projectId: "fc5504a0-2a5e-4124-a0b0-1a91636e0ff6"
      }
 
  },
  plugins: [
    "expo-router",
    [
      "expo-build-properties",
      {
        ios: {
          useFrameworks: "dynamic"
        }
      }
    ],
    "@react-native-firebase/app",
    [
      "@react-native-firebase/messaging",
      {

      }
    ],
    [
      "expo-notifications",
      {
        icon: "./assets/images/notification-icon.png",
        color: "#90c590",
        defaultChannel: "default",
        iosDisplayInForeground: true
      }
    ]
  ]
};

export default config;
