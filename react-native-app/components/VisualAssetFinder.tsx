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
import { AssetType, Item, Container } from "@/types";
import { SmartItemFrame } from "@/components/SmartItemFrame";
import {
  cropImage,
  expandFrameIfPossible,
  frameToSquareIfPossible,
  VisualCode,
} from "@/lib/utils";
import { useSupabase } from "@/lib/useSupabase";
import { searchItems, getContainerByVisualCode } from "@/lib/supabase";
import { isProcessing } from "@/signals/queue";
import TextRecognitionV2Module from "@/modules/expo-mlkit/src/TextRecognitionV2Module";
import {
  Rect,
  TextRecognitionResult,
} from "@/modules/expo-mlkit/src/TextRecognitionV2.types";

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

type DetectedCode = {
  code: string;
  correctedCode: string | null;
  isValid: boolean;
  rect: Rect;
  container?: Container;
};

export const VisualAssetFinder = ({
  image,
  onCancel,
  onItemSelect,
  debug,
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
  const [detectedCodes, setDetectedCodes] = useState<DetectedCode[]>([]);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [ocrResult, setOcrResult] = useState<TextRecognitionResult | null>(
    null,
  );

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

    recognizeText(image.uri);

    if (segmentator.isInitialized) {
      if (debug) {
        console.log("Segmentator is initialized, starting segmentation");
      }
      createSuggestionFrames(image.uri);
    }
  }, [image.uri, segmentator, segmentator.isInitialized]);

  useEffect(() => {
    if (!segmentator.isInitialized || !image?.uri) return;
    if (candidates.length > 1 && selectedCandidatesCount === 0) return;
    if (detectedCodes.some((code) => code.isValid)) return;

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

  useEffect(() => {
    if (!ocrResult) return;
    processOcrResult(ocrResult);
  }, [ocrResult]);

  useEffect(() => {
    const fetchContainers = async () => {
      const updatedCodes = [...detectedCodes];
      let hasUpdates = false;

      for (let i = 0; i < updatedCodes.length; i++) {
        const codeData = updatedCodes[i];
        if (
          codeData.container ||
          (!codeData.isValid && !codeData.correctedCode)
        )
          continue;

        const codeToLookup = codeData.isValid
          ? codeData.code
          : codeData.correctedCode;
        if (!codeToLookup) continue;

        try {
          if (debug) {
            console.log("Fetching container for code:", codeToLookup);
          }
          const container = await getContainerByVisualCode({
            visualCode: codeToLookup,
          });
          if (container) {
            updatedCodes[i] = {
              ...codeData,
              container,
            };
            hasUpdates = true;
            if (debug) {
              console.log(
                `Found container for code ${codeToLookup}:`,
                container.id,
              );
            }
          }
        } catch (err) {
          console.error(
            `Error fetching container for code ${codeToLookup}:`,
            err,
          );
        }
      }

      if (hasUpdates) {
        setDetectedCodes(updatedCodes);
      }
    };

    if (detectedCodes.length > 0) {
      fetchContainers();
    }
  }, [detectedCodes]);

  const recognizeText = async (imageUri: string) => {
    try {
      setIsProcessingOCR(true);
      const result =
        await TextRecognitionV2Module.recognizeTextInImage(imageUri);
      setOcrResult(result);
      console.log("OCR result:", result.text);
    } catch (error) {
      console.error("Error during text recognition:", error);
    } finally {
      setIsProcessingOCR(false);
    }
  };

  const processOcrResult = (result: TextRecognitionResult) => {
    const potentialCodes = VisualCode.findCodesInText(result.text);
    if (debug) {
      console.log(`Found ${potentialCodes.length} potential codes in text`);
    }

    if (potentialCodes.length === 0) return;

    const mappedCodes: DetectedCode[] = [];

    /* For each potential code, find which block/line contains it */
    for (const codeData of potentialCodes) {
      const { code } = codeData;

      for (const block of result.blocks) {
        if (block.text.toUpperCase().includes(code)) {
          for (const line of block.lines) {
            if (line.text.toUpperCase().includes(code)) {
              mappedCodes.push({
                ...codeData,
                rect: line.rect,
              });
              break;
            }
          }
          break;
        }
      }
    }

    setDetectedCodes(mappedCodes);
  };

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

  const handleCodePress = (codeData: DetectedCode) => {
    console.log("handleCodePress", codeData);
    if (codeData.container) {
      router.push({
        pathname: "/containers/[id]",
        params: {
          id: codeData.container.id,
          containerData: JSON.stringify(codeData.container || undefined),
        },
      });
    }
  };

  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
  const displayHeight = image.height * (screenWidth / image.width);
  const buttonsHeight = 120;
  const topSafeArea = 50;
  const availableHeight = screenHeight - topSafeArea - buttonsHeight;
  const canFitBelowImage = displayHeight <= availableHeight;

  const scaleX = screenWidth / (ocrResult?.width || image.width);
  const scaleY = displayHeight / (ocrResult?.height || image.height);

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

          {/* Visual code overlays */}
          {detectedCodes.map((codeData, index) => {
            if (!codeData.isValid && !codeData.correctedCode) return null;
            const rect = {
              left: codeData.rect.left * scaleX,
              top: codeData.rect.top * scaleY,
              width: codeData.rect.width * scaleX,
              height: codeData.rect.height * scaleY,
            };
            const hasContainer = !!codeData.container;

            return (
              <TouchableOpacity
                key={`code-${index}`}
                className="absolute flex-row items-center justify-center gap-2 border-2 rounded-xl z-30"
                style={{
                  ...rect,
                  borderColor: hasContainer ? "#3498db" : "#f1c40f",
                  backgroundColor: hasContainer
                    ? "rgba(52, 152, 219, 0.3)"
                    : "rgba(241, 196, 15, 0.3)",
                }}
                onPress={() => handleCodePress(codeData)}
              >
                {hasContainer && codeData.container?.imageUrl && (
                  <Image
                    source={{ uri: codeData.container.imageUrl }}
                    className="size-8 rounded-md border border-white"
                  />
                )}
                <Text className="text-white font-rubik-semibold text-xs py-1 px-2 bg-black/50 rounded-md">
                  {codeData.isValid ? codeData.code : codeData.correctedCode}
                </Text>
              </TouchableOpacity>
            );
          })}

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

                  {items && items.length === 0 && (
                    <Text className="text-black-200 font-rubik-semibold text-base">
                      No matches
                    </Text>
                  )}

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
