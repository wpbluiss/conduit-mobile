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
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { useTheme } from '../../contexts/ThemeContext';
import { Colors } from '../../constants/colors';
import { Fonts, TypeScale, TextStyles } from '../../constants/typography';
import { Spacing, BorderRadius, ScreenPadding } from '../../constants/layout';
import { api, type Conversation, type Message } from '../../lib/api';

const { width: SCREEN_W } = Dimensions.get('window');

// ── Mock Data ────────────────────────────────────────────────

const NOW = Date.now();
const MIN = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1', contact_name: 'Maria Gonzalez', contact_phone: '+1 (512) 555-0147',
    last_message: 'Yes, Saturday at 2pm works perfectly!', last_message_at: new Date(NOW - 2 * MIN).toISOString(),
    unread: true, source: 'auto', message_count: 5,
  },
  {
    id: 'conv-2', contact_name: 'James Wilson', contact_phone: '+1 (737) 555-0283',
    last_message: "Thanks, I'll be there", last_message_at: new Date(NOW - 1 * HOUR).toISOString(),
    unread: false, source: 'manual', message_count: 4,
  },
  {
    id: 'conv-3', contact_name: 'Sofia Reyes', contact_phone: '+1 (210) 555-0391',
    last_message: 'Can you do highlights too?', last_message_at: new Date(NOW - 3 * HOUR).toISOString(),
    unread: true, source: 'auto', message_count: 6,
  },
  {
    id: 'conv-4', contact_name: 'David Chen', contact_phone: '+1 (832) 555-0512',
    last_message: 'What are your prices?', last_message_at: new Date(NOW - 8 * HOUR).toISOString(),
    unread: true, source: 'auto', message_count: 4,
  },
  {
    id: 'conv-5', contact_name: 'Amanda Brooks', contact_phone: '+1 (469) 555-0628',
    last_message: 'See you tomorrow!', last_message_at: new Date(NOW - 1 * DAY).toISOString(),
    unread: false, source: 'manual', message_count: 5,
  },
];

