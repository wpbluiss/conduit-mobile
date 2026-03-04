import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Dimensions,
  TextInput,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { Colors } from '../constants/colors';
import { Fonts, TypeScale, TextStyles } from '../constants/typography';
import { Spacing, BorderRadius, ScreenPadding } from '../constants/layout';
import { api, type Booking } from '../lib/api';

const { width: SCREEN_W } = Dimensions.get('window');

// ── Date helpers ─────────────────────────────────────────────

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getWeekDays(baseDate: Date): Date[] {
  const d = new Date(baseDate);
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return date;
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatTime12(time24: string): string {
  const [h, m] = time24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

// ── Mock Data ────────────────────────────────────────────────

function buildMockBookings(): Booking[] {
  const today = new Date();
  const week = getWeekDays(today);

  const services = ['Haircut', 'Beard Trim', 'Color Treatment', 'AC Repair', 'Plumbing Estimate', 'Deep Tissue Massage', 'Balayage', 'Full Highlights', 'Furnace Inspection', 'Kitchen Remodel Estimate'];
  const names = ['Maria Gonzalez', 'James Wilson', 'Sofia Reyes', 'David Chen', 'Amanda Brooks', 'Carlos Mendez', 'Emily Davis', 'Ryan Torres', 'Jessica Nguyen', 'Michael Park'];
  const phones = ['+1 (512) 555-0147', '+1 (737) 555-0283', '+1 (210) 555-0391', '+1 (832) 555-0512', '+1 (469) 555-0628', '+1 (512) 555-0734', '+1 (737) 555-0891', '+1 (210) 555-0956', '+1 (832) 555-1023', '+1 (469) 555-1187'];

  const bookings: Booking[] = [
    { id: 'bk-1', client_name: names[0], client_phone: phones[0], service: services[0], date: toDateKey(week[0]), time: '09:00', duration: 45, status: 'completed', source: 'ai' },
    { id: 'bk-2', client_name: names[1], client_phone: phones[1], service: services[3], date: toDateKey(week[1]), time: '10:30', duration: 60, status: 'confirmed', source: 'manual' },
    { id: 'bk-3', client_name: names[2], client_phone: phones[2], service: services[2], date: toDateKey(week[1]), time: '14:00', duration: 90, status: 'confirmed', source: 'ai' },
    { id: 'bk-4', client_name: names[3], client_phone: phones[3], service: services[4], date: toDateKey(week[2]), time: '11:00', duration: 30, status: 'pending', source: 'ai' },
    { id: 'bk-5', client_name: names[4], client_phone: phones[4], service: services[5], date: toDateKey(week[3]), time: '09:30', duration: 60, status: 'confirmed', source: 'manual' },
    { id: 'bk-6', client_name: names[5], client_phone: phones[5], service: services[1], date: toDateKey(week[3]), time: '15:00', duration: 30, status: 'cancelled', source: 'ai' },
    { id: 'bk-7', client_name: names[6], client_phone: phones[6], service: services[6], date: toDateKey(week[4]), time: '10:00', duration: 90, status: 'pending', source: 'ai' },
    { id: 'bk-8', client_name: names[7], client_phone: phones[7], service: services[7], date: toDateKey(week[4]), time: '13:30', duration: 90, status: 'confirmed', source: 'manual' },
    { id: 'bk-9', client_name: names[8], client_phone: phones[8], service: services[8], date: toDateKey(week[5]), time: '08:00', duration: 45, status: 'confirmed', source: 'ai' },
    { id: 'bk-10', client_name: names[9], client_phone: phones[9], service: services[9], date: toDateKey(week[6]), time: '11:00', duration: 60, status: 'pending', source: 'ai', notes: 'Needs measurements first' },
  ];
  return bookings;
}

// ── Status config ────────────────────────────────────────────

const STATUS_CFG: Record<Booking['status'], { label: string; color: string; bg: string }> = {
  confirmed: { label: 'Confirmed', color: Colors.success, bg: Colors.successGlow },
  pending: { label: 'Pending', color: Colors.warning, bg: Colors.warningGlow },
  cancelled: { label: 'Cancelled', color: Colors.danger, bg: Colors.dangerGlow },
  completed: { label: 'Completed', color: Colors.electric, bg: Colors.electricMuted },
};

const DURATIONS = [15, 30, 45, 60, 90];

const SERVICE_OPTIONS = ['Haircut', 'Beard Trim', 'Color Treatment', 'AC Repair', 'Plumbing Estimate', 'Deep Tissue Massage', 'Consultation', 'Other'];

// ── Shimmer ──────────────────────────────────────────────────

function ShimmerOverlay() {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(shimmer, { toValue: 1, duration: 2000, useNativeDriver: true }),
      Animated.timing(shimmer, { toValue: 0, duration: 0, useNativeDriver: true }),
      Animated.delay(3000),
    ])).start();
  }, []);
  const translateX = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-SCREEN_W, SCREEN_W] });
  return (
    <Animated.View style={[st.shimmer, { transform: [{ translateX }] }]}>
      <LinearGradient colors={['transparent', 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
}

// ── Stagger ──────────────────────────────────────────────────

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

// ── Appointment Card ─────────────────────────────────────────

function AppointmentCard({
  booking, onConfirm, onCancel, onCall,
}: {
  booking: Booking;
  onConfirm: () => void;
  onCancel: () => void;
  onCall: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const scfg = STATUS_CFG[booking.status];

  return (
    <Pressable
      onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, friction: 8 }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 8 }).start()}
    >
      <Animated.View style={[st.apptCard, { transform: [{ scale }] }]}>
        <ShimmerOverlay />
        <View style={st.apptRow}>
          {/* Time block */}
          <View style={st.apptTimeBlock}>
            <Text style={st.apptTime}>{formatTime12(booking.time)}</Text>
            <Text style={st.apptDuration}>{booking.duration} min</Text>
          </View>

          {/* Accent line */}
          <View style={[st.apptAccent, { backgroundColor: scfg.color }]} />

          {/* Info */}
          <View style={st.apptInfo}>
            <View style={st.apptNameRow}>
              <Text style={st.apptName} numberOfLines={1}>{booking.client_name}</Text>
              <View style={[st.apptStatusPill, { backgroundColor: scfg.bg }]}>
                <Text style={[st.apptStatusText, { color: scfg.color }]}>{scfg.label}</Text>
              </View>
            </View>
            <Text style={st.apptService}>{booking.service}</Text>
            <View style={st.apptBottomRow}>
              <Pressable onPress={onCall} hitSlop={8} style={st.apptPhoneRow}>
                <Ionicons name="call-outline" size={12} color={Colors.electric} />
                <Text style={st.apptPhone}>{booking.client_phone}</Text>
              </Pressable>
              <Text style={[st.apptSourceLabel, { color: booking.source === 'ai' ? Colors.cyan : Colors.textMuted }]}>
                {booking.source === 'ai' ? 'Booked by AI' : 'Manual'}
              </Text>
            </View>

            {/* Action buttons */}
            {(booking.status === 'pending' || booking.status === 'confirmed') && (
              <View style={st.apptActions}>
                {booking.status === 'pending' && (
                  <Pressable onPress={onConfirm} style={[st.apptActionBtn, { backgroundColor: Colors.successGlow }]}>
                    <Ionicons name="checkmark" size={14} color={Colors.success} />
                    <Text style={[st.apptActionText, { color: Colors.success }]}>Confirm</Text>
                  </Pressable>
                )}
                <Pressable onPress={onCancel} style={[st.apptActionBtn, { backgroundColor: Colors.dangerGlow }]}>
                  <Ionicons name="close" size={14} color={Colors.danger} />
                  <Text style={[st.apptActionText, { color: Colors.danger }]}>Cancel</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ── Upcoming Mini Card ───────────────────────────────────────

function UpcomingMiniCard({ booking }: { booking: Booking }) {
  const scfg = STATUS_CFG[booking.status];
  return (
    <View style={st.upcomingCard}>
      <ShimmerOverlay />
      <View style={st.upcomingTop}>
        <Text style={st.upcomingTime}>{formatTime12(booking.time)}</Text>
        <View style={[st.upcomingDot, { backgroundColor: scfg.color }]} />
      </View>
      <Text style={st.upcomingName} numberOfLines={1}>{booking.client_name}</Text>
      <Text style={st.upcomingService} numberOfLines={1}>{booking.service}</Text>
      <Text style={st.upcomingDate}>
        {new Date(booking.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
      </Text>
    </View>
  );
}

// ── Add Booking Modal ────────────────────────────────────────

function AddBookingModal({
  visible, onClose, onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (booking: Omit<Booking, 'id' | 'status' | 'source'>) => void;
}) {
  const insets = useSafeAreaInsets();
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [service, setService] = useState('');
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [date, setDate] = useState(toDateKey(new Date()));
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState(45);
  const [notes, setNotes] = useState('');

  const reset = () => {
    setClientName(''); setClientPhone(''); setService(''); setDate(toDateKey(new Date()));
    setTime('10:00'); setDuration(45); setNotes(''); setShowServicePicker(false);
  };

  const handleSave = () => {
    if (!clientName.trim() || !service) {
      Alert.alert('Missing Info', 'Please enter a client name and select a service.');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave({ client_name: clientName.trim(), client_phone: clientPhone.trim(), service, date, time, duration, notes: notes.trim() || undefined });
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <Pressable style={st.modalOverlay} onPress={onClose}>
        <Pressable style={[st.modalSheet, { paddingBottom: insets.bottom || Spacing.lg }]} onPress={() => {}}>
          <BlurView intensity={40} tint="dark" style={st.modalBlur}>
            <View style={st.modalContent}>
              {/* Header */}
              <View style={st.modalHeader}>
                <Text style={st.modalTitle}>Add Booking</Text>
                <Pressable onPress={() => { reset(); onClose(); }} hitSlop={12}>
                  <Ionicons name="close" size={24} color={Colors.textMuted} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={st.modalScroll}>
                {/* Client name */}
                <Text style={st.fieldLabel}>Client Name</Text>
                <TextInput style={st.fieldInput} value={clientName} onChangeText={setClientName} placeholder="Full name" placeholderTextColor={Colors.textMuted} />

                {/* Phone */}
                <Text style={st.fieldLabel}>Phone Number</Text>
                <TextInput style={st.fieldInput} value={clientPhone} onChangeText={setClientPhone} placeholder="+1 (555) 000-0000" placeholderTextColor={Colors.textMuted} keyboardType="phone-pad" />

                {/* Service */}
                <Text style={st.fieldLabel}>Service Type</Text>
                <Pressable style={st.fieldInput} onPress={() => setShowServicePicker(!showServicePicker)}>
                  <Text style={service ? st.fieldInputText : st.fieldPlaceholder}>
                    {service || 'Select a service'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={Colors.textMuted} />
                </Pressable>
                {showServicePicker && (
                  <View style={st.pickerDropdown}>
                    {SERVICE_OPTIONS.map((s) => (
                      <Pressable key={s} style={st.pickerItem} onPress={() => { setService(s); setShowServicePicker(false); Haptics.selectionAsync(); }}>
                        <Text style={[st.pickerItemText, service === s && { color: Colors.electric }]}>{s}</Text>
                        {service === s && <Ionicons name="checkmark" size={16} color={Colors.electric} />}
                      </Pressable>
                    ))}
                  </View>
                )}

                {/* Date */}
                <Text style={st.fieldLabel}>Date</Text>
                <TextInput style={st.fieldInput} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={Colors.textMuted} />

                {/* Time */}
                <Text style={st.fieldLabel}>Time</Text>
                <TextInput style={st.fieldInput} value={time} onChangeText={setTime} placeholder="HH:MM (24h)" placeholderTextColor={Colors.textMuted} />

                {/* Duration */}
                <Text style={st.fieldLabel}>Duration</Text>
                <View style={st.durationRow}>
                  {DURATIONS.map((d) => (
                    <Pressable key={d} onPress={() => { setDuration(d); Haptics.selectionAsync(); }} style={[st.durationPill, duration === d && st.durationPillActive]}>
                      <Text style={[st.durationPillText, duration === d && st.durationPillTextActive]}>{d}m</Text>
                    </Pressable>
                  ))}
                </View>

                {/* Notes */}
                <Text style={st.fieldLabel}>Notes (optional)</Text>
                <TextInput style={[st.fieldInput, st.fieldMultiline]} value={notes} onChangeText={setNotes} placeholder="Any special instructions..." placeholderTextColor={Colors.textMuted} multiline numberOfLines={3} />

                {/* Save button */}
                <Pressable onPress={handleSave} style={st.saveWrap}>
                  <LinearGradient colors={Colors.gradientElectric} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.saveBtn}>
                    <Ionicons name="calendar-outline" size={18} color="#fff" />
                    <Text style={st.saveBtnText}>Book Appointment</Text>
                  </LinearGradient>
                </Pressable>

                <View style={{ height: Spacing.xl }} />
              </ScrollView>
            </View>
          </BlurView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Main Screen ──────────────────────────────────────────────

export default function CalendarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekBase, setWeekBase] = useState(new Date());
  const [showModal, setShowModal] = useState(false);

  const weekDays = useMemo(() => getWeekDays(weekBase), [weekBase]);
  const today = useMemo(() => new Date(), []);

  useEffect(() => {
    api.getBookings()
      .then(setBookings)
      .catch(() => setBookings(buildMockBookings()));
  }, []);

  // Map of date key -> bookings for quick lookup
  const bookingsByDate = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    bookings.forEach((b) => {
      if (!map[b.date]) map[b.date] = [];
      map[b.date].push(b);
    });
    // Sort each day by time
    Object.values(map).forEach((arr) => arr.sort((a, b) => a.time.localeCompare(b.time)));
    return map;
  }, [bookings]);

  const selectedKey = toDateKey(selectedDate);
  const dayBookings = bookingsByDate[selectedKey] || [];

  // Upcoming: next 5 bookings from today onwards
  const upcoming = useMemo(() => {
    const todayKey = toDateKey(today);
    return bookings
      .filter((b) => b.date >= todayKey && b.status !== 'cancelled' && b.status !== 'completed')
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
      .slice(0, 5);
  }, [bookings, today]);

  const weekMonth = weekDays[3]; // middle of the week to get display month
  const monthLabel = `${MONTH_NAMES[weekMonth.getMonth()]} ${weekMonth.getFullYear()}`;

  const navigateWeek = useCallback((dir: number) => {
    Haptics.selectionAsync();
    setWeekBase((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + dir * 7);
      return d;
    });
  }, []);

  const goToToday = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const now = new Date();
    setWeekBase(now);
    setSelectedDate(now);
  }, []);

  const handleSelectDay = useCallback((d: Date) => {
    Haptics.selectionAsync();
    setSelectedDate(d);
  }, []);

  const handleConfirm = useCallback((id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: 'confirmed' as const } : b));
    api.updateBooking(id, 'confirmed').catch(() => {});
  }, []);

  const handleCancel = useCallback((id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert('Cancel Booking', 'Are you sure you want to cancel this appointment?', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Cancel Booking', style: 'destructive', onPress: () => {
        setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: 'cancelled' as const } : b));
        api.updateBooking(id, 'cancelled').catch(() => {});
      }},
    ]);
  }, []);

  const handleCall = useCallback((phone: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(`tel:${phone.replace(/\D/g, '')}`);
  }, []);

  const handleSaveBooking = useCallback((data: Omit<Booking, 'id' | 'status' | 'source'>) => {
    const newBooking: Booking = {
      ...data,
      id: `bk-local-${Date.now()}`,
      status: 'confirmed',
      source: 'manual',
    };
    setBookings((prev) => [...prev, newBooking]);
    api.createBooking(data).catch(() => {});
  }, []);

  const upcomingCount = upcoming.length;

  return (
    <View style={st.root}>
      <LinearGradient colors={[Colors.bgPrimary, Colors.bgPrimary, 'rgba(14, 165, 233, 0.03)']} locations={[0, 0.6, 1]} style={StyleSheet.absoluteFill} />

      {/* ── Header ── */}
      <View style={[st.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={st.backBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <View style={st.headerTextCol}>
          <Text style={st.headerTitle}>Bookings</Text>
          <Text style={st.headerSub}>Appointments booked by your AI</Text>
        </View>
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowModal(true); }}
          style={st.addBtnWrap}
        >
          <LinearGradient colors={Colors.gradientElectric} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.addBtn}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={st.addBtnText}>Add</Text>
          </LinearGradient>
        </Pressable>
      </View>

      <ScrollView style={st.container} contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Calendar Week View ── */}
        <StaggerIn index={0}>
          <View style={st.calCard}>
            <ShimmerOverlay />
            {/* Month nav */}
            <View style={st.calMonthRow}>
              <Pressable onPress={() => navigateWeek(-1)} hitSlop={12}>
                <Ionicons name="chevron-back" size={20} color={Colors.textSecondary} />
              </Pressable>
              <Text style={st.calMonth}>{monthLabel}</Text>
              <Pressable onPress={() => navigateWeek(1)} hitSlop={12}>
                <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
              </Pressable>
            </View>

            {/* Day buttons */}
            <View style={st.calDaysRow}>
              {weekDays.map((d) => {
                const key = toDateKey(d);
                const isSelected = isSameDay(d, selectedDate);
                const isToday = isSameDay(d, today);
                const hasDots = !!bookingsByDate[key]?.length;

                return (
                  <Pressable key={key} onPress={() => handleSelectDay(d)} style={st.calDayCol}>
                    <Text style={[st.calDayName, isToday && st.calDayNameToday]}>{DAY_NAMES[d.getDay()]}</Text>
                    <View style={[st.calDayCircle, isSelected && st.calDayCircleSelected]}>
                      {isSelected && <View style={st.calDayGlow} />}
                      <Text style={[st.calDayNum, isSelected && st.calDayNumSelected, isToday && !isSelected && st.calDayNumToday]}>
                        {d.getDate()}
                      </Text>
                    </View>
                    <View style={st.calDotRow}>
                      {hasDots && <View style={[st.calDot, isSelected && st.calDotSelected]} />}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Today button */}
            {!isSameDay(selectedDate, today) && (
              <Pressable onPress={goToToday} style={st.todayPill}>
                <Ionicons name="today-outline" size={14} color={Colors.electric} />
                <Text style={st.todayPillText}>Today</Text>
              </Pressable>
            )}
          </View>
        </StaggerIn>

        {/* ── Selected Day Appointments ── */}
        <StaggerIn index={1}>
          <View style={st.sectionHeader}>
            <View style={st.sectionLeft}>
              <View style={st.sectionDot} />
              <Text style={st.sectionTitle}>
                {isSameDay(selectedDate, today) ? 'Today' : selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </Text>
            </View>
            <Text style={st.sectionCount}>{dayBookings.length} booking{dayBookings.length !== 1 ? 's' : ''}</Text>
          </View>

          {dayBookings.length === 0 ? (
            <View style={st.emptyDay}>
              <Ionicons name="calendar-outline" size={36} color={Colors.textMuted} />
              <Text style={st.emptyDayTitle}>
                No bookings for {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
              </Text>
              <Text style={st.emptyDayText}>Appointments will appear here as your AI agent books them</Text>
            </View>
          ) : (
            <View style={st.apptList}>
              {dayBookings.map((b, i) => (
                <StaggerIn key={b.id} index={i}>
                  <AppointmentCard
                    booking={b}
                    onConfirm={() => handleConfirm(b.id)}
                    onCancel={() => handleCancel(b.id)}
                    onCall={() => handleCall(b.client_phone)}
                  />
                </StaggerIn>
              ))}
            </View>
          )}
        </StaggerIn>

        {/* ── Upcoming This Week ── */}
        {upcoming.length > 0 && (
          <StaggerIn index={2}>
            <View style={st.sectionHeader}>
              <View style={st.sectionLeft}>
                <View style={st.sectionDot} />
                <Text style={st.sectionTitle}>Upcoming This Week</Text>
              </View>
              <Text style={st.sectionCount}>{upcomingCount}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.upcomingScroll}>
              {upcoming.map((b) => (
                <UpcomingMiniCard key={b.id} booking={b} />
              ))}
            </ScrollView>
          </StaggerIn>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <AddBookingModal visible={showModal} onClose={() => setShowModal(false)} onSave={handleSaveBooking} />
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
  addBtnWrap: { borderRadius: BorderRadius.md, overflow: 'hidden' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs + 2,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  addBtnText: { ...Fonts.bodySemibold, fontSize: TypeScale.bodySm, color: '#fff' },

  /* ── Calendar Card ── */
  calCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.base,
    overflow: 'hidden', marginTop: Spacing.sm,
  },
  calMonthRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.md,
  },
  calMonth: { ...Fonts.bodySemibold, fontSize: TypeScale.h4, color: Colors.textPrimary },

  calDaysRow: { flexDirection: 'row', justifyContent: 'space-between' },
  calDayCol: { alignItems: 'center', flex: 1, gap: Spacing.xs },
  calDayName: { ...Fonts.bodyMedium, fontSize: TypeScale.tiny, color: Colors.textMuted, letterSpacing: 0.5 },
  calDayNameToday: { color: Colors.electric },
  calDayCircle: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  calDayCircleSelected: {
    backgroundColor: Colors.electric,
  },
  calDayGlow: {
    position: 'absolute', width: 46, height: 46, borderRadius: 23,
    backgroundColor: Colors.electricMuted,
  },
  calDayNum: { ...Fonts.bodySemibold, fontSize: TypeScale.body, color: Colors.textSecondary },
  calDayNumSelected: { color: '#fff' },
  calDayNumToday: { color: Colors.electric },
  calDotRow: { height: 6, alignItems: 'center', justifyContent: 'center' },
  calDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.textMuted },
  calDotSelected: { backgroundColor: Colors.electric },

  todayPill: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'center',
    gap: Spacing.xs, marginTop: Spacing.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2,
    backgroundColor: Colors.electricMuted, borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: Colors.electricBorder,
  },
  todayPillText: { ...Fonts.bodyMedium, fontSize: TypeScale.caption, color: Colors.electric },

  /* ── Section Header ── */
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: Spacing.sm,
  },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.electric },
  sectionTitle: { ...Fonts.bodySemibold, fontSize: TypeScale.h4, color: Colors.textPrimary },
  sectionCount: { ...Fonts.mono, fontSize: TypeScale.caption, color: Colors.textMuted },

  /* ── Appointment Cards ── */
  apptList: { gap: Spacing.sm },
  apptCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md,
    overflow: 'hidden',
  },
  apptRow: { flexDirection: 'row', gap: Spacing.md },
  apptTimeBlock: { width: 62, alignItems: 'center', justifyContent: 'center' },
  apptTime: { ...Fonts.monoBold, fontSize: TypeScale.bodySm, color: Colors.textPrimary },
  apptDuration: { ...Fonts.mono, fontSize: TypeScale.tiny, color: Colors.textMuted, marginTop: 2 },
  apptAccent: { width: 3, borderRadius: 1.5, alignSelf: 'stretch' },
  apptInfo: { flex: 1, gap: 4 },
  apptNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  apptName: { ...Fonts.bodySemibold, fontSize: TypeScale.body, color: Colors.textPrimary, flex: 1, marginRight: Spacing.sm },
  apptStatusPill: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  apptStatusText: { ...Fonts.monoBold, fontSize: TypeScale.tiny, letterSpacing: 0.5 },
  apptService: { ...Fonts.body, fontSize: TypeScale.bodySm, color: Colors.textSecondary },
  apptBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  apptPhoneRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  apptPhone: { ...Fonts.mono, fontSize: TypeScale.caption, color: Colors.electric },
  apptSourceLabel: { ...Fonts.mono, fontSize: TypeScale.tiny },
  apptActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  apptActionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
  },
  apptActionText: { ...Fonts.bodyMedium, fontSize: TypeScale.caption },

  /* ── Empty Day ── */
  emptyDay: { alignItems: 'center', paddingVertical: Spacing['3xl'], gap: Spacing.sm },
  emptyDayTitle: { ...TextStyles.h3, color: Colors.textSecondary },
  emptyDayText: { ...Fonts.body, fontSize: TypeScale.bodySm, color: Colors.textMuted, textAlign: 'center' },

  /* ── Upcoming Cards ── */
  upcomingScroll: { gap: Spacing.sm, paddingVertical: Spacing.xs },
  upcomingCard: {
    width: 150, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md,
    overflow: 'hidden',
  },
  upcomingTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  upcomingTime: { ...Fonts.monoBold, fontSize: TypeScale.bodySm, color: Colors.textPrimary },
  upcomingDot: { width: 8, height: 8, borderRadius: 4 },
  upcomingName: { ...Fonts.bodySemibold, fontSize: TypeScale.bodySm, color: Colors.textPrimary },
  upcomingService: { ...Fonts.body, fontSize: TypeScale.caption, color: Colors.textSecondary, marginTop: 2 },
  upcomingDate: { ...Fonts.mono, fontSize: TypeScale.tiny, color: Colors.textMuted, marginTop: Spacing.xs },

  /* ── Modal ── */
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(3, 7, 18, 0.6)', justifyContent: 'flex-end',
  },
  modalSheet: {
    maxHeight: '90%', borderTopLeftRadius: BorderRadius['2xl'], borderTopRightRadius: BorderRadius['2xl'],
    overflow: 'hidden',
  },
  modalBlur: { borderTopLeftRadius: BorderRadius['2xl'], borderTopRightRadius: BorderRadius['2xl'] },
  modalContent: { backgroundColor: 'rgba(17, 24, 39, 0.92)', padding: Spacing.lg },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: { ...TextStyles.h2, color: Colors.textPrimary },
  modalScroll: {},

  fieldLabel: {
    ...Fonts.bodyMedium, fontSize: TypeScale.caption, color: Colors.textMuted,
    letterSpacing: 0.5, marginBottom: Spacing.xs, marginTop: Spacing.md,
  },
  fieldInput: {
    backgroundColor: Colors.bgInput, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    ...Fonts.body, fontSize: TypeScale.body, color: Colors.textPrimary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  fieldInputText: { ...Fonts.body, fontSize: TypeScale.body, color: Colors.textPrimary },
  fieldPlaceholder: { ...Fonts.body, fontSize: TypeScale.body, color: Colors.textMuted },
  fieldMultiline: { minHeight: 80, textAlignVertical: 'top' },

  pickerDropdown: {
    backgroundColor: Colors.bgElevated, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border, marginTop: Spacing.xs,
    overflow: 'hidden',
  },
  pickerItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  pickerItemText: { ...Fonts.body, fontSize: TypeScale.body, color: Colors.textSecondary },

  durationRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  durationPill: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, backgroundColor: Colors.bgInput,
    borderWidth: 1, borderColor: Colors.border,
  },
  durationPillActive: { backgroundColor: Colors.electricMuted, borderColor: Colors.electricBorder },
  durationPillText: { ...Fonts.bodyMedium, fontSize: TypeScale.bodySm, color: Colors.textMuted },
  durationPillTextActive: { color: Colors.electric },

  saveWrap: { borderRadius: BorderRadius.md, overflow: 'hidden', marginTop: Spacing.xl },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: Spacing.base, borderRadius: BorderRadius.md,
  },
  saveBtnText: { ...Fonts.bodySemibold, fontSize: TypeScale.body, color: '#fff' },
});
