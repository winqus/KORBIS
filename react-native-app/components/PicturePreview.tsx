import { Image } from "expo-image";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  BackHandler,
  Modal,
  Pressable,
  StyleSheet,
  ImageSourcePropType,
  FlatList,
} from "react-native";
import React, { PropsWithChildren, useEffect, useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { CameraItemOption } from "@/components/ItemCameraControls";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  SubjectSegmentationResponseRenderer,
  SubjectSegmentationResult,
  useSubjectSegmentation,
} from "@/modules/expo-mlkit";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";

interface PicturePreviewProps {
  mode: CameraItemOption;
  image: { uri: string; width: number; height: number };
  onCancel: () => void;
  onAutoCreate: () => void;
  onManualAdd: () => void;
}

export const PicturePreview = ({
  mode,
  image,
  onCancel,
  onAutoCreate,
  onManualAdd,
}: PicturePreviewProps) => {
  if (!image) {
    throw new Error("Picture is missing");
  }
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [images, setImages] = useState<ImageSourcePropType[]>([image]);

  const segmentator = useSubjectSegmentation();
  const [segmentationResult, setSegmentationResult] =
    useState<SubjectSegmentationResult | null>(null);

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
    if (segmentator.isInitialized) {
      console.log("SEGMENTING", segmentator.isInitialized);
      segmentator
        .segmentSubjects(image.uri)
        .then((result) => {
          console.log("RESULT", result);
          setSegmentationResult(result);
          generateCroppedImages(result, image.uri).then((croppedImages) => {
            setImages([image, ...croppedImages]);
            setIsModalVisible(true);
          });
        })
        .catch((error) => {
          console.error("Error during segmentation:", error);
        });
    }
  }, [image, segmentator.isInitialized]);

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
          />

          {segmentationResult && (
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

          {segmentationResult && (
            <SubjectSegmentationResponseRenderer
              result={segmentationResult}
              displayWidth={screenWidth}
              displayHeight={displayHeight}
              borderColor="blue"
              scale={1}
            />
          )}
        </View>
        <ActionButtons
          mode={mode}
          absolute={!canFitBelowImage}
          onAutoCreate={() => setIsModalVisible(true)}
          onManualAdd={onManualAdd}
        />
      </View>
      <DebugModal
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        title={`Images ${images.length}`}
      >
        {/* A list of emoji component will go here */}
        <EmojiList
          onSelect={() => {}}
          onCloseModal={() => {}}
          images={images}
        />
      </DebugModal>
    </SafeAreaView>
  );
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

export const DebugModal = ({
  isVisible,
  children,
  onClose,
  title,
}: PropsWithChildren<{
  isVisible: boolean;
  onClose: () => void;
  title?: string;
}>) => {
  return (
    <View>
      <Modal animationType="slide" transparent={true} visible={isVisible}>
        <View className="absolute bottom-0 h-1/4 w-full bg-[#25292e] rounded-t-xl">
          <View className="h-[16%] bg-[#464C55] rounded-t-lg px-5 flex-row items-center justify-between">
            <Text className="text-white text-base">{title || "Items"}</Text>
            <Pressable onPress={onClose}>
              <MaterialIcons name="close" color="#fff" size={22} />
            </Pressable>
          </View>
          {children}
        </View>
      </Modal>
    </View>
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

const EmojiList = ({
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

export const generateCroppedImages = async (
  result: SubjectSegmentationResult,
  imageUri: string,
  options?: {
    cropAsSquare?: boolean;
    multiplier?: number;
    log?: boolean;
  },
): Promise<{ uri: string }[]> => {
  const croppedUris: { uri: string }[] = [];

  const { cropAsSquare = true, multiplier = 1.05, log = true } = options || {};

  for (let i = 0; i < result.frames.length; i++) {
    const frame = result.frames[i];
    let { left, top, width, height } = frame;

    const centerX = left + width / 2;
    const centerY = top + height / 2;

    /* (Expand the frame if requested and possible) */
    if (multiplier && multiplier > 1) {
      const newWidth = width * multiplier;
      const newHeight = height * multiplier;

      const expandedLeft = centerX - newWidth / 2;
      const expandedTop = centerY - newHeight / 2;

      if (
        expandedLeft >= 0 &&
        expandedTop >= 0 &&
        expandedLeft + newWidth <= result.inputImageWidth &&
        expandedTop + newHeight <= result.inputImageHeight
      ) {
        left = Math.round(expandedLeft);
        top = Math.round(expandedTop);
        width = Math.round(newWidth);
        height = Math.round(newHeight);

        if (log) {
          console.log(`[Frame${i}] Expanded to ${width}x${height}`);
        }
      }
    }

    if (cropAsSquare) {
      const squareSize = Math.max(width, height);

      const squareLeft = centerX - squareSize / 2;
      const squareTop = centerY - squareSize / 2;

      if (
        squareLeft >= 0 &&
        squareTop >= 0 &&
        squareLeft + squareSize <= result.inputImageWidth &&
        squareTop + squareSize <= result.inputImageHeight
      ) {
        left = Math.round(squareLeft);
        top = Math.round(squareTop);
        width = Math.round(squareSize);
        height = Math.round(squareSize);

        if (log) {
          console.log(`[Frame${i}] Cropping as square ${width}x${height}`);
        }
      }
    }

    const cropped = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        {
          crop: {
            originX: Math.round(left),
            originY: Math.round(top),
            width: Math.round(width),
            height: Math.round(height),
          },
        },
      ],
      {
        compress: 1,
        format: ImageManipulator.SaveFormat.PNG,
      },
    );

    if (log) {
      console.log(`[Frame${i}] Cropped as ${cropped.width}x${cropped.height}`);
    }
    croppedUris.push({ uri: cropped.uri });
  }

  return croppedUris;
};
