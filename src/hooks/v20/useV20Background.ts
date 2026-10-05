import { createBgSettingsStore } from "@/hooks/themeBackground/createBgSettingsStore";

export const v20BgStore = createBgSettingsStore("bpim2-v20-bg");
export const useV20BgSettings = v20BgStore.useSettings;
