const itemSchema = {
    class: "Item",
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
        {
            "name": "image",
            "dataType": ["blob"],
        },
        {
            "name": "imageID",
            "dataType": ["uuid"],
        },
        {
            "name": "name",
            "dataType": ["string"],
        },
        {
            "name": "description",
            "dataType": ["string"],
        },
    ],
};

export default itemSchema;
