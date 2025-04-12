import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  SafeAreaView,
  Dimensions,
  BackHandler,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { OutlinedButton } from "./Buttons";
import { GuidanceHoverText } from "./GuidanceHoverText";

interface VisualAssetFinderProps {
  image: { uri: string; width: number; height: number };
  onCancel: () => void;
  onItemFound: (foundItem: any) => void; // Update type based on your item structure
  debug?: boolean;
}

export const VisualAssetFinder = ({
  image,
  onCancel,
  onItemFound,
  debug = false,
}: VisualAssetFinderProps) => {
  if (!image) {
    throw new Error("Picture is missing");
  }

  const router = useRouter();

  // State for found items
  const [foundItems, setFoundItems] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        onCancel();
        return true; /* prevent default behavior */
      },
    );
    return () => backHandler.remove();
  }, [onCancel]);

  useEffect(() => {
    if (!image?.uri) return;

    // Start search when image is provided
    searchForItems(image.uri);
  }, [image.uri]);

  const searchForItems = async (imageUri: string) => {
    setIsSearching(true);
    try {
      // Call your Supabase Edge Function for item matching
      // Example:
      // const { data, error } = await supabase.functions.invoke('match-item', {
      //   body: { imageUri }
      // });

      // If you need to upload the image first:
      // 1. Upload to storage
      // 2. Get the URL
      // 3. Send URL to edge function

      // Placeholder for now
      setTimeout(() => {
        // Simulating results
        setFoundItems([
          { id: "item-1", name: "Sample Item 1", confidence: 0.95 },
          { id: "item-2", name: "Sample Item 2", confidence: 0.82 },
        ]);
        setIsSearching(false);
      }, 2000);
    } catch (error) {
      console.error("Error searching for items:", error);
      setIsSearching(false);
    }
  };

  const handleSelectItem = (item: any) => {
    onItemFound(item);
    router.push("/");
  };

  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
  const displayHeight = image.height * (screenWidth / image.width);
  const buttonsHeight = 120;
  const topSafeArea = 50;
  const availableHeight = screenHeight - topSafeArea - buttonsHeight;
  const canFitBelowImage = displayHeight <= availableHeight;

  return (
    <SafeAreaView className="flex-1 bg-black">
      <GuidanceHoverText
        text="Searching for matching items in your collection"
        textContainerClassName="max-w-[70%]"
      />
      <View className="flex-1">
        {canFitBelowImage && <View style={{ paddingTop: topSafeArea }} />}
        <View
          className={`flex-1 ${
            canFitBelowImage ? "justify-start" : "justify-center"
          } items-center`}
        >
          <Image
            source={image}
            style={{ width: screenWidth, height: displayHeight }}
            contentFit="contain"
          />

          {/* Overlay with search indicator when searching */}
          {isSearching && (
            <View className="absolute inset-0 bg-black/50 items-center justify-center">
              <Text className="text-white text-lg font-medium">
                Finding matches...
              </Text>
            </View>
          )}

          {/* Results display when available */}
          {!isSearching && foundItems.length > 0 && (
            <View className="absolute bottom-5 left-5 right-5 bg-black/70 rounded-lg p-4">
              <Text className="text-white text-lg font-bold mb-2">
                Found Items
              </Text>
              {foundItems.map((item) => (
                <View
                  key={item.id}
                  className="flex-row items-center justify-between mb-2 py-2 border-b border-gray-700"
                >
                  <Text className="text-white">{item.name}</Text>
                  <Text className="text-white/70">
                    {Math.round(item.confidence * 100)}% match
                  </Text>
                  <OutlinedButton
                    text="Select"
                    onPress={() => handleSelectItem(item)}
                    containerClassName="py-1 px-3"
                  />
                </View>
              ))}
            </View>
          )}

          {/* No results message */}
          {!isSearching && foundItems.length === 0 && (
            <View className="absolute bottom-5 left-5 right-5 bg-black/70 rounded-lg p-4">
              <Text className="text-white text-center">
                No matching items found in your collection
              </Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};
