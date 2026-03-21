"use client";

import { ExternalLink } from "lucide-react";

export function DemoBanner() {
  return (
    <div className="bg-blue-600 text-white text-center py-2 px-4 text-sm">
      <span>You&apos;re viewing a demo</span>
      <span className="mx-2">&mdash;</span>
      <a
        href="https://github.com/AaronCx/NexaBase"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-blue-100 transition-colors"
      >
        View Source on GitHub
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}
