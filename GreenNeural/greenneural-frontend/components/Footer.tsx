export default function Footer() {
  return (
    <footer className="mt-12 py-6 text-center text-gray-600 dark:text-gray-400">
      <p>GreenNeural uses encrypted storage and secure authentication.</p>
      <p>Your sustainability data is protected with industry‑standard security.</p>
      <p>We never sell or share your data.</p>
      <p className="mt-4">
        <a href="/about" className="text-green-600 dark:text-green-400">
          About GreenNeural
        </a>
      </p>
      <a
        href="https://launchtry.com/product/green-neural-v1?utm_source=greenneural-frontend.vercel.app&utm_medium=badge&utm_campaign=launch_badge"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="View Green Neural v1 on LaunchTry"
        className="mt-6 inline-flex items-center no-underline"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="184"
          height="44"
          viewBox="0 0 184 44"
          role="img"
          aria-label="Launching on LaunchTry"
          className="block h-11 w-[184px] max-w-full"
        >
          <path d="M14 0.5H170A13.5 13.5 0 0 1 183.5 14V43.5H0.5V14A13.5 13.5 0 0 1 14 0.5Z" fill="#FFFFFF" stroke="#E8E3DA" />
          <rect x="1" y="42" width="182" height="1.5" fill="#F97316" opacity="0.92" />
          <g transform="translate(14 10)" fill="none" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 17.8c5.2-6.9 10.9-11.6 18-14.8-1.4 7.5-4.9 13.9-10.8 19.5l-1.8-6-5.4 1.3Z" />
            <path d="M11.3 8.8 16.5 14" />
            <path d="M3.3 21.2c3.3-.1 6.3-.8 9-2.1" />
          </g>
          <text x="45" y="18" fill="#6B6258" fontFamily="Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif" fontSize="9" fontWeight="600" letterSpacing=".9">LAUNCHING ON</text>
          <text x="45" y="31" fill="#111111" fontFamily="Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif" fontSize="15" fontWeight="700">LaunchTry</text>
        </svg>
      </a>
    </footer>
  );
}
