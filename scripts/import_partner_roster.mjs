#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

for (const line of readFileSync(resolve(process.cwd(), ".env"), "utf8").split("\n")) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (!match) continue;
  let value = match[2].trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  process.env[match[1]] ??= value.trim();
}

const sourceDir = process.argv[2];
if (!sourceDir) throw new Error("Usage: node scripts/import_partner_roster.mjs <logo-directory>");

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function uploadWithRetry(storagePath, bytes) {
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const { error } = await supabase.storage
      .from("partner-logos")
      .upload(storagePath, bytes, {
        contentType: "image/png",
        upsert: true,
        cacheControl: "31536000",
      });
    if (!error) return;
    lastError = error;
    if (attempt < 4) await new Promise((resolveDelay) => setTimeout(resolveDelay, attempt * 750));
  }
  throw lastError;
}

const roster = [
  {
    slug: "2fas",
    name: "Future Farmers & Agricultural Specialists (2FAS)",
    file: "2fas.png",
    category: "University & Extension",
    short_description: "A Tuskegee University pathway connecting students with agriculture, food systems, mentoring, and professional development.",
    partnership_areas: ["Education", "Student development", "Agriculture", "Workforce development"],
    is_featured: true,
  },
  {
    slug: "annual-farmers-conference",
    name: "Annual Farmers Conference",
    file: "annual farmers conference.png",
    category: "University & Extension",
    short_description: "A longstanding Tuskegee gathering connecting farmers, Extension professionals, researchers, and rural communities.",
    partnership_areas: ["Extension", "Small farms", "Education", "Community development"],
    is_featured: false,
  },
  {
    slug: "tuskegee-university-caens",
    name: "Tuskegee University College of Agriculture, Environment and Nutrition Sciences",
    file: "CAENS.png",
    category: "University & Extension",
    short_description: "CISC’s academic home, advancing agriculture, environment, nutrition, teaching, research, and Extension.",
    partnership_areas: ["Research", "Education", "Extension", "Student development"],
    is_featured: true,
  },
  {
    slug: "cfsrpes",
    name: "CFSRPES",
    file: "CFSRPES.png",
    category: "Research",
    short_description: "A research and education partner supporting interdisciplinary work in food systems, rural prosperity, environment, and sustainability.",
    partnership_areas: ["Research", "Food systems", "Rural development", "Sustainability"],
    is_featured: false,
  },
  {
    slug: "carver-integrative-sustainability-center",
    name: "Carver Integrative Sustainability Center",
    file: "cisc.png",
    category: "Research",
    short_description: "Tuskegee University’s integrative center connecting research, education, Extension, and community-driven sustainability solutions.",
    partnership_areas: ["Research", "Extension", "Sustainability", "Community development"],
    is_featured: true,
  },
  {
    slug: "tuskegee-university-cooperative-extension",
    name: "Tuskegee University Cooperative Extension",
    file: "cooperative extension.png",
    category: "University & Extension",
    short_description: "Community-based education, technical assistance, and outreach serving farmers, families, youth, and communities.",
    partnership_areas: ["Extension", "Small farms", "Youth development", "Community education"],
    is_featured: true,
  },
  {
    slug: "eat-south",
    name: "EAT South",
    file: "eat south.png",
    category: "Community Organization",
    short_description: "A community food and education organization supporting healthy food access, learning, and local agriculture.",
    partnership_areas: ["Food access", "Community education", "Local agriculture", "Youth development"],
    is_featured: false,
  },
  {
    slug: "heart-of-alabama-food-bank",
    name: "Heart of Alabama Food Bank",
    file: "heart of alabama.png",
    category: "Community Organization",
    short_description: "A regional hunger-relief and food-access partner serving communities across central Alabama.",
    partnership_areas: ["Food access", "Community partnerships", "Food systems"],
    is_featured: true,
  },
  {
    slug: "macon-county-farmers-market",
    name: "Macon County Farmers Market",
    file: "macon county farmers market.png",
    category: "Community Organization",
    short_description: "A community market connecting Macon County growers, food producers, residents, and local food-system partners.",
    partnership_areas: ["Farmers markets", "Small farms", "Food access", "Local agriculture"],
    is_featured: true,
  },
  {
    slug: "south-central-alabama-broadband-cooperative-district",
    name: "South Central Alabama Broadband Cooperative District",
    file: "SCABCD.png",
    category: "Community Organization",
    short_description: "A regional broadband partner working to expand connectivity and reduce the digital divide across south central Alabama.",
    partnership_areas: ["Broadband", "Digital access", "Rural development", "Community infrastructure"],
    is_featured: false,
  },
  {
    slug: "summer-experience-internship",
    name: "Summer Experience Internship",
    file: "Summer experience.png",
    category: "University & Extension",
    short_description: "A Tuskegee student experience combining mentoring, applied learning, career exploration, and agricultural education.",
    partnership_areas: ["Student development", "Education", "Workforce development", "Youth development"],
    is_featured: false,
  },
  {
    slug: "tuskegee-university",
    name: "Tuskegee University",
    file: "tuskegee university.png",
    category: "University & Extension",
    short_description: "JESUP’s home institution and a historic land-grant university committed to education, research, service, and community impact.",
    partnership_areas: ["Education", "Research", "Extension", "Community service"],
    is_featured: true,
  },
  {
    slug: "usda",
    name: "United States Department of Agriculture",
    file: "USDA.png",
    category: "Federal Government",
    short_description: "A federal partner supporting agriculture, food systems, natural resources, rural development, and producer services.",
    partnership_areas: ["Small farms", "Natural resources", "Rural development", "Food systems"],
    is_featured: true,
  },
  {
    slug: "usda-national-institute-of-food-and-agriculture",
    name: "USDA National Institute of Food and Agriculture",
    file: "usda nifa.png",
    category: "Federal Government",
    short_description: "USDA’s extramural science agency investing in agricultural research, education, Extension, and workforce development.",
    partnership_areas: ["Research", "Education", "Extension", "Agriculture"],
    is_featured: true,
  },
  {
    slug: "wk-kellogg-foundation",
    name: "W.K. Kellogg Foundation",
    file: "WK Kellogg Foundation.png",
    category: "Foundation",
    short_description: "A philanthropic partner supporting children, families, equitable opportunity, and community-led change.",
    partnership_areas: ["Community development", "Families", "Equity", "Food systems"],
    is_featured: true,
  },
];

