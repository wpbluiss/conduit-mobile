import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { ComingSoon } from '../components/ui/ComingSoon';

export default function ReviewsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bgPrimary, paddingTop: insets.top }}>
      <ComingSoon icon="star-outline" title="Reviews & Reputation" />
    </View>
  );
}
