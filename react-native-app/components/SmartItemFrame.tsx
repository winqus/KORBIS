import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Frame,
  ObjectDetectionResponseRenderer,
  ObjectDetectionResult,
  useObjectDetectionTracking,
} from "../modules/expo-mlkit";
import { convertDetectionFramesToParentDomain } from "../lib/utils";
import { ColorValue, Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import icons from "../constants/icons";

type SmartItemFrameProps = {
  id: string;
  state: "suggested" | "selected" | "dismissed";
  croppedImage?: { uri: string; width: number; height: number };
  frame: Frame;
  quantity?: number;
  displayWidth: number;
  displayHeight: number;
  borderColor?: ColorValue;
  parentImage: { uri: string; width: number; height: number };
  onSelect: () => void;
  onDismiss: () => void;
  onChangeCount: (count: number) => void;
  debug?: boolean;
};

export const SmartItemFrame = (props: SmartItemFrameProps) => {
  const {
    id,
    state,
    croppedImage,
    frame,
    quantity,
    displayWidth,
    displayHeight,
    borderColor = "white",
    parentImage,
    onSelect,
    onDismiss,
    onChangeCount,
    debug = false,
  } = props;

  const selected = state === "selected";
  const countSelected = quantity !== undefined;
  const { detectObjects, isInitialized: isDetectorInitialized } =
    useObjectDetectionTracking();
  const [detectionResult, setDetectionResult] =
    useState<ObjectDetectionResult | null>(null);

  const rect = useMemo(
    () => ({
      left: (frame.left / parentImage.width) * displayWidth,
      top: (frame.top / parentImage.height) * displayHeight,
      width: (frame.width / parentImage.width) * displayWidth,
      height: (frame.height / parentImage.height) * displayHeight,
    }),
    [frame, displayWidth, displayHeight, parentImage],
  );

  useEffect(() => {
    if (!isDetectorInitialized || !croppedImage) return;

    detectObjects(croppedImage.uri).then((result) => {
      if (debug) {
        console.log(
          `[${id}] 🔍 Detection count:`,
          result.detectedObjects.length,
        );
      }

      const converted = convertDetectionFramesToParentDomain(result, frame);
      setDetectionResult(converted);
    });
  }, [croppedImage, isDetectorInitialized, frame]);

  const shouldDisplayCountSuggestion = () => {
    return selected && (detectionResult?.detectedObjects.length || 0) > 1;
  };

  return (
    <>
      {/* Frame */}
      <TouchableOpacity
        onPress={onSelect}
        className="absolute"
        style={{
          borderColor,
          borderRadius: 12,
          borderWidth: 3,
          opacity: selected ? 1 : 0.5,
          ...rect,
        }}
        disabled={selected}
      />
      {!selected && (
        <Image
          source={icons.shines}
          className="absolute size-6"
          tintColor="white"
          style={{
            left: rect.left + 6,
            top: rect.top + 6,
            opacity: selected ? 1 : 0.5,
          }}
          contentFit="contain"
        />
      )}
      {debug && (
        <Text
          className="absolute bg-white/20 text-black text-xs font-medium rounded-lg py-1 px-2 z-10"
          style={{ ...rect, height: "auto" }}
        >
          {`${id}`}
        </Text>
      )}

      {/* Count suggestion/selection */}
      {shouldDisplayCountSuggestion() && (
        <TouchableOpacity
          className="absolute flex-row items-center justify-center"
          style={{
            left: rect.left,
            top: rect.top + rect.height + 2,
            width: rect.width,
            opacity: countSelected ? 1 : 0.5,
          }}
          onPress={() =>
            onChangeCount(detectionResult?.detectedObjects.length || 1)
          }
        >
          <View
            className="bg-white rounded-lg py-1 px-2 z-10"
            style={{
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {countSelected ? (
              <Text className="text-gray text-xs font-rubik-medium">
                {`Add ${detectionResult?.detectedObjects.length || 0} units`}
              </Text>
            ) : (
              <>
                <Image
                  source={icons.shines}
                  className="size-4"
                  tintColor="white"
                  style={{
                    position: "absolute",
                    left: -20,
                    opacity: countSelected ? 1 : 0.5,
                  }}
                />
                <Text className="text-gray text-xs font-rubik-medium">
                  {`Add ${detectionResult?.detectedObjects.length || 0} units?`}
                </Text>
              </>
            )}
          </View>
        </TouchableOpacity>
      )}

      {/* DEBUG */}
      {debug && detectionResult && (
        <ObjectDetectionResponseRenderer
          result={detectionResult}
          imageWidth={parentImage.width}
          imageHeight={parentImage.height}
          displayWidth={displayWidth}
          displayHeight={displayHeight}
        />
      )}
    </>
  );
};
