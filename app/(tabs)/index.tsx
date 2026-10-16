import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';

export default function PlayScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>SIX° CINEMA</Text>
      <Text style={styles.title}>Un casting.{`\n`}Mille chemins.</Text>
      <Text style={styles.body}>
        Relie deux acteurs en passant par les films qu’ils ont partagés.
      </Text>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>BIENTÔT</Text>
        <Text style={styles.cardTitle}>La partie se prépare</Text>
        <Text style={styles.cardBody}>
          La recherche de films et d’acteurs sera disponible dans le premier jalon jouable.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 28, backgroundColor: '#0C0C0F' },
  eyebrow: { color: '#FF3256', fontSize: 13, fontWeight: '800', letterSpacing: 2.4, marginBottom: 18 },
  title: { color: '#FFFFFF', fontSize: 42, fontWeight: '900', lineHeight: 46, letterSpacing: -1.5 },
  body: { color: '#A6A6B2', fontSize: 16, lineHeight: 24, marginTop: 16, maxWidth: 320 },
  card: { backgroundColor: '#19191E', borderColor: '#2A2A32', borderRadius: 22, borderWidth: 1, marginTop: 42, padding: 22 },
  cardLabel: { color: '#FF3256', fontSize: 11, fontWeight: '800', letterSpacing: 1.8 },
  cardTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginTop: 12 },
  cardBody: { color: '#A6A6B2', fontSize: 14, lineHeight: 21, marginTop: 8 },
});
