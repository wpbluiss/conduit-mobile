import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, TypeScale } from '../constants/typography';
import { Colors } from '../constants/colors';

export default function ReviewsScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[st.container, { backgroundColor: colors.bgPrimary, paddingTop: insets.top }]}>
      <View style={st.header}>
        <Text style={[st.headerTitle, { color: colors.textPrimary }]}>Reviews</Text>
      </View>
      <View style={st.emptyState}>
        <View style={st.iconWrap}>
          <Ionicons name="star-outline" size={48} color={Colors.electric} />
        </View>
        <Text style={[st.emptyTitle, { color: colors.textPrimary }]}>No data yet</Text>
        <Text style={[st.emptySubtitle, { color: colors.textSecondary }]}>
          Customer reviews and reputation management tools will appear here.
        </Text>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { ...Fonts.displayBold, fontSize: TypeScale.h2 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingBottom: 80 },
  iconWrap: { width: 80, height: 80, borderRadius: 20, backgroundColor: Colors.electricMuted, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { ...Fonts.displayBold, fontSize: TypeScale.h3, marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { ...Fonts.body, fontSize: TypeScale.bodySm, textAlign: 'center', lineHeight: TypeScale.bodySm * 1.5 },
});
