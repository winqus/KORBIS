import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityIndicator } from "react-native";
import { Redirect, Slot } from "expo-router";
import { useGlobalContext } from "@/lib/global-provider";
import React from "react";

export default function AppLayout() {
  const { loading, isLoggedIn } = useGlobalContext();

  if (loading) {
    return (
      <SafeAreaView className="bg-white h-full flex justify-center items-center">
        <ActivityIndicator className="text-primary-300" size="large" />
      </SafeAreaView>
    );
  }

  if (!isLoggedIn && !(process.env.EXPO_PUBLIC_HIDE_LOGIN_SCREEN === "true")) {
    return <Redirect href="/sign-in" />;
  }

  return <Slot />;
}
