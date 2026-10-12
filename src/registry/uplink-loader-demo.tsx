"use client";

import { UplinkLoader } from "./uplink-loader";

export default function UplinkLoaderDemo() {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <div className="absolute inset-0">
        <UplinkLoader />
      </div>
    </div>
  );
}
