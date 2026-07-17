import Script from "next/script";
import { publicEnv } from "@/platform/config/public-env";

const projectId = publicEnv.clarityProjectId;

/**
 * Minimal Clarity bootstrap: loads after the page is idle so it
 * does not compete with LCP / interactivity. No custom events.
 */
export function MicrosoftClarity() {
  if (!projectId || publicEnv.nodeEnv !== "production") {
    return null;
  }

  return (
    <Script id="microsoft-clarity" strategy="lazyOnload">
      {`(function(c,l,a,r,i,t,y){
c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "${projectId}");`}
    </Script>
  );
}
