/** Quiet product backdrop shared by pricing, about, and dashboard pages. */
export function MarketingBackdrop({ intensity = "soft" }: { intensity?: "soft" | "full" }) {
  const strong = intensity === "full";

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-[#f3f3ef] dark:bg-[#0d0f0d]">
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgba(17,19,15,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(17,19,15,0.035)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_84%)] dark:opacity-20" />
      <div
        className={
          strong
            ? "absolute left-1/2 top-[-18rem] size-[48rem] -translate-x-1/2 rounded-full bg-[#9cc2b3]/22 blur-[120px] dark:bg-[#214f43]/25"
            : "absolute left-1/2 top-[-14rem] size-[38rem] -translate-x-1/2 rounded-full bg-[#9cc2b3]/16 blur-[110px] dark:bg-[#214f43]/18"
        }
      />
    </div>
  );
}
