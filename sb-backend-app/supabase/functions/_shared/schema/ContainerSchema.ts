export const containerSchema = {
  class: "Container",
  description: "Asset of type 'container'",
  vectorizer: "multi2vec-clip",
  vectorIndexType: "hnsw",
  moduleConfig: {
    /* https://weaviate.github.io/typescript-client/types/Multi2VecClipConfig.html (v2) */
    "multi2vec-clip": {
      imageFields: [
        "image",
      ],
      textFields: [
        "name",
        "description",
      ],
      weights: {
        imageFields: [0.9],
        textFields: [0.1, 0.1],
      },
    },
  },
  properties: [
    /* Base VirtualAsset properties */
    {
      name: "ownerId",
      dataType: ["uuid"],
      description: "Asset owner (user) ID",
    },
    {
      name: "name",
      dataType: ["text"],
      description: "Asset name",
    },
    {
      name: "type",
      dataType: ["text"],
      description: "Asset type",
    },
    /* End of Base VirtualAsset properties */
    {
      name: "parentId",
      dataType: ["text"],
      description: "ID of parent VirtualAsset",
    },
    {
      name: "parentType",
      dataType: ["text"],
      description: "Type of parent VirtualAsset",
    },
    {
      name: "childCount",
      dataType: ["int"],
      description: "Number of children in the container",
    },
    {
      name: "path",
      dataType: ["text"],
      description: "Path of the container",
    },
    {
      name: "description",
      dataType: ["text"],
      description: "Item description/notes",
    },
    {
      name: "imageId",
      dataType: ["uuid"],
      description: "ID of the item image",
    },
    {
      name: "image",
      dataType: ["blob"],
      description: "Image in base64 of the item",
    },
  ],
};
