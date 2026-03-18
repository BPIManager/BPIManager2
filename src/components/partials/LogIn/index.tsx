"use client";

import { authActions } from "@/lib/firebase/auth";
import { Button } from "@/components/ui/button";
import { FaGoogle, FaTwitter, FaLine } from "react-icons/fa";

export const LoginButtons = () => {
  return (
    <div className="my-4 flex w-full flex-col items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-6">
      <span className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">
        ログインして開始
      </span>

      <div className="flex w-full flex-col -space-y-px">
        <Button
          variant="outline"
          className="relative flex h-12 w-full items-center justify-center gap-3 rounded-b-none border-white/10 bg-transparent transition-all hover:z-10 hover:bg-white/5 active:scale-[0.98]"
          onClick={() => authActions.signInWithGoogle()}
        >
          <FaGoogle className="text-red-500" />
          <span className="text-sm font-bold text-gray-200">
            Googleでログイン
          </span>
        </Button>

        <Button
          variant="outline"
          className="relative flex h-12 w-full items-center justify-center gap-3 rounded-none border-white/10 bg-transparent transition-all hover:z-10 hover:bg-white/5 active:scale-[0.98]"
          onClick={() => authActions.signInWithTwitter()}
        >
          <FaTwitter className="text-sky-400" />
          <span className="text-sm font-bold text-gray-200">
            X (Twitter) でログイン
          </span>
        </Button>

        <Button
          variant="outline"
          className="relative flex h-12 w-full items-center justify-center gap-3 rounded-t-none border-white/10 bg-transparent transition-all hover:z-10 hover:bg-white/5 active:scale-[0.98]"
          onClick={() => authActions.signInWithLINE()}
        >
          <FaLine className="text-green-500" />
          <span className="text-sm font-bold text-gray-200">
            LINEでログイン
          </span>
        </Button>
      </div>
    </div>
  );
};