function buildMockMessages(convId: string): Message[] {
  const base = { conversation_id: convId };
  const map: Record<string, Message[]> = {
    'conv-1': [
      { id: 'm1-1', ...base, text: "Hi Maria! This is Conduit AI calling on behalf of Bella's Salon. We noticed you were interested in booking an appointment. Would you like to schedule one?", direction: 'outbound', source: 'auto', created_at: new Date(NOW - 25 * MIN).toISOString() },
      { id: 'm1-2', ...base, text: 'Yes! I need a haircut and maybe some highlights. What do you have available this weekend?', direction: 'inbound', source: 'manual', created_at: new Date(NOW - 22 * MIN).toISOString() },
      { id: 'm1-3', ...base, text: "Great news! We have openings on Saturday at 10am, 2pm, and 4pm. Sunday we have 11am and 3pm. Which works best for you?", direction: 'outbound', source: 'auto', created_at: new Date(NOW - 20 * MIN).toISOString() },
      { id: 'm1-4', ...base, text: 'Saturday at 2pm sounds perfect. How long will it take with highlights?', direction: 'inbound', source: 'manual', created_at: new Date(NOW - 8 * MIN).toISOString() },
      { id: 'm1-5', ...base, text: 'Yes, Saturday at 2pm works perfectly!', direction: 'inbound', source: 'manual', created_at: new Date(NOW - 2 * MIN).toISOString() },
    ],
    'conv-2': [
      { id: 'm2-1', ...base, text: "Hi James, this is Chris from Conduit Plumbing. Just following up on your request for a quote on the kitchen faucet replacement.", direction: 'outbound', source: 'manual', created_at: new Date(NOW - 3 * HOUR).toISOString() },
      { id: 'm2-2', ...base, text: "Hey Chris! Yeah, the faucet is still leaking. When can you come by?", direction: 'inbound', source: 'manual', created_at: new Date(NOW - 2.5 * HOUR).toISOString() },
      { id: 'm2-3', ...base, text: "I can come tomorrow between 9-11am. The replacement will be around $180 including parts and labor. Sound good?", direction: 'outbound', source: 'manual', created_at: new Date(NOW - 2 * HOUR).toISOString() },
      { id: 'm2-4', ...base, text: "Thanks, I'll be there", direction: 'inbound', source: 'manual', created_at: new Date(NOW - 1 * HOUR).toISOString() },
    ],
    'conv-3': [
      { id: 'm3-1', ...base, text: "Hi Sofia! Thanks for calling Bella's Salon. I'm the AI assistant. I'd love to help you book an appointment. What service are you looking for?", direction: 'outbound', source: 'auto', created_at: new Date(NOW - 6 * HOUR).toISOString() },
      { id: 'm3-2', ...base, text: "Hi! I want to get a balayage done. Do you have any availability this week?", direction: 'inbound', source: 'manual', created_at: new Date(NOW - 5.5 * HOUR).toISOString() },
      { id: 'm3-3', ...base, text: "We have balayage appointments available on Thursday at 1pm and Friday at 10am. Our stylist Jessica specializes in balayage and would be perfect for you!", direction: 'outbound', source: 'auto', created_at: new Date(NOW - 5 * HOUR).toISOString() },
      { id: 'm3-4', ...base, text: "Friday at 10am works. How much is it?", direction: 'inbound', source: 'manual', created_at: new Date(NOW - 4.5 * HOUR).toISOString() },
      { id: 'm3-5', ...base, text: "Balayage starts at $150 depending on hair length. I'll book you in with Jessica for Friday at 10am!", direction: 'outbound', source: 'auto', created_at: new Date(NOW - 4 * HOUR).toISOString() },
      { id: 'm3-6', ...base, text: 'Can you do highlights too?', direction: 'inbound', source: 'manual', created_at: new Date(NOW - 3 * HOUR).toISOString() },
    ],
    'conv-4': [
      { id: 'm4-1', ...base, text: "Hello! Thanks for reaching out to Mike's Auto Shop. How can I help you today?", direction: 'outbound', source: 'auto', created_at: new Date(NOW - 10 * HOUR).toISOString() },
      { id: 'm4-2', ...base, text: "Hi, I need an oil change and maybe brake inspection. How much would that run?", direction: 'inbound', source: 'manual', created_at: new Date(NOW - 9.5 * HOUR).toISOString() },
      { id: 'm4-3', ...base, text: "Our oil change starts at $45 for conventional and $75 for synthetic. Brake inspection is complimentary when combined with any service!", direction: 'outbound', source: 'auto', created_at: new Date(NOW - 9 * HOUR).toISOString() },
      { id: 'm4-4', ...base, text: 'What are your prices?', direction: 'inbound', source: 'manual', created_at: new Date(NOW - 8 * HOUR).toISOString() },
    ],
    'conv-5': [
      { id: 'm5-1', ...base, text: "Hey Amanda, just confirming your appointment for tomorrow at 3pm for the deep tissue massage.", direction: 'outbound', source: 'manual', created_at: new Date(NOW - 2 * DAY).toISOString() },
      { id: 'm5-2', ...base, text: "Yes! I'm so looking forward to it. Should I arrive early?", direction: 'inbound', source: 'manual', created_at: new Date(NOW - 1.8 * DAY).toISOString() },
      { id: 'm5-3', ...base, text: "Please arrive 10 minutes early to fill out the intake form. We have complimentary tea and water in the waiting area.", direction: 'outbound', source: 'manual', created_at: new Date(NOW - 1.5 * DAY).toISOString() },
      { id: 'm5-4', ...base, text: "That sounds lovely. Do you have parking on site?", direction: 'inbound', source: 'manual', created_at: new Date(NOW - 1.3 * DAY).toISOString() },
      { id: 'm5-5', ...base, text: 'See you tomorrow!', direction: 'inbound', source: 'manual', created_at: new Date(NOW - 1 * DAY).toISOString() },
    ],
  };
  return map[convId] ?? [];
}

