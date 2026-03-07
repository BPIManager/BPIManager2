import { Provider } from "@/components/ui/provider";
import { Toaster } from "@/components/ui/toaster";
import { UserProvider } from "@/contexts/users/UserContext";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { DarkMode } from "@/components/ui/color-mode";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Provider>
      <UserProvider>
        <DarkMode>
          <Toaster />
          <Component {...pageProps} />
          <ProgressBar
            height="3px"
            color="#3182ce"
            options={{ showSpinner: false }}
            shallowRouting
          />
        </DarkMode>
      </UserProvider>
    </Provider>
  );
}
