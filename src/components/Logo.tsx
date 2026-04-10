import Image from "next/image";

interface LogoProps {
  size?: "sm" | "md" | "lg";
}

const dimensions = {
  sm: { width: 140, height: 40 },
  md: { width: 200, height: 56 },
  lg: { width: 280, height: 78 },
};

export function Logo({ size = "md" }: LogoProps) {
  const { width, height } = dimensions[size];
  return (
    <Image
      src="/hammflix-logo.png"
      alt="HAMMFLIX"
      width={width}
      height={height}
      priority
      className="select-none"
    />
  );
}
