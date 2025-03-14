import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
// @ts-types="npm:@types/express"
import express from "npm:express@4.21.2";
import {
  BaseResponse,
  getJson,
} from "https://deno.land/x/serpapi@2.1.0/mod.ts";
import { GoogleGenerativeAI, SchemaType } from "npm:@google/generative-ai";
import {
  correctLocalPublicUrl,
  isLocalEnv,
  throwIfMissing,
} from "../_shared/utils.ts";
import serapiExampleResponse from "../_shared/data/serapiResponse_5AgUKUF.json" with {
  type: "json",
};
import geminiExampleResponse1 from "../_shared/data/geminiResponse1_5AgUKUF.json" with {
  type: "json",
};
import { isStorageError } from "npm:@supabase/storage-js@2.7.1";

throwIfMissing("env variables", Deno.env.toObject(), [
  "USE_SERPAPI",
  "SERPAPI_KEY",
  "USE_TEST_IMAGE",
  "TEST_IMAGE_URL",
  "USE_GEMINI",
  "GEMINI_API_KEY",
  "GEMINI_MODEL",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
]);

const app = express();
const port = 8000;
app.use(express.json());


function getPublicImageUrl(picturePath: string): string {
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_KEY") ?? "",
  );

  const { data } = supabaseClient
    .storage
    .from("public-bucket")
    .getPublicUrl(picturePath);

  if (isLocalEnv()) {
    data.publicUrl = correctLocalPublicUrl(data.publicUrl);
  }

  const useTestImage = Deno.env.get("USE_TEST_IMAGE") === "true" &&
    Deno.env.has("TEST_IMAGE_URL");
  const testImageUrl = Deno.env.get("TEST_IMAGE_URL")!;
  if (useTestImage) {
    console.log(`USING EXAMPLE PUBLIC TEST IMAGE, URL: ${testImageUrl}`);
    data.publicUrl = testImageUrl;
  }

  return data.publicUrl;
}

async function deletePublicImage(picturePath: string) {
  const supabaseAdminClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_KEY") ?? "",
  );

  const { error} = await supabaseAdminClient.storage.from("public-bucket").remove([picturePath]);
  if (isStorageError(error)) {
    console.error(`Failed to delete image ${picturePath} from public bucket: ${error.message}`);
  }
}

interface VisualMatch {
  position: number;
  title: string;
  link: string;
  source: string;
  thumbnail: string;
}

function mapSerpapiResponseToMatches(response: BaseResponse): VisualMatch[] {
  if (!response.visual_matches) {
    console.error("No visual matches found in response");
    return [];
  }

  const matches: VisualMatch[] = response.visual_matches?.slice(
    0,
    Math.min(10, response.visual_matches.length),
  ).map((match: any) => ({
    position: match.position,
    title: match.title,
    link: match.link,
    source: match.source,
    thumbnail: match.thumbnail,
  }));

  return matches ?? [];
}

async function findVisualMatches(picturePublicUrl: string): Promise<VisualMatch[] | null> {
  let matches: VisualMatch[] = [];
  if (Deno.env.get("USE_SERPAPI") !== "true") {
    console.log(`USING EXAMPLE SERPAPI RESPONSE FOR IMAGE ${picturePublicUrl}`);
    const response = serapiExampleResponse;
    matches = mapSerpapiResponseToMatches(response);

    return matches;
  }

  try {
    console.log(`Using SerpApi for image ${picturePublicUrl}`);

    const response = await getJson({
      engine: "google_lens",
      api_key: Deno.env.get("SERPAPI_KEY"),
      url: picturePublicUrl,
    });

    matches = mapSerpapiResponseToMatches(response);
    return matches;
  } catch (error) {
    console.error(`Error fetching metadata from SerpApi,`, error);
    return null;
  }
}

interface ItemMetadata {
  item_name: string;
  shorthand: string;
  description: string;
}

