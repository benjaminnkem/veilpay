import type { Company } from '@repo/types';

const demoCompany: Company = {
  id: 'cmp_demo',
  name: 'VeilPay Demo Co',
  status: 'active',
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
};

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 font-sans dark:bg-black">
      <main className="flex w-full max-w-xl flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-10 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            VeilPay monorepo
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Web app is running
          </h1>
          <p className="mt-3 text-base leading-7 text-zinc-600 dark:text-zinc-400">
            Shared types from{' '}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-sm dark:bg-zinc-900">
              @repo/types
            </code>{' '}
            are wired into this app.
          </p>
        </div>

        <dl className="grid gap-3 rounded-xl bg-zinc-50 p-4 text-sm dark:bg-zinc-900/60">
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Company</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-100">
              {demoCompany.name}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Status</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-100">
              {demoCompany.status}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">API</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-100">
              http://localhost:3001
            </dd>
          </div>
        </dl>
      </main>
    </div>
  );
}
