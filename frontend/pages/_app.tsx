import type { AppProps } from "next/app";
import { ThemeProvider } from "@/lib/Theme";
import "mapbox-gl/dist/mapbox-gl.css";
import "../styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <Component {...pageProps} />
    </ThemeProvider>
  );
}