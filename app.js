import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  StatusBar,
} from 'react-native';

const Stack = createNativeStackNavigator();

// ---------- Home Screen ----------
function HomeScreen({ navigation }) {
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: '#0f172a' }]}> 
      <StatusBar barStyle="light-content" />
      <View style={styles.homeWrap}>
        <Text style={styles.appTitle}>Your App</Text>
        <Text style={styles.subtitle}>Welcome back 👋</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('SmartPlan')}
          style={styles.cta}
          activeOpacity={0.9}
        >
          <Text style={styles.ctaText}>Open Smart Plan</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ---------- Smart Plan Screen ----------
function SmartPlanScreen() {
  const metrics = [
    { id: 'm1', label: 'Focus', value: 'Deep Work', chip: '2h' },
    { id: 'm2', label: 'Breaks', value: 'Pomodoro', chip: '25/5' },
    { id: 'm3', label: 'Energy', value: 'High', chip: '👑' },
  ];

  const timeline = [
    { id: 't1', time: '07:30', title: 'Warm-up & Inbox Zero', tag: 'Admin', done: true },
    { id: 't2', time: '09:00', title: 'Client Sync – Project A', tag: 'Meet', done: false },
    { id: 't3', time: '10:00', title: 'Deep Work Sprint 1', tag: 'Focus', done: false },
    { id: 't4', time: '12:00', title: 'Break / Walk', tag: 'Health', done: false },
    { id: 't5', time: '14:00', title: 'Deep Work Sprint 2', tag: 'Focus', done: false },
    { id: 't6', time: '17:30', title: 'Review & Plan Tomorrow', tag: 'Review', done: false },
  ];

  const tasks = [
    { id: 'a1', title: 'Prepare proposal draft', detail: 'For 12/09 event | 130 pax', tags: ['Priority', 'Client'], progress: 0.6 },
    { id: 'a2', title: 'Update renewal model', detail: 'Health portfolio – LR check', tags: ['Data', 'Finance'], progress: 0.35 },
    { id: 'a3', title: 'UX polish: Smart Plan', detail: 'Spacing, cards, states', tags: ['Dev', 'Design'], progress: 0.8 },
  ];

  return (
    <SafeAreaView style={styles.safe}> 
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}> 
          <View>
            <Text style={styles.kicker}>Today · Smart Plan</Text>
            <Text style={styles.h1}>Make today effortless</Text>
          </View>
          <TouchableOpacity style={styles.headerBtn} activeOpacity={0.9}>
            <Text style={styles.headerBtnText}>Regenerate</Text>
          </TouchableOpacity>
        </View>

        {/* Date+Filters Row */}
        <View style={styles.row}>
          <TouchableOpacity style={[styles.pill, styles.pillActive]}>
            <Text style={[styles.pillText, styles.pillTextActive]}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pill}>
            <Text style={styles.pillText}>Tomorrow</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pill}>
            <Text style={styles.pillText}>Week</Text>
          </TouchableOpacity>
        </View>

        {/* Metrics Cards */}
        <View style={styles.metricsGrid}>
          {metrics.map((m) => (
            <View key={m.id} style={styles.metricCard}>
              <View style={styles.metricTop}>
                <Text style={styles.metricLabel}>{m.label}</Text>
                <Text style={styles.metricChip}>{m.chip}</Text>
              </View>
              <Text style={styles.metricValue}>{m.value}</Text>
            </View>
          ))}
        </View>

        {/* Focus Block Card */}
        <View style={styles.blockCard}>
          <Text style={styles.blockTitle}>Next Focus Block</Text>
          <Text style={styles.blockTime}>10:00 – 12:00</Text>
          <Text style={styles.blockDesc}>Finish proposal sections: pricing & terms. Phone on Do Not Disturb.</Text>
          <View style={styles.blockActions}>
            <TouchableOpacity style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>Adjust</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Start</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Timeline */}
        <Text style={styles.sectionTitle}>Timeline</Text>
        <View style={styles.timeline}>
          {timeline.map((item, i) => (
            <View key={item.id} style={styles.timelineRow}>
              <View style={styles.timelineTimeWrap}>
                <Text style={styles.timelineTime}>{item.time}</Text>
                <View style={[styles.dot, item.done && styles.dotDone]} />
                {i < timeline.length - 1 && <View style={styles.line} />}
              </View>
              <View style={styles.timelineCard}> 
                <View style={styles.timelineHeader}>
                  <Text style={styles.timelineTitle}>{item.title}</Text>
                  <Text style={styles.badge}>{item.tag}</Text>
                </View>
                <View style={styles.timelineActions}>
                  <TouchableOpacity style={styles.textBtn}><Text style={styles.textBtnText}>Details</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.textBtn}><Text style={styles.textBtnText}>Mark done</Text></TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Tasks */}
        <Text style={styles.sectionTitle}>Action Items</Text>
        <FlatList
          data={tasks}
          keyExtractor={(i) => i.id}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => (
            <View style={styles.taskCard}>
              <View style={{ gap: 6 }}>
                <Text style={styles.taskTitle}>{item.title}</Text>
                <Text style={styles.taskDetail}>{item.detail}</Text>
                <View style={styles.tagRow}>
                  {item.tags.map((t) => (
                    <Text key={t} style={styles.tag}>{t}</Text>
                  ))}
                </View>
              </View>
              <View style={styles.progressWrap}>
                <View style={[styles.progressBar, { width: `${Math.round(item.progress * 100)}%` }]} />
              </View>
              <View style={styles.taskActions}>
                <TouchableOpacity style={styles.secondaryBtnSmall}><Text style={styles.secondaryBtnSmallText}>Snooze</Text></TouchableOpacity>
                <TouchableOpacity style={styles.primaryBtnSmall}><Text style={styles.primaryBtnSmallText}>Open</Text></TouchableOpacity>
              </View>
            </View>
          )}
        />

        {/* Spacer for Footer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Footer */}
      <View style={styles.footer}> 
        <TouchableOpacity style={styles.footerBtn}>
          <Text style={styles.footerBtnText}>Add Task</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.footerBtn, styles.footerBtnPrimary]}>
          <Text style={[styles.footerBtnText, styles.footerBtnTextPrimary]}>Start Day</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SmartPlan"
          component={SmartPlanScreen}
          options={{
            title: 'Smart Plan',
            headerShadowVisible: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ---------- Styles ----------
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f6f7fb' },
  container: { padding: 16 },

  // Home
  homeWrap: { flex: 1, padding: 24, justifyContent: 'center' },
  appTitle: { fontSize: 34, fontWeight: '800', color: 'white', letterSpacing: 0.5 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 8 },
  cta: {
    marginTop: 24,
    backgroundColor: 'white',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  ctaText: { fontSize: 16, fontWeight: '700', color: '#0f172a' },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  kicker: { color: '#64748b', fontSize: 14, fontWeight: '600' },
  h1: { fontSize: 28, fontWeight: '800', color: '#0f172a', marginTop: 2 },
  headerBtn: { backgroundColor: '#0f172a', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  headerBtnText: { color: 'white', fontWeight: '700' },

  // Row pills
  row: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  pill: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: 'white', borderWidth: 1, borderColor: '#e5e7eb' },
  pillActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  pillText: { color: '#0f172a', fontWeight: '700' },
  pillTextActive: { color: 'white' },

  // Metrics
  metricsGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  metricCard: { flex: 1, backgroundColor: 'white', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#eef0f4', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  metricTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metricLabel: { color: '#64748b', fontSize: 13, fontWeight: '700' },
  metricChip: { backgroundColor: '#f1f5f9', color: '#0f172a', fontSize: 12, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, overflow: 'hidden', fontWeight: '700' },
  metricValue: { marginTop: 8, fontSize: 16, fontWeight: '800', color: '#0f172a' },

  // Focus Block
  blockCard: { backgroundColor: 'white', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#eef0f4', marginBottom: 18 },
  blockTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  blockTime: { marginTop: 4, fontSize: 14, fontWeight: '700', color: '#334155' },
  blockDesc: { marginTop: 6, fontSize: 14, color: '#475569' },
  blockActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  primaryBtn: { backgroundColor: '#0f172a', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12 },
  primaryBtnText: { color: 'white', fontWeight: '800' },
  secondaryBtn: { backgroundColor: '#f1f5f9', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12 },
  secondaryBtnText: { color: '#0f172a', fontWeight: '800' },

  // Timeline
  sectionTitle: { marginTop: 8, marginBottom: 10, fontSize: 16, fontWeight: '900', color: '#0f172a' },
  timeline: { paddingLeft: 8, marginBottom: 10 },
  timelineRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  timelineTimeWrap: { width: 64, alignItems: 'center' },
  timelineTime: { fontSize: 12, color: '#64748b', fontWeight: '700' },
  dot: { width: 10, height: 10, borderRadius: 20, backgroundColor: '#94a3b8', marginTop: 6 },
  dotDone: { backgroundColor: '#22c55e' },
  line: { width: 2, flex: 1, backgroundColor: '#e2e8f0', marginTop: 6 },
  timelineCard: { flex: 1, backgroundColor: 'white', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#eef0f4' },
  timelineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timelineTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  badge: { backgroundColor: '#eef2ff', color: '#3730a3', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, overflow: 'hidden', fontWeight: '800', fontSize: 12 },
  timelineActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  textBtn: { paddingVertical: 6, paddingHorizontal: 6 },
  textBtnText: { color: '#2563eb', fontWeight: '800' },

  // Tasks
  taskCard: { backgroundColor: 'white', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#eef0f4' },
  taskTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  taskDetail: { fontSize: 13, color: '#64748b' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  tag: { backgroundColor: '#f1f5f9', color: '#0f172a', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, overflow: 'hidden', fontSize: 12, fontWeight: '800' },
  progressWrap: { marginTop: 12, height: 8, backgroundColor: '#e2e8f0', borderRadius: 999, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: '#0f172a' },
  taskActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 12 },
  primaryBtnSmall: { backgroundColor: '#0f172a', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  primaryBtnSmallText: { color: 'white', fontWeight: '800' },
  secondaryBtnSmall: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  secondaryBtnSmallText: { color: '#0f172a', fontWeight: '800' },

  // Footer
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 12, padding: 16, backgroundColor: 'rgba(246,247,251,0.95)', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  footerBtn: { flex: 1, backgroundColor: 'white', paddingVertical: 14, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  footerBtnText: { fontWeight: '800', color: '#0f172a' },
  footerBtnPrimary: { backgroundColor: '#0f172a' },
  footerBtnTextPrimary: { color: 'white' },
});
