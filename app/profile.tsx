import React from "react";
import { SafeAreaView, View, Text, StyleSheet } from "react-native";

export default function Profile() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.wrap}>
        <Text style={styles.h1}>Profile</Text>
        <Text style={styles.sub}>Preferences & notifications</Text>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f6f7fb" },
  wrap: { flex: 1, padding: 16 },
  h1: { fontSize: 24, fontWeight: "800", color: "#0f172a" },
  sub: { marginTop: 6, color: "#475569" },
});
