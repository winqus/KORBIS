import ImageLabelerModule, {
  ImageLabelerOptions,
  ImageLabelingResult,
} from "../ImageLabelerModule";
import { useState, useEffect, useCallback } from "react";

interface UseImageLabelerResult {
  isInitialized: boolean;
  isLoading: boolean;
  error: Error | null;
  labelImage: (imageUri: string) => Promise<ImageLabelingResult>;
  reinitialize: (options?: ImageLabelerOptions) => Promise<boolean>;
}

/**
 * Hook to initialize and use image labeler tracking functionality
 *
 * @param options - Configuration options for image labeler
 * @returns Object containing labeler state and methods
 */
export const useImageLabeler = (
  options: ImageLabelerOptions = {
    confidenceThreshold: 0.5,
  },
): UseImageLabelerResult => {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  /* Initialize labeler on mount with provided options */
  useEffect(() => {
    let isMounted = true;

    const initializeLabeler = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if already initialized
        const alreadyInitialized = ImageLabelerModule.isInitialized();

        if (!alreadyInitialized) {
          console.log("Initializing Image Labeler...");
          const success = await ImageLabelerModule.initialize(options);

          if (isMounted) {
            setIsInitialized(success);
            if (!success) {
              setError(new Error("Failed to initialize image labeler module"));
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

    initializeLabeler().catch((err) => {
      if (isMounted) {
        console.error("Failed to initialize labeler:", err);
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

  /* Method to label in an image */
  const labelImage = useCallback(
    async (imageUri: string): Promise<ImageLabelingResult> => {
      if (!isInitialized) {
        throw new Error("Image labeler module is not initialized");
      }

      try {
        return await ImageLabelerModule.labelImage(imageUri);
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to label image");
        setError(error);
        throw error;
      }
    },
    [isInitialized],
  );

  /* Method to reinitialize the labeler with new options */
  const reinitialize = useCallback(
    async (newOptions?: ImageLabelerOptions): Promise<boolean> => {
      try {
        setIsLoading(true);
        setError(null);

        const success = await ImageLabelerModule.initialize(
          newOptions || options,
        );
        setIsInitialized(success);

        if (!success) {
          setError(new Error("Failed to reinitialize image labeler module"));
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
    labelImage,
    reinitialize,
  };
};
