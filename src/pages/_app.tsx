import { Provider } from "@/components/ui/provider";
import { UserProvider } from "@/contexts/users/UserContext";
import "@/styles/globals.css";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Provider>
      <UserProvider>
        <Component {...pageProps} />
      </UserProvider>
    </Provider>
  );
}
