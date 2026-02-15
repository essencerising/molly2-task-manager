'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Button, Input, Label } from '@/components/ui';
import { toast } from 'sonner';
import { Loader2, LogIn } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                toast.error('Hiba a bejelentkezés során', {
                    description: error.message
                });
                return;
            }

            toast.success('Sikeres bejelentkezés!', {
                description: 'Átirányítás a vezérlőpultra...'
            });

            router.push('/dashboard');
            router.refresh();
        } catch (error) {
            console.error('Login error:', error);
            toast.error('Váratlan hiba történt');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
                        Molly 3.0
                    </h1>
                    <p className="text-slate-400">Jelentkezz be a fiókodba</p>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 md:p-8 backdrop-blur-sm shadow-xl">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email cím</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="pelda@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-slate-950/50 border-slate-700 focus:border-indigo-500"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Jelszó</Label>
                                {/* Később: Elfelejtett jelszó link */}
                            </div>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-slate-950/50 border-slate-700 focus:border-indigo-500"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Belépés...
                                </>
                            ) : (
                                <>
                                    <LogIn className="mr-2 h-4 w-4" />
                                    Belépés
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        <span className="text-slate-500">Nincs még fiókod? </span>
                        <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium hover:underline">
                            Regisztrálj itt
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
