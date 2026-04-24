import Lottie, { type LottieComponentProps } from "lottie-react";

type Props = Omit<LottieComponentProps, "animationData"> & {
  animationData: LottieComponentProps["animationData"];
  size?: number;
};

export const LottieAnimation = ({ size = 48, style, ...props }: Props) => {
  return (
    <Lottie
      loop={false}
      autoplay={true}
      style={{ width: size, height: size, ...style }}
      {...props}
    />
  );
};
