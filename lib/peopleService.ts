// lib/peopleService.ts
import { supabase } from './supabaseClient';
import type { Person } from '@/types/people';

export async function getPeopleByArea(area: string): Promise<Person[]> {
  const { data, error } = await supabase
    .from('people')
    .select('*')
    .or(`area.eq.${area},area.is.null`)
    .order('name', { ascending: true });

  if (error) {
    console.error('getPeopleByArea error', error);
    throw error;
  }

  return data ?? [];
}

export async function createPerson(input: {
  name: string;
  email?: string;
  area?: string;
}): Promise<Person> {
  const { data, error } = await supabase
    .from('people')
    .insert({
      name: input.name,
      email: input.email ?? null,
      area: input.area ?? null,
    })
    .select('*')
    .single();

  if (error) {
    console.error('createPerson error', error);
    throw error;
  }

  return data as Person;
}
