import { Image } from "expo-image";
import {
  Dimensions,
  ImageSourcePropType,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Frame,
  SubjectSegmentationResult,
  useSubjectSegmentation,
} from "../modules/expo-mlkit";
import { DebugModal } from "./DebugModal";
import {
  cropImage,
  expandFrameIfPossible,
  frameToSquareIfPossible,
  generateCroppedImages,
} from "../lib/utils";
import { SmallImageList } from "./SmallImageList";
import { OutlinedButton, AutoCreateButton, ManualAddButton } from "./Buttons";
import { SmartItemFrame } from "./SmartItemFrame";
import { AssetType } from "../types";
import { GuidanceHoverText } from "./GuidanceHoverText";
import { AutoCreateItemsPayload } from "../signals/queue";

type CreationCandidateAsset = {
  id: string;
  state: "suggested" | "selected" | "dismissed";
  image: { uri: string; width: number; height: number };
  frame: Frame;
  type: AssetType;
  quantity?: number;
};

interface VisualAssetCreatorProps {
  image: { uri: string; width: number; height: number };
  onCancel: () => void;
  onAutoCreate: (payload: AutoCreateItemsPayload) => void;
  onManualAdd: (candidates: { quantity: number; imageUri: string }[]) => void;
  debug?: boolean;
}

