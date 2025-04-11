import { Image } from "expo-image";
import {
  BackHandler,
  ColorValue,
  Dimensions,
  FlatList,
  ImageSourcePropType,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { CameraItemOption } from "@/components/ItemCameraControls";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Frame,
  ObjectDetectionResponseRenderer,
  ObjectDetectionResult,
  SubjectSegmentationResponseRenderer,
  SubjectSegmentationResult,
  useObjectDetectionTracking,
  useSubjectSegmentation,
} from "@/modules/expo-mlkit";
import * as ImageManipulator from "expo-image-manipulator";
import { DebugModal } from "@/components/DebugModal";
import icons from "@/constants/icons";

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

export const convertDetectionFramesToParentDomain = (
  result: ObjectDetectionResult,
  cropFrame: Frame,
): ObjectDetectionResult => {
  const scaleX = cropFrame.width / result.width;
  const scaleY = cropFrame.height / result.height;

  const convertedObjects = result.detectedObjects.map((obj) => {
    const { frame, ...rest } = obj;

    const convertedFrame = {
      top: cropFrame.top + frame.top * scaleY,
      left: cropFrame.left + frame.left * scaleX,
      width: frame.width * scaleX,
      height: frame.height * scaleY,
    };

    return {
      frame: convertedFrame,
      ...rest,
    };
  });

  return {
    width: cropFrame.width,
    height: cropFrame.height,
    detectedObjects: convertedObjects,
  };
};

type ActionButtonsProps = {
  mode: string;
  absolute?: boolean;
  onAutoCreate: () => void;
  onManualAdd: () => void;
};

export const ActionButtons = ({
  mode,
  absolute,
  onAutoCreate,
  onManualAdd,
}: ActionButtonsProps) => {
  if (mode !== "add") return null;

  return (
    <View
      className={`${
        absolute ? "absolute bottom-10 left-0 right-0 px-6" : "px-10 mb-10"
      }`}
    >
      <TouchableOpacity
        onPress={onAutoCreate}
        className="bg-primary-300 py-4 rounded-full items-center mb-4"
      >
        <Text className="text-white font-semibold text-base">
          Auto create item
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onManualAdd}
        className="py-3 items-center m-auto px-6"
      >
        <Text className="text-white text-sm">or manually add items</Text>
      </TouchableOpacity>
    </View>
  );
};

type CloseButtonProps = {
  absolute?: boolean;
  onCancel: () => void;
};

export const CloseButton = ({ absolute, onCancel }: CloseButtonProps) => {
  const className = `p-2 ${absolute ? "" : "absolute top-12 left-4 z-10 p-2 bg-primary-200 rounded-full items-center justify-center size-12"}`;

  const button = (
    <TouchableOpacity onPress={onCancel} className={className}>
      <Ionicons name="close" size={28} color="white" />
    </TouchableOpacity>
  );

  return absolute ? <View className="pt-2 pl-4 pb-2">{button}</View> : button;
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

const SmallImageList = ({
  onSelect,
  onCloseModal,
  images,
}: {
  onSelect: (image: ImageSourcePropType) => void;
  onCloseModal: () => void;
  images: ImageSourcePropType[];
}) => {
  const [emoji] = useState<ImageSourcePropType[]>(images);

  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={emoji}
      keyExtractor={(_, index) => index.toString()}
      contentContainerStyle={{
        paddingHorizontal: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
      }}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => {
            onSelect(item);
            onCloseModal();
          }}
          className="mr-5"
        >
          <Image
            source={item}
            contentFit="contain"
            className="size-24 bg-red-500"
          />
        </Pressable>
      )}
    />
  );
};

export const expandFrameIfPossible = (
  frame: Frame,
  multiplier: number,
  inputImageWidth: number,
  inputImageHeight: number,
): { frame: Frame; wasExpanded: boolean } => {
  const { left, top, width, height } = frame;
  if (!multiplier || multiplier <= 1) {
    return { frame, wasExpanded: false };
  }
  const centerX = left + width / 2;
  const centerY = top + height / 2;
  const newWidth = width * multiplier;
  const newHeight = height * multiplier;
  const expandedLeft = centerX - newWidth / 2;
  const expandedTop = centerY - newHeight / 2;
  if (
    expandedLeft >= 0 &&
    expandedTop >= 0 &&
    expandedLeft + newWidth <= inputImageWidth &&
    expandedTop + newHeight <= inputImageHeight
  ) {
    return {
      frame: {
        left: Math.round(expandedLeft),
        top: Math.round(expandedTop),
        width: Math.round(newWidth),
        height: Math.round(newHeight),
      },
      wasExpanded: true,
    };
  }
  return { frame, wasExpanded: false };
};

export const frameToSquareIfPossible = (
  frame: Frame,
  inputImageWidth: number,
  inputImageHeight: number,
): { frame: Frame; wasSquared: boolean } => {
  const { left, top, width, height } = frame;
  const centerX = left + width / 2;
  const centerY = top + height / 2;
  const squareSize = Math.max(width, height);
  const squareLeft = centerX - squareSize / 2;
  const squareTop = centerY - squareSize / 2;
  if (
    squareLeft >= 0 &&
    squareTop >= 0 &&
    squareLeft + squareSize <= inputImageWidth &&
    squareTop + squareSize <= inputImageHeight
  ) {
    return {
      frame: {
        left: Math.round(squareLeft),
        top: Math.round(squareTop),
        width: Math.round(squareSize),
        height: Math.round(squareSize),
      },
      wasSquared: true,
    };
  }
  return { frame, wasSquared: false };
};

export const cropImage = async (
  imageUri: string,
  frame: Frame,
): Promise<{ uri: string; width: number; height: number }> => {
  return await ImageManipulator.manipulateAsync(
    imageUri,
    [
      {
        crop: {
          originX: frame.left,
          originY: frame.top,
          width: frame.width,
          height: frame.height,
        },
      },
    ],
    {
      compress: 1,
      format: ImageManipulator.SaveFormat.PNG,
    },
  );
};

export const generateCroppedImages = async (
  result: SubjectSegmentationResult,
  imageUri: string,
  options?: {
    cropAsSquare?: boolean;
    multiplier?: number;
    log?: boolean;
  },
): Promise<{ uri: string; frame: Frame }[]> => {
  const processedFrames: { uri: string; frame: Frame }[] = [];
  const { cropAsSquare = true, multiplier = 1.05, log } = options || {};

  for (let i = 0; i < result.frames.length; i++) {
    let frame = result.frames[i];

    const { frame: expandedFrame, wasExpanded } = expandFrameIfPossible(
      frame,
      multiplier,
      result.inputImageWidth,
      result.inputImageHeight,
    );

    if (wasExpanded && log) {
      console.log(
        `[Frame${i}] Expanded to ${expandedFrame.width}x${expandedFrame.height}`,
      );
    }

    frame = expandedFrame;

    if (cropAsSquare) {
      const { frame: squaredFrame, wasSquared } = frameToSquareIfPossible(
        frame,
        result.inputImageWidth,
        result.inputImageHeight,
      );
      if (wasSquared && log) {
        console.log(
          `[Frame${i}] Cropping as square ${squaredFrame.width}x${squaredFrame.height}`,
        );
      }
      frame = squaredFrame;
    }

    const cropped = await cropImage(imageUri, frame);

    if (log) {
      console.log(`[Frame${i}] Cropped to ${cropped.width}x${cropped.height}`);
    }

    processedFrames.push({ uri: cropped.uri, frame });
  }
  return processedFrames;
};
