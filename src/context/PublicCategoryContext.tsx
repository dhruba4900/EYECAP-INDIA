"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";

type PublicCategoryContextValue = {
  categories: unknown[];
  loaded: boolean;
};

const PublicCategoryContext =
  createContext<PublicCategoryContextValue | null>(null);

function isRestrictedRoute(pathname: string): boolean {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/delivery")
  );
}

export function PublicCategoryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [categories, setCategories] = useState<unknown[]>([]);
  const [loaded, setLoaded] = useState(false);
  const requestId = useRef(0);
  const initialLoadStarted = useRef(false);
  const previousPathname = useRef(pathname);

  const loadCategories = useCallback(async (clearWhileLoading = false) => {
    const currentRequestId = ++requestId.current;

    if (clearWhileLoading) {
      setCategories([]);
      setLoaded(false);
    }

    try {
      const response = await fetch("/api/categories?navigation=true", {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Category request failed: ${response.status}`);
      }

      const data: unknown = await response.json();

      if (
        !data ||
        typeof data !== "object" ||
        !("categories" in data) ||
        !Array.isArray(data.categories)
      ) {
        throw new Error("Invalid category response from server.");
      }

      if (currentRequestId === requestId.current) {
        setCategories(data.categories);
        setLoaded(true);
      }
    } catch (error) {
      console.error("Public category loading failed:", error);

      if (currentRequestId === requestId.current) {
        setCategories([]);
        setLoaded(true);
      }
    }
  }, []);

  useEffect(() => {
    const wasRestrictedRoute = isRestrictedRoute(
      previousPathname.current
    );
    const restrictedRoute = isRestrictedRoute(pathname);

    previousPathname.current = pathname;

    if (wasRestrictedRoute && !restrictedRoute) {
      initialLoadStarted.current = true;
      void loadCategories(true);
    } else if (
      !restrictedRoute &&
      !initialLoadStarted.current
    ) {
      initialLoadStarted.current = true;
      void loadCategories();
    }
  }, [loadCategories, pathname]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        !isRestrictedRoute(previousPathname.current)
      ) {
        void loadCategories();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [loadCategories]);

  const returningFromRestrictedRoute =
    isRestrictedRoute(previousPathname.current) &&
    !isRestrictedRoute(pathname);
  const value = returningFromRestrictedRoute
    ? { categories: [], loaded: false }
    : { categories, loaded };

  return (
    <PublicCategoryContext.Provider value={value}>
      {children}
    </PublicCategoryContext.Provider>
  );
}

export function usePublicCategories(): PublicCategoryContextValue {
  const context = useContext(PublicCategoryContext);

  if (!context) {
    throw new Error(
      "usePublicCategories must be used within PublicCategoryProvider."
    );
  }

  return context;
}
