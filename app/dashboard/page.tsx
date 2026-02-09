// app/dashboard/page.tsx
import Link from 'next/link';
import { fetchAreas, fetchTasks } from '@/lib/tasksService';
import { DashboardTasksClient } from '@/features/tasks/DashboardTasksClient';


export default async function DashboardPage() {
  const areas = await fetchAreas();
  // Dashboardzon többet akarunk látni, mint 20
  const { data: tasks } = await fetchTasks({ limit: 100 });

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

      {/* Globális feladat naptár / lista + KPI kártyák (most már ez a fő nézet) */}
      <section className="mx-auto max-w-6xl px-4 py-8">
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
