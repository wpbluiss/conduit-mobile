import { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Dimensions,
  TextInput,
  Switch,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/colors';
import { Fonts, TypeScale, TextStyles } from '../constants/typography';
import { Spacing, BorderRadius, ScreenPadding } from '../constants/layout';
import { api, type Location } from '../lib/api';

const { width: SCREEN_W } = Dimensions.get('window');

// ── Mock Data ────────────────────────────────────────────────

const MOCK_LOCATIONS: Location[] = [
  {
    id: 'loc-1',
    name: 'Main Office - West Palm Beach',
    address: '123 Clematis St, West Palm Beach, FL 33401',
    phone: '(561) 555-0142',
    business_type: 'Service Business',
    agent_status: 'active',
    calls_today: 12,
    leads_today: 5,
    active_hours: '8am - 6pm',
    business_hours: {
      monday: { enabled: true, start: '08:00', end: '18:00' },
      tuesday: { enabled: true, start: '08:00', end: '18:00' },
      wednesday: { enabled: true, start: '08:00', end: '18:00' },
      thursday: { enabled: true, start: '08:00', end: '18:00' },
      friday: { enabled: true, start: '08:00', end: '17:00' },
      saturday: { enabled: true, start: '09:00', end: '14:00' },
      sunday: { enabled: false, start: '00:00', end: '00:00' },
    },
    agent_voice: 'Aria (Professional)',
    agent_personality: 7,
    last_call_at: '2026-03-02T14:22:00Z',
  },
  {
    id: 'loc-2',
    name: 'North Palm Beach Branch',
    address: '456 US-1, North Palm Beach, FL 33408',
    phone: '(561) 555-0198',
    business_type: 'Service Business',
    agent_status: 'active',
    calls_today: 8,
    leads_today: 3,
    active_hours: '9am - 5pm',
    business_hours: {
      monday: { enabled: true, start: '09:00', end: '17:00' },
      tuesday: { enabled: true, start: '09:00', end: '17:00' },
      wednesday: { enabled: true, start: '09:00', end: '17:00' },
      thursday: { enabled: true, start: '09:00', end: '17:00' },
      friday: { enabled: true, start: '09:00', end: '17:00' },
      saturday: { enabled: false, start: '00:00', end: '00:00' },
      sunday: { enabled: false, start: '00:00', end: '00:00' },
    },
    agent_voice: 'Kai (Friendly)',
    agent_personality: 8,
    last_call_at: '2026-03-02T12:05:00Z',
  },
  {
    id: 'loc-3',
    name: 'Boca Raton (Coming Soon)',
    address: '789 Glades Rd, Boca Raton, FL 33431',
    phone: 'Not assigned',
    business_type: 'Service Business',
    agent_status: 'inactive',
    calls_today: 0,
    leads_today: 0,
    active_hours: '--',
    business_hours: {
      monday: { enabled: true, start: '09:00', end: '17:00' },
      tuesday: { enabled: true, start: '09:00', end: '17:00' },
      wednesday: { enabled: true, start: '09:00', end: '17:00' },
      thursday: { enabled: true, start: '09:00', end: '17:00' },
      friday: { enabled: true, start: '09:00', end: '17:00' },
      saturday: { enabled: false, start: '00:00', end: '00:00' },
      sunday: { enabled: false, start: '00:00', end: '00:00' },
    },
    agent_voice: 'Aria (Professional)',
    agent_personality: 5,
    last_call_at: undefined,
  },
];

const BUSINESS_TYPES = [
  'Service Business',
  'Restaurant / Food',
  'Healthcare',
  'Real Estate',
  'Legal',
  'Home Services',
  'Auto / Dealership',
  'Salon / Spa',
  'Other',
];

// ── Helpers ──────────────────────────────────────────────────

function getTimeAgo(iso?: string): string {
  if (!iso) return 'Never';
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function formatHours(bh: Location['business_hours']): string {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const parts: string[] = [];

  let i = 0;
  while (i < days.length) {
    const day = bh[days[i]];
    if (!day?.enabled) { i++; continue; }
    const start = day.start;
    const end = day.end;
    let j = i;
    while (j < days.length - 1 && bh[days[j + 1]]?.enabled && bh[days[j + 1]]?.start === start && bh[days[j + 1]]?.end === end) {
      j++;
    }
    const timeStr = `${formatTime(start)}-${formatTime(end)}`;
    parts.push(i === j ? `${labels[i]} ${timeStr}` : `${labels[i]}-${labels[j]} ${timeStr}`);
    i = j + 1;
  }
  return parts.join(', ') || 'Not set';
}

function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'p' : 'a';
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return m === 0 ? `${hour}${suffix}` : `${hour}:${String(m).padStart(2, '0')}${suffix}`;
}

// ── Shimmer Effect ───────────────────────────────────────────

function ShimmerOverlay() {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(3000),
      ])
    ).start();
  }, []);
  const translateX = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-SCREEN_W, SCREEN_W] });
  return (
    <Animated.View style={[st.shimmer, { transform: [{ translateX }] }]}>
      <LinearGradient
        colors={['transparent', 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)', 'transparent']}
        start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

// ── Stagger Entrance ─────────────────────────────────────────

function StaggerIn({ index, children }: { index: number; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;
  useEffect(() => {
    const delay = index * 80;
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>;
}

// ── Mini Stat ────────────────────────────────────────────────

function MiniStat({ icon, label, value, color }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <View style={st.miniStat}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={st.miniStatValue}>{value}</Text>
      <Text style={st.miniStatLabel}>{label}</Text>
    </View>
  );
}

// ── Location Card ────────────────────────────────────────────

function LocationCard({
  location,
  index,
  onToggleAgent,
}: {
  location: Location;
  index: number;
  onToggleAgent: (id: string, active: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isActive = location.agent_status === 'active';
  const accentColor = isActive ? Colors.electric : Colors.textMuted;

  return (
    <StaggerIn index={index + 1}>
      <View style={[st.locCard, { borderLeftColor: accentColor }]}>
        <ShimmerOverlay />

        {/* Name & Address */}
        <View style={st.locHeader}>
          <View style={st.locNameCol}>
            <Text style={st.locName}>{location.name}</Text>
            <Text style={st.locAddress}>{location.address}</Text>
          </View>
        </View>

        {/* Phone & Agent Status */}
        <View style={st.locInfoRow}>
          <View style={st.locPhoneWrap}>
            <Ionicons name="call-outline" size={14} color={Colors.textMuted} />
            <Text style={st.locPhone}>{location.phone}</Text>
          </View>
          <View style={st.locAgentToggle}>
            <View style={[st.statusDot, { backgroundColor: isActive ? Colors.success : Colors.danger }]} />
            <Text style={[st.statusText, { color: isActive ? Colors.success : Colors.danger }]}>
              {isActive ? 'Active' : 'Inactive'}
            </Text>
            <Switch
              value={isActive}
              onValueChange={(val) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onToggleAgent(location.id, val);
              }}
              trackColor={{ false: Colors.bgElevated, true: Colors.successGlow }}
              thumbColor={isActive ? Colors.success : Colors.textMuted}
              ios_backgroundColor={Colors.bgElevated}
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
          </View>
        </View>

        {/* Quick Stats */}
        <View style={st.locStatsRow}>
          <MiniStat icon="call" label="Calls" value={location.calls_today} color={Colors.electric} />
          <View style={st.locStatDivider} />
          <MiniStat icon="people" label="Leads" value={location.leads_today} color={Colors.success} />
          <View style={st.locStatDivider} />
          <MiniStat icon="time" label="Hours" value={location.active_hours} color={Colors.cyan} />
        </View>

        {/* Action Buttons */}
        <View style={st.locActions}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert('Agent Settings', `Agent settings for ${location.name}`);
            }}
            style={st.locActionBtn}
          >
            <Ionicons name="settings-outline" size={14} color={Colors.electric} />
            <Text style={st.locActionText}>Configure Agent</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert('Analytics', `View analytics for ${location.name}`);
            }}
            style={st.locActionBtn}
          >
            <Ionicons name="bar-chart-outline" size={14} color={Colors.electric} />
            <Text style={st.locActionText}>View Analytics</Text>
          </Pressable>
        </View>

        {/* Expandable Details */}
        <Pressable
          onPress={() => { Haptics.selectionAsync(); setExpanded(!expanded); }}
          style={st.expandToggle}
        >
          <Text style={st.expandToggleText}>{expanded ? 'Hide Details' : 'Show Details'}</Text>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textMuted} />
        </Pressable>

        {expanded && (
          <View style={st.locDetails}>
            <View style={st.detailRow}>
              <View style={st.detailIconWrap}>
                <Ionicons name="calendar-outline" size={14} color={Colors.cyan} />
              </View>
              <View style={st.detailContent}>
                <Text style={st.detailLabel}>Business Hours</Text>
                <Text style={st.detailValue}>{formatHours(location.business_hours)}</Text>
              </View>
            </View>

            <View style={st.detailDivider} />

            <View style={st.detailRow}>
              <View style={st.detailIconWrap}>
                <Ionicons name="mic-outline" size={14} color={Colors.electric} />
              </View>
              <View style={st.detailContent}>
                <Text style={st.detailLabel}>Agent Voice</Text>
                <Text style={st.detailValue}>{location.agent_voice}</Text>
              </View>
            </View>

            <View style={st.detailDivider} />

            <View style={st.detailRow}>
              <View style={st.detailIconWrap}>
                <Ionicons name="speedometer-outline" size={14} color={Colors.warning} />
              </View>
              <View style={st.detailContent}>
                <Text style={st.detailLabel}>Personality</Text>
                <View style={st.personalityBar}>
                  <View style={st.personalityTrack}>
                    <LinearGradient
                      colors={Colors.gradientElectric}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={[st.personalityFill, { width: `${location.agent_personality * 10}%` as any }]}
                    />
                  </View>
                  <Text style={st.personalityValue}>{location.agent_personality}/10</Text>
                </View>
              </View>
            </View>

            <View style={st.detailDivider} />

            <View style={st.detailRow}>
              <View style={st.detailIconWrap}>
                <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
              </View>
              <View style={st.detailContent}>
                <Text style={st.detailLabel}>Last Call</Text>
                <Text style={st.detailValue}>{getTimeAgo(location.last_call_at)}</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </StaggerIn>
  );
}

// ── Add Location Modal ───────────────────────────────────────

function AddLocationModal({
  visible,
  onClose,
  onAdd,
  existingLocations,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (data: { name: string; address: string; phone: string; business_type: string; copy_from: string }) => void;
  existingLocations: Location[];
}) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [businessType, setBusinessType] = useState('Service Business');
  const [copyFrom, setCopyFrom] = useState('fresh');
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [copyPickerOpen, setCopyPickerOpen] = useState(false);

  const reset = () => {
    setName(''); setAddress(''); setPhone('');
    setBusinessType('Service Business'); setCopyFrom('fresh');
    setTypePickerOpen(false); setCopyPickerOpen(false);
  };

  const handleAdd = () => {
    if (!name.trim() || !address.trim()) {
      Alert.alert('Missing Fields', 'Please enter a location name and address.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAdd({ name: name.trim(), address: address.trim(), phone: phone.trim(), business_type: businessType, copy_from: copyFrom });
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={st.modalOverlay}
      >
        <Pressable style={st.modalBackdrop} onPress={() => { reset(); onClose(); }} />
        <View style={[st.modalSheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <View style={st.modalHandle} />
          <Text style={st.modalTitle}>Add Location</Text>
          <Text style={st.modalSubtitle}>Set up a new business location with its own AI agent</Text>

          <ScrollView showsVerticalScrollIndicator={false} style={st.modalScroll}>
            {/* Name */}
            <Text style={st.inputLabel}>Location name</Text>
            <TextInput
              style={st.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Downtown Office"
              placeholderTextColor={Colors.textMuted}
            />

            {/* Address */}
            <Text style={st.inputLabel}>Address</Text>
            <TextInput
              style={st.input}
              value={address}
              onChangeText={setAddress}
              placeholder="123 Main St, City, State ZIP"
              placeholderTextColor={Colors.textMuted}
            />

            {/* Phone */}
            <Text style={st.inputLabel}>Phone number</Text>
            <TextInput
              style={st.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="(555) 000-0000"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
            />
            <Text style={st.inputNote}>A new Conduit number will be assigned</Text>

            {/* Business Type Dropdown */}
            <Text style={st.inputLabel}>Business type</Text>
            <Pressable
              onPress={() => { Haptics.selectionAsync(); setTypePickerOpen(!typePickerOpen); setCopyPickerOpen(false); }}
              style={st.dropdown}
            >
              <Text style={st.dropdownText}>{businessType}</Text>
              <Ionicons name={typePickerOpen ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textMuted} />
            </Pressable>
            {typePickerOpen && (
              <View style={st.dropdownList}>
                {BUSINESS_TYPES.map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => { Haptics.selectionAsync(); setBusinessType(t); setTypePickerOpen(false); }}
                    style={[st.dropdownItem, businessType === t && st.dropdownItemActive]}
                  >
                    <Text style={[st.dropdownItemText, businessType === t && { color: Colors.electric }]}>{t}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Copy Settings From */}
            <Text style={st.inputLabel}>Copy settings from</Text>
            <Pressable
              onPress={() => { Haptics.selectionAsync(); setCopyPickerOpen(!copyPickerOpen); setTypePickerOpen(false); }}
              style={st.dropdown}
            >
              <Text style={st.dropdownText}>
                {copyFrom === 'fresh' ? 'Start fresh' : existingLocations.find((l) => l.id === copyFrom)?.name || 'Start fresh'}
              </Text>
              <Ionicons name={copyPickerOpen ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textMuted} />
            </Pressable>
            {copyPickerOpen && (
              <View style={st.dropdownList}>
                <Pressable
                  onPress={() => { Haptics.selectionAsync(); setCopyFrom('fresh'); setCopyPickerOpen(false); }}
                  style={[st.dropdownItem, copyFrom === 'fresh' && st.dropdownItemActive]}
                >
                  <Text style={[st.dropdownItemText, copyFrom === 'fresh' && { color: Colors.electric }]}>Start fresh</Text>
                </Pressable>
                {existingLocations.map((loc) => (
                  <Pressable
                    key={loc.id}
                    onPress={() => { Haptics.selectionAsync(); setCopyFrom(loc.id); setCopyPickerOpen(false); }}
                    style={[st.dropdownItem, copyFrom === loc.id && st.dropdownItemActive]}
                  >
                    <Text style={[st.dropdownItemText, copyFrom === loc.id && { color: Colors.electric }]}>{loc.name}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Add Button */}
            <Pressable onPress={handleAdd} style={st.addBtnWrap}>
              <LinearGradient
                colors={Colors.gradientElectric}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={st.addBtn}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={st.addBtnText}>Add Location</Text>
              </LinearGradient>
            </Pressable>

            <View style={st.pricingNote}>
              <Ionicons name="information-circle-outline" size={14} color={Colors.textMuted} />
              <Text style={st.pricingNoteText}>Additional locations are $29/mo each</Text>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Main Screen ──────────────────────────────────────────────

export default function LocationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [locations, setLocations] = useState<Location[]>(MOCK_LOCATIONS);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    api.getLocations()
      .then(setLocations)
      .catch(() => { /* use mock */ });
  }, []);

  const handleToggleAgent = useCallback((id: string, active: boolean) => {
    setLocations((prev) =>
      prev.map((loc) =>
        loc.id === id ? { ...loc, agent_status: active ? 'active' : 'inactive' } : loc
      )
    );
  }, []);

  const handleAddLocation = useCallback((data: { name: string; address: string; phone: string; business_type: string; copy_from: string }) => {
    const newLoc: Location = {
      id: `loc-${Date.now()}`,
      name: data.name,
      address: data.address,
      phone: data.phone || 'Pending assignment',
      business_type: data.business_type,
      agent_status: 'inactive',
      calls_today: 0,
      leads_today: 0,
      active_hours: '--',
      business_hours: {
        monday: { enabled: true, start: '09:00', end: '17:00' },
        tuesday: { enabled: true, start: '09:00', end: '17:00' },
        wednesday: { enabled: true, start: '09:00', end: '17:00' },
        thursday: { enabled: true, start: '09:00', end: '17:00' },
        friday: { enabled: true, start: '09:00', end: '17:00' },
        saturday: { enabled: false, start: '00:00', end: '00:00' },
        sunday: { enabled: false, start: '00:00', end: '00:00' },
      },
      agent_voice: 'Aria (Professional)',
      agent_personality: 5,
    };
    setLocations((prev) => [...prev, newLoc]);
    api.createLocation(newLoc).catch(() => {});
  }, []);

  const totalCalls = locations.reduce((sum, l) => sum + l.calls_today, 0);
  const totalLeads = locations.reduce((sum, l) => sum + l.leads_today, 0);
  const activeAgents = locations.filter((l) => l.agent_status === 'active').length;

  return (
    <View style={st.root}>
      <LinearGradient
        colors={[Colors.bgPrimary, Colors.bgPrimary, 'rgba(14, 165, 233, 0.03)']}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* ── Header ── */}
      <View style={[st.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={st.backBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <View style={st.headerTextCol}>
          <Text style={st.headerTitle}>Locations & Agents</Text>
          <Text style={st.headerSub}>Manage multiple business locations</Text>
        </View>
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setModalVisible(true); }}
          style={st.addHeaderBtnWrap}
        >
          <LinearGradient
            colors={Colors.gradientElectric}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={st.addHeaderBtn}
          >
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={st.addHeaderBtnText}>Add</Text>
          </LinearGradient>
        </Pressable>
      </View>

      <ScrollView
        style={st.container}
        contentContainerStyle={st.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Overview Summary ── */}
        <StaggerIn index={0}>
          <View style={st.overviewCard}>
            <ShimmerOverlay />
            <Text style={st.overviewTitle}>Overview</Text>
            <View style={st.overviewStatsRow}>
              <View style={st.overviewStat}>
                <Text style={st.overviewStatValue}>{locations.length}</Text>
                <Text style={st.overviewStatLabel}>Locations</Text>
              </View>
              <View style={st.overviewDivider} />
              <View style={st.overviewStat}>
                <Text style={[st.overviewStatValue, { color: Colors.success }]}>{activeAgents}</Text>
                <Text style={st.overviewStatLabel}>Active Agents</Text>
              </View>
              <View style={st.overviewDivider} />
              <View style={st.overviewStat}>
                <Text style={[st.overviewStatValue, { color: Colors.electric }]}>{totalCalls}</Text>
                <Text style={st.overviewStatLabel}>Calls Today</Text>
              </View>
              <View style={st.overviewDivider} />
              <View style={st.overviewStat}>
                <Text style={[st.overviewStatValue, { color: Colors.cyan }]}>{totalLeads}</Text>
                <Text style={st.overviewStatLabel}>Leads Today</Text>
              </View>
            </View>
          </View>
        </StaggerIn>

        {/* ── Section Header ── */}
        <View style={st.sectionHeader}>
          <View style={st.sectionLeft}>
            <View style={st.sectionDot} />
            <Text style={st.sectionTitle}>Your Locations</Text>
          </View>
          <Text style={st.locationCount}>{locations.length} total</Text>
        </View>

        {/* ── Location Cards ── */}
        {locations.map((loc, i) => (
          <LocationCard
            key={loc.id}
            location={loc}
            index={i}
            onToggleAgent={handleToggleAgent}
          />
        ))}

        {/* ── Expand Prompt (if few locations) ── */}
        {locations.length < 3 && (
          <StaggerIn index={locations.length + 1}>
            <View style={st.expandPrompt}>
              <ShimmerOverlay />
              <View style={st.expandIconWrap}>
                <LinearGradient
                  colors={Colors.gradientElectric}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={st.expandIconBg}
                >
                  <Ionicons name="business-outline" size={28} color="#fff" />
                </LinearGradient>
              </View>
              <Text style={st.expandTitle}>Expand to multiple locations</Text>
              <Text style={st.expandDesc}>
                Businesses with 2+ locations capture 3x more leads
              </Text>
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setModalVisible(true); }}
                style={st.expandBtnWrap}
              >
                <LinearGradient
                  colors={Colors.gradientElectric}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={st.expandBtn}
                >
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={st.expandBtnText}>Add Location</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </StaggerIn>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <AddLocationModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={handleAddLocation}
        existingLocations={locations}
      />
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgPrimary },
  container: { flex: 1 },
  scroll: { paddingHorizontal: ScreenPadding.horizontal, gap: Spacing.md },
  shimmer: { position: 'absolute', top: 0, bottom: 0, width: SCREEN_W * 0.6, zIndex: 1 },

  /* ── Header ── */
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: ScreenPadding.horizontal, paddingBottom: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.bgPrimary,
  },
  backBtn: { marginRight: Spacing.sm },
  headerTextCol: { flex: 1 },
  headerTitle: { ...Fonts.bodySemibold, fontSize: TypeScale.h3, color: Colors.textPrimary },
  headerSub: { ...Fonts.body, fontSize: TypeScale.caption, color: Colors.textMuted, marginTop: 1 },
  addHeaderBtnWrap: { borderRadius: BorderRadius.md, overflow: 'hidden' },
  addHeaderBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  addHeaderBtnText: { ...Fonts.bodySemibold, fontSize: TypeScale.caption, color: '#fff' },

  /* ── Overview Card ── */
  overviewCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.lg, overflow: 'hidden', marginTop: Spacing.sm,
  },
  overviewTitle: {
    ...Fonts.bodyMedium, fontSize: TypeScale.caption, color: Colors.textMuted,
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: Spacing.md,
  },
  overviewStatsRow: { flexDirection: 'row', alignItems: 'center' },
  overviewStat: { flex: 1, alignItems: 'center' },
  overviewStatValue: { ...Fonts.monoBold, fontSize: TypeScale.h2, color: Colors.textPrimary },
  overviewStatLabel: {
    ...Fonts.body, fontSize: TypeScale.tiny, color: Colors.textMuted, marginTop: 2,
  },
  overviewDivider: { width: 1, height: 32, backgroundColor: Colors.border },

  /* ── Section Header ── */
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: Spacing.sm,
  },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.electric },
  sectionTitle: { ...Fonts.bodySemibold, fontSize: TypeScale.h4, color: Colors.textPrimary },
  locationCount: { ...Fonts.mono, fontSize: TypeScale.caption, color: Colors.textMuted },

  /* ── Location Card ── */
  locCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border,
    borderLeftWidth: 3, padding: Spacing.base, overflow: 'hidden',
  },
  locHeader: { marginBottom: Spacing.sm },
  locNameCol: {},
  locName: { ...Fonts.bodySemibold, fontSize: TypeScale.bodyLg, color: Colors.textPrimary },
  locAddress: { ...Fonts.body, fontSize: TypeScale.caption, color: Colors.textMuted, marginTop: 2 },

  locInfoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.md,
  },
  locPhoneWrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  locPhone: { ...Fonts.mono, fontSize: TypeScale.bodySm, color: Colors.textSecondary },
  locAgentToggle: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { ...Fonts.bodyMedium, fontSize: TypeScale.caption },

  locStatsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgElevated, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  miniStat: { flex: 1, alignItems: 'center', gap: 2 },
  miniStatValue: { ...Fonts.monoBold, fontSize: TypeScale.body, color: Colors.textPrimary },
  miniStatLabel: { ...Fonts.body, fontSize: TypeScale.tiny, color: Colors.textMuted },
  locStatDivider: { width: 1, height: 28, backgroundColor: Colors.border },

  locActions: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  locActionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md, backgroundColor: Colors.electricMuted,
    borderWidth: 1, borderColor: Colors.electricBorder,
  },
  locActionText: { ...Fonts.bodyMedium, fontSize: TypeScale.caption, color: Colors.electric },

  expandToggle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs, paddingTop: Spacing.sm,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  expandToggleText: { ...Fonts.body, fontSize: TypeScale.caption, color: Colors.textMuted },

  /* ── Expanded Details ── */
  locDetails: { marginTop: Spacing.md },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, paddingVertical: Spacing.sm },
  detailIconWrap: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: Colors.bgElevated, alignItems: 'center', justifyContent: 'center',
  },
  detailContent: { flex: 1 },
  detailLabel: { ...Fonts.bodyMedium, fontSize: TypeScale.caption, color: Colors.textMuted, marginBottom: 2 },
  detailValue: { ...Fonts.body, fontSize: TypeScale.bodySm, color: Colors.textPrimary },
  detailDivider: { height: 1, backgroundColor: Colors.border },
  personalityBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 2 },
  personalityTrack: {
    flex: 1, height: 6, borderRadius: 3, backgroundColor: Colors.bgElevated, overflow: 'hidden',
  },
  personalityFill: { height: 6, borderRadius: 3 },
  personalityValue: { ...Fonts.monoBold, fontSize: TypeScale.tiny, color: Colors.electric },

  /* ── Expand Prompt ── */
  expandPrompt: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing['2xl'], alignItems: 'center', overflow: 'hidden',
  },
  expandIconWrap: { marginBottom: Spacing.lg },
  expandIconBg: {
    width: 64, height: 64, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  expandTitle: { ...TextStyles.h3, color: Colors.textPrimary, marginBottom: Spacing.sm, textAlign: 'center' },
  expandDesc: {
    ...Fonts.body, fontSize: TypeScale.bodySm, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 20, marginBottom: Spacing.lg,
  },
  expandBtnWrap: { borderRadius: BorderRadius.md, overflow: 'hidden' },
  expandBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: BorderRadius.md,
  },
  expandBtnText: { ...Fonts.bodySemibold, fontSize: TypeScale.body, color: '#fff' },

  /* ── Modal ── */
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
  },
  modalSheet: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: BorderRadius['2xl'], borderTopRightRadius: BorderRadius['2xl'],
    paddingHorizontal: ScreenPadding.horizontal, paddingTop: Spacing.md,
    maxHeight: '85%',
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.textMuted, alignSelf: 'center', marginBottom: Spacing.lg,
  },
  modalTitle: { ...TextStyles.h2, color: Colors.textPrimary, marginBottom: Spacing.xs },
  modalSubtitle: { ...Fonts.body, fontSize: TypeScale.bodySm, color: Colors.textMuted, marginBottom: Spacing.lg },
  modalScroll: { flexGrow: 0 },

  inputLabel: {
    ...Fonts.bodyMedium, fontSize: TypeScale.caption, color: Colors.textMuted,
    letterSpacing: 0.5, marginBottom: Spacing.xs, marginTop: Spacing.md,
  },
  input: {
    backgroundColor: Colors.bgInput, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    ...Fonts.body, fontSize: TypeScale.body, color: Colors.textPrimary,
  },
  inputNote: {
    ...Fonts.body, fontSize: TypeScale.tiny, color: Colors.textMuted, marginTop: Spacing.xs,
  },

  dropdown: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.bgInput, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
  },
  dropdownText: { ...Fonts.body, fontSize: TypeScale.body, color: Colors.textPrimary },
  dropdownList: {
    backgroundColor: Colors.bgElevated, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border, marginTop: Spacing.xs,
    overflow: 'hidden',
  },
  dropdownItem: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  dropdownItemActive: { backgroundColor: Colors.electricMuted },
  dropdownItemText: { ...Fonts.body, fontSize: TypeScale.bodySm, color: Colors.textSecondary },

  addBtnWrap: { borderRadius: BorderRadius.md, overflow: 'hidden', marginTop: Spacing.xl },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: Spacing.base, borderRadius: BorderRadius.md,
  },
  addBtnText: { ...Fonts.bodySemibold, fontSize: TypeScale.bodyLg, color: '#fff' },

  pricingNote: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, marginTop: Spacing.md, marginBottom: Spacing.lg,
  },
  pricingNoteText: { ...Fonts.body, fontSize: TypeScale.caption, color: Colors.textMuted },
});
