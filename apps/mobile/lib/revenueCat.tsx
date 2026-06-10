import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesPackage,
} from "react-native-purchases";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/lib/auth";
import { IntegrationError, toIntegrationError } from "@/lib/integrationErrors";
import { createSliceApiClient } from "@/lib/sliceApi";
import {
  REVENUECAT_PACKAGE_IDS,
  isRevenueCatPublicSdkKey,
  packageRefForIdentifier,
  type BillingPeriod,
  type PaidTier,
} from "@/lib/revenueCatUtils";

type PurchaseResult = { cancelled: boolean };

type TierPackages = Partial<Record<BillingPeriod, PurchasesPackage>>;

type RevenueCatContextValue = {
  available: boolean;
  configured: boolean;
  loading: boolean;
  packages: Partial<Record<PaidTier, TierPackages>>;
  error: IntegrationError | null;
  purchase: (tier: PaidTier, period: BillingPeriod) => Promise<PurchaseResult>;
  restore: () => Promise<void>;
  manage: () => Promise<void>;
  refresh: () => Promise<void>;
};

const RevenueCatContext = createContext<RevenueCatContextValue | null>(null);

let sdkConfigured = false;
let configuredUserId: string | null = null;

function platformApiKey() {
  if (Platform.OS === "ios") {
    return (
      process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ??
      process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
    );
  }
  if (Platform.OS === "android") {
    return (
      process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ??
      process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY
    );
  }
  return undefined;
}

function isPreviewEnvironment() {
  return Constants.executionEnvironment === "storeClient";
}

function packageMap(availablePackages: PurchasesPackage[]) {
  return availablePackages.reduce<Partial<Record<PaidTier, TierPackages>>>(
    (result, item) => {
      const ref = packageRefForIdentifier(item.identifier);
      if (ref) {
        const tierPackages = result[ref.tier] ?? {};
        tierPackages[ref.period] = item;
        result[ref.tier] = tierPackages;
      }
      return result;
    },
    {},
  );
}

export function RevenueCatProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [packages, setPackages] = useState<
    Partial<Record<PaidTier, TierPackages>>
  >({});
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [error, setError] = useState<IntegrationError | null>(null);

  const available =
    (Platform.OS === "ios" || Platform.OS === "android") &&
    !isPreviewEnvironment();

  const configureSdk = async () => {
    if (!available) {
      throw new IntegrationError(
        "revenuecat_preview",
        "Real purchases require a development build.",
      );
    }
    if (!user) {
      throw new IntegrationError(
        "revenuecat_not_configured",
        "Sign in before using purchases.",
      );
    }

    const apiKey = platformApiKey()?.trim();
    const platform = Platform.OS === "ios" ? "ios" : "android";
    if (!apiKey || !isRevenueCatPublicSdkKey(platform, apiKey)) {
      throw new IntegrationError(
        "revenuecat_not_configured",
        `Missing or invalid RevenueCat ${platform} public SDK key.`,
      );
    }

    if (!sdkConfigured) {
      Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN);
      Purchases.configure({ apiKey, appUserID: user.id });
      sdkConfigured = true;
      configuredUserId = user.id;
    } else if (configuredUserId !== user.id) {
      await Purchases.logIn(user.id);
      configuredUserId = user.id;
    }
  };

  const syncProfileTier = async () => {
    if (!user) return;
    const api = createSliceApiClient();
    await api.profileUpsert({ revenuecat_app_user_id: user.id });
    await api.syncEntitlements();
    await queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
  };

  const refresh = async () => {
    if (!available) {
      setError(
        new IntegrationError(
          "revenuecat_preview",
          "Real purchases require a development build.",
        ),
      );
      return;
    }
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      await configureSdk();
      const offerings = await Purchases.getOfferings();
      if (!offerings.current) {
        throw new IntegrationError(
          "offering_unavailable",
          "RevenueCat has no current offering.",
        );
      }
      setPackages(packageMap(offerings.current.availablePackages));
      setConfigured(true);
      await syncProfileTier();
    } catch (cause) {
      const nextError = toIntegrationError(
        cause,
        "revenuecat_initialization_failed",
        "Could not load subscription products.",
      );
      setError(nextError);
      setConfigured(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setPackages({});
      setConfigured(false);
      setError(null);
      if (sdkConfigured && configuredUserId) {
        void Purchases.logOut()
          .catch(() => undefined)
          .finally(() => {
            configuredUserId = null;
          });
      }
    }
  }, [user?.id]);

  const purchase = async (
    tier: PaidTier,
    period: BillingPeriod,
  ): Promise<PurchaseResult> => {
    if (!available) {
      throw new IntegrationError(
        "revenuecat_preview",
        "Real purchases require a development build.",
      );
    }
    const selectedPackage = packages[tier]?.[period];
    if (
      !selectedPackage ||
      selectedPackage.identifier !== REVENUECAT_PACKAGE_IDS[tier][period]
    ) {
      throw new IntegrationError(
        "package_unavailable",
        `${tier} (${period}) is not available in the current offering.`,
      );
    }

    try {
      await Purchases.purchasePackage(selectedPackage);
      await syncProfileTier();
      return { cancelled: false };
    } catch (cause) {
      const nextError = toIntegrationError(
        cause,
        "purchase_failed",
        "The purchase could not be completed.",
      );
      if (nextError.cancelled) return { cancelled: true };
      throw nextError;
    }
  };

  const restore = async () => {
    if (!available) {
      throw new IntegrationError(
        "revenuecat_preview",
        "Restore requires a development build.",
      );
    }
    try {
      await configureSdk();
      await Purchases.restorePurchases();
      await syncProfileTier();
    } catch (cause) {
      throw toIntegrationError(
        cause,
        "restore_failed",
        "Purchases could not be restored.",
      );
    }
  };

  const manage = async () => {
    if (!available) {
      throw new IntegrationError(
        "revenuecat_preview",
        "Subscription management requires a development build.",
      );
    }
    let customerInfo: CustomerInfo;
    try {
      await configureSdk();
      customerInfo = await Purchases.getCustomerInfo();
    } catch (cause) {
      throw toIntegrationError(
        cause,
        "customer_info_failed",
        "Could not load subscription details.",
      );
    }
    if (!customerInfo.managementURL) {
      throw new IntegrationError(
        "management_unavailable",
        "No subscription management URL is available.",
      );
    }
    await WebBrowser.openBrowserAsync(customerInfo.managementURL);
  };

  return (
    <RevenueCatContext.Provider
      value={{
        available,
        configured,
        loading,
        packages,
        error,
        purchase,
        restore,
        manage,
        refresh,
      }}
    >
      {children}
    </RevenueCatContext.Provider>
  );
}

export function useRevenueCat() {
  const value = useContext(RevenueCatContext);
  if (!value)
    throw new Error("useRevenueCat must be used inside RevenueCatProvider");
  return value;
}
