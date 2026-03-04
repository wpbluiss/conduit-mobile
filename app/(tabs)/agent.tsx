import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  Animated,
  Dimensions,
  LayoutAnimation,
  UIManager,
  Platform,
  Modal,
  TextInput,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../contexts/ThemeContext';
import { Colors } from '../../constants/colors';
import { TextStyles, Fonts, TypeScale } from '../../constants/typography';
import { ScreenPadding, Spacing, BorderRadius } from '../../constants/layout';
import { useRouter } from 'expo-router';
import { api, type AgentConfig } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { loadAgentConfig, saveAgentConfig, isVapiConfigured } from '../../lib/vapi';

const { width: SCREEN_W } = Dimensions.get('window');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

// ── Constants ────────────────────────────────────────────────

const VOICES = [
  { id: 'professional_female', name: 'Professional Female', icon: 'pulse-outline' as IoniconsName },
  { id: 'professional_male', name: 'Professional Male', icon: 'pulse-outline' as IoniconsName },
  { id: 'friendly_female', name: 'Friendly Female', icon: 'pulse-outline' as IoniconsName },
  { id: 'friendly_male', name: 'Friendly Male', icon: 'pulse-outline' as IoniconsName },
  { id: 'neutral', name: 'Neutral', icon: 'pulse-outline' as IoniconsName },
];

const DAYS = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' },
];

const TIMES_24 = Array.from({ length: 33 }, (_, i) => {
  const h = Math.floor(i / 2) + 6;
  const m = (i % 2) * 30;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
});

