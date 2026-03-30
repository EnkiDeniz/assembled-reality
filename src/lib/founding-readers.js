import { slugify } from "@/lib/text";

export const FOUNDING_READER_NAMES = [
  "Deniz",
  "Kerem",
  "Melih",
  "Bahadir",
  "Cumali",
  "Aziz",
  "Diba",
];

export const SEVEN_READER = {
  slug: "seven",
  displayName: "Seven",
};

const FOUNDING_SLUGS = new Set(FOUNDING_READER_NAMES.map((name) => slugify(name)));

export function isFoundingReaderName(value) {
  return FOUNDING_SLUGS.has(slugify(value || ""));
}
