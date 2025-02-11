"use client"; // ✅ Ensure it's a client component

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { LogOut } from "lucide-react"; // ✅ Import Lucide logout icon
import SignUpFormProvider from "@/components/forms/sign-up/form-provider";
import RegistrationFormStep from "@/components/forms/sign-up/registration-step";
import ButtonHandler from "@/components/forms/sign-up/button-handlers";

const SIGNUP_ACCESS_PASSWORD = process.env.NEXT_PUBLIC_SIGNUP_ACCESS_PASSWORD || ""; // Change this

export default function SignUp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const storedAuth = Cookies.get("signup_auth");

    if (!storedAuth) {
      const userInput = window.prompt("Enter Sign-Up Page Password:");
      if (userInput === SIGNUP_ACCESS_PASSWORD) {
        Cookies.set("signup_auth", "true", { expires: 1 }); // Store access for 1 day
        setIsAuthenticated(true);
      } else {
        alert("Incorrect password! Redirecting...");
        router.push("/auth/sign-in"); // Redirect to sign-in or another page
      }
    } else {
      setIsAuthenticated(true);
    }
  }, []);

  if (!isAuthenticated) return null; // Prevent form from rendering until authenticated

  const handleLogout = () => {
    Cookies.remove("signup_auth");
    router.push("/auth/sign-in"); // Redirect on logout
  };

  return (
    <div className="relative py-16 md:px-16 w-full">
      {/* ✅ Logout button in top-right corner */}
      <button
        onClick={handleLogout}
        className="absolute top-4 right-4 bg-blue-400 text-white p-2 rounded-full hover:bg-red-600 transition-all flex items-center gap-2"
      >
        <LogOut size={20} />
      </button>

      <SignUpFormProvider>
        <div className="flex flex-col gap-3">
          <RegistrationFormStep />
          <ButtonHandler />
        </div>
      </SignUpFormProvider>
    </div>
  );
}
