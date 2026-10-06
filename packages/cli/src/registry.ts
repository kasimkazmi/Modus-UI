export interface CatalogueEntry {
  name: string;
  title: string;
  category: string;
  description: string;
  dependencies: string[];
}

export interface Catalogue {
  name: string;
  homepage: string;
  count: number;
  categories: string[];
  components: CatalogueEntry[];
}

export interface RegistryComponent {
  name: string;
  title: string;
  category: string;
  type: string;
  dependencies: string[];
  files: { path: string; content: string }[];
}

export const DEFAULT_REGISTRY_URL = "https://modusui.kasimkazmi.com";

export function registryUrl(): string {
  return (process.env.MODUS_UI_URL || DEFAULT_REGISTRY_URL).replace(/\/+$/, "");
}

async function getJson<T>(path: string): Promise<T> {
  const url = `${registryUrl()}/registry/${path}`;
  let res: Response;
  try {
    res = await fetch(url);
  } catch (error) {
    throw new Error(`Could not reach ${url}: ${(error as Error).message}`);
  }
  if (!res.ok) throw new Error(`Request to ${url} failed with ${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

export function fetchCatalogue(): Promise<Catalogue> {
  return getJson<Catalogue>("index.json");
}

export function fetchComponent(name: string): Promise<RegistryComponent> {
  return getJson<RegistryComponent>(`${encodeURIComponent(name)}.json`);
}
