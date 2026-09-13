import { Leaf } from "lucide-react";

export default function BrandLogo({ className = "h-9 w-auto" }: { className?: string }) {
  return <span className={`inline-flex items-center gap-2 ${className}`} aria-label="GreenNeural">
    <Leaf className="h-5 w-5 shrink-0 text-emerald-500" aria-hidden="true" />
    <span className="font-bold tracking-tight text-emerald-700 dark:text-emerald-300">GreenNeural</span>
  </span>;
}
