export function AuroraBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-[#f3f3ef] dark:bg-[#0d0f0d]">
      <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(to_right,rgba(17,19,15,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(17,19,15,0.035)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_78%)] dark:opacity-20" />
      <div className="absolute left-1/2 top-[-12rem] size-[38rem] -translate-x-1/2 rounded-full bg-[#9cc2b3]/18 blur-[110px] dark:bg-[#214f43]/20" />
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#f3f3ef] via-[#f3f3ef]/80 to-transparent dark:from-[#0d0f0d] dark:via-[#0d0f0d]/80" />
    </div>
  );
}
