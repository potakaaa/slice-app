import React, { useCallback } from "react";

import { CelebrationOverlay } from "@/components/CelebrationOverlay";
import { Toast } from "@/components/Toast";
import { maybeRequestReview } from "@/lib/reviewPrompt";
import { useCelebrationStore } from "@/store/useCelebrationStore";

/**
 * Single root-mounted renderer for milestone celebrations (Pillar 3).
 *
 * Subscribes to the transient celebration store so any screen can fire a
 * celebration with one `celebrate(key)` call and have it render above the whole
 * app, surviving navigation. Centralizes the celebration→review sequence: after
 * a pride/hero moment dismisses, we attempt the (independently gated) review
 * ask — so the native sheet always lands *after* the confetti, never during.
 */
export function CelebrationHost() {
  const active = useCelebrationStore((s) => s.active);
  const dismiss = useCelebrationStore((s) => s.dismiss);

  const handleDone = useCallback(() => {
    const voice = active?.voice;
    dismiss();
    if (voice === "pride" || voice === "hero") {
      // Let the celebration fully clear before the review sheet may appear.
      setTimeout(() => void maybeRequestReview(), 400);
    }
  }, [active?.voice, dismiss]);

  if (!active) return null;

  if (active.tier === "micro") {
    // `key` forces a fresh mount per celebration so animations replay.
    return (
      <Toast
        key={active.id}
        title={active.title}
        message={active.message}
        onDone={handleDone}
      />
    );
  }

  return (
    <CelebrationOverlay
      key={active.id}
      visible
      title={active.title}
      message={active.message}
      variant={active.tier === "hero" ? "hero" : "standard"}
      onDone={handleDone}
    />
  );
}
