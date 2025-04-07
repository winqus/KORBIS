export const itemSchema = {
  class: "Item",
  description: "Asset of type 'item'",
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
      name: "description",
      dataType: ["text"],
      description: "Item description/notes",
    },
    {
      name: "quantity",
      dataType: ["number"],
      description: "Quantity of this item",
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

// export const itemSchema = {
//     class: "Item",
//     description: "Physical items or containers in the system",
//     vectorizer: "multi2vec-clip",
//     vectorIndexType: "hnsw",
//     moduleConfig: {
//         /* https://weaviate.github.io/typescript-client/types/Multi2VecClipConfig.html (v2) */
//         "multi2vec-clip": {
//             imageFields: [
//                 "image",
//             ],
//             textFields: [
//                 "name",
//                 "description",
//                 "tags",
//             ],
//             weights: {
//                 imageFields: [0.6],
//                 textFields: [0.2, 0.1, 0.1],
//             },
//         },
//     },
//     properties: [
//         {
//             name: "image",
//             dataType: ["blob"],
//         },
//         {
//             name: "imageID",
//             dataType: ["uuid"],
//         },
//         {
//             name: "name",
//             dataType: ["text"],
//             description: "Name of the item",
//             moduleConfig: {
//                 "multi2vec-clip": {
//                     vectorizePropertyName: true,
//                     tokenization: "lowercase",
//                 },
//             },
//         },
//         {
//             name: "description",
//             dataType: ["text"],
//             description: "Detailed description of the item",
//             moduleConfig: {
//                 "multi2vec-clip": {
//                     vectorizePropertyName: true,
//                     tokenization: "word",
//                 },
//             },
//         },
//         {
//             name: "itemTypes",
//             dataType: ["text[]"],
//             description:
//                 "Types or interfaces this item implements: item, container",
//         },
//         {
//             name: "status",
//             dataType: ["text"],
//             description: "Current status: active, archived",
//         },
//         {
//             name: "quantity",
//             dataType: ["number"],
//             description: "Quantity of identical items",
//         },
//         {
//             name: "unitOfMeasurement",
//             dataType: ["text"],
//             description: "Unit of measurement for quantity",
//         },
//         {
//             name: "createdAt",
//             dataType: ["date"],
//             description: "When the item was created",
//         },
//         {
//             name: "modifiedAt",
//             dataType: ["date"],
//             description: "When the item was last modified",
//         },
//         {
//             name: "deletedAt",
//             dataType: ["date"],
//             description: "Soft delete timestamp, null if active",
//         },
//         {
//             name: "domainInfo",
//             dataType: ["object"],
//             nestedProperties: [
//                 {
//                     name: "domainID",
//                     dataType: ["uuid"],
//                     description: "ID of the domain",
//                 },
//                 {
//                     name: "domainName",
//                     dataType: ["text"],
//                     description: "Name of the domain",
//                 },
//             ],
//             description: "Information about the domain this item belongs to",
//         },
//         {
//             name: "locationInfo",
//             dataType: ["object"],
//             nestedProperties: [
//                 {
//                     name: "locationID",
//                     dataType: ["uuid"],
//                     description: "ID of the location",
//                 },
//                 {
//                     name: "locationName",
//                     dataType: ["text"],
//                     description: "Name of the location",
//                 },
//                 {
//                     name: "locationPath",
//                     dataType: ["text"],
//                     description: "Path of the location",
//                 },
//             ],
//             description: "Information about the location this item is in",
//         },
//         {
//             name: "parentInfo",
//             dataType: ["object"],
//             nestedProperties: [
//                 {
//                     name: "parentID",
//                     dataType: ["uuid"],
//                     description: "ID of the parent item",
//                 },
//                 {
//                     name: "itemName",
//                     dataType: ["text"],
//                     description: "Name of the parent item",
//                 },
//             ],
//             description: "Information about the parent container item (if any)",
//         },
//         {
//             name: "fullPath",
//             dataType: ["text"],
//             description:
//                 "Full path including location and containers, e.g., 'Beach House/Living Room/Cabinet/Box'",
//         },
//         {
//             name: "tags",
//             dataType: ["text[]"],
//             description: "Array of tag names",
//             moduleConfig: {
//                 "multi2vec-clip": {
//                     tokenization: "field",
//                 },
//             },
//         },
//         {
//             name: "attachments",
//             dataType: ["object[]"],
//             nestedProperties: [
//                 {
//                     name: "filePath",
//                     dataType: ["text"],
//                     description: "Path to the attached file",
//                 },
//                 {
//                     name: "fileType",
//                     dataType: ["text"],
//                     description: "MIME type of the file",
//                 },
//                 {
//                     name: "uploadedAt",
//                     dataType: ["date"],
//                     description: "When the file was uploaded",
//                 },
//                 {
//                     name: "deletedAt",
//                     dataType: ["date"],
//                     description: "Soft delete timestamp, null if active",
//                 },
//             ],
//             description: "Files attached to this item",
//         },
//     ],
// };
