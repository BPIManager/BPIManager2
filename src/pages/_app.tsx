import "@/styles/globals.css";

import { UserProvider } from "@/contexts/users/UserContext";
import type { AppProps } from "next/app";
import { PagesProgressBar as ProgressBar } from "next-nprogress-bar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <ProgressBar
        height="3px"
        color="#3182ce"
        options={{ showSpinner: true }}
        shallowRouting
      />
      <UserProvider>
        <TooltipProvider>
          <Toaster />
          <Component {...pageProps} />
        </TooltipProvider>
      </UserProvider>
    </>
  );
}
