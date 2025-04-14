import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { OutlinedButton } from "./Buttons";
import { GuidanceHoverText } from "./GuidanceHoverText";
import { Frame, useSubjectSegmentation } from "@/modules/expo-mlkit";
import { AssetType, Item } from "@/types";
import { SmartItemFrame } from "@/components/SmartItemFrame";
import {
  cropImage,
  expandFrameIfPossible,
  frameToSquareIfPossible,
} from "@/lib/utils";
import { useSupabase } from "@/lib/useSupabase";
import { searchItems } from "@/lib/supabase";
import { isProcessing } from "@/signals/queue";

interface VisualAssetFinderProps {
  image: { uri: string; width: number; height: number };
  onCancel: () => void;
  onItemSelect: (item: Item) => void;
  debug?: boolean;
}

type SearchCandidateAsset = {
  id: string;
  state: "suggested" | "selected" | "dismissed";
  image?: { uri: string; width: number; height: number };
  frame: Frame;
  type: AssetType;
};

export const VisualAssetFinder = ({
  image,
  onCancel,
  onItemSelect,
  debug = false,
}: VisualAssetFinderProps) => {
  if (!image) {
    throw new Error("Picture is missing");
  }

  const router = useRouter();
  const segmentator = useSubjectSegmentation();
  const lastImageUriRef = useRef<string | null>(null);
  const [candidates, setCandidates] = useState<SearchCandidateAsset[]>([]);
  const lastSearchImageUriRef = useRef<string | null>(null);
  const [imageToSearch, setImageToSearch] = useState<string | null>(null);

  const {
    data: items,
    loading: loadingItems,
    refetch: refetchItems,
  } = useSupabase({
    fn: searchItems,
    params: {
      queryText: "",
      queryImageUri: imageToSearch || "",
    },
    skip: true,
  });

  const selectedCandidatesCount = candidates.filter(
    (c) => c.state === "selected",
  ).length;

  useEffect(() => {
    if (!imageToSearch) return;
    if (lastSearchImageUriRef.current === imageToSearch) return;

    lastSearchImageUriRef.current = imageToSearch;

    refetchItems({
      queryText: "",
      queryImageUri: imageToSearch || "",
    });
  }, [imageToSearch, isProcessing.value]);

  useEffect(() => {
    if (!segmentator.isInitialized || !image?.uri) return;
    if (lastImageUriRef.current === image.uri) return;

    lastImageUriRef.current = image.uri;

    if (debug) {
      console.log("Segmentator is initialized, starting segmentation");
    }

    createSuggestionFrames(image.uri);
  }, [image.uri, segmentator, segmentator.isInitialized]);

  useEffect(() => {
    if (!segmentator.isInitialized || !image?.uri) return;
    if (candidates.length > 1 && selectedCandidatesCount === 0) return;

    if (candidates.length === 1) {
      updateCandidate(candidates[0].id, {
        state: "selected",
      });

      return;
    }

    if (debug) {
      console.log("Selected candidates count:", selectedCandidatesCount);
    }

    dismissSuggestedCandidates();
  }, [image.uri, candidates.length]);

  const createSuggestionFrames = async (imageUri: string) => {
    const result = await segmentator
      .segmentSubjects(imageUri)
      .then((result) => {
        const frames = result.frames.map(
          (frame, i) =>
            ({
              id: `subject-${i + 1}`,
              frame: expandFrameIfPossible(
                frame,
                1.1,
                image.width,
                image.height,
              ).frame,
              type: "item",
              state: "suggested",
            }) satisfies SearchCandidateAsset,
        );

        if (debug) {
          console.log("Segmentation result:", frames.length);
        }

        setCandidates(frames);
      })
      .catch((error) => {
        console.error("Error during segmentation:", error);
      });
  };

  const cropAndSearch = async (candidate: SearchCandidateAsset) => {
    if (debug) {
      console.log("Cropping and searching for candidate:", candidate.id);
    }

    const expandedFrame = expandFrameIfPossible(
      candidate.frame,
      1.05,
      image.width,
      image.height,
    ).frame;
    const squareFrame = frameToSquareIfPossible(
      expandedFrame,
      image.width,
      image.height,
    ).frame;
    const croppedImage = await cropImage(image.uri, squareFrame);

    await searchForItems(croppedImage.uri);
  };

  const searchForItems = async (imageUri: string) => {
    setImageToSearch(imageUri);
  };

  useEffect(() => {
    if (selectedCandidatesCount !== 1) return;

    const selectedCandidate = candidates.find((c) => c.state === "selected");

    if (!selectedCandidate) return;

    dismissSuggestedCandidates();

    cropAndSearch(selectedCandidate);
  }, [selectedCandidatesCount]);

  const updateCandidate = (
    id: string,
    update: Partial<SearchCandidateAsset>,
  ) => {
    setCandidates((prev) =>
      prev.map((candidate) => {
        if (candidate.id === id) {
          const updatedCandidate = {
            ...candidate,
            ...update,
          };
          // TODO future: If the frame was updated, trigger recropping
          // if (update.frame) {
          //   recropCandidate(id, update.frame);
          // }
          return updatedCandidate;
        }
        return candidate;
      }),
    );
  };

  const dismissSuggestedCandidates = () => {
    setCandidates((prev) =>
      prev.map((candidate) =>
        candidate.state === "suggested"
          ? {
              ...candidate,
              state: "dismissed",
            }
          : candidate,
      ),
    );
  };

  const handleCandidateSelect = (id: string) => {
    updateCandidate(id, {
      state: "selected",
    });
  };

  const handleSelectItem = (item: any) => {
    onItemSelect(item);
  };

  const handleSelectMore = () => {
    if (!imageToSearch) return;

    const encodedUri = encodeURIComponent(imageToSearch);

    router.push({
      pathname: "/",
      params: {
        queryText: "",
        queryImageUri: encodedUri,
      },
    });
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
        text="Tap on items to find matches"
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
            style={{
              width: screenWidth,
              height: displayHeight,
            }}
            contentFit="contain"
            onTouchStart={() => {
              if (candidates.length > 0) {
                dismissSuggestedCandidates();
              }
            }}
          />

          {candidates
            .filter((c) => c.state !== "dismissed")
            .map((c, i) => (
              <SmartItemFrame
                key={c.id}
                id={c.id}
                state={c.state}
                frame={c.frame}
                displayWidth={screenWidth}
                displayHeight={displayHeight}
                parentImage={image}
                borderColor="white"
                onSelect={() => {
                  updateCandidate(c.id, {
                    state: "selected",
                  });
                }}
                onChangeCount={(count: number) => {}}
                onDismiss={() => {
                  console.log("Candidate dismissed:", c.id);
                }}
              />
            ))}

          {/* Overlay with search indicator when searching */}
          {loadingItems && (
            <View className="absolute inset-0 bg-black/50 items-center justify-center">
              <Text className="text-white text-lg font-medium">
                Finding matches...
              </Text>
            </View>
          )}

          {/* Results display when available */}
          {(loadingItems || !!items) && (
            <View className="absolute bottom-16 px-6">
              <View className="bg-white rounded-lg px-4 py-3">
                <View className="flex-row items-center flex-wrap gap-3">
                  {loadingItems && (
                    <ActivityIndicator
                      className="text-primary-300"
                      size="large"
                    />
                  )}

                  {items?.slice(0, 3).map((item) => (
                    <View key={item.id} className="">
                      <TouchableOpacity onPress={() => handleSelectItem(item)}>
                        <Image
                          source={{ uri: item.imageUrl }}
                          className="size-16 rounded-md"
                        />
                        {item.quantity > 1 && (
                          <View className="absolute top-0 right-0 bg-black/70 rounded-full w-5 h-5 items-center justify-center">
                            <Text className="text-xs text-white font-rubik-semibold">
                              {item.quantity}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>
                  ))}

                  {items && items.length > 3 && (
                    <TouchableOpacity onPress={handleSelectMore}>
                      <Text className="text-black-200 font-rubik-semibold text-base">
                        More
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};
