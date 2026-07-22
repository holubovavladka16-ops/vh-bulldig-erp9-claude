export type DeviceType = "phone" | "tablet" | "desktop";

export function detectDeviceType(): DeviceType {
  if (typeof window === "undefined") return "desktop";
  const width = window.innerWidth;
  if (width < 640) return "phone";
  if (width < 1024) return "tablet";
  return "desktop";
}
