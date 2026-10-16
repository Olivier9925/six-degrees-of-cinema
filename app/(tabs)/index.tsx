import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Text } from '@/components/Themed';
import { apiErrorMessage, getActorMovies, getMovieCast, getPopularActors, searchActors, type TmdbActor, type TmdbFilm, type TmdbMovieCast } from '@/src/lib/tmdb-api';

type Link = { from: TmdbActor; film: TmdbFilm; to: TmdbActor };
type ActorField = 'start' | 'target';

export default function PlayScreen() {
  const [startActor, setStartActor] = useState<TmdbActor | null>(null);
  const [targetActor, setTargetActor] = useState<TmdbActor | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [screen, setScreen] = useState<'setup' | 'actor' | 'film'>('setup');
  const [selectedFilm, setSelectedFilm] = useState<TmdbFilm | null>(null);
  const [films, setFilms] = useState<TmdbFilm[]>([]);
  const [movie, setMovie] = useState<TmdbMovieCast | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [suggestedActors, setSuggestedActors] = useState<TmdbActor[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);

  const currentActor = links.at(-1)?.to ?? startActor;
  const won = Boolean(currentActor && targetActor && currentActor.id === targetActor.id && screen !== 'setup');

  useEffect(() => {
    if (screen !== 'setup' || suggestedActors.length > 0) return;
    let active = true;
    setSuggestionsLoading(true);
    getPopularActors()
      .then((actors) => { if (active) setSuggestedActors(actors); })
      .catch((reason: unknown) => { if (active) setSuggestionsError(apiErrorMessage(reason)); })
      .finally(() => { if (active) setSuggestionsLoading(false); });
    return () => { active = false; };
  }, [screen, suggestedActors.length]);

  useEffect(() => {
    if (screen !== 'actor' || !currentActor) return;
    let active = true;
    setLoading(true);
    setError(null);
    getActorMovies(currentActor.id)
      .then((result) => { if (active) setFilms(result); })
      .catch((reason: unknown) => { if (active) setError(apiErrorMessage(reason)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [screen, currentActor?.id, reloadKey]);

  useEffect(() => {
    if (screen !== 'film' || !selectedFilm) return;
    let active = true;
    setLoading(true);
    setError(null);
    setMovie(null);
    getMovieCast(selectedFilm.id)
      .then((result) => { if (active) setMovie(result); })
      .catch((reason: unknown) => { if (active) setError(apiErrorMessage(reason)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [screen, selectedFilm?.id, reloadKey]);

  function chooseActor(field: ActorField, actor: TmdbActor) {
    if (field === 'start') setStartActor(actor);
    else setTargetActor(actor);
    setError(null);
  }

  function beginGame() {
    if (!startActor || !targetActor) return;
    if (startActor.id === targetActor.id) {
      setError('Choisis deux acteurs différents.');
      return;
    }
    setLinks([]);
    setScreen('actor');
  }

  function chooseCastMember(actor: TmdbActor) {
    if (!currentActor || !selectedFilm) return;
    setLinks((previous) => [...previous, { from: currentActor, film: selectedFilm, to: actor }]);
    setSelectedFilm(null);
    setMovie(null);
    setScreen('actor');
  }

  function goBack() {
    setError(null);
    if (screen === 'film') {
      setScreen('actor');
      setSelectedFilm(null);
      return;
    }
    if (links.length > 0) {
      setLinks((previous) => previous.slice(0, -1));
      return;
    }
    setScreen('setup');
  }

  function newGame() {
    setStartActor(null);
    setTargetActor(null);
    setLinks([]);
    setFilms([]);
    setMovie(null);
    setSelectedFilm(null);
    setError(null);
    setScreen('setup');
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.topLine}>
        <Text style={styles.brand}>SIX° CINEMA</Text>
        {screen !== 'setup' ? <Pressable accessibilityRole="button" onPress={newGame}><Text style={styles.reset}>Nouvelle partie</Text></Pressable> : null}
      </View>
      <Text style={styles.title}>{won ? <>Connexion{`\n`}trouvée !</> : screen === 'setup' ? <>Choisis les deux.{`\n`}Trouve le lien.</> : <>De fiche en fiche.{`\n`}À toi de jouer.</>}</Text>

      {screen === 'setup' ? (
        <>
          <Text style={styles.intro}>Choisis un acteur de départ et un acteur cible. Tu avanceras ensuite par les films qu’ils ont en commun avec d’autres acteurs.</Text>
          <ActorPicker label="ACTEUR DE DÉPART" role="start" excludeActorId={targetActor?.id} suggestions={suggestedActors} suggestionsLoading={suggestionsLoading} suggestionsError={suggestionsError} selected={startActor} onSelect={(actor) => chooseActor('start', actor)} onClear={() => setStartActor(null)} />
          <ActorPicker label="ACTEUR CIBLE" role="target" excludeActorId={startActor?.id} suggestions={suggestedActors} suggestionsLoading={suggestionsLoading} suggestionsError={suggestionsError} selected={targetActor} onSelect={(actor) => chooseActor('target', actor)} onClear={() => setTargetActor(null)} />
          {error ? <ErrorNotice message={error} onRetry={() => setError(null)} /> : null}
          <Pressable accessibilityRole="button" disabled={!startActor || !targetActor} onPress={beginGame} style={[styles.primaryButton, (!startActor || !targetActor) && styles.buttonDisabled]}>
            <Text style={styles.primaryButtonText}>Commencer la partie</Text>
          </Pressable>
          <Text style={styles.demoNote}>Les recherches et les fiches sont fournies par TMDB.</Text>
        </>
      ) : won && startActor && targetActor ? (
        <>
          <View style={styles.successCard}>
            <Text style={styles.successEyebrow}>BRAVO, TU AS RÉUSSI !</Text>
            <Text style={styles.successTitle}>Six degrés de séparation</Text>
            <View style={styles.successPeople}>
              <View style={styles.successPerson}>
                <Text style={styles.successLabel}>DÉPART</Text>
                <ActorImage uri={startActor.profileUrl} name={startActor.name} size={88} />
                <Text numberOfLines={2} style={styles.successName}>{startActor.name}</Text>
              </View>
              <Text style={styles.successArrow}>→</Text>
              <View style={styles.successPerson}>
                <Text style={styles.successLabel}>ARRIVÉE</Text>
                <ActorImage uri={targetActor.profileUrl} name={targetActor.name} size={88} />
                <Text numberOfLines={2} style={styles.successName}>{targetActor.name}</Text>
              </View>
            </View>
            <View style={styles.finalScore}>
              <Text style={styles.finalScoreNumber}>{links.length}</Text>
              <Text style={styles.finalScoreText}>{links.length === 1 ? 'liaison' : 'liaisons'}</Text>
            </View>
          </View>

          <Text style={styles.recapHeading}>Ton parcours</Text>
          <View style={styles.recapCard}>
            <View style={styles.recapActor}><View style={styles.recapDot} /><Text style={styles.recapActorName}>{startActor.name}</Text></View>
            {links.map((link, index) => (
              <View key={`${link.film.id}-${index}`} style={styles.recapLink}>
                <View style={styles.recapConnector} />
                <View style={styles.recapFilmRow}>
                  <Poster uri={link.film.posterUrl} />
                  <View style={styles.recapFilmCopy}>
                    <Text style={styles.recapFilmTitle}>{link.film.title}</Text>
                    {link.film.year ? <Text style={styles.recapFilmYear}>{link.film.year}</Text> : null}
                  </View>
                </View>
                <View style={styles.recapConnector} />
                <View style={styles.recapActor}><View style={styles.recapDot} /><Text style={styles.recapActorName}>{link.to.name}</Text></View>
              </View>
            ))}
          </View>
          <Pressable accessibilityRole="button" onPress={newGame} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Nouvelle partie</Text></Pressable>
        </>
      ) : (
        <>
          <View style={styles.challenge}>
            <View style={styles.person}><Text style={styles.caption}>DÉPART</Text><Text numberOfLines={1} style={styles.personName}>{startActor?.name}</Text></View>
            <Text style={styles.arrow}>→</Text>
            <View style={[styles.person, styles.target]}><Text style={styles.caption}>CIBLE</Text><Text numberOfLines={1} style={styles.personName}>{targetActor?.name}</Text></View>
          </View>

          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>Ton parcours</Text>
            <View accessibilityLabel={`Score : ${links.length} ${links.length === 1 ? 'liaison' : 'liaisons'}`} style={styles.scoreBadge}>
              <Text style={styles.scoreLabel}>SCORE</Text>
              <Text style={styles.scoreNumber}>{links.length}</Text>
            </View>
          </View>
          <View style={styles.pathCard}>
            {startActor ? <PathActor actor={startActor} active={links.length === 0 && !won} /> : null}
            {links.map((link, index) => (
              <View key={`${link.film.id}-${index}`} style={styles.pathLink}>
                <View style={styles.connector} /><Text style={styles.pathFilm}>{link.film.title}{link.film.year ? ` · ${link.film.year}` : ''}</Text><View style={styles.connector} />
                <PathActor actor={link.to} active={index === links.length - 1 && !won} />
              </View>
            ))}
          </View>

          <>
              <View style={styles.sectionHeading}>
                <Text style={styles.sectionTitle}>{screen === 'actor' ? 'Fiche acteur' : 'Fiche film'}</Text>
                <Pressable accessibilityRole="button" onPress={goBack}><Text style={styles.undo}>← Retour</Text></Pressable>
              </View>

              {screen === 'actor' && currentActor ? (
                <>
                  <View style={styles.actorCard}>
                    <ActorImage uri={currentActor.profileUrl} name={currentActor.name} size={66} />
                    <View style={styles.actorCardCopy}><Text style={styles.caption}>ACTEUR ACTUEL</Text><Text style={styles.actorName}>{currentActor.name}</Text><Text style={styles.helper}>Ouvre un film, puis choisis un acteur de son casting.</Text></View>
                  </View>
                  <Text style={styles.listHeading}>Filmographie</Text>
                  {loading ? <LoadingState label="Chargement de la filmographie…" /> : null}
                  {error ? <ErrorNotice message={error} onRetry={() => setReloadKey((value) => value + 1)} /> : null}
                  {!loading && !error && films.length === 0 ? <EmptyState message="Aucun film trouvé pour cet acteur." /> : null}
                  <View style={styles.options}>
                    {!loading && films.map((film) => (
                      <Pressable accessibilityRole="button" key={film.id} onPress={() => { setSelectedFilm(film); setScreen('film'); }} style={styles.filmCard}>
                        <Poster uri={film.posterUrl} /><View style={styles.filmCopy}><Text style={styles.optionTitle}>{film.title}</Text><Text style={styles.optionSub}>{film.year ?? 'Année inconnue'}{film.character ? ` · ${film.character}` : ''}</Text></View><Text style={styles.optionChevron}>›</Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              ) : screen === 'film' && selectedFilm ? (
                <>
                  <View style={styles.movieCard}>
                    <Poster uri={movie?.posterUrl ?? selectedFilm.posterUrl} large />
                    <Text style={styles.movieTitle}>{movie?.title ?? selectedFilm.title}</Text>
                    <Text style={styles.movieYear}>FILM · {movie?.year ?? selectedFilm.year ?? 'ANNÉE INCONNUE'}</Text>
                    <Text style={styles.helper}>Choisis un autre acteur de la distribution pour continuer le parcours.</Text>
                  </View>
                  <Text style={styles.listHeading}>Distribution</Text>
                  {loading ? <LoadingState label="Chargement de la distribution…" /> : null}
                  {error ? <ErrorNotice message={error} onRetry={() => setReloadKey((value) => value + 1)} /> : null}
                  {!loading && !error && movie?.cast.length === 0 ? <EmptyState message="Aucun acteur trouvé dans cette distribution." /> : null}
                  <View style={styles.options}>
                    {!loading && movie?.cast.filter((actor) => actor.id !== currentActor?.id).map((actor) => (
                      <Pressable accessibilityRole="button" key={actor.id} onPress={() => chooseCastMember(actor)} style={styles.actorOption}>
                        <ActorImage uri={actor.profileUrl} name={actor.name} size={42} />
                        <View style={styles.filmCopy}><Text style={styles.optionTitle}>{actor.name}</Text>{actor.id === targetActor?.id ? <Text style={styles.targetHint}>ACTEUR CIBLE</Text> : null}</View><Text style={styles.optionChevron}>›</Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              ) : null}
          </>
        </>
      )}
    </ScrollView>
  );
}

function ActorPicker({ label, role, excludeActorId, suggestions, suggestionsLoading, suggestionsError, selected, onSelect, onClear }: { label: string; role: ActorField; excludeActorId?: number; suggestions: TmdbActor[]; suggestionsLoading: boolean; suggestionsError: string | null; selected: TmdbActor | null; onSelect: (actor: TmdbActor) => void; onClear: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TmdbActor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2 || selected?.name === term) { setResults([]); setError(null); setLoading(false); return; }
    let active = true;
    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);
      searchActors(term)
        .then((items) => { if (active) setResults(items); })
        .catch((reason: unknown) => { if (active) { setResults([]); setError(apiErrorMessage(reason)); } })
        .finally(() => { if (active) setLoading(false); });
    }, 350);
    return () => { active = false; clearTimeout(timer); };
  }, [query, selected?.id, retryKey]);

  return (
    <View style={styles.pickerBlock}>
      <Text style={styles.pickerLabel}>{label}</Text>
      {selected ? (
        <View style={styles.selectedActor}>
          <ActorImage uri={selected.profileUrl} name={selected.name} size={44} />
          <Text style={styles.selectedName}>{selected.name}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={`Modifier ${label.toLowerCase()}`} onPress={() => { setQuery(''); setResults([]); onClear(); }}><Text style={styles.changeLink}>Modifier</Text></Pressable>
        </View>
      ) : (
        <>
          <Text style={styles.suggestionHeading}>{role === 'start' ? 'OU CHOISIS UN ACTEUR POPULAIRE' : 'SUGGESTIONS POUR LA CIBLE'}</Text>
          {suggestionsLoading ? <LoadingState label="Chargement des suggestions…" compact /> : null}
          {suggestionsError ? <Text style={styles.suggestionFallback}>Les suggestions sont indisponibles. Tu peux toujours rechercher un acteur.</Text> : null}
          {!suggestionsLoading && suggestions.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionRow}>
              {suggestions.filter((actor) => actor.id !== excludeActorId).map((actor) => (
                <Pressable accessibilityRole="button" accessibilityLabel={`Choisir ${actor.name} comme ${role === 'start' ? 'acteur de départ' : 'acteur cible'}`} key={actor.id} onPress={() => { onSelect(actor); setQuery(''); setResults([]); }} style={styles.suggestionCard}>
                  <ActorImage uri={actor.profileUrl} name={actor.name} size={58} />
                  <Text numberOfLines={2} style={styles.suggestionName}>{actor.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : null}
          <TextInput
            accessibilityLabel={`Rechercher ${label.toLowerCase()}`}
            autoCorrect={false}
            onChangeText={setQuery}
            placeholder="Rechercher un acteur…"
            placeholderTextColor="#777781"
            returnKeyType="search"
            style={styles.searchInput}
            value={query}
          />
          {loading ? <LoadingState label="Recherche TMDB…" compact /> : null}
          {error ? <View style={styles.searchError}><Text style={styles.errorText}>{error}</Text><Pressable accessibilityRole="button" onPress={() => setRetryKey((value) => value + 1)}><Text style={styles.retry}>Réessayer</Text></Pressable></View> : null}
          {!loading && !error && query.trim().length >= 2 && results.length === 0 ? <Text style={styles.emptyText}>Aucun acteur trouvé.</Text> : null}
          <View style={styles.options}>
            {results.map((actor) => (
              <Pressable accessibilityRole="button" key={actor.id} onPress={() => { onSelect(actor); setQuery(actor.name); setResults([]); }} style={styles.actorOption}>
                <ActorImage uri={actor.profileUrl} name={actor.name} size={40} /><Text style={styles.optionTitle}>{actor.name}</Text><Text style={styles.optionChevron}>›</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

function PathActor({ actor, active }: { actor: TmdbActor; active: boolean }) {
  return <View style={styles.pathActor}><View style={[styles.pathDot, active && styles.pathDotActive]} /><Text style={[styles.pathName, active && styles.pathNameActive]}>{actor.name}</Text></View>;
}

function ActorImage({ uri, name, size }: { uri: string | null; name: string; size: number }) {
  return uri ? <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#30252B' }} /> : <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}><Text style={styles.avatarText}>{initials(name)}</Text></View>;
}

function Poster({ uri, large = false }: { uri: string | null; large?: boolean }) {
  return uri ? <Image source={{ uri }} resizeMode={large ? 'contain' : 'cover'} style={large ? styles.largePoster : styles.poster} /> : <View style={large ? styles.largePoster : styles.poster}><Text style={styles.posterMark}>▶</Text></View>;
}

function LoadingState({ label, compact = false }: { label: string; compact?: boolean }) {
  return <View style={[styles.loading, compact && styles.loadingCompact]}><ActivityIndicator color="#FF3256" /><Text style={styles.loadingText}>{label}</Text></View>;
}

function ErrorNotice({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <View style={styles.errorBox}><Text style={styles.errorText}>{message}</Text><Pressable accessibilityRole="button" onPress={onRetry}><Text style={styles.retry}>Réessayer</Text></Pressable></View>;
}

function EmptyState({ message }: { message: string }) {
  return <View style={styles.emptyBox}><Text style={styles.emptyText}>{message}</Text></View>;
}

function initials(name: string) {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0C0C0F' },
  content: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 40 },
  topLine: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  brand: { color: '#FF3256', fontSize: 12, fontWeight: '900', letterSpacing: 2.2 },
  reset: { color: '#A6A6B2', fontSize: 13, fontWeight: '600' },
  title: { color: '#FFFFFF', fontSize: 34, fontWeight: '900', lineHeight: 38, letterSpacing: -1 },
  intro: { color: '#A6A6B2', fontSize: 14, lineHeight: 21, marginBottom: 22, marginTop: 14 },
  pickerBlock: { marginBottom: 20 },
  pickerLabel: { color: '#FF8094', fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 9 },
  suggestionHeading: { color: '#A6A6B2', fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 8, marginTop: 12 },
  suggestionRow: { gap: 10, paddingBottom: 10 },
  suggestionCard: { alignItems: 'center', backgroundColor: '#19191E', borderColor: '#34343D', borderRadius: 14, borderWidth: 1, gap: 7, paddingHorizontal: 9, paddingVertical: 10, width: 92 },
  suggestionName: { color: '#FFFFFF', fontSize: 10, fontWeight: '700', minHeight: 28, textAlign: 'center' },
  suggestionFallback: { color: '#A6A6B2', fontSize: 11, lineHeight: 16, marginBottom: 8 },
  searchInput: { backgroundColor: '#19191E', borderColor: '#34343D', borderRadius: 14, borderWidth: 1, color: '#FFFFFF', fontSize: 15, minHeight: 54, paddingHorizontal: 15 },
  selectedActor: { alignItems: 'center', backgroundColor: '#19191E', borderColor: '#34343D', borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 12, minHeight: 62, paddingHorizontal: 11 },
  selectedName: { color: '#FFFFFF', flex: 1, fontSize: 15, fontWeight: '800' },
  changeLink: { color: '#FF8094', fontSize: 12, fontWeight: '800' },
  challenge: { alignItems: 'center', backgroundColor: '#19191E', borderColor: '#2A2A32', borderRadius: 20, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 22, padding: 16 },
  person: { flex: 1 },
  target: { alignItems: 'flex-end' },
  caption: { color: '#A6A6B2', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 6 },
  personName: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  arrow: { color: '#FF3256', fontSize: 22, marginHorizontal: 10 },
  sectionHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, marginTop: 25 },
  sectionTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  scoreBadge: { alignItems: 'center', backgroundColor: '#29191F', borderColor: '#60303B', borderRadius: 13, borderWidth: 1, flexDirection: 'row', gap: 9, paddingHorizontal: 11, paddingVertical: 6 },
  scoreLabel: { color: '#FF8094', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  scoreNumber: { color: '#FFFFFF', fontSize: 17, fontWeight: '900', minWidth: 15, textAlign: 'center' },
  pathCard: { backgroundColor: '#19191E', borderColor: '#2A2A32', borderRadius: 18, borderWidth: 1, padding: 16 },
  pathActor: { alignItems: 'center', flexDirection: 'row', gap: 10, minHeight: 28 },
  pathDot: { backgroundColor: '#575761', borderRadius: 7, height: 10, width: 10 },
  pathDotActive: { backgroundColor: '#FF3256' },
  pathName: { color: '#A6A6B2', fontSize: 14, fontWeight: '700' },
  pathNameActive: { color: '#FFFFFF' },
  pathLink: { marginLeft: 4 },
  connector: { backgroundColor: '#393941', height: 12, marginLeft: 1, width: 2 },
  pathFilm: { color: '#FF8094', fontSize: 11, fontWeight: '700', marginLeft: 16, paddingVertical: 3 },
  successCard: { alignItems: 'center', backgroundColor: '#19191E', borderColor: '#60303B', borderRadius: 22, borderWidth: 1, marginTop: 22, padding: 20 },
  successEyebrow: { color: '#FF8094', fontSize: 10, fontWeight: '900', letterSpacing: 1.7 },
  successTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', marginTop: 8, textAlign: 'center' },
  successPeople: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, width: '100%' },
  successPerson: { alignItems: 'center', flex: 1, gap: 9 },
  successLabel: { color: '#A6A6B2', fontSize: 9, fontWeight: '900', letterSpacing: 1.4 },
  successName: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', textAlign: 'center' },
  successArrow: { color: '#FF3256', fontSize: 25, fontWeight: '800', marginHorizontal: 8 },
  finalScore: { alignItems: 'center', backgroundColor: '#29191F', borderColor: '#60303B', borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 8, marginTop: 22, paddingHorizontal: 18, paddingVertical: 9 },
  finalScoreNumber: { color: '#FFFFFF', fontSize: 24, fontWeight: '900' },
  finalScoreText: { color: '#FF8094', fontSize: 13, fontWeight: '800' },
  recapHeading: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', marginBottom: 12, marginTop: 25 },
  recapCard: { backgroundColor: '#19191E', borderColor: '#2A2A32', borderRadius: 18, borderWidth: 1, padding: 15 },
  recapActor: { alignItems: 'center', flexDirection: 'row', gap: 10, minHeight: 28 },
  recapDot: { backgroundColor: '#FF3256', borderRadius: 6, height: 10, width: 10 },
  recapActorName: { color: '#FFFFFF', flex: 1, fontSize: 13, fontWeight: '700' },
  recapLink: { marginLeft: 4 },
  recapConnector: { backgroundColor: '#393941', height: 12, marginLeft: 4, width: 2 },
  recapFilmRow: { alignItems: 'center', flexDirection: 'row', marginLeft: 16 },
  recapFilmCopy: { flex: 1 },
  recapFilmTitle: { color: '#FF8094', fontSize: 12, fontWeight: '800' },
  recapFilmYear: { color: '#A6A6B2', fontSize: 10, marginTop: 3 },
  undo: { color: '#FF8094', fontSize: 13, fontWeight: '700' },
  actorCard: { alignItems: 'center', backgroundColor: '#19191E', borderColor: '#2A2A32', borderRadius: 18, borderWidth: 1, flexDirection: 'row', padding: 15 },
  actorCardCopy: { flex: 1, marginLeft: 14 },
  actorName: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', marginBottom: 5 },
  helper: { color: '#A6A6B2', fontSize: 12, lineHeight: 18, marginTop: 8, textAlign: 'center' },
  listHeading: { color: '#A6A6B2', fontSize: 13, fontWeight: '700', marginBottom: 10, marginTop: 22 },
  options: { gap: 9 },
  filmCard: { alignItems: 'center', backgroundColor: '#19191E', borderColor: '#2A2A32', borderRadius: 15, borderWidth: 1, flexDirection: 'row', minHeight: 76, padding: 9 },
  poster: { alignItems: 'center', backgroundColor: '#3A2029', borderRadius: 10, height: 102, justifyContent: 'center', marginRight: 12, width: 68 },
  largePoster: { alignItems: 'center', alignSelf: 'center', backgroundColor: '#3A2029', borderRadius: 15, height: 330, justifyContent: 'center', marginBottom: 14, width: 220 },
  posterMark: { color: '#FF8094', fontSize: 16 },
  filmCopy: { flex: 1 },
  optionTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  optionSub: { color: '#A6A6B2', fontSize: 11, marginTop: 4 },
  optionChevron: { color: '#777781', fontSize: 23, marginHorizontal: 8 },
  movieCard: { alignItems: 'center', backgroundColor: '#19191E', borderColor: '#2A2A32', borderRadius: 18, borderWidth: 1, padding: 17 },
  movieTitle: { color: '#FFFFFF', fontSize: 23, fontWeight: '900' },
  movieYear: { color: '#FF8094', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginTop: 5 },
  actorOption: { alignItems: 'center', backgroundColor: '#19191E', borderColor: '#2A2A32', borderRadius: 15, borderWidth: 1, flexDirection: 'row', gap: 12, minHeight: 62, paddingHorizontal: 12 },
  avatar: { alignItems: 'center', backgroundColor: '#30252B', height: 40, justifyContent: 'center', width: 40 },
  avatarText: { color: '#FF8094', fontSize: 11, fontWeight: '900' },
  targetHint: { color: '#FF8094', fontSize: 9, fontWeight: '900', letterSpacing: 1, marginTop: 4 },
  primaryButton: { alignItems: 'center', backgroundColor: '#FF3256', borderRadius: 15, marginTop: 22, padding: 16 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  buttonDisabled: { opacity: 0.45 },
  demoNote: { color: '#696973', fontSize: 10, lineHeight: 15, marginTop: 24, textAlign: 'center' },
  loading: { alignItems: 'center', backgroundColor: '#19191E', borderRadius: 14, flexDirection: 'row', gap: 11, marginVertical: 10, padding: 14 },
  loadingCompact: { backgroundColor: 'transparent', marginVertical: 6, padding: 8 },
  loadingText: { color: '#A6A6B2', fontSize: 12 },
  errorBox: { backgroundColor: '#2B191F', borderColor: '#69303D', borderRadius: 13, borderWidth: 1, marginVertical: 10, padding: 13 },
  searchError: { backgroundColor: '#2B191F', borderRadius: 12, marginTop: 8, padding: 11 },
  errorText: { color: '#FF9BAB', fontSize: 12, lineHeight: 18 },
  retry: { color: '#FFFFFF', fontSize: 12, fontWeight: '800', marginTop: 8 },
  emptyBox: { backgroundColor: '#19191E', borderRadius: 13, marginVertical: 6, padding: 14 },
  emptyText: { color: '#A6A6B2', fontSize: 12, lineHeight: 18 },
});
