interface LogoProps {
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "text-2xl",
  md: "text-4xl",
  lg: "text-5xl",
};

export function Logo({ size = "md" }: LogoProps) {
  return (
    <span
      className={`${sizes[size]} tracking-wide select-none`}
      style={{
        fontFamily: '"Graphique", "Helvetica Neue", Helvetica, Arial, sans-serif',
        color: "#e50914",
        textShadow: "2px 2px 4px rgba(0,0,0,0.6)",
      }}
    >
      HAMMFLIX
    </span>
  );
}
