import Link from "next/link";
import { Leaf } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t py-12" style={{ borderColor: 'var(--gn-border)' }}>
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
        <div>
          <div className="flex items-center gap-2">
            <Leaf style={{ color: 'var(--gn-accent)' }} />
            <span className="font-bold text-lg">GreenNeural</span>
          </div>
          <p className="mt-2 text-sm" style={{ color: 'var(--gn-muted)' }}>
            Sustainable tech intelligence platform for developers.
          </p>
        </div>
        <div>
          <h3 className="font-semibold">Navigation</h3>
          <ul className="mt-4 space-y-2">
            <li><Link href="/dashboard" className="text-sm hover:underline" style={{ color: 'var(--gn-muted)' }}>Dashboard</Link></li>
            <li><Link href="/about" className="text-sm hover:underline" style={{ color: 'var(--gn-muted)' }}>About</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold">Security</h3>
          <p className="mt-4 text-sm" style={{ color: 'var(--gn-muted)' }}>
            Your data is protected with industry-standard security.
          </p>
        </div>
      </div>
      <div className="mt-8 text-center text-sm" style={{ color: 'var(--gn-muted)' }}>
        <p>© {new Date().getFullYear()} GreenNeural. All rights reserved.</p>
      </div>
    </footer>
  );
}