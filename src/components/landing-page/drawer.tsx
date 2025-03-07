import { buttonVariants } from "@/components/landing-page/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTrigger,
} from "@/components/landing-page/ui/drawer";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { IoMenuSharp } from "react-icons/io5";
import Image from 'next/image'
import { useEffect, useState } from "react";
import { getUserFullName } from "@/actions/settings";

export default function drawerDemo() {
  const [fullName, setFullName] = useState<string | null>(null);
  
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
    <Drawer>
      <DrawerTrigger>
        <IoMenuSharp className="text-2xl" />
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="px-6">
          <div className="">
            <Link
              href="/"
              title="brand-logo"
              className="relative mr-6 flex items-center space-x-2"
            >
              <Image
                src="/assets/logo.png"
                alt="LOGO"
                sizes="100vw"
                style={{
                  width: '180px',
                  height: 'auto',
                }}
                width={0}
                height={0}
              />
            </Link>
          </div>
        </DrawerHeader>
        <DrawerFooter>
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
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
