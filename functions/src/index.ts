import { initializeApp } from 'firebase-admin/app';
import { defineSecret } from 'firebase-functions/params';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

initializeApp();

const tmdbToken = defineSecret('TMDB_READ_ACCESS_TOKEN');
const REGION = 'europe-west1';
const API_BASE = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

type TmdbPerson = {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department?: string;
};

type TmdbMovie = {
  id: number;
  title: string;
  release_date?: string;
  poster_path: string | null;
  character?: string;
  order?: number;
  popularity?: number;
};

async function tmdb<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${API_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${tmdbToken.value()}`, accept: 'application/json' },
    });
  } catch {
    throw new HttpsError('unavailable', 'TMDB est momentanément inaccessible. Réessaie dans un instant.');
  }

  if (response.status === 404) throw new HttpsError('not-found', 'Cette fiche TMDB est introuvable.');
  if (response.status === 429) throw new HttpsError('resource-exhausted', 'Trop de recherches ont été faites. Réessaie plus tard.');
  if (!response.ok) {
    console.error('TMDB request failed', { status: response.status, path });
    throw new HttpsError('unavailable', 'Impossible de charger les données cinéma. Réessaie plus tard.');
  }
  return response.json() as Promise<T>;
}

function numericId(value: unknown, label: string): number {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) throw new HttpsError('invalid-argument', `${label} invalide.`);
  return id;
}

function imageUrl(path: string | null) {
  return path ? `${IMAGE_BASE}${path}` : null;
}

export const searchActors = onCall({ region: REGION, secrets: [tmdbToken], enforceAppCheck: true }, async (request) => {
  const query = typeof request.data?.query === 'string' ? request.data.query.trim().slice(0, 80) : '';
  if (query.length < 2) throw new HttpsError('invalid-argument', 'Saisis au moins deux caractères.');

  const result = await tmdb<{ results: TmdbPerson[] }>('/search/person', {
    query,
    include_adult: 'false',
    language: 'fr-FR',
    page: '1',
  });
  return result.results
    .filter((person) => !person.known_for_department || person.known_for_department === 'Acting')
    .slice(0, 15)
    .map((person) => ({ id: person.id, name: person.name, profileUrl: imageUrl(person.profile_path) }));
});

export const getPopularActors = onCall({ region: REGION, secrets: [tmdbToken], enforceAppCheck: true }, async () => {
  const result = await tmdb<{ results: TmdbPerson[] }>('/person/popular', {
    language: 'fr-FR',
    page: '1',
  });
  return result.results
    .filter((person) => (!person.known_for_department || person.known_for_department === 'Acting') && person.profile_path)
    .slice(0, 12)
    .map((person) => ({ id: person.id, name: person.name, profileUrl: imageUrl(person.profile_path) }));
});

export const getActorMovies = onCall({ region: REGION, secrets: [tmdbToken], enforceAppCheck: true }, async (request) => {
  const actorId = numericId(request.data?.actorId, 'Identifiant acteur');
  const result = await tmdb<{ cast: TmdbMovie[] }>(`/person/${actorId}/movie_credits`, { language: 'fr-FR' });
  return result.cast
    .filter((movie) => movie.title)
    .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0) || sortByReleaseDate(a.release_date, b.release_date))
    .slice(0, 100)
    .map((movie) => ({
      id: movie.id,
      title: movie.title,
      year: movie.release_date?.slice(0, 4) ?? null,
      posterUrl: imageUrl(movie.poster_path),
      character: movie.character ?? null,
    }));
});

function sortByReleaseDate(first: string | undefined, second: string | undefined) {
  if (!first) return second ? 1 : 0;
  if (!second) return -1;
  return second.localeCompare(first);
}

export const getMovieCast = onCall({ region: REGION, secrets: [tmdbToken], enforceAppCheck: true }, async (request) => {
  const movieId = numericId(request.data?.movieId, 'Identifiant film');
  const result = await tmdb<{ id: number; title: string; release_date?: string; poster_path: string | null; cast: TmdbPerson[] }>(
    `/movie/${movieId}/credits`,
    { language: 'fr-FR' },
  );
  return {
    id: result.id,
    title: result.title,
    year: result.release_date?.slice(0, 4) ?? null,
    posterUrl: imageUrl(result.poster_path),
    cast: result.cast.slice(0, 30).map((person) => ({
      id: person.id,
      name: person.name,
      profileUrl: imageUrl(person.profile_path),
    })),
  };
});
