import type { GeneratorInput, SiteData } from "@/lib/types";

/**
 * After regen on edit, keep layout/structure fields the form does not control.
 * Visual kit changes from the wizard are applied when the user picked one.
 */
export function mergeSiteOnUpdate(
  existing: SiteData,
  generated: SiteData,
  input: GeneratorInput
): SiteData {
  return {
    ...generated,
    heroLayout: existing.heroLayout,
    design: input.visualKit ? generated.design : existing.design,
    sections: existing.sections,
    sectionLabels: existing.sectionLabels,
    gallery: existing.gallery?.length ? existing.gallery : generated.gallery,
    menu: existing.menu ?? generated.menu,
    faq: existing.faq ?? generated.faq,
    storeHours: existing.storeHours ?? generated.storeHours,
    mapEmbedUrl: existing.mapEmbedUrl ?? generated.mapEmbedUrl,
    mapsUrl: existing.mapsUrl ?? generated.mapsUrl,
    booking: existing.booking ?? generated.booking,
  };
}
