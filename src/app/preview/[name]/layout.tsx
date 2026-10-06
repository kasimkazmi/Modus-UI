import type { Metadata } from "next";

// Full-screen demos duplicate the docs pages, so keep them out of search results.
export const metadata: Metadata = { robots: { index: false } };

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
