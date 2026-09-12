import { REGION_OPTIONS as BASE_REGION_OPTIONS, type RegionProvider } from "@/regions";

export const REGION_OPTIONS: Record<string, RegionProvider> = {
  ...BASE_REGION_OPTIONS,
  azure: {
  label: "Azure",
  groups: {
    Americas: [
      { value: "eastus", label: "East US" },
      { value: "eastus2", label: "East US 2" },
      { value: "westus", label: "West US" },
      { value: "westus2", label: "West US 2" },
      { value: "westus3", label: "West US 3" },
      { value: "centralus", label: "Central US" },
      { value: "northcentralus", label: "North Central US" },
      { value: "southcentralus", label: "South Central US" },
      { value: "canadacentral", label: "Canada Central" },
      { value: "canadaeast", label: "Canada East" }
    ],
    Europe: [
      { value: "northeurope", label: "North Europe" },
      { value: "westeurope", label: "West Europe" },
      { value: "uksouth", label: "UK South" },
      { value: "ukwest", label: "UK West" },
      { value: "francecentral", label: "France Central" },
      { value: "francesouth", label: "France South" },
      { value: "germanynorth", label: "Germany North" },
      { value: "germanywestcentral", label: "Germany West Central" },
      { value: "switzerlandnorth", label: "Switzerland North" },
      { value: "switzerlandwest", label: "Switzerland West" },
      { value: "norwayeast", label: "Norway East" },
      { value: "norwaywest", label: "Norway West" },
      { value: "swedencentral", label: "Sweden Central" },
      { value: "swedensouth", label: "Sweden South" },
      { value: "italynorth", label: "Italy North" },
      { value: "spaincentral", label: "Spain Central" },
      { value: "polandcentral", label: "Poland Central" }
    ],
    AsiaPacific: [
      { value: "southeastasia", label: "Southeast Asia" },
      { value: "eastasia", label: "East Asia" },
      { value: "japaneast", label: "Japan East" },
      { value: "japanwest", label: "Japan West" },
      { value: "koreacentral", label: "Korea Central" },
      { value: "koreasouth", label: "Korea South" },
      { value: "indiacentral", label: "India Central" },
      { value: "indiasouth", label: "India South" },
      { value: "indiawest", label: "India West" },
      { value: "australiaeast", label: "Australia East" },
      { value: "australiasoutheast", label: "Australia Southeast" },
      { value: "australiacentral", label: "Australia Central" },
      { value: "australiacentral2", label: "Australia Central 2" }
    ],
    MiddleEastAfrica: [
      { value: "southafricanorth", label: "South Africa North" },
      { value: "southafricawest", label: "South Africa West" },
      { value: "uaenorth", label: "UAE North" },
      { value: "uaecentral", label: "UAE Central" },
      { value: "qatarcentral", label: "Qatar Central" },
      { value: "israelcentral", label: "Israel Central" }
    ]
  }
  },
  gcp: {
  label: "Google Cloud",
  groups: {
    Americas: [
      { value: "us-central1", label: "US Central 1" },
      { value: "us-east1", label: "US East 1" },
      { value: "us-east4", label: "US East 4" },
      { value: "us-west1", label: "US West 1" },
      { value: "us-west2", label: "US West 2" },
      { value: "us-west3", label: "US West 3" },
      { value: "us-west4", label: "US West 4" },
      { value: "northamerica-northeast1", label: "Canada NE 1" },
      { value: "northamerica-northeast2", label: "Canada NE 2" },
      { value: "southamerica-east1", label: "South America East 1" },
      { value: "southamerica-west1", label: "South America West 1" }
    ],
    Europe: [
      { value: "europe-west1", label: "Europe West 1" },
      { value: "europe-west2", label: "Europe West 2" },
      { value: "europe-west3", label: "Europe West 3" },
      { value: "europe-west4", label: "Europe West 4" },
      { value: "europe-west6", label: "Europe West 6" },
      { value: "europe-central2", label: "Europe Central 2" },
      { value: "europe-north1", label: "Europe North 1" }
    ],
    AsiaPacific: [
      { value: "asia-east1", label: "Asia East 1" },
      { value: "asia-east2", label: "Asia East 2" },
      { value: "asia-northeast1", label: "Asia Northeast 1" },
      { value: "asia-northeast2", label: "Asia Northeast 2" },
      { value: "asia-northeast3", label: "Asia Northeast 3" },
      { value: "asia-south1", label: "Asia South 1" },
      { value: "asia-south2", label: "Asia South 2" },
      { value: "asia-southeast1", label: "Asia Southeast 1" },
      { value: "asia-southeast2", label: "Asia Southeast 2" },
      { value: "australia-southeast1", label: "Australia Southeast 1" },
      { value: "australia-southeast2", label: "Australia Southeast 2" }
    ],
    MiddleEastAfrica: [
      { value: "me-central1", label: "Middle East Central 1" },
      { value: "me-west1", label: "Middle East West 1" }
    ]
  }
  },
};
