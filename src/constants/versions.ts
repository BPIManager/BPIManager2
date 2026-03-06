import { createListCollection } from "@chakra-ui/react/collection";

export const versionTitles: {
  num: string;
  title: string;
  default?: boolean;
  disabled?: boolean;
}[] = [
  { num: "26", title: "26 Rootage", disabled: true },
  { num: "27", title: "27 HEROIC VERSE", disabled: true },
  { num: "28", title: "28 BISTROVER", disabled: true },
  { num: "29", title: "29 CastHour", disabled: true },
  { num: "30", title: "30 RESIDENT", disabled: true },
  { num: "31", title: "31 EPOLIS", disabled: true },
  { num: "32", title: "32 Pinky Crush", disabled: true },
  { num: "33", title: "33 Sparkle Shower", default: true },
];

export const versionsCollection = createListCollection({
  items: versionTitles.map((v) => ({
    label: v.title,
    value: v.num,
    disabled: v.disabled,
  })),
});
