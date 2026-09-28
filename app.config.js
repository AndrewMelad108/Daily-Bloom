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
        projectId: "7f26d4cb-21f6-49f7-bd6d-b106b0f4571b",
      },
    },
  },
};
