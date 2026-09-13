import Link from "next/link";
import { DEMO_USER } from "@/lib/demoUser";
import ThemeToggle from "@/components/ThemeToggle";
import BrandLogo from "@/components/BrandLogo";

type DemoTopBarProps = {
  embed: boolean;
};

export default function DemoTopBar({ embed }: DemoTopBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center gap-3">
        {!embed && <BrandLogo className="h-8 w-auto" />}
        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
          Demo mode
        </span>
        <span className="hidden items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 sm:flex">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-white">
            {DEMO_USER.name.charAt(0)}
          </span>
          {DEMO_USER.name}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Link
          href="/signup"
          className="rounded-md bg-emerald-500 px-4 py-1.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
        >
          Sign up to save your settings
        </Link>
      </div>
    </div>
  );
}
