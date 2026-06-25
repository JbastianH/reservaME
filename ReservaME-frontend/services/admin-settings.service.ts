import { apiGet, apiPatch } from "@/lib/api";

export type AdminSettings = {
  id: string;
  tenantId: string;
  reminderHoursBefore: number;
  cancellationHoursBefore: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminSettingsResponse = {
  ok: true;
  settings: AdminSettings;
};

export type UpdateAdminSettingsPayload = {
  reminderHoursBefore: number;
  cancellationHoursBefore: number;
};

export function getAdminSettings() {
  return apiGet<AdminSettingsResponse>("/admin/settings");
}

export function updateAdminSettings(payload: UpdateAdminSettingsPayload) {
  return apiPatch<AdminSettingsResponse>("/admin/settings", payload);
}
