import { getFunctions, httpsCallable } from 'firebase/functions';

import { getFirebaseApp } from '@/src/lib/firebase';

export type TmdbActor = { id: number; name: string; profileUrl: string | null };
export type TmdbFilm = { id: number; title: string; year: string | null; posterUrl: string | null; character: string | null };
export type TmdbMovieCast = {
  id: number;
  title: string;
  year: string | null;
  posterUrl: string | null;
  cast: TmdbActor[];
};

function functions() {
  return getFunctions(getFirebaseApp(), 'europe-west1');
}

async function requestTmdb<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const token = process.env.EXPO_PUBLIC_TMDB_READ_ACCESS_TOKEN;
  if (!token) throw new Error('TMDB development token is not configured.');
  const url = new URL(`https://api.themoviedb.org/3${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  let response: Response;
  try {
    response = await fetch(url, { headers: { Authorization: `Bearer ${token}`, accept: 'application/json' } });
  } catch {
    throw new Error('TMDB is unreachable.');
  }
  const body = await response.json();
  if (response.status === 401) throw new Error('TMDB development token is invalid.');
  if (response.status === 429) throw new Error('TMDB rate limit reached.');
  if (!response.ok) throw new Error(`TMDB request failed (${response.status}).`);
  return body as T;
}

export async function searchActors(query: string): Promise<TmdbActor[]> {
  if (__DEV__) {
    const result = await requestTmdb<{ results: Array<{ id: number; name: string; profile_path: string | null; known_for_department?: string }> }>(
      '/search/person', { query, include_adult: 'false', language: 'fr-FR', page: '1' },
    );
    return result.results
      .filter((actor) => !actor.known_for_department || actor.known_for_department === 'Acting')
      .slice(0, 15)
      .map((actor) => ({ id: actor.id, name: actor.name, profileUrl: tmdbImage(actor.profile_path) }));
  }
  const call = httpsCallable<{ query: string }, TmdbActor[]>(functions(), 'searchActors');
  const result = await call({ query });
  return result.data;
}

export async function getPopularActors(): Promise<TmdbActor[]> {
  if (__DEV__) {
    const result = await requestTmdb<{ results: Array<{ id: number; name: string; profile_path: string | null; known_for_department?: string }> }>(
      '/person/popular', { language: 'fr-FR', page: '1' },
    );
    return result.results
      .filter((actor) => (!actor.known_for_department || actor.known_for_department === 'Acting') && actor.profile_path)
      .slice(0, 12)
      .map((actor) => ({ id: actor.id, name: actor.name, profileUrl: tmdbImage(actor.profile_path) }));
  }
  const call = httpsCallable<void, TmdbActor[]>(functions(), 'getPopularActors');
  const result = await call();
  return result.data;
}

export async function getActorMovies(actorId: number): Promise<TmdbFilm[]> {
  if (__DEV__) {
    const result = await requestTmdb<{ cast: Array<{ id: number; title: string; release_date?: string; poster_path: string | null; character?: string; popularity?: number }> }>(
      `/person/${actorId}/movie_credits`, { language: 'fr-FR' },
    );
    return result.cast
      .filter((film) => film.title)
      .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0) || sortByReleaseDate(a.release_date, b.release_date))
      .slice(0, 100)
      .map((film) => ({ id: film.id, title: film.title, year: film.release_date?.slice(0, 4) ?? null, posterUrl: tmdbImage(film.poster_path), character: film.character ?? null }));
  }
  const call = httpsCallable<{ actorId: number }, TmdbFilm[]>(functions(), 'getActorMovies');
  const result = await call({ actorId });
  return result.data;
}

export async function getMovieCast(movieId: number): Promise<TmdbMovieCast> {
  if (__DEV__) {
    const result = await requestTmdb<{ id: number; title: string; release_date?: string; poster_path: string | null; cast: Array<{ id: number; name: string; profile_path: string | null }> }>(
      `/movie/${movieId}/credits`, { language: 'fr-FR' },
    );
    return {
      id: result.id,
      title: result.title,
      year: result.release_date?.slice(0, 4) ?? null,
      posterUrl: tmdbImage(result.poster_path),
      cast: result.cast.slice(0, 30).map((person) => ({ id: person.id, name: person.name, profileUrl: tmdbImage(person.profile_path) })),
    };
  }
  const call = httpsCallable<{ movieId: number }, TmdbMovieCast>(functions(), 'getMovieCast');
  const result = await call({ movieId });
  return result.data;
}

export function apiErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.includes('TMDB development token is not configured')) {
    return 'Ajoute le jeton TMDB à la variable de développement EXPO_PUBLIC_TMDB_READ_ACCESS_TOKEN.';
  }
  if (error instanceof Error && error.message.includes('TMDB development token is invalid')) {
    return 'Le jeton TMDB de développement est invalide.';
  }
  if (error instanceof Error && error.message.includes('TMDB rate limit')) {
    return 'TMDB limite temporairement les requêtes. Réessaie dans un instant.';
  }
  if (error instanceof Error && error.message.includes('TMDB is unreachable')) {
    return 'Connexion à TMDB impossible. Vérifie Internet puis réessaie.';
  }
  if (error instanceof Error && error.message.includes('Firebase is not configured')) {
    return 'Firebase n’est pas encore configuré pour cette application. Ajoute les paramètres du projet dans le fichier .env local.';
  }
  if (error && typeof error === 'object' && 'code' in error) {
    const code = String(error.code);
    if (code.includes('unauthenticated') || code.includes('failed-precondition')) {
      return 'Le service cinéma n’est pas encore configuré. Réessaie après la configuration Firebase.';
    }
    if (code.includes('permission-denied')) {
      return 'La sécurité de l’application n’est pas encore configurée pour ce service.';
    }
    if (code.includes('unavailable') || code.includes('network')) {
      return 'Connexion impossible. Vérifie Internet puis réessaie.';
    }
    if (code.includes('not-found')) return 'Aucun résultat disponible pour cette fiche.';
  }
  return 'Une erreur est survenue. Réessaie.';
}

function tmdbImage(path: string | null) {
  return path ? `https://image.tmdb.org/t/p/w500${path}` : null;
}

function sortByReleaseDate(first: string | undefined, second: string | undefined) {
  if (!first) return second ? 1 : 0;
  if (!second) return -1;
  return second.localeCompare(first);
}
