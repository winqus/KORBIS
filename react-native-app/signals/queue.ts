import { computed, signal } from "@preact/signals-react";
import { Item, IVirtualAsset } from "../types";
import { getPictureBase64FromLocalUri, randomUUIDv4 } from "@/lib/utils";
import { createItem, generateItemMetadataFromPicture } from "@/lib/supabase";

export type AutoCreateItemPayload = {
  candidate: Partial<Item>;
  imageUri: string;
  parent?: Pick<IVirtualAsset, "type" | "id">;
};

export type AutoCreateItemsPayload = AutoCreateItemPayload[];

export type Job<T> = T & {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
};

export const jobQueue = signal<Job<AutoCreateItemPayload>[]>([]);
export const failedJobs = signal<Job<AutoCreateItemPayload>[]>([]);
export const completedJobs = signal<Job<AutoCreateItemPayload>[]>([]);

export const isProcessing = signal(false);

export const pendingJobsCount = computed(() => jobQueue.value.length);
export const failedJobsCount = computed(() => failedJobs.value.length);

export function enqueueJobs(jobs: AutoCreateItemsPayload) {
  jobs.forEach((job) => {
    enqueueJob(job);
  });
}

export function enqueueJob(job: AutoCreateItemPayload) {
  const newJob: Job<AutoCreateItemPayload> = {
    ...job,
    id: randomUUIDv4().split("-")[0],
    status: "pending",
  };

  jobQueue.value = [...jobQueue.value, newJob];
  processQueue();

  console.log("Job queued:", newJob.id);
}

function updateJobStatus(job: Job<unknown>, status: Job<unknown>["status"]) {
  jobQueue.value = jobQueue.value.map((j) =>
    j === job ? { ...j, status } : j,
  );

  console.log(`Job ${job.id} status updated to:`, status);
}

export function clearCompletedAutoQueueJobs() {
  completedJobs.value = [];
}

async function processQueue() {
  if (isProcessing.value || jobQueue.value.length === 0) return;

  isProcessing.value = true;

  while (jobQueue.value.length > 0) {
    const job = jobQueue.value[0];
    try {
      updateJobStatus(job, "processing");
      const { candidate, imageUri, parent } = job;

      const imageBase64 = await getPictureBase64FromLocalUri(imageUri);
      if (!imageBase64) {
        throw new Error(`No picture base64 for image uri ${imageUri}`);
      }

      const generatedMetadata = await generateItemMetadataFromPicture({
        pictureBase64: imageBase64,
      });

      if (!generatedMetadata) {
        throw new Error(`Failed to generate data for ${imageUri}`);
      }

      const newItem = await createItem({
        name: generatedMetadata.item_name,
        description: generatedMetadata.description,
        pictureBase64: imageBase64,
        quantity: candidate.quantity,
        parent,
      });

      if (!newItem) {
        throw new Error(`Failed to create item`);
      }

      (job as any).candidate = {
        ...job.candidate,
        ...newItem,
        type: newItem.type,
      };
      updateJobStatus(job, "completed");
      completedJobs.value = [...completedJobs.value, job];
    } catch (e) {
      updateJobStatus(job, "failed");
      console.error(`Failed job ${job.id} error:`, e);
      failedJobs.value = [...failedJobs.value, job];
    } finally {
      jobQueue.value = jobQueue.value.slice(1);
    }
  }

  isProcessing.value = false;
}
