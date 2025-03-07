"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Drawer from "@/components/landing-page/drawer";
import { buttonVariants } from "@/components/landing-page/ui/button";
import { cn } from "@/lib/utils";
import { getUserFullName } from "@/actions/settings";

export default function Header() {
  const [addBorder, setAddBorder] = useState(false);
  const [fullName, setFullName] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setAddBorder(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    async function fetchUser() {
      const name = await getUserFullName();
      if (name !== undefined) {
        setFullName(name);
      }
    }
    fetchUser();
  }, []);

  return (
    <header className="relative sticky top-0 z-50 py-2 bg-background/60 backdrop-blur">
      <div className="flex justify-between items-center container">
        <Link href="/" title="brand-logo" className="relative mr-6 flex items-center space-x-2">
          <Image
            src="/assets/logo.png"
            alt="LOGO"
            sizes="100vw"
            style={{ width: "180px", height: "auto" }}
            width={0}
            height={0}
          />
        </Link>

        <div className="hidden lg:block">
          <div className="flex items-center">
            <div className="gap-2 flex">
              {fullName ? (
                <>
                  <Link href="/auth/sign-in" className={buttonVariants({ variant: "outline" })}>
                    Dashboard
                  </Link>
                  <button
                    className={cn(buttonVariants({ variant: "default" }), "w-full sm:w-auto text-background flex gap-2")}
                  >
                    Hi, {fullName}
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/sign-in" className={buttonVariants({ variant: "outline" })}>
                    Login
                  </Link>
                  <Link
                    href="/auth/sign-in"
                    className={cn(buttonVariants({ variant: "default" }), "w-full sm:w-auto text-background flex gap-2")}
                  >
                    Get Started for Free
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-2 cursor-pointer block lg:hidden">
          <Drawer />
        </div>
      </div>
      <hr className={cn("absolute w-full bottom-0 transition-opacity duration-300 ease-in-out", addBorder ? "opacity-100" : "opacity-0")} />
    </header>
  );
}
