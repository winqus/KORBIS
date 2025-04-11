import { Image } from "expo-image";
import {
  BackHandler,
  Dimensions,
  ImageSourcePropType,
  View,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { CameraItemOption } from "@/components/ItemCameraControls";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ObjectDetectionResult,
  SubjectSegmentationResult,
  useObjectDetectionTracking,
  useSubjectSegmentation,
} from "@/modules/expo-mlkit";
import { DebugModal } from "@/components/DebugModal";
import { generateCroppedImages } from "@/lib/utils";
import { SmallImageList } from "@/components/SmallImageList";
import { ActionButtons, CloseButton } from "@/components/Buttons";
import { SmartItemFrame } from "@/components/SmartItemFrame";

interface PicturePreviewProps {
  mode: CameraItemOption;
  image: { uri: string; width: number; height: number };
  onCancel: () => void;
  onAutoCreate: () => void;
  onManualAdd: () => void;
  debug?: boolean;
}

export const PicturePreview = ({
  mode,
  image,
  onCancel,
  onAutoCreate,
  onManualAdd,
  debug = false,
}: PicturePreviewProps) => {
  if (!image) {
    throw new Error("Picture is missing");
  }

  const segmentator = useSubjectSegmentation();
  const objectDetector = useObjectDetectionTracking();

  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [images, setImages] = useState<ImageSourcePropType[]>([]);

  const lastImageUriRef = useRef<string | null>(null);

  const [segmentationResult, setSegmentationResult] =
    useState<SubjectSegmentationResult | null>(null);
  const [detectionResult, setDetectionResult] =
    useState<ObjectDetectionResult | null>(null);

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
    if (!segmentator.isInitialized || !image?.uri) return;
    if (lastImageUriRef.current === image.uri) return;

    lastImageUriRef.current = image.uri;

    console.log("SEGMENTING", segmentator.isInitialized);
    segmentator
      .segmentSubjects(image.uri)
      .then(async (result) => {
        setSegmentationResult(result);

        await generateCroppedImages(result, image.uri).then((croppedImages) => {
          setImages([...croppedImages]);
          // setIsModalVisible(true);
        });
      })
      .catch((error) => {
        console.error("Error during segmentation:", error);
      });
  }, [image.uri, segmentator, segmentator.isInitialized]);

  // TODO REMOVE LATER
  useEffect(() => {
    if (!objectDetector.isInitialized || !image?.uri) return;

    console.log("DETECTING", objectDetector.isInitialized);

    objectDetector.detectObjects(image.uri).then((result) => {
      setDetectionResult(result);
    });
  }, [image.uri, objectDetector.isInitialized]);

  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
  const displayHeight = image.height * (screenWidth / image.width);
  const buttonsHeight = 120;
  const topSafeArea = 50;
  const availableHeight = screenHeight - topSafeArea - buttonsHeight;
  const canFitBelowImage = displayHeight <= availableHeight;

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-1">
        <CloseButton absolute={canFitBelowImage} onCancel={onCancel} />
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
              console.log("TOUCHING IMAGE (TODO: clear AI suggestion frames)");
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

          {/* TODO remove if not needed */}
          {/*{segmentationResult && (*/}
          {/*  <SubjectSegmentationResponseRenderer*/}
          {/*    result={segmentationResult}*/}
          {/*    displayWidth={screenWidth}*/}
          {/*    displayHeight={displayHeight}*/}
          {/*    borderColor="blue"*/}
          {/*    scale={1}*/}
          {/*  />*/}
          {/*)}*/}

          {segmentationResult?.frames.map((frame, i) => (
            <SmartItemFrame
              key={`frame-${i + 1}`}
              index={`subject-${i + 1}`}
              frame={frame}
              displayWidth={screenWidth}
              displayHeight={displayHeight}
              parentImage={image}
              borderColor="white"
              onObjectDetectionDone={(result) => {
                console.log(`Object-${result.index} detection result:`, result);
                // setDetectionResult(result);
              }}
              onFrameSelect={() => {
                console.log("Frame selected:", frame);
              }}
            />
          ))}

          {/*{detectionResult && (*/}
          {/*  <ObjectDetectionResponseRenderer*/}
          {/*    result={detectionResult}*/}
          {/*    imageWidth={detectionResult.width}*/}
          {/*    imageHeight={detectionResult.height}*/}
          {/*    displayWidth={screenWidth}*/}
          {/*    displayHeight={displayHeight}*/}
          {/*    borderColor="rgba(0, 0, 0, 0.2)"*/}
          {/*  />*/}
          {/*)}*/}
        </View>
        <ActionButtons
          mode={mode}
          absolute={!canFitBelowImage}
          onAutoCreate={() => setIsModalVisible(true)}
          onManualAdd={onManualAdd}
        />
      </View>
      {/* TODO remove later */}
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
    </SafeAreaView>
  );
};

// const SmallItemCard = ({
//   imageSize,
//   imageSource,
// }: {
//   imageSize: number;
//   imageSource: ImageSourcePropType;
// }) => {
//   return (
//     <View className="relative -top-[350px]">
//       <Image
//         source={imageSource}
//         style={{ width: imageSize, height: imageSize }}
//       />
//     </View>
//   );
// };
