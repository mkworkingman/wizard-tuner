"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import { cn } from "@/lib/utils"

const LINKS = [
  { label: "Tuner", href: "/tuner" },
  { label: "Ear Training", href: "/ear-training" },
  { label: "Metronome", href: "/metronome" },
  { label: "Beat Machine", href: "/beat-machine" },
] as const

type NavLinksProps = {
  /** `horizontal`: tabs split by slanted rules. `vertical`: a stacked list (mobile sheet). */
  orientation?: "horizontal" | "vertical"
  className?: string
}

/** The links between the tool pages. Marks the current page. */
export function NavLinks({ orientation = "horizontal", className }: NavLinksProps) {
  const pathname = usePathname()
  const horizontal = orientation === "horizontal"

  return (
    <NavigationMenu
      viewport={false}
      aria-label="Tools"
      data-slot="nav-links"
      className={cn(!horizontal && "w-full max-w-full flex-none items-start", className)}
    >
      <NavigationMenuList className={cn(!horizontal && "flex-col items-stretch")}>
        {LINKS.map(({ label, href }) => (
          <NavigationMenuItem
            key={href}
            className={cn(horizontal && "slant-divider first:before:hidden")}
          >
            <NavigationMenuLink
              asChild
              active={pathname === href}
              className={cn(
                "min-h-12 rounded-none px-4 font-display text-sm font-semibold tracking-wider text-muted-foreground uppercase hover:bg-transparent hover:text-foreground focus:bg-transparent data-active:bg-transparent data-active:text-foreground data-active:hover:bg-transparent data-active:focus:bg-transparent",
                horizontal && "px-8 text-base",
              )}
            >
              <Link href={href} aria-current={pathname === href ? "page" : undefined}>
                {label}
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  )
}
