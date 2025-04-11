import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Frame,
  ObjectDetectionResponseRenderer,
  ObjectDetectionResult,
  useObjectDetectionTracking,
} from "../modules/expo-mlkit";
import {
  convertDetectionFramesToParentDomain,
  cropImage,
  expandFrameIfPossible,
} from "../lib/utils";
import { ColorValue, Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import icons from "../constants/icons";

type SmartItemFrameProps = {
  index: number | string;
  frame: Frame;
  displayWidth: number;
  displayHeight: number;
  borderColor?: ColorValue;
  parentImage: { uri: string; width: number; height: number };
  onObjectDetectionDone: (result: {
    index: number;
    count: number;
    frames: Frame[];
  }) => void;
  onFrameSelect: () => void;
  debug?: boolean;
};

export const SmartItemFrame = (props: SmartItemFrameProps) => {
  const {
    index,
    frame,
    displayWidth,
    displayHeight,
    borderColor = "white",
    parentImage,
    onObjectDetectionDone,
    onFrameSelect,
    debug = false,
  } = props;

  const [selected, setSelected] = useState(false);
  const lastImageUriRef = useRef<string | null>(null);
  const { detectObjects, isInitialized: isDetectorInitialized } =
    useObjectDetectionTracking();
  const [detectionResult, setDetectionResult] =
    useState<ObjectDetectionResult | null>(null);
  const [croppedImage, setCroppedImage] = useState<{
    uri: string;
    width: number;
    height: number;
  } | null>(null);

  const adjustedFrame = useMemo(() => {
    const { frame: expanded } = expandFrameIfPossible(
      frame,
      1,
      parentImage.width,
      parentImage.height,
    );
    return expanded;
  }, [frame, parentImage]);

  const rect = useMemo(
    () => ({
      left: (adjustedFrame.left / parentImage.width) * displayWidth,
      top: (adjustedFrame.top / parentImage.height) * displayHeight,
      width: (adjustedFrame.width / parentImage.width) * displayWidth,
      height: (adjustedFrame.height / parentImage.height) * displayHeight,
    }),
    [adjustedFrame, displayWidth, displayHeight, parentImage],
  );

  useEffect(() => {
    /* NOT SURE IF NEEDED */
    // if (lastImageUriRef.current === parentImage.uri) return;

    let isCancelled = false;
    lastImageUriRef.current = parentImage.uri;

    (async () => {
      const cropped = await cropImage(parentImage.uri, adjustedFrame);
      console.log(
        `[${index}] Cropped image: ${cropped.width} x ${cropped.height}`,
      );
      if (!isCancelled) setCroppedImage(cropped);
    })();

    return () => {
      isCancelled = true;
    };
  }, [parentImage.uri, adjustedFrame]);

  useEffect(() => {
    if (!isDetectorInitialized || !croppedImage) return;

    detectObjects(croppedImage.uri).then((result) => {
      console.log(
        `[${index}] 🔍 Detection count:`,
        result.detectedObjects.length,
      );

      const converted = convertDetectionFramesToParentDomain(
        result,
        adjustedFrame,
      );
      setDetectionResult(converted);
    });
  }, [croppedImage, isDetectorInitialized, adjustedFrame]);

  return (
    <>
      <TouchableOpacity
        // onPress={onFrameSelect}
        onPress={() => setSelected(true)}
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
          {`${index}`}
        </Text>
      )}
      <View
        className="absolute items-center"
        style={{
          left: rect.left,
          top: rect.top + rect.height + 2,
          width: rect.width,
        }}
      >
        <Text className="bg-white text-black text-xs font-medium rounded-lg py-1 px-2 z-10">
          {`(${detectionResult?.detectedObjects.length || 0})`}
        </Text>
      </View>
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
