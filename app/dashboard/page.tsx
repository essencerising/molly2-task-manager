// app/dashboard/page.tsx
import Link from 'next/link';
import { fetchAreas, fetchTasks } from '@/lib/tasksService';
import { TodayTasksPanel } from '@/features/dashboard/TodayTasksPanel';
import { DelegatedTasksPanel } from '@/features/dashboard/DelegatedTasksPanel';
import { UpcomingFollowupsPanel } from '@/features/dashboard/UpcomingFollowupsPanel';
import { DashboardTasksClient } from '@/features/tasks/DashboardTasksClient';


export default async function DashboardPage() {
  const areas = await fetchAreas();
  const tasks = await fetchTasks(); // minden feladat

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* Topbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Delegation Dashboard
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Áttekintés a mai feladataidról, az általad delegált munkákról,
              a közelgő follow‑upokról és a projektjeidről (area‑k).
            </p>
          </div>
          <nav className="flex items-center gap-3 text-sm text-slate-300">
            <Link href="/" className="hover:text-white transition-colors">
              Vissza a feladatlistához
            </Link>
          </nav>
        </div>
      </header>

      {/* Felső kártyás blokk */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Kártya 1: Mai feladataid */}
          <Link
            href="#today"
            className="group rounded-xl border border-slate-800 bg-slate-900/60 p-5 hover:border-sky-500 hover:bg-slate-900 transition-colors cursor-pointer flex flex-col justify-between"
          >
            <div>
              <h2 className="text-lg font-semibold mb-1 group-hover:text-sky-400 transition-colors">
                Mai fókuszod
              </h2>
              <p className="text-sm text-slate-400">
                A ma szempontjából fontos feladatok és határidők – lásd lejjebb
                a „Mai feladataid” panelben.
              </p>
            </div>
            <div className="mt-4 text-xs text-slate-500">
              Később: valós lista, státusz, gyors akciók.
            </div>
          </Link>

          {/* Kártya 2: Általad delegált feladatok */}
          <Link
            href="#delegated"
            className="group rounded-xl border border-slate-800 bg-slate-900/60 p-5 hover:border-amber-500 hover:bg-slate-900 transition-colors cursor-pointer flex flex-col justify-between"
          >
            <div>
              <h2 className="text-lg font-semibold mb-1 group-hover:text-amber-300 transition-colors">
                Általad delegált feladatok
              </h2>
              <p className="text-sm text-slate-400">
                Minden feladat, amit másnak adtál ki, hogy lásd, hol tartanak a
                delegálások.
              </p>
            </div>
            <div className="mt-4 text-xs text-slate-500">
              Később: „delegáló” mező, státusz szerinti csoportosítás.
            </div>
          </Link>

          {/* Kártya 3: Közelgő follow‑upok */}
          <Link
            href="#followups"
            className="group rounded-xl border border-slate-800 bg-slate-900/60 p-5 hover:border-emerald-500 hover:bg-slate-900 transition-colors cursor-pointer flex flex-col justify-between"
          >
            <div>
              <h2 className="text-lg font-semibold mb-1 group-hover:text-emerald-300 transition-colors">
                Közelgő follow‑upok
              </h2>
              <p className="text-sm text-slate-400">
                A közeljövőben esedékes follow‑up dátumok, hogy biztosan utána
                tudj menni a fontos ügyeknek.
              </p>
            </div>
            <div className="mt-4 text-xs text-slate-500">
              Később: dátum szerinti rendezés, naptár nézetbe ugrás.
            </div>
          </Link>
        </div>
      </section>

      {/* Mai feladataid panel */}
      <section id="today" className="mx-auto max-w-6xl px-4 pb-8">
        {/* Itt most még nem szűrünk konkrét e-mailre, minden ma esedékes feladat jön. */}
        {/* Később: <TodayTasksPanel assigneeEmail={currentUser.email} /> */}
        {/* @ ts-expect-error Server Component */}
        <TodayTasksPanel />
      </section>

      {/* Általad delegált feladatok panel */}
      <section id="delegated" className="mx-auto max-w-6xl px-4 pb-8">
        {/* Később: delegatorEmail={currentUser.email} */}
        {/* @ ts-expect-error Server Component */}
        <DelegatedTasksPanel />
      </section>

      {/* Közelgő follow-upok panel */}
      <section id="followups" className="mx-auto max-w-6xl px-4 pb-12">
        {/* Később: assigneeEmail={currentUser.email} vagy delegator szűrés */}
        {/* @ ts-expect-error Server Component */}
        <UpcomingFollowupsPanel daysAhead={7} />
      </section>

      {/* Globális feladat naptár / lista */}
      <section className="mx-auto max-w-6xl px-4 pb-12">
        <DashboardTasksClient tasks={tasks as any} />
      </section>

      {/* Projektek / area-k szekció */}
      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Projektjeid (area‑k)</h2>
            <p className="text-sm text-slate-400 mt-1">
              Minden area egy külön projekt / életterület (pl. Tanya, CarpLove,
              stb.).
            </p>
          </div>
          {/* Később ide jöhet filter, view váltó (Lista / Naptár) */}
        </div>

        {areas.length === 0 ? (
          <p className="text-sm text-slate-500">
            Még nincs egyetlen area sem a feladatokban. Hozz létre új feladatot
            egy area megadásával, és itt meg fog jelenni.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {areas.map((area) => (
              <Link
                key={area}
                href={`/dashboard/area/${encodeURIComponent(area)}`}
                className="group rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-sky-500 hover:bg-slate-900 transition-colors cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-base font-semibold group-hover:text-sky-400 transition-colors">
                    {area}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Projekt / életterület. Kattints, hogy lásd az ide tartozó
                    feladatokat.
                  </p>
                </div>
                <div className="mt-3 text-[11px] text-slate-500">
                  Később: feladatok száma, nyitott / kész, következő határidő,
                  naptárnézet.
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
