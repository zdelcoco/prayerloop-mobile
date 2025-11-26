import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: "prayerloop",
  owner: "delsuckahh",
  slug: "prayerloop",
  version: "2025.11.4",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "prayerloop",
  sdkVersion: "53.0.0",
  backgroundColor: "#90C590",
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
    supportsTablet: false,
    bundleIdentifier: "com.prayerloop.app",
    buildNumber: "2",
    googleServicesFile: "./GoogleService-Info.plist",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false
    },
    backgroundColor: "#90C590"
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#90C590"
    },
    package: "com.prayerloop.app",
    versionCode: 1,
    backgroundColor: "#90C590"
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
