export const STOP_STATUSES = ["pending", "in_progress", "delivered"] as const;
export const PROOF_UPLOAD_STATES = [
  "none",
  "pending",
  "uploaded",
  "failed",
] as const;

export type StopStatus = (typeof STOP_STATUSES)[number];
export type ProofUploadState = (typeof PROOF_UPLOAD_STATES)[number];

export interface DeliveryStop {
  id: string;
  routeId: string;
  sequence: number;
  customerName: string;
  address: string;
  latitude: number;
  longitude: number;
  status: StopStatus | string;
  deliveredAt?: string | null;
  proofImagePath?: string | null;
  proofUploadState: ProofUploadState | string;
}
