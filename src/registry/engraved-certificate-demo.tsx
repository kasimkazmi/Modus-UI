"use client";

import { EngravedCertificate } from "./engraved-certificate";

export default function EngravedCertificateDemo() {
  return (
    <div className="relative flex h-[560px] min-h-[400px] w-full items-center justify-center overflow-hidden rounded-xl border border-border">
      <EngravedCertificate />
    </div>
  );
}
