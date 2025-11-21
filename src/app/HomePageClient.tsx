"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PeminjamanManagement from "@/components/peminjaman/PeminjamanManagement";
import SerahTerimaManagement from "@/components/serah-terima/SerahTerimaManagement";
import ArchiveManagement from "@/components/archive/ArchiveManagement";
import "../app/globals.css";

export default function HomePageClient() {
  console.log("✅ HomePageClient rendered");
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isAuth, setIsAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  console.log("Render HomePage", { isAuth, isLoading, user });

  // Centralized auth check function
  const checkAuth = async (retryCount = 0) => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
      });

      console.log("Auth check response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Auth check data:", data);

        if (data.user) {
          console.log("✅ Setting isAuth TRUE");
          setUser(data.user);
          setIsAuth(true);
          return true;
        } else {
          throw new Error("No user data received");
        }
      } else {
        console.log("⛔ No user in response, redirecting");
        throw new Error(
          `Authentication failed with status: ${response.status}`
        );
      }
    } catch (error) {
      console.error("Auth check failed:", error);

      if (retryCount === 0) {
        console.log("Retrying auth check...");
        await new Promise((resolve) => setTimeout(resolve, 200));
        return await checkAuth(1);
      }

      setIsAuth(false);
      setUser(null);
      router.replace("/login");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("from") === "login") {
      urlParams.delete("from");
      const newUrl =
        window.location.pathname +
        (urlParams.toString() ? "?" + urlParams.toString() : "");
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  const tab = searchParams.get("tab") || "archive";

  const setTab = (newTab: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", newTab);
    router.push("?" + params.toString());
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuth) {
    return null;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <div className="flex space-x-4">
          <button
            onClick={() => setTab("archive")}
            className={`px-3 py-1 rounded ${
              tab === "archive" ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            Arsip
          </button>
          <button
            onClick={() => setTab("peminjaman")}
            className={`px-3 py-1 rounded ${
              tab === "peminjaman" ? "bg-green-600 text-white" : "bg-gray-200"
            }`}
          >
            Peminjaman
          </button>
          <button
            onClick={() => setTab("serah-terima")}
            className={`px-3 py-1 rounded ${
              tab === "serah-terima"
                ? "bg-purple-600 text-white"
                : "bg-gray-200"
            }`}
          >
            Serah Terima
          </button>
        </div>
      </div>

      {tab === "archive" && <ArchiveManagement />}
      {tab === "peminjaman" && <PeminjamanManagement />}
      {tab === "serah-terima" && <SerahTerimaManagement />}
    </div>
  );
}