// ── Helpers ──────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = NOW - new Date(iso).getTime();
  if (diff < MIN) return 'Just now';
  if (diff < HOUR) return `${Math.floor(diff / MIN)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < 2 * DAY) return 'Yesterday';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function messageTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

type FilterKey = 'all' | 'unread' | 'auto' | 'manual';
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'auto', label: 'Automated' },
  { key: 'manual', label: 'Manual' },
];

const QUICK_REPLIES = [
  'Thanks for reaching out!',
  'Can I call you at [time]?',
  'Your appointment is confirmed for [date]',
  "We'll get back to you within the hour",
];

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

// ── Conversation Row Card ────────────────────────────────────

function ConversationCard({
  conv, onPress,
}: {
  conv: Conversation; onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, friction: 8 }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 8 }).start()}
      onPress={onPress}
    >
      <Animated.View style={[st.convCard, { transform: [{ scale }] }]}>
        <ShimmerOverlay />
        <View style={st.convRow}>
          <LinearGradient
            colors={Colors.gradientElectric}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={st.convAvatar}
          >
            <Text style={st.convAvatarText}>{conv.contact_name.charAt(0)}</Text>
          </LinearGradient>

          <View style={st.convInfo}>
            <View style={st.convNameRow}>
              <Text style={st.convName} numberOfLines={1}>{conv.contact_name}</Text>
              <Text style={st.convTime}>{timeAgo(conv.last_message_at)}</Text>
            </View>
            <Text style={st.convPhone}>{conv.contact_phone}</Text>
            <View style={st.convBottomRow}>
              <Text style={[st.convPreview, conv.unread && st.convPreviewUnread]} numberOfLines={1}>
                {conv.last_message}
              </Text>
              <View style={st.convRightBadges}>
                <View style={[st.sourcePill, conv.source === 'auto' ? st.sourcePillAuto : st.sourcePillManual]}>
                  <Text style={[st.sourcePillText, conv.source === 'auto' ? st.sourcePillTextAuto : st.sourcePillTextManual]}>
                    {conv.source === 'auto' ? 'Auto' : 'Manual'}
                  </Text>
                </View>
                {conv.unread && <View style={st.unreadDot} />}
              </View>
            </View>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ── Chat Bubble ──────────────────────────────────────────────

function ChatBubble({ msg }: { msg: Message }) {
  const isOutbound = msg.direction === 'outbound';

  return (
    <View style={[st.bubbleWrap, isOutbound ? st.bubbleWrapOut : st.bubbleWrapIn]}>
      {isOutbound ? (
        <LinearGradient
          colors={Colors.gradientElectric}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[st.bubble, st.bubbleOut]}
        >
          <Text style={st.bubbleTextOut}>{msg.text}</Text>
          {msg.source === 'auto' && (
            <Text style={st.sentByAi}>Sent by AI</Text>
          )}
          <Text style={st.bubbleTimeOut}>{messageTime(msg.created_at)}</Text>
        </LinearGradient>
      ) : (
        <View style={[st.bubble, st.bubbleIn]}>
          <Text style={st.bubbleTextIn}>{msg.text}</Text>
          <Text style={st.bubbleTimeIn}>{messageTime(msg.created_at)}</Text>
        </View>
      )}
    </View>
  );
}

// ── Empty State ──────────────────────────────────────────────

function EmptyState() {
  return (
    <View style={st.emptyContainer}>
      <View style={st.emptyIconWrap}>
        <LinearGradient
          colors={[Colors.electricMuted, 'rgba(6, 182, 212, 0.08)']}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
          style={st.emptyIconBg}
        >
          <Ionicons name="chatbubbles-outline" size={48} color={Colors.electric} />
        </LinearGradient>
      </View>
      <Text style={st.emptyTitle}>No messages yet</Text>
      <Text style={st.emptyDesc}>
        SMS conversations with your leads will appear here once your AI agent starts handling calls
      </Text>
    </View>
  );
}

// ── Quick Replies Sheet ──────────────────────────────────────

function QuickRepliesSheet({ onSelect, onClose }: { onSelect: (text: string) => void; onClose: () => void }) {
  return (
    <Pressable style={st.qrOverlay} onPress={onClose}>
      <View style={st.qrSheet}>
        <BlurView intensity={30} tint="dark" style={st.qrBlur}>
          <View style={st.qrContent}>
            <Text style={st.qrTitle}>Quick Replies</Text>
            {QUICK_REPLIES.map((text) => (
              <Pressable
                key={text}
                style={st.qrItem}
                onPress={() => {
                  Haptics.selectionAsync();
                  onSelect(text);
                }}
              >
                <Text style={st.qrItemText}>{text}</Text>
              </Pressable>
            ))}
          </View>
        </BlurView>
      </View>
    </Pressable>
  );
}

// ── Conversation Detail View ─────────────────────────────────

function ConversationDetail({
  conversation, onBack,
}: {
  conversation: Conversation; onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const scrollRef = useRef<FlatList<Message>>(null);
  const slideAnim = useRef(new Animated.Value(SCREEN_W)).current;

  useEffect(() => {
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 150, mass: 0.8 }).start();
  }, []);

  useEffect(() => {
    api.getConversationMessages(conversation.id)
      .then(setMessages)
      .catch(() => setMessages(buildMockMessages(conversation.id)));
  }, [conversation.id]);

  const handleBack = useCallback(() => {
    Animated.spring(slideAnim, { toValue: SCREEN_W, useNativeDriver: true, damping: 20, stiffness: 150, mass: 0.8 }).start(() => {
      onBack();
    });
  }, [onBack]);

  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newMsg: Message = {
      id: `local-${Date.now()}`,
      conversation_id: conversation.id,
      text,
      direction: 'outbound',
      source: 'manual',
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    api.sendMessage(conversation.id, text).catch(() => {});
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [inputText, conversation.id]);

  const handleQuickReply = useCallback((text: string) => {
    setShowQuickReplies(false);
    setInputText(text);
  }, []);

  const handleCall = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const digits = conversation.contact_phone.replace(/\D/g, '');
    Linking.openURL(`tel:${digits}`);
  }, [conversation.contact_phone]);

  return (
    <Animated.View style={[st.detailRoot, { transform: [{ translateX: slideAnim }] }]}>
      {/* Header */}
      <View style={[st.detailHeader, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={handleBack} style={st.detailBackBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <View style={st.detailHeaderInfo}>
          <Text style={st.detailName} numberOfLines={1}>{conversation.contact_name}</Text>
          <Text style={st.detailPhone}>{conversation.contact_phone}</Text>
        </View>
        <Pressable onPress={handleCall} style={st.detailCallBtn}>
          <LinearGradient
            colors={Colors.gradientElectric}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={st.detailCallGrad}
          >
            <Ionicons name="call" size={18} color="#fff" />
          </LinearGradient>
        </Pressable>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={st.detailBody}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={scrollRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <ChatBubble msg={item} />}
          contentContainerStyle={st.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        />

        {/* Input Bar */}
        <View style={[st.inputBar, { paddingBottom: insets.bottom || Spacing.md }]}>
          <Pressable onPress={() => { Haptics.selectionAsync(); setShowQuickReplies(true); }} style={st.quickReplyBtn} hitSlop={8}>
            <Ionicons name="flash-outline" size={20} color={Colors.electric} />
          </Pressable>
          <View style={st.inputWrap}>
            <TextInput
              style={st.textInput}
              placeholder="Type a message..."
              placeholderTextColor={Colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
            />
          </View>
          <Pressable onPress={handleSend} disabled={!inputText.trim()}>
            <LinearGradient
              colors={inputText.trim() ? Colors.gradientElectric : [Colors.bgElevated, Colors.bgElevated]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={st.sendBtn}
            >
              <Ionicons name="arrow-up" size={20} color={inputText.trim() ? '#fff' : Colors.textMuted} />
            </LinearGradient>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {showQuickReplies && (
        <QuickRepliesSheet onSelect={handleQuickReply} onClose={() => setShowQuickReplies(false)} />
      )}
    </Animated.View>
  );
}

// ── Main Screen ──────────────────────────────────────────────

export default function MessagesScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);

  useEffect(() => {
    api.getConversations()
      .then((data) => { setConversations(data); setLoaded(true); })
      .catch(() => { setConversations(MOCK_CONVERSATIONS); setLoaded(true); });
  }, []);

  const unreadCount = useMemo(() => conversations.filter((c) => c.unread).length, [conversations]);

  const filtered = useMemo(() => {
    let list = conversations;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) => c.contact_name.toLowerCase().includes(q) || c.contact_phone.includes(q),
      );
    }
    if (filter === 'unread') list = list.filter((c) => c.unread);
    else if (filter === 'auto') list = list.filter((c) => c.source === 'auto');
    else if (filter === 'manual') list = list.filter((c) => c.source === 'manual');
    return list.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
  }, [conversations, search, filter]);

  const handleOpenConv = useCallback((conv: Conversation) => {
    Haptics.selectionAsync();
    setActiveConv(conv);
  }, []);

  if (activeConv) {
    return (
      <ConversationDetail
        conversation={activeConv}
        onBack={() => setActiveConv(null)}
      />
    );
  }

  return (
    <View style={[st.root, { backgroundColor: colors.bgPrimary }]}>
      <LinearGradient
        colors={[Colors.bgPrimary, Colors.bgPrimary, 'rgba(14, 165, 233, 0.03)']}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={[st.container, { paddingTop: insets.top }]}
        contentContainerStyle={st.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ── */}
        <View style={st.headerOuter}>
          <BlurView intensity={25} tint="dark" style={st.headerBlur}>
            <View style={st.headerInner}>
              <Text style={st.headerTitle}>Messages</Text>
              <Text style={st.headerSub}>
                {unreadCount > 0 ? `${unreadCount} unread conversation${unreadCount !== 1 ? 's' : ''}` : 'All caught up'}
              </Text>

              {/* Search */}
              <View style={st.searchWrap}>
                <Ionicons name="search" size={16} color={Colors.textMuted} />
                <TextInput
                  style={st.searchInput}
                  placeholder="Search by name or phone..."
                  placeholderTextColor={Colors.textMuted}
                  value={search}
                  onChangeText={setSearch}
                />
                {search.length > 0 && (
                  <Pressable onPress={() => setSearch('')} hitSlop={8}>
                    <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
                  </Pressable>
                )}
              </View>

              {/* Filter pills */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.filterScroll} contentContainerStyle={st.filterRow}>
                {FILTERS.map((f) => {
                  const active = filter === f.key;
                  return (
                    <Pressable
                      key={f.key}
                      onPress={() => { Haptics.selectionAsync(); setFilter(f.key); }}
                      style={[st.filterPill, active && st.filterPillActive]}
                    >
                      <Text style={[st.filterPillText, active && st.filterPillTextActive]}>{f.label}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </BlurView>
        </View>

        {/* ── Conversation List ── */}
        {loaded && filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <View style={st.listGap}>
            {filtered.map((conv) => (
              <ConversationCard key={conv.id} conv={conv} onPress={() => handleOpenConv(conv)} />
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
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
  headerOuter: {
    borderRadius: BorderRadius.xl, overflow: 'hidden', marginTop: Spacing.base,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.06)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6,
  },
  headerBlur: { overflow: 'hidden', borderRadius: BorderRadius.xl },
  headerInner: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg,
    backgroundColor: 'rgba(17, 24, 39, 0.65)',
  },
  headerTitle: { ...TextStyles.h1, color: Colors.textPrimary },
  headerSub: { ...Fonts.body, fontSize: TypeScale.bodySm, color: Colors.textSecondary, marginTop: 2 },

  /* ── Search ── */
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.bgInput, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, marginTop: Spacing.md, height: 40,
  },
  searchInput: {
    flex: 1, ...Fonts.body, fontSize: TypeScale.body, color: Colors.textPrimary, paddingVertical: 0,
  },

  /* ── Filters ── */
  filterScroll: { marginTop: Spacing.md, marginHorizontal: -Spacing.lg },
  filterRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg },
  filterPill: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full, backgroundColor: Colors.bgInput,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterPillActive: {
    backgroundColor: Colors.electricMuted, borderColor: Colors.electricBorder,
  },
  filterPillText: { ...Fonts.bodyMedium, fontSize: TypeScale.caption, color: Colors.textMuted },
  filterPillTextActive: { color: Colors.electric },

  /* ── Conversation Cards ── */
  listGap: { gap: Spacing.sm },
  convCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md,
    overflow: 'hidden',
  },
  convRow: { flexDirection: 'row', gap: Spacing.md },
  convAvatar: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  convAvatarText: { ...Fonts.displayBold, fontSize: TypeScale.h3, color: '#fff' },
  convInfo: { flex: 1, gap: 3 },
  convNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convName: { ...Fonts.bodySemibold, fontSize: TypeScale.body, color: Colors.textPrimary, flex: 1, marginRight: Spacing.sm },
  convTime: { ...Fonts.mono, fontSize: TypeScale.caption, color: Colors.textMuted },
  convPhone: { ...Fonts.mono, fontSize: TypeScale.caption, color: Colors.textMuted },
  convBottomRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  convPreview: { ...Fonts.body, fontSize: TypeScale.bodySm, color: Colors.textSecondary, flex: 1, marginRight: Spacing.sm },
  convPreviewUnread: { ...Fonts.bodySemibold, color: Colors.textPrimary },
  convRightBadges: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sourcePill: {
    paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full,
  },
  sourcePillAuto: { backgroundColor: Colors.cyanGlow },
  sourcePillManual: { backgroundColor: 'rgba(148, 163, 184, 0.1)' },
  sourcePillText: { ...Fonts.monoBold, fontSize: TypeScale.tiny, letterSpacing: 0.5 },
  sourcePillTextAuto: { color: Colors.cyan },
  sourcePillTextManual: { color: Colors.textMuted },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.electric },

  /* ── Empty State ── */
  emptyContainer: { alignItems: 'center', paddingTop: Spacing['5xl'], paddingHorizontal: Spacing.xl },
  emptyIconWrap: { marginBottom: Spacing.lg },
  emptyIconBg: {
    width: 96, height: 96, borderRadius: 48,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { ...TextStyles.h2, color: Colors.textPrimary, marginBottom: Spacing.sm },
  emptyDesc: { ...Fonts.body, fontSize: TypeScale.bodySm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  /* ── Detail View ── */
  detailRoot: { flex: 1, backgroundColor: Colors.bgPrimary, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 },
  detailHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: ScreenPadding.horizontal, paddingBottom: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.bgPrimary,
  },
  detailBackBtn: { marginRight: Spacing.sm },
  detailHeaderInfo: { flex: 1 },
  detailName: { ...Fonts.bodySemibold, fontSize: TypeScale.h4, color: Colors.textPrimary },
  detailPhone: { ...Fonts.mono, fontSize: TypeScale.caption, color: Colors.textMuted, marginTop: 1 },
  detailCallBtn: { borderRadius: BorderRadius.full, overflow: 'hidden' },
  detailCallGrad: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  detailBody: { flex: 1 },
  messagesList: { padding: ScreenPadding.horizontal, paddingTop: Spacing.md, paddingBottom: Spacing.sm },

  /* ── Chat Bubbles ── */
  bubbleWrap: { marginBottom: Spacing.md, maxWidth: '80%' },
  bubbleWrapOut: { alignSelf: 'flex-end' },
  bubbleWrapIn: { alignSelf: 'flex-start' },
  bubble: { borderRadius: BorderRadius.xl, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md },
  bubbleOut: { borderBottomRightRadius: BorderRadius.sm },
  bubbleIn: {
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderBottomLeftRadius: BorderRadius.sm,
  },
  bubbleTextOut: { ...Fonts.body, fontSize: TypeScale.body, color: '#fff', lineHeight: 20 },
  bubbleTextIn: { ...Fonts.body, fontSize: TypeScale.body, color: Colors.textPrimary, lineHeight: 20 },
  sentByAi: { ...Fonts.mono, fontSize: TypeScale.tiny, color: 'rgba(255,255,255,0.6)', marginTop: Spacing.xs },
  bubbleTimeOut: { ...Fonts.mono, fontSize: TypeScale.tiny, color: 'rgba(255,255,255,0.5)', marginTop: Spacing.xs, textAlign: 'right' },
  bubbleTimeIn: { ...Fonts.mono, fontSize: TypeScale.tiny, color: Colors.textMuted, marginTop: Spacing.xs },

  /* ── Input Bar ── */
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm,
    paddingHorizontal: ScreenPadding.horizontal, paddingTop: Spacing.sm,
    borderTopWidth: 1, borderTopColor: Colors.border,
    backgroundColor: Colors.bgPrimary,
  },
  quickReplyBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.electricMuted,
    alignItems: 'center', justifyContent: 'center', marginBottom: 2,
  },
  inputWrap: {
    flex: 1, backgroundColor: Colors.bgInput, borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, minHeight: 36, maxHeight: 100,
    justifyContent: 'center',
  },
  textInput: {
    ...Fonts.body, fontSize: TypeScale.body, color: Colors.textPrimary,
    paddingVertical: Platform.OS === 'ios' ? Spacing.sm : Spacing.xs,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', marginBottom: 2,
  },

  /* ── Quick Replies ── */
  qrOverlay: {
    ...StyleSheet.absoluteFillObject, zIndex: 20,
    backgroundColor: 'rgba(3, 7, 18, 0.5)', justifyContent: 'flex-end',
  },
  qrSheet: { borderTopLeftRadius: BorderRadius['2xl'], borderTopRightRadius: BorderRadius['2xl'], overflow: 'hidden' },
  qrBlur: { borderTopLeftRadius: BorderRadius['2xl'], borderTopRightRadius: BorderRadius['2xl'] },
  qrContent: { backgroundColor: 'rgba(17, 24, 39, 0.85)', padding: Spacing.lg, paddingBottom: Spacing['3xl'] },
  qrTitle: { ...Fonts.bodySemibold, fontSize: TypeScale.h4, color: Colors.textPrimary, marginBottom: Spacing.md },
  qrItem: {
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  qrItemText: { ...Fonts.body, fontSize: TypeScale.body, color: Colors.textSecondary },
});
