'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Button, Input, Label } from '@/components/ui';
import { toast } from 'sonner';
import { Loader2, UserPlus } from 'lucide-react';

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [success, setSuccess] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Sign up with Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                },
            });

            if (authError) {
                toast.error('Hiba a regisztráció során', {
                    description: authError.message
                });
                return;
            }

            if (authData.user) {
                // Check if session is missing (indicates email confirmation is required)
                if (!authData.session) {
                    setSuccess(true);
                    toast.success('Sikeres regisztráció!', {
                        description: 'Kérlek erősítsd meg az email címedet!'
                    });
                } else {
                    // Auto-login successful (email confirmation disabled)
                    toast.success('Sikeres regisztráció!', {
                        description: 'Üdvözlünk a Molly 3.0-ban!'
                    });
                    router.push('/dashboard');
                    router.refresh();
                }
            }
        } catch (error) {
            console.error('Registration error:', error);
            toast.error('Váratlan hiba történt');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
                <div className="w-full max-w-md text-center space-y-6 bg-slate-900/50 border border-slate-800 rounded-xl p-8 backdrop-blur-sm shadow-xl animate-in fade-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                        <UserPlus className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Sikeres regisztráció!</h2>
                    <p className="text-slate-300">
                        Elküldtük a visszaigazoló emailt a(z) <br />
                        <span className="font-semibold text-indigo-400">{email}</span> címre.
                    </p>
                    <p className="text-sm text-slate-400">
                        A fiókod aktiválásához kattints az emailben található linkre.
                    </p>
                    <div className="pt-4">
                        <Link href="/login">
                            <Button className="w-full" variant="outline">
                                Vissza a bejelentkezéshez
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
                        Molly 3.0
                    </h1>
                    <p className="text-slate-400">Hozz létre új fiókot</p>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 md:p-8 backdrop-blur-sm shadow-xl">
                    <form onSubmit={handleRegister} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Teljes név</Label>
                            <Input
                                id="fullName"
                                type="text"
                                placeholder="Kovács János"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                className="bg-slate-950/50 border-slate-700 focus:border-indigo-500"
                            />
                        </div>

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
                            <Label htmlFor="password">Jelszó</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Legalább 6 karakter"
                                minLength={6}
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
                                    Regisztráció...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Regisztráció
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        <span className="text-slate-500">Már van fiókod? </span>
                        <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium hover:underline">
                            Lépj be itt
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
