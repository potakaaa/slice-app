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

const EFFECTIVE_DATE = "June 12, 2026";
const GOVERNING_STATE = "Florida";
const CONTACT_EMAIL = "Marc@MarcFeinberg.com";
const WEBSITE_URL = "https://slicemydebt.com";
const PRIVACY_POLICY_URL = "https://slicemydebt.com/privacy-policy";
const LEGAL_BUSINESS_NAME = "Coach Marc LLC";
const MAILING_ADDRESS = "2007 Cove Ln.\nNorth Palm Beach, FL 33408";

interface Section {
  heading?: string;
  body?: string;
  bullets?: string[];
}

const SECTIONS: Section[] = [
  {
    heading: "1. About SLICE",
    body: "SLICE is a debt resolution planning and education app designed to help users organize debt information, calculate settlement targets, create savings timelines, prepare negotiation scripts, track creditor progress, and access educational coaching support.",
    bullets: [
      "Customized debt program setup",
      "Creditor tracking",
      "Settlement calculators",
      "Monthly savings planning",
      "Snowball timeline tools",
      "AI-generated negotiation scripts",
      "AI debt coaching features",
      "Credit repair education",
      "Founder coaching and booking features",
      "Mastermind educational content",
      "Subscription-based premium features",
    ],
  },
  {
    body: "SLICE is intended for users located in the United States.",
  },
  {
    heading: "2. Not Legal, Tax, Credit, or Financial Advice",
    body: "SLICE is not a law firm, credit repair organization, tax advisor, financial advisor, debt settlement company, or financial institution.\n\nThe information, tools, AI responses, scripts, coaching, calculators, timelines, and educational content provided through SLICE are for general informational and educational purposes only.\n\nSLICE does not provide:",
    bullets: [
      "Legal advice",
      "Tax advice",
      "Financial advice",
      "Credit repair services",
      "Debt settlement services",
      "Guaranteed debt reduction",
      "Guaranteed creditor acceptance",
      "Guaranteed credit score improvement",
      "Guaranteed financial outcomes",
    ],
  },
  {
    body: "You are responsible for your own decisions and actions. You should consult a qualified attorney, tax professional, credit professional, financial advisor, or other licensed professional when needed.\n\nYou should get all debt settlement agreements in writing before making any payment to a creditor, collector, or third party.",
  },
  {
    heading: "3. Eligibility",
    body: "You must be at least 18 years old to use SLICE.\n\nBy using SLICE, you represent that:",
    bullets: [
      "You are at least 18 years old",
      "You are legally able to enter into these Terms",
      "The information you provide is accurate and belongs to you",
      "You will use SLICE only for lawful purposes",
      "You will not misuse the app, AI tools, coaching features, or subscription services",
    ],
  },
  {
    heading: "4. User Accounts",
    body: "To use certain features, you may need to create an account. You agree to:",
    bullets: [
      "Provide accurate and complete information",
      "Keep your account information updated",
      "Keep your login credentials secure",
      "Notify us if you suspect unauthorized access",
      "Accept responsibility for activity under your account",
    ],
  },
  {
    body: "We may suspend or terminate accounts that violate these Terms, create risk, misuse the service, or provide false or misleading information.",
  },
  {
    heading: "5. User-Provided Information",
    body: "You may manually enter information into SLICE, including creditor names, debt balances, credit score estimates, monthly savings amounts, budget information, notes, negotiation preferences, and coaching questions.\n\nYou are responsible for the accuracy and legality of the information you provide. SLICE calculations and AI suggestions depend on the information you enter.",
  },
  {
    heading: "6. Debt Calculators and Program Estimates",
    body: "SLICE may provide settlement calculators, savings plans, timeline estimates, and debt program projections. These tools are estimates only. Actual outcomes may vary based on creditor policies, account status, available savings, legal rules, tax consequences, and other factors outside our control.\n\nSLICE does not guarantee that:",
    bullets: [
      "A creditor will accept any settlement offer",
      "A creditor will stop collection efforts",
      "A debt will be reduced",
      "A specific timeline will be achieved",
      "A credit score will improve",
      "A settlement will be reported in a specific way",
    ],
  },
  {
    heading: "7. AI Features",
    body: "SLICE may include AI-powered features, including Zest AI Debt Coach, negotiation strategy suggestions, customized call scripts, letter drafts, and educational guidance.\n\nAI-generated content may be incomplete, inaccurate, outdated, or inappropriate for your specific situation. You should review all AI-generated content before using it.\n\nYou agree not to enter highly sensitive information into AI features, including:",
    bullets: [
      "Social Security numbers",
      "Full bank account numbers",
      "Full credit card numbers",
      "Government identification numbers",
      "Passwords or security codes",
    ],
  },
  {
    body: "AI features are for educational support only and do not replace professional advice.",
  },
  {
    heading: "8. Coaching and Founder Coaching",
    body: "SLICE may allow users to book coaching sessions, founder coaching with Marc Feinberg, Mastermind sessions, tax advisory sessions, or live creditor call support.\n\nCoaching is educational guidance only. Coaching does not create an attorney-client, tax advisor-client, financial advisor-client, fiduciary, or credit repair relationship.\n\nCoaching availability, scheduling, session length, pricing, and included features may vary by subscription tier. We may reschedule, cancel, or modify coaching availability when necessary.\n\nUnless clearly stated otherwise and consented to, SLICE does not record coaching calls.",
  },
  {
    heading: "9. Credit Repair Education",
    body: "SLICE may include a Credit Repair page, credit score tracking, credit report checklists, dispute letter placeholders, and educational steps for rebuilding credit.\n\nThese features are educational only. SLICE does not guarantee credit repair, deletion of negative items, removal of accurate information, or credit score improvement.\n\nYou are responsible for reviewing, editing, and verifying any letters, scripts, or documents before sending them.",
  },
  {
    heading: "10. Subscriptions, In-App Purchases, and Payments",
    body: "SLICE may offer free and paid features through subscription tiers or in-app purchases. Subscription tiers may include Free, Silver, Gold, Platinum, or other offerings.\n\nFor iOS users, digital subscriptions and in-app purchases are processed through Apple App Store. For Android users, purchases may be processed through Google Play. We may also use RevenueCat for subscription management.\n\nWe do not store your full payment card information.\n\nAuto-renewing subscriptions renew automatically unless canceled according to the applicable app store rules. You are responsible for managing and canceling your subscription through your Apple App Store or Google Play account settings.",
  },
  {
    heading: "11. Refunds and Cancellations",
    body: "Refunds for in-app purchases or subscriptions are generally handled by the applicable app store or payment provider. SLICE does not control Apple App Store or Google Play refund decisions.\n\nIf you cancel a subscription, you may continue to have access to paid features until the end of the current billing period, depending on the applicable app store rules.",
  },
  {
    heading: "12. Acceptable Use",
    body: "You agree not to:",
    bullets: [
      "Use SLICE for illegal, fraudulent, abusive, or harmful purposes",
      "Misrepresent your identity or account information",
      "Attempt to access another user's account",
      "Reverse engineer, copy, modify, or exploit the app",
      "Interfere with app security or performance",
      "Upload malicious code or harmful content",
      "Use AI features to create deceptive, abusive, or unlawful content",
      "Use SLICE to harass creditors, collectors, coaches, users, or staff",
      "Violate any law, regulation, third-party right, or app store policy",
    ],
  },
  {
    heading: "13. Intellectual Property",
    body: "SLICE, including its name, logo, design, app interface, text, graphics, code, educational content, AI prompt structures, workflows, and templates, is owned by SLICE or its licensors.\n\nYou may use SLICE for your personal, non-commercial use only. You may not copy, reproduce, distribute, sell, license, or exploit any part of SLICE without written permission.",
  },
  {
    heading: "14. User Content License",
    body: "You retain ownership of information you enter into SLICE. By using SLICE, you grant us a limited license to use, process, store, display, and transmit your information only as needed to provide and improve the app, operate AI features, process subscriptions, provide coaching, deliver support, and comply with law.",
  },
  {
    heading: "15. Third-Party Services",
    body: "SLICE may rely on third-party services including Apple App Store, Google Play, RevenueCat, cloud hosting providers, AI providers, Expo, Sentry or similar crash reporting tools, email and notification providers, and calendar or scheduling providers.\n\nYour use of third-party services may be subject to their own terms and privacy policies. We are not responsible for third-party service outages, errors, policies, or actions.",
  },
  {
    heading: "16. Privacy",
    body: `Your use of SLICE is also governed by our Privacy Policy, which explains how we collect, use, store, and share information.\n\nPrivacy Policy: ${PRIVACY_POLICY_URL}\n\nBy using SLICE, you also agree to the practices described in the Privacy Policy.`,
  },
  {
    heading: "17. No Warranties",
    body: 'SLICE is provided on an "as is" and "as available" basis. To the fullest extent allowed by law, we disclaim all warranties, express or implied, including warranties of merchantability, fitness for a particular purpose, accuracy, availability, reliability, and non-infringement.\n\nWe do not warrant that SLICE will be uninterrupted, secure, error-free, or that results will meet your expectations.',
  },
  {
    heading: "18. Limitation of Liability",
    body: "To the fullest extent allowed by law, SLICE and its owners, founders, officers, employees, contractors, coaches, partners, and service providers will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages.\n\nThis includes damages related to debt settlement outcomes, creditor decisions, collection activity, credit score changes, tax consequences, financial losses, AI-generated content, user decisions, coaching outcomes, or app downtime.\n\nYour use of SLICE is at your own risk. Some states do not allow certain limitations, so some of these limitations may not apply to you.",
  },
  {
    heading: "19. Indemnification",
    body: "You agree to defend, indemnify, and hold harmless SLICE, its owners, founders, employees, contractors, coaches, partners, and service providers from any claims, damages, losses, liabilities, costs, or expenses arising from your use of SLICE, your violation of these Terms, your violation of any law or third-party right, or actions you take based on app content, AI content, coaching, scripts, or calculators.",
  },
  {
    heading: "20. Termination",
    body: "We may suspend or terminate your access to SLICE at any time if you violate these Terms, misuse the app, create legal or security risk, or if we discontinue the app or a feature.\n\nYou may stop using SLICE at any time. Termination does not automatically cancel your app store subscription. You must cancel subscriptions through the applicable app store or payment provider.",
  },
  {
    heading: "21. Changes to the App or Terms",
    body: "We may update SLICE, change features, modify pricing, add or remove services, or update these Terms from time to time. If we make material changes, we may notify you through the app, by email, or by updating the effective date.\n\nYour continued use of SLICE after changes become effective means you accept the updated Terms.",
  },
  {
    heading: `22. Governing Law`,
    body: `These Terms are governed by the laws of the State of ${GOVERNING_STATE}, without regard to conflict of law principles.\n\nAny disputes arising from these Terms or your use of SLICE will be resolved in the courts of ${GOVERNING_STATE}.`,
  },
  {
    heading: "23. Dispute Resolution",
    body: "Before filing a legal claim, you agree to contact us at " + CONTACT_EMAIL + " to attempt informal resolution. We will try to resolve disputes within 30 days of receiving written notice.",
  },
  {
    heading: "24. Contact Us",
    body: `For questions about these Terms, contact us:\n\n${LEGAL_BUSINESS_NAME}\nEmail: ${CONTACT_EMAIL}\nWebsite: ${WEBSITE_URL}\nMailing Address: ${MAILING_ADDRESS}`,
  },
];

export default function TermsScreen() {
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
          Terms and Conditions
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

        <Text style={[styles.intro, { color: colors.foreground }]}>
          These Terms and Conditions ("Terms") govern your access to and use of SLICE — Debt Resolution App, including the SLICE mobile app, website, AI tools, coaching features, subscription features, educational content, and related services.{"\n\n"}
          By creating an account, accessing SLICE, or using any part of the app, you agree to these Terms. If you do not agree, do not use SLICE.
        </Text>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {SECTIONS.map((s, i) => (
          <View key={i} style={styles.section}>
            {s.heading && (
              <Text style={[styles.heading, { color: colors.foreground }]}>
                {s.heading}
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
          SLICE App · Terms and Conditions · {EFFECTIVE_DATE}
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
  intro: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 21 },
  section: { marginBottom: 16 },
  heading: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 6, marginTop: 4 },
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
