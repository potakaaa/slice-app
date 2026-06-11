import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AccessibilityInfo } from "react-native";

import { useAppStore } from "@/store/useAppStore";

import { TOUR_STEPS, type TourStep } from "./tourSteps";

interface TourContextValue {
  /** True while the guided tour is actively running. */
  isActive: boolean;
  step: TourStep | null;
  stepIndex: number;
  totalSteps: number;
  reduceMotion: boolean;
  /** Begin the tour from the first step. */
  start: () => void;
  next: () => void;
  prev: () => void;
  skip: () => void;
  finish: () => void;
}

const TourContext = createContext<TourContextValue | null>(null);

export function useTour(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) {
    throw new Error("useTour must be used within a <TourProvider>");
  }
  return ctx;
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const tutorialStatus = useAppStore((s) => s.tutorialStatus);
  const startTour = useAppStore((s) => s.startTour);
  const setTutorialStatus = useAppStore((s) => s.setTutorialStatus);

  const isActive = tutorialStatus === "in_progress";

  const [stepIndex, setStepIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  const step = isActive ? (TOUR_STEPS[stepIndex] ?? null) : null;

  // Honor the OS "Reduce Motion" setting for overlay animation.
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (enabled) => setReduceMotion(enabled)
    );
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  const tick = useCallback(() => {
    if (reduceMotion) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, [reduceMotion]);

  // Auto-navigate to the tab the current step describes, so the user sees the
  // real page behind the explainer card.
  useEffect(() => {
    if (isActive && TOUR_STEPS[stepIndex]) {
      router.navigate(TOUR_STEPS[stepIndex].route as never);
    }
  }, [isActive, stepIndex]);

  const start = useCallback(() => {
    setStepIndex(0);
    startTour();
  }, [startTour]);

  const finish = useCallback(() => {
    setTutorialStatus("completed");
    setStepIndex(0);
  }, [setTutorialStatus]);

  const skip = useCallback(() => {
    setTutorialStatus("skipped");
    setStepIndex(0);
  }, [setTutorialStatus]);

  const next = useCallback(() => {
    if (stepIndex >= TOUR_STEPS.length - 1) {
      finish();
      return;
    }
    tick();
    setStepIndex(stepIndex + 1);
  }, [stepIndex, finish, tick]);

  const prev = useCallback(() => {
    if (stepIndex <= 0) return;
    tick();
    setStepIndex(stepIndex - 1);
  }, [stepIndex, tick]);

  const value = useMemo<TourContextValue>(
    () => ({
      isActive,
      step,
      stepIndex,
      totalSteps: TOUR_STEPS.length,
      reduceMotion,
      start,
      next,
      prev,
      skip,
      finish,
    }),
    [isActive, step, stepIndex, reduceMotion, start, next, prev, skip, finish]
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}
