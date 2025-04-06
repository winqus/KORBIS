export type WeaviateBaseResult<
  T = Record<string, any>,
  U = Record<string, any>,
> =
  & T
  & U;

export type WeaviateAdditionalBase = {
  id: string;
};

export type WeaviateSearchResult<T = Record<string, any>> = WeaviateBaseResult<
  T,
  {
    _additional: WeaviateAdditionalBase;
  }
>;

export type WeaviateNearImageSearchResult<T = Record<string, any>> =
  WeaviateBaseResult<T, {
    _additional: WeaviateAdditionalBase & {
      distance: number;
    };
  }>;

export type WeaviateScoredSearchResult<T = Record<string, any>> =
  WeaviateBaseResult<
    T,
    {
      _additional: WeaviateAdditionalBase & {
        score: number;
      };
    }
  >;

// Generic version that allows for custom additional fields
export type WeaviateResultWithAdditional<T = Record<string, any>, U = {}> =
  WeaviateBaseResult<T, {
    _additional: WeaviateAdditionalBase & U;
  }>;
