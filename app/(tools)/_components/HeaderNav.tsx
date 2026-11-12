"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const LINKS = [
  { label: "Tuner", href: "/tuner" },
  { label: "Ear Training", href: "/ear-training" },
  { label: "Metronome", href: "/metronome" },
  { label: "Beat Machine", href: "/beat-machine" },
] as const

/** Links between the tool pages, shown in the tool-page header. Marks the current page. */
export function HeaderNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Tools">
      <ul className="flex flex-wrap gap-x-4">
        {LINKS.map(({ label, href }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={pathname === href ? "page" : undefined}
              className="flex min-h-10 items-center text-sm text-muted-foreground underline-offset-4 focus-ring hover:text-foreground hover:underline aria-[current=page]:text-foreground aria-[current=page]:underline md:text-base"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
