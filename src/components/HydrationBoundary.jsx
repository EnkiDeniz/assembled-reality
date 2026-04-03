"use client";

import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

export default function HydrationBoundary({ children, fallback = null }) {
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);

  return hydrated ? children : fallback;
}
