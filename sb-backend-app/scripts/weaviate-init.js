// https://weaviate.io/developers/weaviate/model-providers/transformers/embeddings-multimodal
// https://weaviate.github.io/typescript-client/types/Multi2VecClipConfig.html (v2)

// import weaviate from 'weaviate-ts-client'; // weaviate v2
import weaviate from "npm:weaviate-ts-client@2.2.0";

/* Create a client */
const client = weaviate.client({
    scheme: 'http', // or 'https'
    host: 'localhost:8080', // or e.g.'weaviate.mydomain.com'
    apiKey: new weaviate.ApiKey("xxxxxxxxxxxxxxxx_myapikey_xxxxxxxxxxxxxxxx") // replace with your API key
});


/* Check for existing classes */
const schemaRes = await client.schema.getter().do();
console.log(schemaRes);

const className = 'Item';
const classExists = schemaRes.classes?.find((c) => c.class === className);

if (schemaRes.classes?.length === 0) {
    console.log('No classes found, creating new classes');
    createWeaviateClasses();
} else if (!classExists) {
    console.log(`No class ${className} found, creating new class`);
    createWeaviateClasses();
}

/* Create a class */
async function createWeaviateClasses() {
    const schemaConfig = {
        class: className,
        vectorizer: 'multi2vec-clip',
        vectorIndexType: 'hnsw',
        moduleConfig: {
            /* https://weaviate.github.io/typescript-client/types/Multi2VecClipConfig.html (v2) */
            'multi2vec-clip': {
                imageFields: [
                    'image',
                ],
                textFields: [
                    'name',
                    'shotname',
                    'description',
                ],
                weights: {
                    imageFields: [0.9],
                    textFields: [0.1, 0.1, 0.1],
                }
            }
        },
        properties: [
            {
                'name': 'image',
                'dataType': ['blob']
            },
            {
                'name': 'name',
                'dataType': ['string']
            },
            {
                'name': 'shortname',
                'dataType': ['string']
            },
            {
                'name': 'description',
                'dataType': ['string']
            },
        ]
    }

    const newClass = await client.schema
        .classCreator()
        .withClass(schemaConfig)
        .do();

    console.log('New class created:', newClass);
}
