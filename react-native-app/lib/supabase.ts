import { AppState } from "react-native";
import * as Linking from "expo-linking";
import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthSessionMissingError, createClient } from "@supabase/supabase-js";
import { throwIfMissing } from "@/lib/utils";
import { openAuthSessionAsync } from "expo-web-browser";
import * as QueryParams from "expo-auth-session/build/QueryParams";

throwIfMissing("env variables", process.env, [
  "EXPO_PUBLIC_SUPABASE_PROJECT_URL",
  "EXPO_PUBLIC_SUPABASE_ANON_KEY",
]);

export const config = {
  projectUrl: process.env.EXPO_PUBLIC_SUPABASE_PROJECT_URL!,
  anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
};

export const supabase = createClient(config.projectUrl, config.anonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export async function login() {
  try {
    const redirectUri = Linking.createURL("/");
    console.log("redirectUri", redirectUri);

    const response = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUri,
        skipBrowserRedirect: true,
        scopes: "openid email profile",
      },
    });
    if (response.error) {
      throw new Error("Failed to login: " + response.error.message);
    }
    const browserResult = await openAuthSessionAsync(
      response.data.url,
      redirectUri,
    );
    if (browserResult.type !== "success") {
      throw new Error("Failed to login in browser");
    }

    const { params, errorCode } = QueryParams.getQueryParams(browserResult.url);
    if (errorCode) {
      throw new Error("Failed to login, code:" + errorCode);
    }

    const { access_token, refresh_token } = params;
    if (!access_token || !refresh_token) {
      throw new Error("Failed to get session tokens");
    }

    const { error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });
    if (error) {
      throw new Error("Failed to create a session");
    }

    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}

export async function logout() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }

    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}

export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      if (error instanceof AuthSessionMissingError) {
        console.log("No session found. User is not authenticated.");
        return null;
      }

      throw error;
    }

    const { user } = data;

    if (user.id) {
      throwIfMissing("user data", user, ["id", "email"]);
      throwIfMissing("user metadata", user.user_metadata, [
        "avatar_url",
        "name",
      ]);
      const id: string = user.id!;
      const email: string = user.email!;
      const avatar: string = user.user_metadata["avatar_url"]!;
      const name: string = user.user_metadata["name"]!;
      return {
        id,
        name,
        email,
        avatar,
      };
    }

    return null;
  } catch (error) {
    console.error("An unexpected error occurred:", error.message);
    return null;
  }
}

// Tells Supabase Auth to continuously refresh the session automatically
// if the app is in the foreground. When this is added, you will continue
// to receive `onAuthStateChange` events with the `TOKEN_REFRESHED` or
// `SIGNED_OUT` event if the user's session is terminated. This should
// only be registered once.
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
