import Link from "next/link"

import { BackHomeLink } from "./_components/BackHomeLink"
import { HeaderNav } from "./_components/HeaderNav"

/**
 * Shared shell for the tool pages. The `(tools)` route group adds no URL segment.
 * Header and footer are named view transitions: they slide in when entering a
 * tool page from home and out when leaving; between tool pages they stay put
 * (CSS in app/globals.css).
 */
export default function ToolsLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col">
      <header
        className="flex flex-col gap-2 border-b-2 border-border bg-chrome px-4 py-2 md:flex-row md:items-center md:justify-between md:py-4"
        style={{ viewTransitionName: "tools-header" }}
      >
        <Link href="/" className="w-fit font-display text-xl focus-ring md:text-2xl">
          Wizard Tuner
        </Link>
        <HeaderNav />
      </header>

      <main className="mx-auto flex w-full max-w-7xl grow flex-col gap-4 px-4 py-4 md:py-8">
        <BackHomeLink />
        {children}
      </main>

      <footer
        className="border-t-2 border-border bg-chrome px-4 py-4 text-muted-foreground"
        style={{ viewTransitionName: "tools-footer" }}
      >
        Wizard Tuner
      </footer>
    </div>
  )
}
