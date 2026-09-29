module.exports = {
  expo: {
    name: "خطوات",
    slug: "daily-bloom",
    version: "1.0.0",
    icon: "./logo.png",
    splash: {
      image: "./logo.png",
      resizeMode: "contain",
      backgroundColor: "#0B1017",
    },
    orientation: "portrait",
    userInterfaceStyle: "dark",
    scheme: "dailybloom",
    ios: {
      bundleIdentifier: "com.andrew.dailybloom",
      supportsTablet: true,
      infoPlist: { ITSAppUsesNonExemptEncryption: false },
      googleServicesFile:
        process.env.GOOGLE_SERVICES_PLIST || "./GoogleService-Info.plist",
    },
    android: {
      package: "com.andrew.dailybloom",
      permissions: ["android.permission.POST_NOTIFICATIONS"],
      googleServicesFile:
        process.env.GOOGLE_SERVICES_JSON || "./google-services.json",
    },
    plugins: [
      "@react-native-firebase/app",
      "@react-native-firebase/auth",
      "expo-font",
      "./plugins/withTimerIcon",
      ["expo-build-properties", {
        ios: { useFrameworks: "static" },
        android: {
          extraMavenRepos: [require("node:url").pathToFileURL(
            require("node:path").join(__dirname, "node_modules/@notifee/react-native/android/libs")
          ).href],
        },
      }],
    ],
    extra: {
      eas: {
        projectId: "7f26d4cb-21f6-49f7-bd6d-b106b0f4571b",
      },
    },
  },
};
