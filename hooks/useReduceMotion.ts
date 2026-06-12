import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/**
 * Returns true when the OS "Reduce Motion" accessibility preference is on.
 * Mirrors the web's `prefers-reduced-motion: reduce` media query.
 * Animations that are purely decorative (looping pulses, parallax, breathing)
 * should gate on this value and show a static alternative instead.
 */
export function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );
    return () => subscription.remove();
  }, []);

  return reduceMotion;
}
