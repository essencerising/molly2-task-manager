import { Skeleton } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
    return (
        <main className="min-h-screen bg-slate-950 text-slate-50">
            {/* Topbar Skeleton */}
            <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
                <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
                    <div>
                        <Skeleton className="h-8 w-48 mb-2" />
                        <Skeleton className="h-4 w-96" />
                    </div>
                    <Skeleton className="h-4 w-32" />
                </div>
            </header>

            {/* Felső kártyák Skeleton */}
            <section className="mx-auto max-w-6xl px-4 py-8">
                <div className="grid gap-6 md:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 h-40 flex flex-col justify-between">
                            <div>
                                <Skeleton className="h-6 w-3/4 mb-2" />
                                <Skeleton className="h-4 w-full mb-1" />
                                <Skeleton className="h-4 w-2/3" />
                            </div>
                            <Skeleton className="h-3 w-1/3" />
                        </div>
                    ))}
                </div>
            </section>

            {/* Panelek Skeleton */}
            <section className="mx-auto max-w-6xl px-4 pb-8 space-y-8">
                {[1, 2, 3].map((panel) => (
                    <div key={panel}>
                        <Skeleton className="h-6 w-48 mb-4" />
                        <div className="space-y-3">
                            {[1, 2].map((item) => (
                                <Skeleton key={item} className="h-16 w-full rounded-lg" />
                            ))}
                        </div>
                    </div>
                ))}
            </section>
        </main>
    );
}
