import * as React from "react";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function useFirstTimeOpen() {
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkFirstTimeOpen() {
      try {
        const hasOpened = await AsyncStorage.getItem("hasOpened");
        setIsFirstTime(hasOpened != null);
      } catch (error) {
        console.error("Error checking first time open", error);
      } finally {
        setIsLoading(false);
      }
    }

    checkFirstTimeOpen();
  }, []);

  return { isLoading, isFirstTime };
}
