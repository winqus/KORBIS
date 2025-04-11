import ObjectDetectionTrackingModule, {
  ObjectDetectorOptions,
  ObjectDetectionResult,
} from "../ObjectDetectionTrackingModule";
import { useState, useEffect, useCallback } from "react";

interface UseObjectDetectionTrackingResult {
  isInitialized: boolean;
  isLoading: boolean;
  error: Error | null;
  detectObjects: (imageUri: string) => Promise<ObjectDetectionResult>;
  reinitialize: (options?: ObjectDetectorOptions) => Promise<boolean>;
}

/**
 * Hook to initialize and use object detection tracking functionality
 *
 * @param options - Configuration options for object detection
 * @returns Object containing detection state and methods
 */
export const useObjectDetectionTracking = (
  options: ObjectDetectorOptions = {
    shouldEnableClassification: false,
    shouldEnableMultipleObjects: true,
    detectorMode: "singleImage",
  },
): UseObjectDetectionTrackingResult => {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  /* Initialize detector on mount with provided options */
  useEffect(() => {
    let isMounted = true;

    const initializeDetector = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if already initialized
        const alreadyInitialized =
          ObjectDetectionTrackingModule.isInitialized();

        if (!alreadyInitialized) {
          console.log("Initializing Detector...");
          const success =
            await ObjectDetectionTrackingModule.initialize(options);

          if (isMounted) {
            setIsInitialized(success);
            if (!success) {
              setError(
                new Error("Failed to initialize object detection module"),
              );
            }
          }
        } else if (isMounted) {
          setIsInitialized(true);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err
              : new Error("Unknown error during initialization"),
          );
          setIsInitialized(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeDetector().catch((err) => {
      if (isMounted) {
        console.error("Failed to initialize detector:", err);
        setError(
          err instanceof Error
            ? err
            : new Error("Unhandled initialization error"),
        );
        setIsLoading(false);
      }
    });

    /* Cleanup function */
    return () => {
      isMounted = false;
    };
  });

  /* Method to detect objects in an image */
  const detectObjects = useCallback(
    async (imageUri: string): Promise<ObjectDetectionResult> => {
      if (!isInitialized) {
        throw new Error("Object detection module is not initialized");
      }

      try {
        return await ObjectDetectionTrackingModule.detectObjectsInImage(
          imageUri,
        );
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to detect objects");
        setError(error);
        throw error;
      }
    },
    [isInitialized],
  );

  /* Method to reinitialize the detector with new options */
  const reinitialize = useCallback(
    async (newOptions?: ObjectDetectorOptions): Promise<boolean> => {
      try {
        setIsLoading(true);
        setError(null);

        const success = await ObjectDetectionTrackingModule.initialize(
          newOptions || options,
        );
        setIsInitialized(success);

        if (!success) {
          setError(new Error("Failed to reinitialize object detection module"));
        }

        return success;
      } catch (err) {
        const error =
          err instanceof Error
            ? err
            : new Error("Unknown error during reinitialization");
        setError(error);
        setIsInitialized(false);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [options],
  );

  return {
    isInitialized,
    isLoading,
    error,
    detectObjects,
    reinitialize,
  };
};