export const VisualAssetCreator = ({
  image,
  onCancel,
  onAutoCreate,
  onManualAdd,
  debug = false,
}: VisualAssetCreatorProps) => {
  if (!image) {
    throw new Error("Picture is missing");
  }

  const segmentator = useSubjectSegmentation();
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [images, setImages] = useState<ImageSourcePropType[]>([]);
  const lastImageUriRef = useRef<string | null>(null);
  const [segmentationResult, setSegmentationResult] =
    useState<SubjectSegmentationResult | null>(null);
  const [candidates, setCandidates] = useState<CreationCandidateAsset[]>([]);

  useEffect(() => {
    if (!segmentator.isInitialized || !image?.uri) return;
    if (lastImageUriRef.current === image.uri) return;

    lastImageUriRef.current = image.uri;

    console.log("SEGMENTING", segmentator.isInitialized);
    segmentator
      .segmentSubjects(image.uri)
      .then(async (result) => {
        setSegmentationResult(result);

        const croppedImages = await generateCroppedImages(
          result.frames,
          image,
          {
            cropAsSquare: false,
            frameExpansionMultiplier: 1,
          },
        );

        setImages(croppedImages.map((i) => i.image));

        const frames = result.frames.map(
          (frame, i) =>
            ({
              id: `subject-${i + 1}`,
              frame: croppedImages[i].frame,
              image: croppedImages[i].image,
              type: "item",
              quantity: undefined,
              state: "suggested",
            }) satisfies CreationCandidateAsset,
        );

        setCandidates(frames);
      })
      .catch((error) => {
        console.error("Error during segmentation:", error);
      });
  }, [image.uri, segmentator, segmentator.isInitialized]);

  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
  const displayHeight = image.height * (screenWidth / image.width);
  const buttonsHeight = 120;
  const topSafeArea = 50;
  const availableHeight = screenHeight - topSafeArea - buttonsHeight;
  const canFitBelowImage = displayHeight <= availableHeight;

  const updateCandidate = (
    id: string,
    update: Partial<CreationCandidateAsset>,
  ) => {
    setCandidates((prev) =>
      prev.map((candidate) => {
        if (candidate.id === id) {
          const updatedCandidate = { ...candidate, ...update };
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
    console.log("Dismiss suggested candidates");
    setCandidates((prev) =>
      prev.map((candidate) =>
        candidate.state === "suggested"
          ? { ...candidate, state: "dismissed" }
          : candidate,
      ),
    );
  };

  //  TODO future: Implement recropping of candidates, integrate with frame resizing
  // const recropCandidate = async (id: string, newFrame: Frame) => {
  //   try {
  //     const cropped = await cropImage(image.uri, newFrame);
  //     setCandidates((prev) =>
  //       prev.map((candidate) =>
  //         candidate.id === id
  //           ? { ...candidate, croppedImage: cropped }
  //           : candidate,
  //       ),
  //     );
  //   } catch (error) {
  //     console.error("Error during recropping candidate", id, error);
  //   }
  // };

  const handleSelectAll = () => {
    setCandidates((prev) =>
      prev.map((candidate) => ({
        ...candidate,
        state: "selected",
      })),
    );
  };

  const handleAutoAdd = async () => {
    const payload = await Promise.all(
      candidates
        .filter((c) => c.state === "selected")
        .map(async (candidate) => {
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

          return {
            candidate: {
              quantity: candidate.quantity,
            },
            imageUri: croppedImage.uri,
          };
        }),
    );

    setCandidates([]);

    onAutoCreate(payload);
  };

  const handleManualAdd = () => {
    const payload = candidates
      .filter((c) => c.state === "selected")
      .map((candidate) => ({
        quantity: candidate.quantity || 1,
        imageUri: candidate.image.uri,
      }));

    setCandidates([]);

    onManualAdd(payload);
  };

  const selectedCandidatesCount = candidates.filter(
    (c) => c.state === "selected",
  ).length;

  const canAutoCreate = candidates.some((c) => c.state === "selected");

  const framesAvailableCount = candidates.filter(
    (c) => c.state !== "dismissed" && c.frame,
  ).length;

  return (
    <SafeAreaView className="flex-1 bg-black">
      <GuidanceHoverText
        text="Tap on items you want to add to your collection"
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
            onTouchStart={() => {
              dismissSuggestedCandidates();
            }}
          />

          {debug && segmentationResult && (
            <Image
              source={{ uri: segmentationResult.mask.fileUri }}
              style={{
                position: "absolute",
                width: screenWidth,
                height: displayHeight,
                opacity: 0.7,
              }}
              contentFit="contain"
            />
          )}

          {candidates
            .filter((c) => c.state !== "dismissed")
            .map((c, i) => (
              <SmartItemFrame
                key={c.id}
                id={c.id}
                state={c.state}
                croppedImage={c.image}
                frame={c.frame}
                quantity={c.quantity}
                displayWidth={screenWidth}
                displayHeight={displayHeight}
                parentImage={image}
                borderColor="white"
                onSelect={() => {
                  updateCandidate(c.id, { state: "selected" });
                }}
                onChangeCount={(count: number) => {
                  updateCandidate(c.id, { quantity: count });
                }}
                onDismiss={() => {
                  console.log("Candidate dismissed:", c.id);
                }}
              />
            ))}
        </View>
        <View
          className={`${
            !canFitBelowImage
              ? "absolute bottom-10 left-0 right-0 px-6"
              : "px-10 mb-10"
          }`}
        >
          {selectedCandidatesCount === 0 ? (
            <OutlinedButton
              text={
                framesAvailableCount === 0
                  ? "No selection"
                  : "Select all suggestions"
              }
              onPress={handleSelectAll}
              containerClassName="mb-4"
              disabled={framesAvailableCount === 0}
            />
          ) : (
            <AutoCreateButton
              onPress={handleAutoAdd}
              text={
                selectedCandidatesCount <= 1
                  ? "Auto add item"
                  : `Auto add ${selectedCandidatesCount} items`
              }
              disabled={!canAutoCreate || selectedCandidatesCount === 0}
            />
          )}

          <ManualAddButton
            onPress={handleManualAdd}
            text={
              selectedCandidatesCount > 1
                ? `or customize each item`
                : "or customize the item"
            }
            disabled={false}
          />
        </View>
      </View>
      {debug && (
        <>
          <TouchableOpacity
            className="bg-white/50 items-center"
            onPress={() => setIsModalVisible(true)}
          >
            <Text>Open Images Modal</Text>
          </TouchableOpacity>
          <DebugModal
            isVisible={isModalVisible}
            onClose={() => setIsModalVisible(false)}
            title={`Images ${images.length}`}
          >
            <SmallImageList
              onSelect={() => {}}
              onCloseModal={() => {}}
              images={images}
            />
          </DebugModal>
        </>
      )}
    </SafeAreaView>
  );
};
