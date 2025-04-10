import { View, Text, StyleSheet, Dimensions, ColorValue } from "react-native";
import React from "react";
import {
  Line,
  TextRecognitionResult,
  ObjectDetectionResult,
  SubjectSegmentationResult,
} from "../../index";

// Generic rectangle interface that can work with both text recognition and object detection
export interface BoundingRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

// Generic interface for any recognized item with text and rectangle
export interface RecognizedItem {
  text?: string;
  rect: BoundingRect;
}

interface BoundingBoxProps {
  item: RecognizedItem;
  scaleX: number;
  scaleY: number;
  borderColor?: ColorValue;
  showText?: boolean;
  textColor?: ColorValue;
}

// Reusable BoundingBox component
export const BoundingBox = ({
  item,
  scaleX,
  scaleY,
  borderColor = "red",
  showText = true,
  textColor = "blue",
}: BoundingBoxProps) => {
  const rect = React.useMemo(() => {
    return {
      left: item.rect.left * scaleX,
      top: item.rect.top * scaleY,
      height: item.rect.height * scaleY,
      width: item.rect.width * scaleX,
    };
  }, [item, scaleX, scaleY]);

  return (
    <View
      style={{
        position: "absolute",
        borderWidth: 1,
        borderColor: borderColor,
        ...rect,
      }}
    >
      {showText && item.text && (
        <Text style={{ color: textColor }}>{item.text}</Text>
      )}
    </View>
  );
};

// Generic overlay component for any kind of detection
interface DetectionOverlayProps {
  items: RecognizedItem[];
  imageWidth: number;
  imageHeight: number;
  displayWidth: number;
  displayHeight: number;
  borderColor?: ColorValue;
  showText?: boolean;
  textColor?: ColorValue;
}

export const DetectionOverlay = ({
  items,
  imageWidth,
  imageHeight,
  displayWidth,
  displayHeight,
  borderColor = "red",
  showText = true,
  textColor = "blue",
}: DetectionOverlayProps) => {
  // Calculate scale factors for both dimensions
  const scaleX = displayWidth / imageWidth;
  const scaleY = displayHeight / imageHeight;
  const { width: windowWidth, height: windowHeight } = Dimensions.get("window");
  // Calculate vertical offset for centering when image doesn't fill screen height
  const verticalOffset = Math.max(0, (windowHeight - displayHeight) / 2);

  return (
    <View
      style={[
        {
          position: "absolute",
          width: displayWidth,
          height: displayHeight,
          left: (windowWidth - displayWidth) / 2, // Center horizontally
          top: verticalOffset, // Center vertically when needed
        },
      ]}
    >
      {items.map((item, index) => (
        <BoundingBox
          key={`item-${index}`}
          item={item}
          scaleX={scaleX}
          scaleY={scaleY}
          borderColor={borderColor}
          showText={showText}
          textColor={textColor}
        />
      ))}
    </View>
  );
};

// Adapter for Text Recognition results
export const TextRecognitionResponseRenderer = ({
  response,
  imageWidth,
  imageHeight,
  displayWidth,
  displayHeight,
  borderColor = "red",
}: ResponseRendererProps) => {
  // Transform text blocks/lines into recognized items
  const items: RecognizedItem[] = React.useMemo(() => {
    const recognizedItems: RecognizedItem[] = [];

    response.blocks.forEach((block) => {
      block.lines.forEach((line) => {
        recognizedItems.push({
          text: line.text,
          rect: line.rect,
        });
      });
    });

    return recognizedItems;
  }, [response]);

  return (
    <DetectionOverlay
      items={items}
      imageWidth={imageWidth}
      imageHeight={imageHeight}
      displayWidth={displayWidth}
      displayHeight={displayHeight}
      borderColor={borderColor}
      showText={true}
      textColor="red"
    />
  );
};

// Adapter for Object Detection results
export const ObjectDetectionResponseRenderer = ({
  result,
  imageWidth,
  imageHeight,
  displayWidth,
  displayHeight,
  borderColor = "green",
  scale = 1,
}: {
  result: ObjectDetectionResult;
  imageWidth: number;
  imageHeight: number;
  displayWidth: number;
  displayHeight: number;
  borderColor?: ColorValue;
  scale?: number;
}) => {
  // Transform object detection results into recognized items
  const items: RecognizedItem[] = React.useMemo(() => {
    return result.detectedObjects.map((result) => ({
      text:
        result.labels.length > 0
          ? `${result.labels[0].text} (${(result.labels[0].confidence * 100).toFixed(1)}%)`
          : undefined,
      rect: {
        left: result.frame.left * scale,
        top: result.frame.top * scale,
        width: result.frame.width * scale,
        height: result.frame.height * scale,
      },
    }));
  }, [result]);

  return (
    <DetectionOverlay
      items={items}
      imageWidth={imageWidth}
      imageHeight={imageHeight}
      displayWidth={displayWidth}
      displayHeight={displayHeight}
      borderColor={borderColor}
      showText={true}
      textColor="white"
    />
  );
};

export const SubjectSegmentationResponseRenderer = ({
  result,
  displayWidth,
  displayHeight,
  borderColor = "blue",
  scale = 1,
}: {
  result: SubjectSegmentationResult;
  displayWidth: number;
  displayHeight: number;
  borderColor?: ColorValue;
  scale?: number;
}) => {
  // Transform segmentation frames into recognized items
  const items: RecognizedItem[] = React.useMemo(() => {
    return result.frames.map((frame, index) => ({
      text: `Subject ${index + 1}`,
      rect: {
        left: frame.left * scale,
        top: frame.top * scale,
        width: frame.width * scale,
        height: frame.height * scale,
      },
    }));
  }, [result, scale]);

  return (
    <DetectionOverlay
      items={items}
      imageWidth={result.inputImageWidth}
      imageHeight={result.inputImageHeight}
      displayWidth={displayWidth}
      displayHeight={displayHeight}
      borderColor={borderColor}
      showText={true}
      textColor="white"
    />
  );
};

interface ResponseRendererProps {
  response: TextRecognitionResult;
  imageWidth: number;
  imageHeight: number;
  displayWidth: number;
  displayHeight: number;
  borderColor?: ColorValue;
}
