import { FormEvent, useCallback, useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { ArrowLeft, LoaderCircle, Sparkles } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import { supabase } from "../lib/supabaseClient";

type UpgradeEntry = {
  id: string;
  entry: string;
  created_at: string;
};

type UpgradeLogResponse = {
  entries: UpgradeEntry[];
  is_admin: boolean;
};

const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

export default function UpdatesPage() {
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [log, setLog] = useState<UpgradeLogResponse | null>(null);
  const [entry, setEntry] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLog = useCallback(async (token: string) => {
    const response = await fetch(`${apiUrl}/api/v1/upgrade-log`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 401) {
      setSignedIn(false);
      setAccessToken(null);
      setLog(null);
      return;
    }
    if (!response.ok) {
      throw new Error("Upgrade log is temporarily unavailable. Please try again later.");
    }
    const result: UpgradeLogResponse = await response.json();
    setLog(result);
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session?.access_token) {
          if (active) setSignedIn(false);
          return;
        }
        if (active) {
          setSignedIn(true);
          setAccessToken(session.access_token);
          await loadLog(session.access_token);
        }
      } catch {
        if (active) {
          setError("Upgrade log is temporarily unavailable. Please try again later.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [loadLog]);

  async function publishEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken || !entry.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/api/v1/upgrade-log`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ entry }),
      });
      if (response.status === 403) {
        setError("Only platform admins can publish upgrade log entries.");
        return;
      }
      if (response.status === 401) {
        setSignedIn(false);
        setAccessToken(null);
        setLog(null);
        return;
      }
      if (!response.ok) {
        throw new Error("Could not publish this update. Please try again.");
      }
      await loadLog(accessToken);
      setEntry("");
    } catch {
      setError("Could not publish this update. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout>
      <Head>
        <title>Daily Upgrade Log | GreenNeural</title>
        <meta
          name="description"
          content="A member-only timeline of GreenNeural platform improvements."
        />
      </Head>
      <main className="mx-auto max-w-4xl space-y-7">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-300"
        >
          <ArrowLeft size={16} aria-hidden="true" /> Homepage
        </Link>
        <header>
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
            <Sparkles size={14} aria-hidden="true" />
            Member updates
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
            Daily Upgrade Log
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-emerald-50/60">
            A transparent changelog of improvements to GreenNeural.
          </p>
        </header>

        {loading ? (
          <p
            className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-emerald-50/60"
            role="status"
          >
            <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
            Checking your session…
          </p>
        ) : !signedIn ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-white/[0.04]">
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
              Sign in to view platform upgrades
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-emerald-50/60">
              The Daily Upgrade Log is available to authenticated members.
            </p>
            <Link
              href="/login?next=%2Fupdates"
              className="mt-5 inline-flex rounded-lg bg-emerald-300 px-4 py-2.5 text-sm font-semibold text-[#07120f] hover:bg-emerald-200"
            >
              Sign in
            </Link>
          </section>
        ) : (
          <>
            {error && (
              <p
                className="rounded-xl border border-amber-500/20 bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
                role="alert"
              >
                {error}
              </p>
            )}

            {log?.is_admin && (
              <form
                onSubmit={publishEntry}
                className="rounded-2xl border border-emerald-900/10 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]"
              >
                <label
                  htmlFor="upgrade-entry"
                  className="block text-sm font-semibold text-slate-900 dark:text-white"
                >
                  Publish a platform update
                </label>
                <textarea
                  id="upgrade-entry"
                  value={entry}
                  onChange={(event) => setEntry(event.target.value)}
                  maxLength={1000}
                  rows={3}
                  required
                  className="mt-3 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-white/10 dark:bg-[#07120f] dark:text-white"
                  placeholder="Describe an improvement…"
                />
                <div className="mt-3 flex items-center justify-between gap-4">
                  <span className="text-xs text-slate-500 dark:text-white/40">
                    {entry.length}/1000 characters
                  </span>
                  <button
                    type="submit"
                    disabled={saving || !entry.trim()}
                    className="rounded-lg bg-emerald-300 px-4 py-2 text-sm font-semibold text-[#07120f] hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? "Publishing…" : "Publish update"}
                  </button>
                </div>
              </form>
            )}

            <section aria-label="Platform updates">
              {log?.entries.length ? (
                <ol className="space-y-4">
                  {log.entries.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]"
                    >
                      <time
                        dateTime={item.created_at}
                        className="text-xs font-medium text-emerald-700 dark:text-emerald-300"
                      >
                        {new Date(item.created_at).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </time>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-emerald-50/75">
                        {item.entry}
                      </p>
                    </li>
                  ))}
                </ol>
              ) : (
                !error && (
                  <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-emerald-50/60">
                    No upgrades have been published yet. Check back soon.
                  </p>
                )
              )}
            </section>
          </>
        )}
      </main>
    </DashboardLayout>
  );
}
