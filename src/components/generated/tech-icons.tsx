"use client";

// Brand logos for the tech stack shown on project / experience blocks. Uses
// simple-icons (SVG path + brand hex). Names from the AI / resume are free text
// ("Node.js", "postgres", "Tailwind CSS"), so we normalize and alias them. When
// a logo isn't found the caller falls back to a generic glyph — nothing breaks.

import {
  siAngular,
  siApachekafka,
  siBootstrap,
  siC,
  siCloudflare,
  siCplusplus,
  siDart,
  siDjango,
  siDocker,
  siDotnet,
  siElasticsearch,
  siElixir,
  siExpress,
  siFastapi,
  siFigma,
  siFirebase,
  siFlask,
  siFlutter,
  siGit,
  siGithub,
  siGitlab,
  siGo,
  siGooglecloud,
  siGraphql,
  siHtml5,
  siJavascript,
  siJest,
  siJira,
  siJquery,
  siKotlin,
  siKubernetes,
  siLaravel,
  siLinux,
  siMongodb,
  siMysql,
  siNestjs,
  siNextdotjs,
  siNginx,
  siNodedotjs,
  siOpenjdk,
  siPhp,
  siPostgresql,
  siPrisma,
  siPython,
  siPytorch,
  siReact,
  siRedis,
  siRedux,
  siRuby,
  siRubyonrails,
  siRust,
  siSass,
  siScala,
  siSharp,
  siSpring,
  siSqlite,
  siStripe,
  siSupabase,
  siSvelte,
  siSwift,
  siTailwindcss,
  siTensorflow,
  siTerraform,
  siTypescript,
  siVercel,
  siVite,
  siVuedotjs,
  siWebpack,
} from "simple-icons";

export interface SimpleIcon {
  title: string;
  hex: string; // brand color, e.g. "61DAFB"
  path: string; // single-path SVG (viewBox 0 0 24 24)
}

const REGISTRY: Record<string, SimpleIcon> = {};

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function reg(icon: SimpleIcon, ...aliases: string[]) {
  for (const a of aliases) REGISTRY[norm(a)] = icon;
}

// Languages
reg(siJavascript, "javascript", "js");
reg(siTypescript, "typescript", "ts");
reg(siPython, "python", "py");
reg(siGo, "go", "golang");
reg(siRust, "rust");
reg(siRuby, "ruby");
reg(siPhp, "php");
reg(siCplusplus, "c++", "cpp", "cplusplus");
reg(siC, "c");
reg(siSharp, "c#", "csharp");
reg(siKotlin, "kotlin");
reg(siSwift, "swift");
reg(siDart, "dart");
reg(siScala, "scala");
reg(siElixir, "elixir");
reg(siOpenjdk, "java", "jvm", "openjdk");
// Frontend
reg(siReact, "react", "reactjs", "reactnative");
reg(siNextdotjs, "next", "nextjs");
reg(siVuedotjs, "vue", "vuejs");
reg(siAngular, "angular", "angularjs");
reg(siSvelte, "svelte", "sveltekit");
reg(siTailwindcss, "tailwind", "tailwindcss");
reg(siRedux, "redux");
reg(siHtml5, "html", "html5");
reg(siBootstrap, "bootstrap");
reg(siSass, "sass", "scss");
reg(siJquery, "jquery");
reg(siVite, "vite");
reg(siWebpack, "webpack");
reg(siJest, "jest");
reg(siFigma, "figma");
// Backend
reg(siNodedotjs, "node", "nodejs");
reg(siExpress, "express", "expressjs");
reg(siNestjs, "nest", "nestjs");
reg(siDjango, "django");
reg(siFlask, "flask");
reg(siFastapi, "fastapi");
reg(siSpring, "spring", "springboot");
reg(siRubyonrails, "rails", "rubyonrails", "ror");
reg(siLaravel, "laravel");
reg(siGraphql, "graphql");
// Data
reg(siPostgresql, "postgres", "postgresql", "psql");
reg(siMysql, "mysql");
reg(siMongodb, "mongo", "mongodb");
reg(siRedis, "redis");
reg(siSqlite, "sqlite");
reg(siFirebase, "firebase");
reg(siSupabase, "supabase");
reg(siPrisma, "prisma");
reg(siElasticsearch, "elasticsearch", "elastic");
reg(siApachekafka, "kafka");
// Cloud / DevOps / Tools
reg(siDocker, "docker");
reg(siKubernetes, "kubernetes", "k8s");
reg(siGooglecloud, "gcp", "googlecloud");
reg(siVercel, "vercel");
reg(siTerraform, "terraform");
reg(siCloudflare, "cloudflare");
reg(siGithub, "github");
reg(siGitlab, "gitlab");
reg(siGit, "git");
reg(siLinux, "linux");
reg(siNginx, "nginx");
reg(siStripe, "stripe");
reg(siDotnet, "dotnet", ".net", "net");
// ML
reg(siTensorflow, "tensorflow");
reg(siPytorch, "pytorch", "torch");
reg(siFlutter, "flutter");
reg(siJira, "jira");

export function lookupTech(label: string): SimpleIcon | null {
  return REGISTRY[norm(label)] ?? null;
}

// Renders the brand logo as an SVG. Defaults to currentColor; pass `brand` to
// paint it in the brand color (best on a light/frosted tile so dark logos like
// Next.js / GitHub stay visible in dark mode).
export function TechLogo({
  icon,
  className,
  brand = false,
}: {
  icon: SimpleIcon;
  className?: string;
  brand?: boolean;
}) {
  return (
    <svg
      role="img"
      aria-label={icon.title}
      viewBox="0 0 24 24"
      className={className}
      fill={brand ? `#${icon.hex}` : "currentColor"}
    >
      <title>{icon.title}</title>
      <path d={icon.path} />
    </svg>
  );
}
