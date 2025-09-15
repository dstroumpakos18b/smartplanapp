import React from "react";
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function Home() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.wrap}>
        <Text style={styles.h1}>Travel Buddy</Text>
        <Text style={styles.sub}>Compare packages & build smart trips</Text>

        <TouchableOpacity style={styles.cta} onPress={() => router.push("/explore")}>
          <Text style={styles.ctaText}>Start Exploring</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0f172a" },
  wrap: { flex: 1, padding: 24, justifyContent: "center" },
  h1: { fontSize: 34, fontWeight: "800", color: "white" },
  sub: { marginTop: 6, color: "rgba(255,255,255,0.85)" },
  cta: { marginTop: 20, backgroundColor: "white", paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  ctaText: { fontWeight: "700", color: "#0f172a" },
});
