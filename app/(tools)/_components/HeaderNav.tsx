"use client"

import { MenuIcon } from "lucide-react"
import { usePathname } from "next/navigation"
import { useState } from "react"

import { NavLinks } from "@/components/NavLinks"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

/**
 * Tool-page header navigation. From `md` up: the links as a bar. Below `md`: a hamburger that
 * opens a side sheet with the same links.
 */
export function HeaderNav() {
  const pathname = usePathname()
  // Remember where it was opened, so navigating to another page closes it.
  const [openAt, setOpenAt] = useState<string | null>(null)

  return (
    <>
      <NavLinks className="max-md:hidden" />

      <Sheet
        open={openAt === pathname}
        onOpenChange={(open) => {
          setOpenAt(open ? pathname : null)
        }}
      >
        <SheetTrigger
          aria-label="Menu"
          className="flex size-10 items-center justify-center rounded-control text-muted-foreground focus-ring hover:text-foreground md:hidden"
        >
          <MenuIcon aria-hidden className="size-6" />
        </SheetTrigger>
        <SheetContent side="right" className="bg-chrome">
          <SheetTitle className="px-4 pt-4 font-display text-xl">Wizard Tuner</SheetTitle>
          <SheetDescription className="sr-only">Choose a tool</SheetDescription>
          <NavLinks orientation="vertical" />
        </SheetContent>
      </Sheet>
    </>
  )
}
