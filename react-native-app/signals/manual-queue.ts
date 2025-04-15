import { computed, signal } from "@preact/signals-react";
import { getPictureBase64FromLocalUri, randomUUIDv4 } from "../lib/utils";
import { createItem } from "../lib/supabase";
import { AssetType } from "@/types";

export type ManualItemPayload = {
  name: string;
  description: string;
  quantity: number;
  imageUri: string;
  parentId?: string;
  parentType?: "root" | "container";
  parentName?: string;
};

export type ManualItemsPayload = ManualItemPayload[];

type Job<T> = T & {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
};

export const manualJobQueue = signal<Job<ManualItemPayload>[]>([]);
export const manualFailedJobs = signal<Job<ManualItemPayload>[]>([]);

export const isManualProcessing = signal(false);

export const pendingManualJobsCount = computed(
  () => manualJobQueue.value.length,
);
export const failedManualJobsCount = computed(
  () => manualFailedJobs.value.length,
);

export function enqueueManualJobs(jobs: ManualItemsPayload) {
  jobs.forEach((job) => {
    enqueueManualJob(job);
  });
}

export function enqueueManualJob(job: ManualItemPayload) {
  const newJob: Job<ManualItemPayload> = {
    ...job,
    id: randomUUIDv4().split("-")[0],
    status: "pending",
  };

  manualJobQueue.value = [...manualJobQueue.value, newJob];
  processManualQueue();

  console.log("Manual job queued:", newJob.id);
}

function updateManualJobStatus(
  job: Job<unknown>,
  status: Job<unknown>["status"],
) {
  manualJobQueue.value = manualJobQueue.value.map((j) =>
    j.id === job.id ? { ...j, status } : j,
  );

  console.log(`Manual job ${job.id} status updated to:`, status);
}

async function processManualQueue() {
  if (isManualProcessing.value || manualJobQueue.value.length === 0) return;

  isManualProcessing.value = true;

  while (manualJobQueue.value.length > 0) {
    const job = manualJobQueue.value[0];
    try {
      updateManualJobStatus(job, "processing");

      const imageBase64 = await getPictureBase64FromLocalUri(job.imageUri);
      if (!imageBase64) {
        throw new Error(`No picture base64 for image uri ${job.imageUri}`);
      }

      const newItem = await createItem({
        name: job.name,
        description: job.description,
        pictureBase64: imageBase64,
        quantity: job.quantity,
        parent:
          job.parentId && job.parentType
            ? {
                id: job.parentId,
                type: job.parentType as AssetType,
              }
            : undefined,
      });

      if (!newItem) {
        throw new Error(`Failed to create item`);
      }

      updateManualJobStatus(job, "completed");
    } catch (e) {
      updateManualJobStatus(job, "failed");
      console.error(`Failed manual job ${job.id} error:`, e);
      manualFailedJobs.value = [...manualFailedJobs.value, job];
    } finally {
      manualJobQueue.value = manualJobQueue.value.slice(1); // remove the processed job
    }
  }

  isManualProcessing.value = false;
}
