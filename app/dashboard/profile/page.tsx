'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Button, Input, Label } from '@/components/ui';
import { toast } from 'sonner';
import { Loader2, User, LogOut, Save, ChevronLeft } from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [fullName, setFullName] = useState('');

    useEffect(() => {
        const getUser = async () => {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error || !user) {
                router.push('/login');
                return;
            }
            setUser(user);
            setFullName(user.user_metadata.full_name || '');
            setLoading(false);
        };

        getUser();
    }, [router]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const { error } = await supabase.auth.updateUser({
                data: { full_name: fullName }
            });

            if (error) {
                toast.error('Hiba a mentés során', { description: error.message });
                return;
            }

            // Update profiles table as well if needed, but users usually just update auth metadata or we sync it.
            // Let's also update the profiles table for consistency if it exists.
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: user?.id,
                    full_name: fullName,
                    updated_at: new Date().toISOString(),
                });

            if (profileError) {
                console.error('Profile table update error:', profileError);
            }

            toast.success('Profil frissítve!');
            router.refresh();
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Váratlan hiba történt');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-4 md:p-8">
            <div className="mb-6">
                <Button
                    variant="ghost"
                    onClick={() => router.push('/dashboard')}
                    className="text-slate-400 hover:text-white pl-0 gap-2"
                >
                    <ChevronLeft size={20} />
                    Vissza a vezérlőpultra
                </Button>
            </div>
            <h1 className="text-3xl font-bold mb-8 text-white">Profilom</h1>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 md:p-8 backdrop-blur-sm shadow-xl space-y-8">

                {/* User Info Section */}
                <div className="flex items-center gap-4 border-b border-slate-800 pb-8">
                    <div className="h-20 w-20 rounded-full bg-indigo-600 flex items-center justify-center text-3xl font-bold text-white">
                        {fullName ? fullName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-white">{fullName || 'Névtelen Felhasználó'}</h2>
                        <p className="text-slate-400">{user?.email}</p>
                        <span className="inline-block mt-2 px-2 py-1 bg-slate-800 rounded text-xs text-slate-500">
                            Utolsó belépés: {new Date(user?.last_sign_in_at || '').toLocaleDateString()}
                        </span>
                    </div>
                </div>

                {/* Edit Form */}
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email cím (nem módosítható)</Label>
                        <Input
                            id="email"
                            value={user?.email || ''}
                            disabled
                            className="bg-slate-950/30 border-slate-800 text-slate-500 cursor-not-allowed"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="fullName">Teljes név</Label>
                        <Input
                            id="fullName"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Add meg a neved"
                            className="bg-slate-950/50 border-slate-700 focus:border-indigo-500"
                        />
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 pt-4">
                        <Button
                            type="submit"
                            className="bg-indigo-600 hover:bg-indigo-500 text-white flex-1"
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Mentés...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Változások mentése
                                </>
                            )}
                        </Button>

                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleLogout}
                            className="flex-1"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Kijelentkezés
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
