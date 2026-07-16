"use client";

import { SiteBuilderWizard } from "@/components/generator/SiteBuilderWizard";
import type { GeneratorInput } from "@/lib/types";

/** Interactive 3-step site builder — wraps SiteBuilderWizard for Studio. */
export function BuilderForm({
  onGenerate,
  generating,
  error,
  initialValues,
  aiAvailable = false,
  editMode = false,
  initialStep = 1,
}: {
  onGenerate: (input: GeneratorInput) => void;
  generating: boolean;
  error: string | null;
  initialValues?: Partial<GeneratorInput>;
  aiAvailable?: boolean;
  editMode?: boolean;
  initialStep?: 1 | 2 | 3;
}) {
  return (
    <SiteBuilderWizard
      onGenerate={onGenerate}
      generating={generating}
      error={error}
      initialValues={initialValues}
      aiAvailable={aiAvailable}
      editMode={editMode}
      initialStep={initialStep}
    />
  );
}
