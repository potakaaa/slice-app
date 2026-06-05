import React from "react";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

// ---------------------------------------------------------------------------
// TODO LIST — replace every placeholder before publishing:
//   1.  EFFECTIVE_DATE       e.g. "June 10, 2026"
//   2.  CONTACT_EMAIL        e.g. "slice.cares@slice.com"
//   3.  WEBSITE_URL          e.g. "https://slice.com"
//   4.  LEGAL_BUSINESS_NAME  e.g. "Slice Technologies LLC"
//   5.  MAILING_ADDRESS      e.g. "123 Main St, Los Angeles, CA 90001"
// ---------------------------------------------------------------------------
const EFFECTIVE_DATE = "[TODO: Date of Publish]";
const CONTACT_EMAIL = "slice.cares@slice.com"; // TODO: confirm email
const WEBSITE_URL = "slice.com"; // TODO: confirm URL
const LEGAL_BUSINESS_NAME = "[TODO: Legal Business Name]";
const MAILING_ADDRESS = "[TODO: Business Mailing Address]";

interface Section {
  heading?: string;
  subheading?: string;
  body?: string;
  bullets?: string[];
}

const SECTIONS: Section[] = [
  {
    body: `SLICE ("SLICE," "we," "us," or "our") respects your privacy. This Privacy Policy explains how we collect, use, store, and protect information when you use the SLICE mobile app, website, services, coaching features, AI tools, subscription features, and related support services.\n\nSLICE is designed for users in the United States who want help organizing debt information, planning settlement goals, tracking savings, preparing negotiation scripts, and accessing educational debt resolution guidance.\n\nBy using SLICE, you agree to the practices described in this Privacy Policy.`,
  },
  {
    heading: "1. Information We Collect",
    subheading: "A. Account and Contact Information",
    body: "When you create an account or use SLICE, we may collect:",
    bullets: [
      "First and last name",
      "Email address",
      "Phone number",
      "Mailing address",
      "City, state, and ZIP code",
      "Login or account credentials",
      "Subscription tier",
      "Referral code, if applicable",
    ],
  },
  {
    subheading: "B. Debt and Financial Planning Information",
    body: "SLICE allows you to manually enter information to create a customized debt program. This may include:",
    bullets: [
      "Total debt amount",
      "Creditor names and phone numbers",
      "Amount owed per creditor",
      "Settlement target percentages",
      "Monthly savings amount",
      "Budget information",
      "Credit score input",
      "Creditor notes and settlement progress",
      "Call preparation notes",
    ],
  },
  {
    body: "SLICE does not connect to your bank account or automatically pull your credit report unless we clearly add and disclose that feature in the future.",
  },
  {
    subheading: "C. AI Coach and Negotiation Script Information",
    body: "If you use AI features such as Zest AI Debt Coach, negotiation strategy suggestions, or customized call scripts, we may collect:",
    bullets: [
      "Messages you send to the AI coach",
      "AI-generated responses",
      "Creditor and debt information needed to personalize responses",
      "Selected script tone or negotiation preferences",
      "Chat history and related app activity",
    ],
  },
  {
    body: "AI features may use third-party AI providers through a secure backend system. We do not allow AI providers to directly access your full account unless needed to provide the requested AI feature.",
  },
  {
    subheading: "D. Coaching and Booking Information",
    body: "If you book coaching or founder coaching with Marc Feinberg, we may collect:",
    bullets: [
      "Booking date and time",
      "Selected coaching topic",
      "Notes or questions submitted before the session",
      "Relevant debt summary information",
      "Session status and communication preferences",
    ],
  },
  {
    subheading: "E. Subscription and Payment Information",
    body: "Payments are processed through Apple App Store, Google Play, RevenueCat, or another authorized provider. We do not store your full credit card number. We may receive limited subscription-related information such as:",
    bullets: [
      "Subscription tier and purchase status",
      "Renewal and expiration date",
      "Transaction identifier or entitlement status",
    ],
  },
  {
    subheading: "F. Device, Usage, and Technical Information",
    body: "We may collect basic technical information such as:",
    bullets: [
      "Device type and operating system",
      "App version",
      "Crash logs and performance data",
      "Feature usage",
      "General location based on IP address",
      "Push notification preferences",
    ],
  },
  {
    heading: "2. How We Use Your Information",
    body: "We use your information to:",
    bullets: [
      "Create and manage your SLICE account",
      "Build your customized debt program",
      "Calculate settlement targets and program length",
      "Track creditor information and debt progress",
      "Provide AI negotiation strategies and scripts",
      "Process subscriptions and premium access",
      "Book coaching sessions",
      "Send reminders, confirmations, and support messages",
      "Improve app performance and user experience",
      "Prevent fraud and unauthorized access",
      "Comply with legal obligations",
    ],
  },
  {
    body: "SLICE is an educational and planning tool. SLICE does not guarantee debt settlement results, creditor acceptance, credit score improvement, or financial outcomes.",
  },
  {
    heading: "3. How We Share Information",
    body: "We do not sell your personal information.\n\nWe may share limited information with trusted service providers only when needed to operate SLICE, including cloud hosting, authentication, AI service providers, payment processors, analytics, email/push notification providers, and professional coaches when you request coaching.\n\nWe may also share information when required to comply with law, court orders, or to protect the rights, safety, and security of SLICE, users, or others.",
  },
  {
    heading: "4. AI Feature Notice",
    body: "AI-generated responses may be inaccurate, incomplete, or not appropriate for every situation. AI responses are for informational and educational purposes only and should not be treated as legal, tax, credit, or financial advice.\n\nDo not enter highly sensitive information into AI chat unless necessary. Do not enter Social Security numbers, full bank account numbers, full credit card numbers, or other highly sensitive identifiers.",
  },
  {
    heading: "5. Data Security",
    body: "We use reasonable administrative, technical, and organizational safeguards to protect your information, including secure authentication, encrypted transmission where available, restricted access controls, and secure storage practices.\n\nHowever, no app, website, or internet transmission is 100% secure. You are responsible for keeping your login credentials secure.",
  },
  {
    heading: "6. Data Retention",
    body: `We keep your information for as long as needed to provide SLICE, comply with legal obligations, resolve disputes, and enforce agreements.\n\nYou may request deletion of your account and associated personal information by contacting us at: ${CONTACT_EMAIL}\n\nSome information may be retained if required by law, for fraud prevention, security, or dispute resolution.`,
  },
  {
    heading: "7. Your Privacy Choices",
    body: "Depending on where you live, you may have rights to access, correct, delete, or receive a copy of your personal information, opt out of certain communications, or withdraw consent where applicable.\n\nTo make a request, contact us at: " + CONTACT_EMAIL + "\n\nWe may need to verify your identity before completing your request.",
  },
  {
    heading: "8. Push Notifications and Communications",
    body: "SLICE may send reminders, app updates, coaching confirmations, subscription notices, or debt program reminders. You can control push notifications through your device settings. You may unsubscribe from promotional emails using the unsubscribe link in the email.\n\nWe may still send important non-promotional messages related to your account, purchases, or security.",
  },
  {
    heading: "9. Children's Privacy",
    body: `SLICE is intended for adults. The app is not intended for children under 18. We do not knowingly collect personal information from children under 13.\n\nIf you believe we have collected information from a child under 13, contact us at: ${CONTACT_EMAIL}`,
  },
  {
    heading: "10. California and Other U.S. State Privacy Rights",
    body: `If you live in California or another U.S. state with privacy laws, you may have additional rights regarding your personal information.\n\nSLICE does not sell personal information and does not use personal information for cross-context behavioral advertising unless clearly disclosed in the future.\n\nTo exercise applicable privacy rights, contact us at: ${CONTACT_EMAIL}`,
  },
  {
    heading: "11. Third-Party Services",
    body: "SLICE may use third-party services including:",
    bullets: [
      "Apple App Store / Google Play",
      "RevenueCat (subscription management)",
      "Supabase or Firebase (cloud hosting)",
      "Anthropic Claude or similar (AI provider)",
      "Expo (app framework)",
      "Sentry or similar (crash reporting)",
      "Email and notification providers",
      "Scheduling and calendar providers",
    ],
  },
  {
    heading: "12. Legal, Financial, Tax, and Credit Disclaimer",
    body: "SLICE is not a law firm, credit repair organization, tax advisor, financial advisor, or debt settlement company. SLICE provides educational tools, planning features, AI-generated suggestions, scripts, coaching support, and organizational resources. SLICE does not provide legal advice, tax advice, guaranteed credit repair, or guarantee any financial outcome.",
  },
  {
    heading: "13. Changes to This Privacy Policy",
    body: "We may update this Privacy Policy from time to time. If we make material changes, we may notify you through the app, by email, or by updating the effective date. Your continued use of SLICE after the updated Privacy Policy becomes effective means you accept the updated policy.",
  },
  {
    heading: "14. Contact Us",
    body: `For privacy questions, support, or data requests, contact us:\n\n${LEGAL_BUSINESS_NAME}\nEmail: ${CONTACT_EMAIL}\nWebsite: ${WEBSITE_URL}\nMailing Address: ${MAILING_ADDRESS}`,
  },
];

