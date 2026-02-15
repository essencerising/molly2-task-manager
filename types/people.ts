// types/people.ts
export type Person = {
  id: string;
  name: string;
  email: string | null;
  area?: string | null; // Legacy
  created_at?: string; // Legacy
  avatar_url?: string | null; // New
  role?: string; // New
};
