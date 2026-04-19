import { LoginPageBody } from "../LogIn/ui";
import { cn } from "@/lib/utils";

const LOGIN_REQUIRED_MESSAGE =
  "このコンテンツの利用にはBPIM2アカウントでのログインが必要です";

export const LoginRequiredCard = ({ className }: { className?: string }) => {
  return (
    <div className={cn(className)}>
      <LoginPageBody requiredMessage={LOGIN_REQUIRED_MESSAGE} />
    </div>
  );
};

export const LoginRequiredBox = () => {
  return (
    <div className="absolute inset-0 z-50 overflow-y-auto">
      <LoginPageBody requiredMessage={LOGIN_REQUIRED_MESSAGE} />
    </div>
  );
};