export default function PrivacyPolicyScreen() {
  const colors = useColors();
  const topPad = Platform.OS === "web" ? 67 : 0;
  const bottomPad = Platform.OS === "web" ? 34 : 20;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background, paddingTop: topPad }]}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.docTitle, { color: colors.foreground }]}>
          Privacy Policy
        </Text>
        <Text style={[styles.meta, { color: colors.mutedForeground }]}>
          Effective Date: {EFFECTIVE_DATE}
        </Text>
        <Text style={[styles.meta, { color: colors.mutedForeground }]}>
          App: SLICE — Debt Resolution App{"\n"}
          Owner: Marc Feinberg{"\n"}
          Contact: {CONTACT_EMAIL}{"\n"}
          Website: {WEBSITE_URL}
        </Text>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {SECTIONS.map((s, i) => (
          <View key={i} style={styles.section}>
            {s.heading && (
              <Text style={[styles.heading, { color: colors.foreground }]}>
                {s.heading}
              </Text>
            )}
            {s.subheading && (
              <Text style={[styles.subheading, { color: colors.foreground }]}>
                {s.subheading}
              </Text>
            )}
            {s.body && (
              <Text style={[styles.body, { color: colors.foreground }]}>
                {s.body}
              </Text>
            )}
            {s.bullets && s.bullets.map((b, j) => (
              <View key={j} style={styles.bulletRow}>
                <Text style={[styles.bullet, { color: colors.mutedForeground }]}>•</Text>
                <Text style={[styles.bulletText, { color: colors.foreground }]}>{b}</Text>
              </View>
            ))}
          </View>
        ))}

        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <Text style={[styles.footer, { color: colors.mutedForeground }]}>
          SLICE App · Privacy Policy · {EFFECTIVE_DATE}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 20, gap: 0 },
  docTitle: { fontSize: 24, fontFamily: "Inter_700Bold", marginBottom: 8 },
  meta: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20, marginBottom: 4 },
  divider: { height: 1, marginVertical: 20 },
  section: { marginBottom: 16 },
  heading: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 6, marginTop: 4 },
  subheading: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  body: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 21 },
  bulletRow: { flexDirection: "row", gap: 8, marginTop: 4, paddingLeft: 4 },
  bullet: { fontSize: 13, lineHeight: 21, width: 12 },
  bulletText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 21, flex: 1 },
  footer: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingBottom: 8,
  },
});