const formatTime12 = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`;
};

const AFTER_HOURS_OPTIONS = [
  { value: 'take_message', label: 'Take Message', icon: 'chatbubble-outline' as IoniconsName },
  { value: 'transfer', label: 'Transfer to Cell', icon: 'call-outline' as IoniconsName },
  { value: 'book_appointment', label: 'Book Appointment', icon: 'calendar-outline' as IoniconsName },
  { value: 'custom_response', label: 'Custom Response', icon: 'create-outline' as IoniconsName },
];

const CAPTURE_FIELDS = [
  { key: 'name', label: 'Name', icon: 'person-outline' as IoniconsName },
  { key: 'phone', label: 'Phone Number', icon: 'call-outline' as IoniconsName },
  { key: 'email', label: 'Email Address', icon: 'mail-outline' as IoniconsName },
  { key: 'service', label: 'Service Needed', icon: 'construct-outline' as IoniconsName },
  { key: 'preferred_date', label: 'Preferred Date/Time', icon: 'calendar-outline' as IoniconsName },
  { key: 'budget', label: 'Budget', icon: 'cash-outline' as IoniconsName },
  { key: 'address', label: 'Address', icon: 'location-outline' as IoniconsName },
];

const DEFAULT_CONFIG: AgentConfig = {
  is_active: true,
  voice: 'professional_female',
  personality: 0.3,
  speaking_speed: 'normal',
  greeting: 'Hi, thank you for calling [Business Name]. How can I help you today?',
  after_hours_greeting: "Thanks for calling [Business Name]. We're currently closed but your call is important to us. Please leave a message and we'll get back to you first thing.",
  language: 'en',
  business_hours: {
    monday: { enabled: true, start: '09:00', end: '17:00' },
    tuesday: { enabled: true, start: '09:00', end: '17:00' },
    wednesday: { enabled: true, start: '09:00', end: '17:00' },
    thursday: { enabled: true, start: '09:00', end: '17:00' },
    friday: { enabled: true, start: '09:00', end: '17:00' },
    saturday: { enabled: false, start: '10:00', end: '14:00' },
    sunday: { enabled: false, start: '10:00', end: '14:00' },
  },
  after_hours_behavior: 'take_message',
  capture_fields: {
    name: true,
    phone: true,
    email: true,
    service: true,
    preferred_date: true,
    budget: false,
    address: false,
  },
  max_call_duration: 5,
  transfer_enabled: false,
  transfer_phone: '',
  call_recording: true,
  faqs: [
    { question: 'What are your hours?', answer: "We're open Monday through Friday, 9 AM to 5 PM." },
    { question: 'Do you accept walk-ins?', answer: 'Yes, we accept walk-ins on a first-come, first-served basis.' },
    { question: 'How do I book an appointment?', answer: 'You can book an appointment by calling us or through our website.' },
  ],
  push_on_new_lead: true,
  daily_summary: true,
  weekly_report: false,
  offline_alert: true,
};

// ── Shimmer Overlay ──────────────────────────────────────────

function ShimmerOverlay() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(4000),
      ])
    ).start();
  }, []);
  return (
    <Animated.View
      style={[
        st.shimmer,
        { transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [-SCREEN_W, SCREEN_W] }) }] },
      ]}
    >
      <LinearGradient
        colors={['transparent', 'rgba(255,255,255,0.03)', 'rgba(255,255,255,0.06)', 'rgba(255,255,255,0.03)', 'transparent']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

// ── Section Header ───────────────────────────────────────────

function SectionHeader({
  title,
  icon,
  expanded,
  onPress,
}: {
  title: string;
  icon: IoniconsName;
  expanded: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={st.sectionHeader}>
      <View style={st.sectionHeaderLeft}>
        <View style={st.sectionIconWrap}>
          <Ionicons name={icon} size={18} color={Colors.electric} />
        </View>
        <Text style={st.sectionHeaderTitle}>{title}</Text>
      </View>
      <Ionicons
        name={expanded ? 'chevron-up' : 'chevron-down'}
        size={18}
        color={Colors.textMuted}
      />
    </Pressable>
  );
}

// ── Voice Card ───────────────────────────────────────────────

function VoiceCard({
  voice,
  selected,
  onSelect,
}: {
  voice: (typeof VOICES)[number];
  selected: boolean;
  onSelect: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPressIn={() => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, friction: 8 }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 8 }).start()}
      onPress={onSelect}
    >
      <Animated.View
        style={[
          st.voiceCard,
          selected && st.voiceCardSelected,
          { transform: [{ scale }] },
        ]}
      >
        <View style={[st.voiceIconWrap, selected && st.voiceIconWrapSelected]}>
          <Ionicons name={voice.icon} size={20} color={selected ? Colors.electric : Colors.textMuted} />
        </View>
        <Text style={[st.voiceCardName, selected && st.voiceCardNameSelected]} numberOfLines={2}>
          {voice.name}
        </Text>
        {selected && (
          <View style={st.voiceCheckRow}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.electric} />
          </View>
        )}
        <Pressable
          style={st.voicePreviewBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          hitSlop={8}
        >
          <Ionicons name="play-circle-outline" size={16} color={Colors.textMuted} />
          <Text style={st.voicePreviewText}>Preview</Text>
        </Pressable>
      </Animated.View>
    </Pressable>
  );
}

// ── Personality Slider ───────────────────────────────────────

function PersonalitySlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [trackWidth, setTrackWidth] = useState(0);

  const handleTouch = (locationX: number) => {
    if (trackWidth <= 0) return;
    const newVal = Math.max(0, Math.min(1, locationX / trackWidth));
    onChange(Math.round(newVal * 20) / 20);
  };

  return (
    <View style={st.sliderWrap}>
      <View style={st.sliderLabels}>
        <Text style={st.sliderLabelText}>Professional</Text>
        <Text style={st.sliderLabelText}>Friendly</Text>
      </View>
      <View
        style={st.sliderTrackOuter}
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(e) => handleTouch(e.nativeEvent.locationX)}
        onResponderMove={(e) => handleTouch(e.nativeEvent.locationX)}
      >
        <LinearGradient
          colors={['#0EA5E9', '#06B6D4']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={st.sliderTrack}
        />
        <View style={st.sliderTrackBg} />
        <View
          style={[
            st.sliderFill,
            { width: trackWidth > 0 ? value * trackWidth : 0 },
          ]}
        >
          <LinearGradient
            colors={['#0EA5E9', '#06B6D4']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </View>
        {trackWidth > 0 && (
          <View
            style={[
              st.sliderThumb,
              { left: value * (trackWidth - 24) },
            ]}
          />
        )}
      </View>
    </View>
  );
}

// ── Pill Toggle Group ────────────────────────────────────────

function PillGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={st.pillGroup}>
      {options.map((opt) => (
        <Pressable
          key={opt.value}
          onPress={() => {
            Haptics.selectionAsync();
            onChange(opt.value);
          }}
          style={[st.pill, value === opt.value && st.pillActive]}
        >
          <Text style={[st.pillText, value === opt.value && st.pillTextActive]}>
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// ── Time Control ─────────────────────────────────────────────

function TimeControl({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const idx = TIMES_24.indexOf(value);

  return (
    <View style={st.timeControl}>
      <Pressable
        onPress={() => { if (idx > 0) onChange(TIMES_24[idx - 1]); }}
        hitSlop={8}
        style={st.timeArrow}
      >
        <Ionicons name="chevron-back" size={14} color={Colors.textMuted} />
      </Pressable>
      <Text style={st.timeText}>{formatTime12(value)}</Text>
      <Pressable
        onPress={() => { if (idx < TIMES_24.length - 1) onChange(TIMES_24[idx + 1]); }}
        hitSlop={8}
        style={st.timeArrow}
      >
        <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
      </Pressable>
    </View>
  );
}

// ── Duration Stepper ─────────────────────────────────────────

function DurationStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={st.stepperRow}>
      <View style={st.stepperLabel}>
        <Ionicons name="timer-outline" size={18} color={Colors.electric} />
        <Text style={st.stepperLabelText}>Max Call Duration</Text>
      </View>
      <View style={st.stepperControls}>
        <Pressable
          onPress={() => { if (value > 1) onChange(value - 1); }}
          style={st.stepperBtn}
          hitSlop={8}
        >
          <Ionicons name="remove" size={18} color={Colors.textPrimary} />
        </Pressable>
        <Text style={st.stepperValue}>{value} min</Text>
        <Pressable
          onPress={() => { if (value < 10) onChange(value + 1); }}
          style={st.stepperBtn}
          hitSlop={8}
        >
          <Ionicons name="add" size={18} color={Colors.textPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

// ── Toggle Row ───────────────────────────────────────────────

function ToggleRow({
  icon,
  iconColor,
  label,
  value,
  onValueChange,
  isLast,
}: {
  icon: IoniconsName;
  iconColor?: string;
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  isLast?: boolean;
}) {
  return (
    <View style={[st.toggleRow, !isLast && st.toggleRowBorder]}>
      <View style={[st.toggleIconWrap, { backgroundColor: `${iconColor || Colors.electric}15` }]}>
        <Ionicons name={icon} size={18} color={iconColor || Colors.electric} />
      </View>
      <Text style={st.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: Colors.bgElevated, true: Colors.electric }}
        thumbColor="#fff"
      />
    </View>
  );
}

// ── Checkbox Row ─────────────────────────────────────────────

function CheckboxRow({
  icon,
  label,
  checked,
  onChange,
}: {
  icon: IoniconsName;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Pressable onPress={() => onChange(!checked)} style={st.checkboxRow}>
      <View style={st.checkboxBox}>
        {checked && <Ionicons name="checkmark" size={14} color={Colors.electric} />}
      </View>
      <Ionicons name={icon} size={16} color={checked ? Colors.electric : Colors.textMuted} style={{ marginRight: Spacing.sm }} />
      <Text style={[st.checkboxLabel, !checked && { color: Colors.textMuted }]}>{label}</Text>
    </Pressable>
  );
}

// ── Option Selector ──────────────────────────────────────────

function OptionSelector({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string; icon: IoniconsName }[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View>
      <Pressable
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setOpen(!open);
        }}
        style={st.optionSelector}
      >
        <View style={st.optionSelectorLeft}>
          <Ionicons name={selected?.icon || 'help-outline'} size={16} color={Colors.electric} />
          <Text style={st.optionSelectorText}>{selected?.label || 'Select'}</Text>
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textMuted} />
      </Pressable>
      {open && (
        <View style={st.optionDropdown}>
          {options.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => {
                Haptics.selectionAsync();
                onChange(opt.value);
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setOpen(false);
              }}
              style={[st.optionItem, opt.value === value && st.optionItemActive]}
            >
              <Ionicons name={opt.icon} size={16} color={opt.value === value ? Colors.electric : Colors.textMuted} />
              <Text style={[st.optionItemText, opt.value === value && { color: Colors.electric }]}>
                {opt.label}
              </Text>
              {opt.value === value && <Ionicons name="checkmark" size={16} color={Colors.electric} />}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

// ── Swipeable FAQ Row ────────────────────────────────────────

function SwipeableFAQRow({
  faq,
  onDelete,
}: {
  faq: { question: string; answer: string };
  onDelete: () => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 15 && Math.abs(gs.dx) > Math.abs(gs.dy) * 2,
      onPanResponderMove: (_, gs) => {
        if (gs.dx < 0) translateX.setValue(Math.max(gs.dx, -80));
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dx < -40) {
          Animated.spring(translateX, { toValue: -72, useNativeDriver: true, friction: 8 }).start();
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
        }
      },
    })
  ).current;

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.timing(translateX, { toValue: -SCREEN_W, duration: 200, useNativeDriver: true }).start(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      onDelete();
    });
  };

  return (
    <View style={st.swipeContainer}>
      <View style={st.swipeDeleteBg}>
        <Pressable onPress={handleDelete} style={st.swipeDeleteBtn}>
          <Ionicons name="trash-outline" size={18} color="#fff" />
          <Text style={st.swipeDeleteText}>Delete</Text>
        </Pressable>
      </View>
      <Animated.View
        style={[st.faqRow, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <View style={st.faqIconWrap}>
          <Ionicons name="help-circle-outline" size={18} color={Colors.electric} />
        </View>
        <View style={st.faqContent}>
          <Text style={st.faqQuestion} numberOfLines={2}>{faq.question}</Text>
          <Text style={st.faqAnswer} numberOfLines={2}>{faq.answer}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

// ── Add FAQ Modal ────────────────────────────────────────────

function AddFAQModal({
  visible,
  onClose,
  onAdd,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (q: string, a: string) => void;
}) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  const handleAdd = () => {
    if (!question.trim() || !answer.trim()) {
      Alert.alert('Required', 'Please fill in both the question and answer.');
      return;
    }
    onAdd(question.trim(), answer.trim());
    setQuestion('');
    setAnswer('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={st.modalOverlay} onPress={onClose}>
        <Pressable style={st.modalContent} onPress={(e) => e.stopPropagation()}>
          <View style={st.modalHeader}>
            <Text style={st.modalTitle}>Add FAQ</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={Colors.textMuted} />
            </Pressable>
          </View>

          <Text style={st.modalInputLabel}>Question</Text>
          <TextInput
            style={st.modalInput}
            value={question}
            onChangeText={setQuestion}
            placeholder="e.g., What services do you offer?"
            placeholderTextColor={Colors.textMuted}
            selectionColor={Colors.electric}
            multiline
          />

          <Text style={st.modalInputLabel}>Answer</Text>
          <TextInput
            style={[st.modalInput, { minHeight: 80 }]}
            value={answer}
            onChangeText={setAnswer}
            placeholder="Your AI agent will use this answer..."
            placeholderTextColor={Colors.textMuted}
            selectionColor={Colors.electric}
            multiline
          />

          <View style={st.modalButtons}>
            <Button title="Cancel" onPress={onClose} variant="ghost" size="md" />
            <Button title="Add FAQ" onPress={handleAdd} variant="primary" size="md" />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Main Screen ──────────────────────────────────────────────

export default function AgentScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [config, setConfig] = useState<AgentConfig>(DEFAULT_CONFIG);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['voice']));
  const [showFAQModal, setShowFAQModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);

  useEffect(() => {
    loadConfigFromSources();
  }, []);

  const loadConfigFromSources = async () => {
    setConfigLoading(true);
    try {
      // Try Vapi + Supabase first
      const { config: loaded, source } = await loadAgentConfig();
      if (Object.keys(loaded).length > 0) {
        setConfig((prev) => ({ ...prev, ...loaded }));
        console.log('[Agent] Config loaded from:', source);
        setConfigLoading(false);
        return;
      }
    } catch (err) {
      console.warn('[Agent] Real config load failed, trying API fallback:', err);
    }
    // Fallback: try the old FastAPI endpoint
    try {
      const data = await api.getAgentConfig();
      setConfig(data);
    } catch {
      // Use defaults
    }
    setConfigLoading(false);
  };

  const updateConfig = useCallback((partial: Partial<AgentConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  const updateBusinessHour = useCallback((day: string, field: string, value: any) => {
    setConfig((prev) => ({
      ...prev,
      business_hours: {
        ...prev.business_hours,
        [day]: { ...prev.business_hours[day], [field]: value },
      },
    }));
  }, []);

  const updateCaptureField = useCallback((field: string, value: boolean) => {
    setConfig((prev) => ({
      ...prev,
      capture_fields: { ...prev.capture_fields, [field]: value },
    }));
  }, []);

  const toggleSection = (section: string) => {
    Haptics.selectionAsync();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  const handleCopyToAll = () => {
    const firstEnabled = Object.entries(config.business_hours).find(([_, h]) => h.enabled);
    if (!firstEnabled) {
      Alert.alert('No hours set', 'Enable at least one day first.');
      return;
    }
    const [, hours] = firstEnabled;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setConfig((prev) => ({
      ...prev,
      business_hours: Object.fromEntries(
        Object.entries(prev.business_hours).map(([day, h]) => [
          day,
          { ...h, start: hours.start, end: hours.end },
        ])
      ),
    }));
  };

  const handleToggleActive = (val: boolean) => {
    if (!val) {
      Alert.alert(
        'Deactivate Agent',
        'Your AI agent will stop answering calls. Missed calls will not be captured.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Deactivate',
            style: 'destructive',
            onPress: () => updateConfig({ is_active: false }),
          },
        ]
      );
    } else {
      updateConfig({ is_active: true });
    }
  };

  const handleSave = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    // Block save in guest mode
    if (useAuthStore.getState().isGuestMode) {
      Alert.alert(
        'Create an Account',
        'Sign up to save your AI agent configuration and start handling real calls.',
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Sign Up', onPress: () => {
            useAuthStore.getState().setGuestMode(false);
            router.replace('/(auth)/signup' as any);
          }},
        ]
      );
      return;
    }
    setSaving(true);
    try {
      const result = await saveAgentConfig(config);

      if (result.supabaseSaved && result.vapiSaved) {
        Alert.alert('Saved', 'All agent settings updated successfully.');
      } else if (result.supabaseSaved && !result.vapiSaved) {
        const reason = !isVapiConfigured()
          ? 'Voice settings require a Vapi API key. Set EXPO_PUBLIC_VAPI_API_KEY in your environment.'
          : result.vapiError || 'Unknown error';
        Alert.alert(
          'Partially Saved',
          `Settings saved to database.\n\nVoice agent update skipped: ${reason}`
        );
      } else if (!result.supabaseSaved && result.vapiSaved) {
        Alert.alert('Partially Saved', `Voice agent updated but database save failed: ${result.supabaseError}`);
      } else {
        Alert.alert('Save Failed', `Could not save settings.\n\n${result.supabaseError || result.vapiError || 'Unknown error'}`);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save configuration.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    Alert.alert('Reset to Defaults', 'This will reset all agent settings to their defaults.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setConfig(DEFAULT_CONFIG);
        },
      },
    ]);
  };

  const addFAQ = (question: string, answer: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    updateConfig({ faqs: [...config.faqs, { question, answer }] });
  };

  const removeFAQ = (index: number) => {
    updateConfig({ faqs: config.faqs.filter((_, i) => i !== index) });
  };

  const isExpanded = (section: string) => expandedSections.has(section);

  return (
    <View style={[st.root, { backgroundColor: colors.bgPrimary }]}>
      <LinearGradient
        colors={[Colors.bgPrimary, Colors.bgPrimary, 'rgba(14, 165, 233, 0.03)']}
        locations={[0, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        style={[st.container, { paddingTop: insets.top }]}
        contentContainerStyle={st.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ── */}
        <View style={st.header}>
          <View>
            <Text style={st.title}>AI Agent</Text>
            <View style={st.statusRow}>
              <View
                style={[
                  st.statusDot,
                  { backgroundColor: config.is_active ? Colors.success : Colors.danger },
                ]}
              />
              <Text
                style={[
                  st.statusText,
                  { color: config.is_active ? Colors.success : Colors.danger },
                ]}
              >
                {config.is_active ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
          <Switch
            value={config.is_active}
            onValueChange={handleToggleActive}
            trackColor={{ false: Colors.bgElevated, true: Colors.success }}
            thumbColor="#fff"
          />
        </View>

        {/* ── 1. Voice & Personality ── */}
        <View style={st.card}>
          <ShimmerOverlay />
          <SectionHeader
            title="Voice & Personality"
            icon="mic-outline"
            expanded={isExpanded('voice')}
            onPress={() => toggleSection('voice')}
          />
          {isExpanded('voice') && (
            <View style={st.sectionContent}>
              <Text style={st.fieldLabel}>Voice</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={st.voiceScroll}
              >
                {VOICES.map((v) => (
                  <VoiceCard
                    key={v.id}
                    voice={v}
                    selected={config.voice === v.id}
                    onSelect={() => {
                      Haptics.selectionAsync();
                      updateConfig({ voice: v.id });
                    }}
                  />
                ))}
              </ScrollView>

              <PersonalitySlider
                value={config.personality}
                onChange={(v) => updateConfig({ personality: v })}
              />

              <View style={{ marginTop: Spacing.base }}>
                <Text style={st.fieldLabel}>Speaking Speed</Text>
                <PillGroup
                  options={[
                    { value: 'slow' as const, label: 'Slow' },
                    { value: 'normal' as const, label: 'Normal' },
                    { value: 'fast' as const, label: 'Fast' },
                  ]}
                  value={config.speaking_speed}
                  onChange={(v) => updateConfig({ speaking_speed: v })}
                />
              </View>
            </View>
          )}
        </View>

        {/* ── 2. Greeting & Responses ── */}
        <View style={st.card}>
          <ShimmerOverlay />
          <SectionHeader
            title="Greeting & Responses"
            icon="chatbubbles-outline"
            expanded={isExpanded('greeting')}
            onPress={() => toggleSection('greeting')}
          />
          {isExpanded('greeting') && (
            <View style={st.sectionContent}>
              <Text style={st.fieldLabel}>Custom Greeting</Text>
              <TextInput
                style={st.textArea}
                value={config.greeting}
                onChangeText={(t) => updateConfig({ greeting: t })}
                multiline
                numberOfLines={3}
                placeholderTextColor={Colors.textMuted}
                selectionColor={Colors.electric}
              />

              <Text style={[st.fieldLabel, { marginTop: Spacing.base }]}>After-Hours Greeting</Text>
              <TextInput
                style={st.textArea}
                value={config.after_hours_greeting}
                onChangeText={(t) => updateConfig({ after_hours_greeting: t })}
                multiline
                numberOfLines={3}
                placeholderTextColor={Colors.textMuted}
                selectionColor={Colors.electric}
              />

              <View style={{ marginTop: Spacing.base }}>
                <Text style={st.fieldLabel}>Language</Text>
                <PillGroup
                  options={[
                    { value: 'en' as const, label: 'English' },
                    { value: 'es' as const, label: 'Spanish' },
                    { value: 'both' as const, label: 'Both' },
                  ]}
                  value={config.language}
                  onChange={(v) => updateConfig({ language: v })}
                />
              </View>

              <View style={{ marginTop: Spacing.base }}>
                <Button
                  title="Test Greeting"
                  onPress={() => {
                    Alert.alert('Test Greeting', 'Audio preview will be available in a future update.');
                  }}
                  variant="secondary"
                  size="md"
                  icon={<Ionicons name="play-outline" size={18} color={Colors.electric} />}
                  fullWidth
                />
              </View>
            </View>
          )}
        </View>

        {/* ── 3. Business Hours ── */}
        <View style={st.card}>
          <ShimmerOverlay />
          <SectionHeader
            title="Business Hours"
            icon="time-outline"
            expanded={isExpanded('hours')}
            onPress={() => toggleSection('hours')}
          />
          {isExpanded('hours') && (
            <View style={st.sectionContent}>
              {DAYS.map((day) => {
                const hours = config.business_hours[day.key];
                if (!hours) return null;
                return (
                  <View key={day.key} style={st.dayRow}>
                    <Switch
                      value={hours.enabled}
                      onValueChange={(v) => updateBusinessHour(day.key, 'enabled', v)}
                      trackColor={{ false: Colors.bgElevated, true: Colors.electric }}
                      thumbColor="#fff"
                      style={st.daySwitch}
                    />
                    <Text style={[st.dayLabel, !hours.enabled && { color: Colors.textMuted }]}>
                      {day.label}
                    </Text>
                    {hours.enabled ? (
                      <View style={st.dayTimes}>
                        <TimeControl
                          value={hours.start}
                          onChange={(v) => updateBusinessHour(day.key, 'start', v)}
                        />
                        <Text style={st.dayTimeSep}>-</Text>
                        <TimeControl
                          value={hours.end}
                          onChange={(v) => updateBusinessHour(day.key, 'end', v)}
                        />
                      </View>
                    ) : (
                      <Text style={st.dayClosedText}>Closed</Text>
                    )}
                  </View>
                );
              })}

              <Pressable onPress={handleCopyToAll} style={st.copyAllBtn}>
                <Ionicons name="copy-outline" size={16} color={Colors.electric} />
                <Text style={st.copyAllText}>Copy to All Days</Text>
              </Pressable>

              <View style={st.divider} />

              <Text style={st.fieldLabel}>After-Hours Behavior</Text>
              <OptionSelector
                value={config.after_hours_behavior}
                options={AFTER_HOURS_OPTIONS}
                onChange={(v) => updateConfig({ after_hours_behavior: v as AgentConfig['after_hours_behavior'] })}
              />
            </View>
          )}
        </View>

        {/* ── 4. Call Handling ── */}
        <View style={st.card}>
          <ShimmerOverlay />
          <SectionHeader
            title="Call Handling"
            icon="settings-outline"
            expanded={isExpanded('call')}
            onPress={() => toggleSection('call')}
          />
          {isExpanded('call') && (
            <View style={st.sectionContent}>
              <Text style={st.fieldLabel}>Information to Capture</Text>
              <View style={st.checkboxGrid}>
                {CAPTURE_FIELDS.map((f) => (
                  <CheckboxRow
                    key={f.key}
                    icon={f.icon}
                    label={f.label}
                    checked={!!config.capture_fields[f.key]}
                    onChange={(v) => updateCaptureField(f.key, v)}
                  />
                ))}
              </View>

              <View style={st.divider} />

              <DurationStepper
                value={config.max_call_duration}
                onChange={(v) => updateConfig({ max_call_duration: v })}
              />

              <View style={st.divider} />

              <ToggleRow
                icon="swap-horizontal-outline"
                iconColor={Colors.cyan}
                label="Transfer to Owner"
                value={config.transfer_enabled}
                onValueChange={(v) => updateConfig({ transfer_enabled: v })}
              />
              {config.transfer_enabled && (
                <View style={st.transferPhoneWrap}>
                  <TextInput
                    style={st.phoneInput}
                    value={config.transfer_phone}
                    onChangeText={(t) => updateConfig({ transfer_phone: t })}
                    placeholder="(555) 123-4567"
                    placeholderTextColor={Colors.textMuted}
                    selectionColor={Colors.electric}
                    keyboardType="phone-pad"
                  />
                </View>
              )}

              <ToggleRow
                icon="recording-outline"
                iconColor={Colors.warning}
                label="Call Recording"
                value={config.call_recording}
                onValueChange={(v) => updateConfig({ call_recording: v })}
                isLast
              />
            </View>
          )}
        </View>

        {/* ── 5. FAQ / Knowledge Base ── */}
        <View style={st.card}>
          <ShimmerOverlay />
          <SectionHeader
            title="FAQ / Knowledge Base"
            icon="book-outline"
            expanded={isExpanded('faq')}
            onPress={() => toggleSection('faq')}
          />
          {isExpanded('faq') && (
            <View style={st.sectionContent}>
              <Text style={st.faqHint}>Swipe left on any FAQ to delete it</Text>
              {config.faqs.map((faq, i) => (
                <SwipeableFAQRow key={`${faq.question}-${i}`} faq={faq} onDelete={() => removeFAQ(i)} />
              ))}
              <View style={{ marginTop: Spacing.md }}>
                <Button
                  title="Add FAQ"
                  onPress={() => setShowFAQModal(true)}
                  variant="secondary"
                  size="md"
                  icon={<Ionicons name="add-circle-outline" size={18} color={Colors.electric} />}
                  fullWidth
                />
              </View>
            </View>
          )}
        </View>

        {/* ── 6. Notifications ── */}
        <View style={st.card}>
          <ShimmerOverlay />
          <SectionHeader
            title="Notifications"
            icon="notifications-outline"
            expanded={isExpanded('notifications')}
            onPress={() => toggleSection('notifications')}
          />
          {isExpanded('notifications') && (
            <View style={st.sectionContent}>
              <ToggleRow
                icon="flash-outline"
                iconColor={Colors.electric}
                label="Push on Every New Lead"
                value={config.push_on_new_lead}
                onValueChange={(v) => updateConfig({ push_on_new_lead: v })}
              />
              <ToggleRow
                icon="today-outline"
                iconColor={Colors.cyan}
                label="Daily Summary"
                value={config.daily_summary}
                onValueChange={(v) => updateConfig({ daily_summary: v })}
              />
              <ToggleRow
                icon="bar-chart-outline"
                iconColor={Colors.success}
                label="Weekly Performance Report"
                value={config.weekly_report}
                onValueChange={(v) => updateConfig({ weekly_report: v })}
              />
              <ToggleRow
                icon="alert-circle-outline"
                iconColor={Colors.danger}
                label="Alert When Agent Offline"
                value={config.offline_alert}
                onValueChange={(v) => updateConfig({ offline_alert: v })}
                isLast
              />
            </View>
          )}
        </View>

        {/* ── Bottom Actions ── */}
        <View style={st.bottomActions}>
          <Button title="Save Changes" onPress={handleSave} size="lg" fullWidth loading={saving} />
          <Pressable onPress={handleReset} style={st.resetBtn}>
            <Text style={st.resetText}>Reset to Defaults</Text>
          </Pressable>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <AddFAQModal
        visible={showFAQModal}
        onClose={() => setShowFAQModal(false)}
        onAdd={addFAQ}
      />
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgPrimary },
  container: { flex: 1 },
  scroll: { paddingHorizontal: ScreenPadding.horizontal },
  shimmer: { position: 'absolute', top: 0, bottom: 0, width: SCREEN_W * 0.6, zIndex: 1 },

  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.base,
    paddingBottom: Spacing.md,
  },
  title: { ...TextStyles.h1, color: Colors.textPrimary },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: {
    ...Fonts.bodyMedium,
    fontSize: TypeScale.caption,
  },

  /* Card */
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginTop: Spacing.md,
  },

  /* Section Header */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  sectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.electricMuted,
  },
  sectionHeaderTitle: {
    ...Fonts.bodySemibold,
    fontSize: TypeScale.body,
    color: Colors.textPrimary,
  },

  /* Section Content */
  sectionContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },

  /* Field Label */
  fieldLabel: {
    ...Fonts.bodyMedium,
    fontSize: TypeScale.caption,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.base,
    marginBottom: Spacing.sm,
  },

  /* Voice Cards */
  voiceScroll: { gap: Spacing.sm, paddingVertical: Spacing.xs },
  voiceCard: {
    width: 120,
    backgroundColor: Colors.bgInput,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  voiceCardSelected: {
    borderColor: Colors.electric,
    backgroundColor: Colors.electricMuted,
    shadowColor: Colors.electric,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  voiceIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceIconWrapSelected: { backgroundColor: Colors.electricMuted },
  voiceCardName: {
    ...Fonts.bodyMedium,
    fontSize: TypeScale.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  voiceCardNameSelected: { color: Colors.textPrimary },
  voiceCheckRow: { position: 'absolute', top: Spacing.sm, right: Spacing.sm },
  voicePreviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: Spacing.xs,
  },
  voicePreviewText: {
    ...Fonts.body,
    fontSize: TypeScale.tiny,
    color: Colors.textMuted,
  },

  /* Personality Slider */
  sliderWrap: { marginTop: Spacing.base },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  sliderLabelText: {
    ...Fonts.bodyMedium,
    fontSize: TypeScale.caption,
    color: Colors.textMuted,
  },
  sliderTrackOuter: {
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    position: 'relative',
  },
  sliderTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 6,
    borderRadius: 3,
    top: 15,
    opacity: 0.3,
  },
  sliderTrackBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 6,
    borderRadius: 3,
    top: 15,
    backgroundColor: Colors.bgElevated,
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    height: 6,
    borderRadius: 3,
    top: 15,
    overflow: 'hidden',
  },
  sliderThumb: {
    position: 'absolute',
    top: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: Colors.electric,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },

  /* Pill Group */
  pillGroup: {
    flexDirection: 'row',
    backgroundColor: Colors.bgInput,
    borderRadius: BorderRadius.md,
    padding: 3,
    gap: 3,
  },
  pill: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md - 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: { backgroundColor: Colors.electric },
  pillText: {
    ...Fonts.bodyMedium,
    fontSize: TypeScale.bodySm,
    color: Colors.textMuted,
  },
  pillTextActive: { color: '#fff' },

  /* TextArea */
  textArea: {
    backgroundColor: Colors.bgInput,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.base,
    ...Fonts.body,
    fontSize: TypeScale.body,
    color: Colors.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
  },

  /* Time Control */
  timeControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  timeArrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    ...Fonts.mono,
    fontSize: TypeScale.caption,
    color: Colors.textPrimary,
    minWidth: 66,
    textAlign: 'center',
  },

  /* Day Row */
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  daySwitch: { transform: [{ scale: 0.8 }] },
  dayLabel: {
    ...Fonts.bodySemibold,
    fontSize: TypeScale.bodySm,
    color: Colors.textPrimary,
    width: 36,
    marginLeft: Spacing.sm,
  },
  dayTimes: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.xs,
  },
  dayTimeSep: {
    ...Fonts.body,
    fontSize: TypeScale.bodySm,
    color: Colors.textMuted,
  },
  dayClosedText: {
    ...Fonts.body,
    fontSize: TypeScale.bodySm,
    color: Colors.textMuted,
    flex: 1,
    textAlign: 'right',
  },

  /* Copy to All */
  copyAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    marginTop: Spacing.xs,
  },
  copyAllText: {
    ...Fonts.bodyMedium,
    fontSize: TypeScale.bodySm,
    color: Colors.electric,
  },

  /* Divider */
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },

  /* Duration Stepper */
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  stepperLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  stepperLabelText: {
    ...Fonts.bodySemibold,
    fontSize: TypeScale.body,
    color: Colors.textPrimary,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.bgInput,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    ...Fonts.monoBold,
    fontSize: TypeScale.body,
    color: Colors.textPrimary,
    minWidth: 48,
    textAlign: 'center',
  },

  /* Toggle Row */
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  toggleRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  toggleIconWrap: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleLabel: {
    ...Fonts.bodySemibold,
    fontSize: TypeScale.body,
    color: Colors.textPrimary,
    flex: 1,
  },

  /* Checkbox Row */
  checkboxGrid: { gap: Spacing.xs },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgInput,
  },
  checkboxLabel: {
    ...Fonts.body,
    fontSize: TypeScale.body,
    color: Colors.textPrimary,
  },

  /* Transfer Phone */
  transferPhoneWrap: { paddingLeft: 44, paddingBottom: Spacing.sm },
  phoneInput: {
    backgroundColor: Colors.bgInput,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.base,
    height: 44,
    ...Fonts.mono,
    fontSize: TypeScale.body,
    color: Colors.textPrimary,
  },

  /* Option Selector */
  optionSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgInput,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  optionSelectorLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  optionSelectorText: {
    ...Fonts.bodyMedium,
    fontSize: TypeScale.body,
    color: Colors.textPrimary,
  },
  optionDropdown: {
    backgroundColor: Colors.bgInput,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.xs,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  optionItemActive: { backgroundColor: Colors.electricMuted },
  optionItemText: {
    ...Fonts.body,
    fontSize: TypeScale.body,
    color: Colors.textSecondary,
    flex: 1,
  },

  /* FAQ */
  faqHint: {
    ...Fonts.body,
    fontSize: TypeScale.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  swipeContainer: {
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  swipeDeleteBg: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 72,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopRightRadius: BorderRadius.md,
    borderBottomRightRadius: BorderRadius.md,
  },
  swipeDeleteBtn: { alignItems: 'center', justifyContent: 'center', gap: 2 },
  swipeDeleteText: {
    ...Fonts.bodyMedium,
    fontSize: TypeScale.tiny,
    color: '#fff',
  },
  faqRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.bgInput,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  faqIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.electricMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  faqContent: { flex: 1, gap: Spacing.xs },
  faqQuestion: {
    ...Fonts.bodySemibold,
    fontSize: TypeScale.bodySm,
    color: Colors.textPrimary,
  },
  faqAnswer: {
    ...Fonts.body,
    fontSize: TypeScale.caption,
    color: Colors.textSecondary,
    lineHeight: TypeScale.caption * 1.4,
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  modalContent: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    ...Fonts.display,
    fontSize: TypeScale.h3,
    color: Colors.textPrimary,
  },
  modalInputLabel: {
    ...Fonts.bodyMedium,
    fontSize: TypeScale.caption,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  modalInput: {
    backgroundColor: Colors.bgInput,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.base,
    ...Fonts.body,
    fontSize: TypeScale.body,
    color: Colors.textPrimary,
    minHeight: 50,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },

  /* Bottom Actions */
  bottomActions: {
    marginTop: Spacing['2xl'],
    gap: Spacing.md,
    alignItems: 'center',
  },
  resetBtn: {
    paddingVertical: Spacing.md,
  },
  resetText: {
    ...Fonts.bodyMedium,
    fontSize: TypeScale.body,
    color: Colors.textMuted,
  },
});
