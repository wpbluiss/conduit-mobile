import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../contexts/ThemeContext';
import { ComingSoon } from '../components/ui/ComingSoon';

export default function CalendarScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bgPrimary, paddingTop: insets.top }}>
      <ComingSoon icon="calendar-outline" title="Calendar & Bookings" />
    </View>
  );
}
