// ============================================================
// Background Job Queue — Async task processing
// In-memory queue with concurrency control
// (Replace with BullMQ/Redis in production)
// ============================================================

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export type JobType =
  | 'fingerprint_compute'
  | 'probe_suite_run'
  | 'batch_embedding'
  | 'diff_compute'
  | 'root_cause_analysis'
  | 'alert_dispatch'
  | 'compliance_check'
  | 'data_export';

export interface Job<T = any> {
  id: string;
  type: JobType;
  status: JobStatus;
  progress: number;           // 0-100
  data: T;
  result?: any;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  retryCount: number;
  maxRetries: number;
}

export interface QueueOptions {
  /** Max concurrent jobs (default: 3) */
  concurrency?: number;
  /** Max retries on failure (default: 2) */
  maxRetries?: number;
  /** Job timeout in ms (default: 5 minutes) */
  timeoutMs?: number;
}

type JobHandler<T = any> = (job: Job<T>, updateProgress: (pct: number) => void) => Promise<any>;

const jobs = new Map<string, Job>();
const handlers = new Map<JobType, JobHandler>();
const queue: string[] = [];
let running = 0;

const DEFAULT_CONCURRENCY = 3;
const DEFAULT_TIMEOUT = 300_000; // 5 minutes

let queueOptions: Required<QueueOptions> = {
  concurrency: DEFAULT_CONCURRENCY,
  maxRetries: 2,
  timeoutMs: DEFAULT_TIMEOUT,
};

/**
 * Configure queue options.
 */
export function configureQueue(options: QueueOptions): void {
  queueOptions = { ...queueOptions, ...options };
}

/**
 * Register a job handler for a type.
 */
export function registerHandler<T = any>(type: JobType, handler: JobHandler<T>): void {
  handlers.set(type, handler);
}

/**
 * Enqueue a job for background processing.
 */
export function enqueueJob<T = any>(type: JobType, data: T, id?: string): Job<T> {
  const jobId = id || `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const job: Job<T> = {
    id: jobId,
    type,
    status: 'pending',
    progress: 0,
    data,
    createdAt: new Date(),
    retryCount: 0,
    maxRetries: queueOptions.maxRetries,
  };

  jobs.set(jobId, job);
  queue.push(jobId);
  processQueue();

  return job;
}

/**
 * Get job status.
 */
export function getJob(jobId: string): Job | undefined {
  return jobs.get(jobId);
}

/**
 * List jobs with optional status filter.
 */
export function listJobs(options: { status?: JobStatus; type?: JobType; limit?: number } = {}): Job[] {
  let result = Array.from(jobs.values());

  if (options.status) result = result.filter(j => j.status === options.status);
  if (options.type) result = result.filter(j => j.type === options.type);

  result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  if (options.limit) result = result.slice(0, options.limit);

  return result;
}

/**
 * Cancel a pending job.
 */
export function cancelJob(jobId: string): boolean {
  const job = jobs.get(jobId);
  if (!job || job.status !== 'pending') return false;

  job.status = 'cancelled';
  const idx = queue.indexOf(jobId);
  if (idx !== -1) queue.splice(idx, 1);

  return true;
}

/**
 * Queue statistics.
 */
export function queueStats(): { pending: number; running: number; completed: number; failed: number; total: number } {
  const all = Array.from(jobs.values());
  return {
    pending: all.filter(j => j.status === 'pending').length,
    running: all.filter(j => j.status === 'running').length,
    completed: all.filter(j => j.status === 'completed').length,
    failed: all.filter(j => j.status === 'failed').length,
    total: all.length,
  };
}

// ── Internal queue processor ─────────────────────────────

async function processQueue(): Promise<void> {
  while (queue.length > 0 && running < queueOptions.concurrency) {
    const jobId = queue.shift();
    if (!jobId) break;

    const job = jobs.get(jobId);
    if (!job || job.status !== 'pending') continue;

    running++;
    executeJob(job).finally(() => {
      running--;
      processQueue();
    });
  }
}

async function executeJob(job: Job): Promise<void> {
  const handler = handlers.get(job.type);
  if (!handler) {
    job.status = 'failed';
    job.error = `No handler registered for job type: ${job.type}`;
    return;
  }

  job.status = 'running';
  job.startedAt = new Date();

  const updateProgress = (pct: number) => {
    job.progress = Math.min(100, Math.max(0, pct));
  };

  try {
    // Timeout wrapper
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Job timed out after ${queueOptions.timeoutMs}ms`)), queueOptions.timeoutMs);
    });

    const result = await Promise.race([handler(job, updateProgress), timeoutPromise]);

    job.status = 'completed';
    job.progress = 100;
    job.result = result;
    job.completedAt = new Date();
  } catch (error: any) {
    job.retryCount++;

    if (job.retryCount <= job.maxRetries) {
      // Retry
      job.status = 'pending';
      job.progress = 0;
      queue.push(job.id);
      console.warn(`Job ${job.id} failed (attempt ${job.retryCount}/${job.maxRetries}), retrying...`);
    } else {
      job.status = 'failed';
      job.error = error.message || 'Unknown error';
      job.completedAt = new Date();
      console.error(`Job ${job.id} failed permanently:`, error.message);
    }
  }
}

/**
 * Cleanup old completed/failed jobs.
 */
export function cleanupJobs(maxAgeMs: number = 3600000): number {
  const now = Date.now();
  let removed = 0;
  for (const [id, job] of jobs.entries()) {
    if ((job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') &&
        job.completedAt && (now - job.completedAt.getTime()) > maxAgeMs) {
      jobs.delete(id);
      removed++;
    }
  }
  return removed;
}
