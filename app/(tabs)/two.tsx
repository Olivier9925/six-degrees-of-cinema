import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';

export default function RulesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>LES RÈGLES</Text>
      <Text style={styles.title}>Deux acteurs,{`\n`}un chemin.</Text>
      <Text style={styles.body}>
        Choisis un film dans lequel l’acteur courant a joué, puis sélectionne un autre membre de sa distribution.
      </Text>
      <View style={styles.step}>
        <Text style={styles.number}>01</Text>
        <Text style={styles.stepText}>Acteur → film → acteur = une liaison.</Text>
      </View>
      <View style={styles.credit}>
        <Text style={styles.creditTitle}>Sources des données</Text>
        <Text style={styles.creditText}>
          Les données de films, les portraits et les affiches proviennent de TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 28, backgroundColor: '#0C0C0F' },
  eyebrow: { color: '#FF3256', fontSize: 13, fontWeight: '800', letterSpacing: 2.4, marginBottom: 18 },
  title: { color: '#FFFFFF', fontSize: 36, fontWeight: '900', lineHeight: 42, letterSpacing: -1 },
  body: { color: '#A6A6B2', fontSize: 16, lineHeight: 24, marginTop: 16 },
  step: { alignItems: 'center', backgroundColor: '#19191E', borderColor: '#2A2A32', borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 16, marginTop: 36, padding: 20 },
  number: { color: '#FF3256', fontSize: 18, fontWeight: '900' },
  stepText: { color: '#FFFFFF', flex: 1, fontSize: 15, fontWeight: '600', lineHeight: 22 },
  credit: { backgroundColor: '#19191E', borderColor: '#2A2A32', borderRadius: 18, borderWidth: 1, marginTop: 18, padding: 18 },
  creditTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', marginBottom: 8 },
  creditText: { color: '#A6A6B2', fontSize: 12, lineHeight: 19 },
});
