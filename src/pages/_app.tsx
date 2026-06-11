import "@/styles/globals.css";

import { useEffect } from "react";
import { UserProvider } from "@/contexts/users/UserContext";
import { LocaleProvider } from "@/contexts/locale/LocaleContext";
import type { AppProps } from "next/app";
import { PagesProgressBar as ProgressBar } from "next-nprogress-bar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { LocaleDetectionModal } from "@/components/partials/LocaleDetectionModal";
import { updateFavicon } from "@/components/ui/bpim-logo";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    updateFavicon();
    const observer = new MutationObserver(updateFavicon);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <ProgressBar
        height="3px"
        color="#3182ce"
        options={{ showSpinner: true }}
        shallowRouting
      />
      <LocaleProvider>
        <UserProvider>
          <TooltipProvider>
            <Toaster />
            <LocaleDetectionModal />
            <Component {...pageProps} />
          </TooltipProvider>
        </UserProvider>
      </LocaleProvider>
    </>
  );
}
