export const COUNTRIES = [
  { label: "United Kingdom", value: "uk" },
  { label: "Germany", value: "de" },
  { label: "France", value: "fr" },
  { label: "United States", value: "us" },
  { label: "Canada", value: "ca" },
  { label: "Singapore", value: "sg" },
  { label: "Japan", value: "jp" },
  { label: "Australia", value: "au" },
  { label: "Brazil", value: "br" },
  { label: "United Arab Emirates", value: "ae" },
] as const;

export const CITIES_BY_COUNTRY = {
  uk: ["London", "Manchester", "Birmingham"],
  de: ["Berlin", "Munich", "Hamburg"],
  fr: ["Paris", "Lyon", "Marseille"],
  us: ["New York", "San Francisco", "Seattle", "Austin"],
  ca: ["Toronto", "Vancouver", "Montreal"],
  sg: ["Singapore"],
  jp: ["Tokyo", "Osaka"],
  au: ["Sydney", "Melbourne"],
  br: ["Sao Paulo", "Rio de Janeiro"],
  ae: ["Dubai", "Abu Dhabi"],
} as const;

export const CLOUD_PROVIDERS = [
  { label: "AWS", value: "aws" },
  { label: "Azure", value: "azure" },
  { label: "Google Cloud", value: "gcp" },
] as const;

export const REGIONS_BY_COUNTRY = {
  uk: { aws: ["eu-west-2"], azure: ["uksouth", "ukwest"], gcp: ["europe-west2"] },
  de: { aws: ["eu-central-1"], azure: ["germanywestcentral"], gcp: ["europe-west3"] },
  fr: { aws: ["eu-west-3"], azure: ["francecentral"], gcp: ["europe-west9"] },
  us: { aws: ["us-east-1", "us-west-1", "us-west-2"], azure: ["eastus", "westus", "centralus"], gcp: ["us-central1", "us-east1", "us-west1"] },
  ca: { aws: ["ca-central-1"], azure: ["canadacentral"], gcp: ["northamerica-northeast1"] },
  sg: { aws: ["ap-southeast-1"], azure: ["southeastasia"], gcp: ["asia-southeast1"] },
  jp: { aws: ["ap-northeast-1"], azure: ["japaneast", "japanwest"], gcp: ["asia-northeast1"] },
  au: { aws: ["ap-southeast-2"], azure: ["australiaeast", "australiasoutheast"], gcp: ["australia-southeast1"] },
  br: { aws: ["sa-east-1"], azure: ["brazilsouth"], gcp: ["southamerica-east1"] },
  ae: { aws: ["me-central-1"], azure: ["uaenorth"], gcp: ["me-central1"] },
} as const;

export type SignupCountry = keyof typeof CITIES_BY_COUNTRY;
export type SignupProvider = (typeof CLOUD_PROVIDERS)[number]["value"];
