import type { SignalTrend } from "./liveHomeTypes";

type Props = {
  value: number | null;
  trend: SignalTrend | undefined;
  updatedAt: string | null;
  className?: string;
};

export default function SignalValue({
  value,
  trend,
  updatedAt,
  className = "",
}: Props) {
  const animation =
    trend === "down"
      ? "animate-[flash-green_600ms_ease-out]"
      : trend === "up"
        ? "animate-[flash-red_600ms_ease-out]"
        : "animate-[fade-neutral_600ms_ease-out]";

  return (
    <span
      key={`${updatedAt ?? "no-time"}-${value ?? "no-value"}`}
      className={`inline-block motion-reduce:animate-none ${animation} ${className}`}
    >
      {value === null ? "—" : Math.round(value).toLocaleString()}
    </span>
  );
}
