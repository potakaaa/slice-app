const APP_NAME = "SLICE - Debt Resolution App";
const DEFAULT_PRODUCTION_ORIGIN = "https://slice.marcfeinberg.com";
const env = process["env"];

const buildProfile = env["EAS_BUILD_PROFILE"];
const appVariant = env["APP_VARIANT"];
const isDevelopmentBuild = buildProfile === "development" || appVariant === "development";
const isProductionLike = buildProfile === "preview" || buildProfile === "production" || appVariant === "production";

const routerOrigin = isProductionLike
  ? env["EXPO_PUBLIC_APP_ORIGIN"] || DEFAULT_PRODUCTION_ORIGIN
  : env["EXPO_PUBLIC_APP_ORIGIN"] || "https://replit.com";

const plugins = [
  [
    "expo-router",
    {
      origin: routerOrigin,
    },
  ],
  "expo-font",
  "expo-web-browser",
];

if (isDevelopmentBuild) {
  plugins.push("expo-dev-client");
}

module.exports = {
  expo: {
    name: APP_NAME,
    slug: "slice",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "slice",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#FFFFFF",
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.slice.debtresolution",
      buildNumber: env["IOS_BUILD_NUMBER"] || "1",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
      privacyManifests: {
        NSPrivacyTracking: false,
        NSPrivacyCollectedDataTypes: [
          {
            NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeName",
            NSPrivacyCollectedDataTypeLinked: true,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: [
              "NSPrivacyCollectedDataTypePurposeAppFunctionality",
            ],
          },
          {
            NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeEmailAddress",
            NSPrivacyCollectedDataTypeLinked: true,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: [
              "NSPrivacyCollectedDataTypePurposeAppFunctionality",
            ],
          },
          {
            NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeUserID",
            NSPrivacyCollectedDataTypeLinked: true,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: [
              "NSPrivacyCollectedDataTypePurposeAppFunctionality",
            ],
          },
          {
            NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypePurchaseHistory",
            NSPrivacyCollectedDataTypeLinked: true,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: [
              "NSPrivacyCollectedDataTypePurposeAppFunctionality",
            ],
          },
          {
            NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeOtherFinancialInfo",
            NSPrivacyCollectedDataTypeLinked: true,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: [
              "NSPrivacyCollectedDataTypePurposeAppFunctionality",
            ],
          },
          {
            NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeProductInteraction",
            NSPrivacyCollectedDataTypeLinked: true,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: [
              "NSPrivacyCollectedDataTypePurposeAppFunctionality",
            ],
          },
        ],
        NSPrivacyAccessedAPITypes: [],
      },
    },
    android: {
      package: "com.slice.debtresolution",
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#FFFFFF",
      },
    },
    web: {
      favicon: "./assets/images/favicon.png",
    },
    plugins,
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      appVariant: appVariant || buildProfile || "local",
      eas: {
        projectId: env["EAS_PROJECT_ID"] || "6c33f5c1-c918-4138-86f9-d9fe48a47c45",
      },
    },
  },
};
