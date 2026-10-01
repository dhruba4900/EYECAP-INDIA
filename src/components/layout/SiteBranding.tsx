"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type BrandSettings = {
  defaultTitle: string;
  titleTemplate: string;
  siteName: string;
  description: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  logoUrl: string | null;
  faviconUrl: string | null;
};

export default function SiteBranding() {
  const pathname = usePathname();
  const [settings, setSettings] = useState<BrandSettings | null>(null);

  useEffect(() => {
    let active = true;

    async function loadBranding() {
      try {
        const response = await fetch("/api/content/homepage");
        if (!response.ok) return;
        const { settings } = await response.json();
        if (!active || !settings) return;

        setSettings(settings);
        const root = document.documentElement;
        root.style.setProperty("--background", settings.backgroundColor);
        root.style.setProperty("--foreground", "#F3F4F6");
        root.style.setProperty("--brand-primary", settings.primaryColor);
        root.style.setProperty("--brand-accent", settings.accentColor);
        document.title = settings.defaultTitle || settings.siteName;
        const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
        if (description) description.content = settings.description;
        window.dispatchEvent(new CustomEvent("eyecap:branding", {
          detail: { logoUrl: settings.logoUrl, siteName: settings.siteName },
        }));

        if (settings.faviconUrl) {
          let icon = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
          if (!icon) {
            icon = document.createElement("link");
            icon.rel = "icon";
            document.head.appendChild(icon);
          }
          icon.href = settings.faviconUrl;
        }
      } catch (error) {
        console.error("Site branding load error:", error);
      }
    }

    loadBranding();
    window.addEventListener("eyecap:branding-updated", loadBranding);
    return () => {
      active = false;
      window.removeEventListener("eyecap:branding-updated", loadBranding);
    };
  }, []);

  useEffect(() => {
    if (!settings) return;
    const currentSettings = settings;
    let active = true;

    async function updatePageTitle() {
      let pageName = pathname === "/"
        ? ""
        : pathname.split("/").filter(Boolean).at(-1)?.replace(/-/g, " ") || "";
      if (pathname.startsWith("/products/")) {
        try {
          const slug = pathname.slice("/products/".length);
          const response = await fetch(`/api/products/${encodeURIComponent(slug)}`);
          if (response.ok) {
            const data = await response.json();
            pageName = data.product?.name || pageName;
          }
        } catch (error) {
          console.error("Product page title load error:", error);
        }
      }
      if (!active) return;
      document.title = pageName
        ? currentSettings.titleTemplate.replace("%page%", pageName).replace("%site%", currentSettings.siteName)
        : currentSettings.defaultTitle || currentSettings.siteName;
    }

    updatePageTitle();
    return () => {
      active = false;
    };
  }, [pathname, settings]);

  return null;
}
