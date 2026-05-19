import { apiGet, apiPatch } from "@/lib/api";

export type AdminSettings = {
  reminderHoursBefore: number;
};

export type AdminSettingsResponse = {
  ok: true;
  settings: AdminSettings;
};

export function getAdminSettings() {
  return apiGet<AdminSettingsResponse>("/admin/settings");
}

export function updateReminderHoursBefore(reminderHoursBefore: number) {
  return apiPatch<AdminSettingsResponse>("/admin/settings", { reminderHoursBefore });
}