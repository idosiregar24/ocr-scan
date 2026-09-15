import Link from "next/link";
import { BrandWordmark } from "@/components/brand-mark";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-sky-brand flex min-h-svh flex-col items-center justify-center gap-8 px-4 py-10">
      <Link href="/" className="text-white [&_svg]:text-white">
        <BrandWordmark />
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