const rows = [];
for (const [index, partner] of roster.entries()) {
  const sourcePath = resolve(sourceDir, partner.file);
  const storagePath = `official-v2/${partner.slug}.png`;
  const bytes = await readFile(sourcePath);
  try {
    await uploadWithRetry(storagePath, bytes);
  } catch (uploadError) {
    throw new Error(`${basename(sourcePath)} upload failed: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from("partner-logos").getPublicUrl(storagePath);
  rows.push({
    slug: partner.slug,
    name: partner.name,
    category: partner.category,
    short_description: partner.short_description,
    description: partner.short_description,
    logo_url: data.publicUrl,
    partnership_areas: partner.partnership_areas,
    social_links: {},
    is_published: true,
    is_featured: partner.is_featured,
    sort_order: index + 1,
  });
  console.log(`[UPLOADED] ${partner.name}`);
}

const slugs = rows.map((row) => row.slug);
const { error: unpublishError } = await supabase
  .from("partners")
  .update({ is_published: false, is_featured: false })
  .not("slug", "in", `(${slugs.join(",")})`);
if (unpublishError) throw new Error(`Unable to retire old partner placeholders: ${unpublishError.message}`);

const { data: imported, error: importError } = await supabase
  .from("partners")
  .upsert(rows, { onConflict: "slug" })
  .select("id,slug,name,logo_url,is_published");
if (importError) throw new Error(`Partner import failed: ${importError.message}`);

console.log(`\nImported ${imported.length} published partners.`);
