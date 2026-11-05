"use client";

import { useReportWebVitals } from "next/web-vitals";
import type { Metric } from "web-vitals";

// Stable module-level reference so metrics are not reported twice.
function reportWebVitals(metric: Metric) {
  if (process.env.NODE_ENV !== "production") {
    console.info(`[web-vitals] ${metric.name}`, Math.round(metric.value), metric.rating);
    return;
  }

  const endpoint = process.env.NEXT_PUBLIC_VITALS_ENDPOINT;
  if (!endpoint) return;

  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    id: metric.id,
    navigationType: metric.navigationType,
    path: window.location.pathname,
  });
  if (!navigator.sendBeacon(endpoint, body)) {
    void fetch(endpoint, { body, method: "POST", keepalive: true });
  }
}

export function WebVitals() {
  useReportWebVitals(reportWebVitals);
  return null;
}
