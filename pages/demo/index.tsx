import { useRouter } from "next/router";
import DemoLayout from "@/components/DemoLayout";

export default function DemoPage() {
  const router = useRouter();
  const embed = router.query.embed === "true";

  return <DemoLayout embed={!!embed} />;
}