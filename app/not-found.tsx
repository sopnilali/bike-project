import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
      <p className="text-sm font-bold uppercase tracking-wider text-slate-400">404</p>
      <h1 className="mt-1 text-xl font-extrabold text-slate-900">Page not found</h1>
      <p className="mt-1 text-sm text-slate-500">
        The page you are looking for does not exist.
      </p>
      <Link
        href="/"
        className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
      >
        Go to dashboard
      </Link>
    </div>
  );
}
