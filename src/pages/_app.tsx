import { Provider } from "@/components/ui/provider";
import { Toaster } from "@/components/ui/toaster";
import { UserProvider } from "@/contexts/users/UserContext";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Provider>
      <UserProvider>
        <Toaster />
        <Component {...pageProps} />
        <ProgressBar
          height="3px"
          color="#3182ce"
          options={{ showSpinner: false }}
          shallowRouting
        />
      </UserProvider>
    </Provider>
  );
}
