import { createBgSettingsStore } from "@/hooks/themeBackground/createBgSettingsStore";

export const v34BgStore = createBgSettingsStore("bpim2-v34-bg");
export const useV34BgSettings = v34BgStore.useSettings;
