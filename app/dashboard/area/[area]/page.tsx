// app/dashboard/area/[area]/page.tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchTasksByArea } from '@/lib/tasksService';
import { AreaTasksClient } from '@/features/tasks/AreaTasksClient';

interface AreaPageProps {
  params: Promise<{
    area: string;
  }>;
}

export default async function AreaPage(props: AreaPageProps) {
  const { area: rawArea } = await props.params;
  const area = decodeURIComponent(rawArea);

  const tasks = await fetchTasksByArea(area);

  if (!tasks) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* Topbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {area}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Ide tartozó feladatok, státuszokkal, felelősökkel és follow‑up dátumokkal.
            </p>
          </div>
          <nav className="flex items-center gap-3 text-sm text-slate-300">
            <Link href="/dashboard" className="hover:text-white transition-colors">
              Vissza a dashboardra
            </Link>
            <Link href="/" className="hover:text-white transition-colors">
              Feladatlista
            </Link>
          </nav>
        </div>
      </header>

      {/* Tartalom */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <AreaTasksClient area={area} tasks={tasks as any} />
      </section>
    </main>
  );
}
