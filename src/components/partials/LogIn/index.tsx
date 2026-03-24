"use client";

import { authActions } from "@/lib/firebase/auth";
import { Button } from "@/components/ui/button";
import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";

const GoogleIcon = ({ className }: { className?: string }) => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="currentColor"
  >
    <title>Google</title>
    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
  </svg>
);

const LineIcon = ({ className }: { className?: string }) => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="currentColor"
  >
    <title>LINE</title>
    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
  </svg>
);

export const XIcon = ({ className }: { className?: string }) => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="currentColor"
  >
    <title>X</title>
    <path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z" />
  </svg>
);

const LOGIN_PROVIDERS = [
  {
    label: "Googleでログイン",
    icon: GoogleIcon,
    onClick: () => authActions.signInWithGoogle(),
  },
  {
    label: "X (Twitter) でログイン",
    icon: XIcon,
    onClick: () => authActions.signInWithTwitter(),
  },
  {
    label: "LINEでログイン",
    icon: LineIcon,
    onClick: () => authActions.signInWithLINE(),
  },
] as const;

export const LoginButtons = () => {
  return (
    <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-2xl">
      <div className="flex flex-col items-center gap-6 p-4">
        <div className="flex w-full flex-col -space-y-px shadow-sm">
          {LOGIN_PROVIDERS.map((provider, index) => {
            const Icon = provider.icon;
            return (
              <Button
                key={index}
                variant="outline"
                onClick={provider.onClick}
                className={`
                  group relative flex h-13 w-full items-center justify-start gap-4 px-6 
                  border-bpim-border bg-transparent transition-all duration-200
                  hover:z-10 hover:bg-bpim-overlay/40
                  active:scale-[0.98]
                  ${index === 0 ? "!rounded-t-xl rounded-b-none" : ""}
                  ${index === LOGIN_PROVIDERS.length - 1 ? "rounded-b-xl rounded-t-none" : "rounded-none"}
                `}
              >
                <Icon className="h-5 w-5 shrink-0 transition-transform group-hover:scale-110" />
                <span className="flex-1 text-left text-sm font-semibold text-bpim-text">
                  {provider.label}
                </span>
                <div className="opacity-0 transition-opacity group-hover:opacity-100">
                  <ChevronRightIcon className="h-4 w-4 text-bpim-muted" />
                </div>
              </Button>
            );
          })}
        </div>

        <p className="px-4 text-center text-xs leading-relaxed text-bpim-muted">
          続行することで、
          <Link
            target="_blank"
            className="underline"
            href="https://www.notion.so/BPIM2-3239989ca87a809f8058dc9736f0e197"
          >
            利用規約・プライバシーポリシー・データポリシー
          </Link>
          に同意したものとみなされます。
        </p>
      </div>
    </div>
  );
};