async function generateItemDataForVisualMatches(
  matches: VisualMatch[],
  additionalUserProvidedInfo?: string,
): Promise<ItemMetadata | null> {
  try {
    if (Deno.env.get("USE_GEMINI") !== "true") {
      console.log("USING EXAMPLE GEMINI RESPONSE FOR VISUAL MATCHES");
      return geminiExampleResponse1;
    }

    const genAI = new GoogleGenerativeAI(Deno.env.get("GEMINI_API_KEY")!);
    const modelName = Deno.env.get("GEMINI_MODEL") ?? "gemini-2.0-flash-lite";
    // https://ai.google.dev/gemini-api/docs/structured-output?lang=node
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 2,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 100,
        responseMimeType: "application/json",
        candidateCount: 1,
        responseSchema: {
          description: "Item metadata",
          type: SchemaType.OBJECT,
          properties: {
            item_name: {
              type: SchemaType.STRING,
              description: "Few worded title of the item",
              nullable: false,
            },
            shorthand: {
              type: SchemaType.STRING,
              description: "ONE word long name of the item",
              nullable: false,
            },
            description: {
              type: SchemaType.STRING,
              description:
                "BRIEF descriptive name of the item. For quick understanding",
              nullable: false,
            },
          },
          required: ["item_name", "shorthand", "description"],
        },
      },
    });
    const summarizationSystemPrompt =
      `Based on these reverse object image search results, determine whether the object(s) represent a specific concrete product, a general object, or a batch/group of similar objects. Answer in the format: {"item_name": "<put the name here, based on whether it is a concrete product, a general object, or a batch/group>, write it like in product listing style"}`;

    let matchesJson = JSON.stringify(matches, null, 1);
    if (matchesJson.length > 5_000) {
      console.warn(
        `Matches json length (${matchesJson.length}) exceeds 10,000 characters, truncating`,
      );
      matchesJson = matchesJson.slice(0, 5_000);
    }
    console.log("Matches json length: ", matchesJson.length);
    const userAdditionalInfoSystemPrompt =
      `User provided additional information to refine the item_name: "${additionalUserProvidedInfo}"`;

    let prompt = "";
    prompt += summarizationSystemPrompt + "\n";
    prompt += matchesJson + "\n";
    if (additionalUserProvidedInfo) {
      prompt += userAdditionalInfoSystemPrompt + "\n";
    }

    const result = await model.generateContent(prompt);

    const object: ItemMetadata = JSON.parse(result.response.text());
    throwIfMissing("item metadata", object, [
      "item_name",
      "shorthand",
      "description",
    ]);

    return object;
  } catch (error) {
    console.error("Error generating metadata for visual matches, ", error);
    return null;
  }
}

app.post("/generator/picture-to-item-metadata", async (req, res) => {
  const { picturePath } = req.body;
  if (!picturePath) {
    return res.status(400).send("Missing 'picturePath' in request body");
  }

  // get image public url
  let publicUrl;
  try {
    publicUrl = getPublicImageUrl(picturePath);
  } catch (error) {
    console.error(`Failed to get public url for image ${picturePath},`, error);
  }
  if (!publicUrl) {
    return res.status(500).send("Failed to find image");
  }

  // send url to gvision client (serpapi) to get metadata
  const matches = await findVisualMatches(publicUrl);
  if (matches == null) {
    return res.status(500).send(
      "Failed to find metadata for provided image due to service error",
    );
  } else if (matches.length === 0) {
    return res.status(404).send("No metadata found for provided image");
  }

  deletePublicImage(picturePath);

  // send metadata to gemini api to create item metadata
  const generatedMetadata = await generateItemDataForVisualMatches(matches);
  if (generatedMetadata == null) {
    return res.status(500).send(
      "Failed to generate item metadata for provided image due to service error",
    );
  }

  res.json(generatedMetadata);
});

app.listen(port, (error) => {
  if (error) {
    return console.error(`Error listening: ${error}`);
  }
});
/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/generator/picture-to-item-metadata' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"picturePath":"test.jpg"}'

*/
