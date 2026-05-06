import Image from "next/image";

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <Image
        src="/loading.gif"
        alt="Loading…"
        width={768}
        height={768}
        unoptimized
        priority
        className="w-full h-full object-cover"
      />
    </div>
  );
}
