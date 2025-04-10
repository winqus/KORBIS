import SubjectSegmentationModule, {
  SubjectSegmentationOptions,
  SubjectSegmentationResult,
} from "../SubjectSegmentationModule";
import { useState, useEffect, useCallback } from "react";

interface UseSegmenterResult {
  isInitialized: boolean;
  isLoading: boolean;
  error: Error | null;
  segmentSubjects: (imageUri: string) => Promise<SubjectSegmentationResult>;
  reinitialize: (options?: SubjectSegmentationOptions) => Promise<boolean>;
}

/**
 * Hook to initialize and use subject segmenter tracking functionality
 *
 * @param options - Configuration options for subject segmenter
 * @returns Object containing segmenter state and methods
 */
export const useSubjectSegmentation = (
  options: SubjectSegmentationOptions = {
    confidenceThreshold: 0.5,
  },
): UseSegmenterResult => {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  /* Initialize segmenter on mount with provided options */
  useEffect(() => {
    let isMounted = true;

    const initializeSegmenter = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if already initialized
        const alreadyInitialized = SubjectSegmentationModule.isInitialized();

        if (!alreadyInitialized) {
          console.log("Initializing Subject Segmenter...");
          const success = await SubjectSegmentationModule.initialize(options);

          if (isMounted) {
            setIsInitialized(success);
            if (!success) {
              setError(
                new Error("Failed to initialize subject segmenter module"),
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

    initializeSegmenter().catch((err) => {
      if (isMounted) {
        console.error("Failed to initialize segmenter:", err);
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

  /* Method to segment subjects in an image */
  const segmentSubjects = useCallback(
    async (imageUri: string): Promise<SubjectSegmentationResult> => {
      if (!isInitialized) {
        throw new Error("Subject segmenter module is not initialized");
      }

      try {
        return await SubjectSegmentationModule.segmentSubjectsInImage(imageUri);
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to segment image");
        setError(error);
        throw error;
      }
    },
    [isInitialized],
  );

  /* Method to reinitialize the segmenter with new options */
  const reinitialize = useCallback(
    async (newOptions?: SubjectSegmentationOptions): Promise<boolean> => {
      try {
        setIsLoading(true);
        setError(null);

        const success = await SubjectSegmentationModule.initialize(
          newOptions || options,
        );
        setIsInitialized(success);

        if (!success) {
          setError(
            new Error("Failed to reinitialize subject segmenter module"),
          );
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
    segmentSubjects,
    reinitialize,
  };
};
