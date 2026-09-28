module.exports = {
  expo: {
    name: "خطوة • Daily Bloom",
    slug: "daily-bloom",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "dark",
    scheme: "dailybloom",
    ios: {
      bundleIdentifier: "com.andrew.dailybloom",
      supportsTablet: true,
      googleServicesFile:
        process.env.GOOGLE_SERVICES_PLIST || "./GoogleService-Info.plist",
    },
    android: {
      package: "com.andrew.dailybloom",
      googleServicesFile:
        process.env.GOOGLE_SERVICES_JSON || "./google-services.json",
    },
    plugins: [
      "@react-native-firebase/app",
      "@react-native-firebase/auth",
      "expo-font",
      ["expo-build-properties", { ios: { useFrameworks: "static" } }],
    ],
    extra: {
      eas: {
        projectId:
          process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
          "REPLACE_WITH_EAS_PROJECT_ID",
      },
    },
  },
};
