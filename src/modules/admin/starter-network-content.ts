import type { Database } from "@/integrations/supabase/types";

type Insert<Table extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][Table]["Insert"];

const stock = {
  field:
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=82",
  farmer:
    "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1600&q=82",
  greenhouse:
    "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=1600&q=82",
  produce:
    "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1600&q=82",
  workshop:
    "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1600&q=82",
  research:
    "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1600&q=82",
  solar:
    "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=1600&q=82",
  livestock:
    "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1600&q=82",
} as const;

type InstitutionDemo = {
  name: string;
  slug: string;
  city: string;
  state: string;
  accent: string;
  secondary: string;
  focus: string;
};

export const starterInstitutionDemos: InstitutionDemo[] = [
  {
    name: "Alabama A&M University",
    slug: "alabama-a-and-m-university",
    city: "Normal",
    state: "AL",
    accent: "#7a0019",
    secondary: "#d5d9dd",
    focus: "urban agriculture and resilient food systems",
  },
  {
    name: "Alcorn State University",
    slug: "alcorn-state-university",
    city: "Lorman",
    state: "MS",
    accent: "#5b2c83",
    secondary: "#f4c430",
    focus: "specialty crops and farm enterprise",
  },
  {
    name: "Central State University",
    slug: "central-state-university",
    city: "Wilberforce",
    state: "OH",
    accent: "#7b1e3a",
    secondary: "#f2c14e",
    focus: "soil health and beginning farmers",
  },
  {
    name: "Delaware State University",
    slug: "delaware-state-university",
    city: "Dover",
    state: "DE",
    accent: "#b11f3a",
    secondary: "#00a9ce",
    focus: "climate-smart production and water quality",
  },
  {
    name: "Florida A&M University",
    slug: "florida-a-and-m-university",
    city: "Tallahassee",
    state: "FL",
    accent: "#f15a22",
    secondary: "#00613c",
    focus: "forestry, horticulture, and cooperative development",
  },
  {
    name: "Fort Valley State University",
    slug: "fort-valley-state-university",
    city: "Fort Valley",
    state: "GA",
    accent: "#0033a0",
    secondary: "#f2b705",
    focus: "small ruminants and value-added agriculture",
  },
  {
    name: "Kentucky State University",
    slug: "kentucky-state-university",
    city: "Frankfort",
    state: "KY",
    accent: "#1f6b42",
    secondary: "#f0c341",
    focus: "aquaculture and sustainable production",
  },
  {
    name: "Langston University",
    slug: "langston-university",
    city: "Langston",
    state: "OK",
    accent: "#f28c28",
    secondary: "#1b4f9c",
    focus: "goat production and rural entrepreneurship",
  },
  {
    name: "Lincoln University",
    slug: "lincoln-university",
    city: "Jefferson City",
    state: "MO",
    accent: "#003b71",
    secondary: "#d4af37",
    focus: "integrated pest management and local foods",
  },
  {
    name: "North Carolina A&T State University",
    slug: "north-carolina-a-and-t-state-university",
    city: "Greensboro",
    state: "NC",
    accent: "#004684",
    secondary: "#f2b134",
    focus: "agricultural technology and food innovation",
  },
  {
    name: "Prairie View A&M University",
    slug: "prairie-view-a-and-m-university",
    city: "Prairie View",
    state: "TX",
    accent: "#4f2683",
    secondary: "#f6c344",
    focus: "ranch management and community resilience",
  },
  {
    name: "South Carolina State University",
    slug: "south-carolina-state-university",
    city: "Orangeburg",
    state: "SC",
    accent: "#7c1835",
    secondary: "#1f4e8c",
    focus: "family farms and agribusiness development",
  },
  {
    name: "Southern University and A&M College",
    slug: "southern-university-and-a-and-m-college",
    city: "Baton Rouge",
    state: "LA",
    accent: "#00539b",
    secondary: "#f6c343",
    focus: "urban forestry and community nutrition",
  },
  {
    name: "Tennessee State University",
    slug: "tennessee-state-university",
    city: "Nashville",
    state: "TN",
    accent: "#c8102e",
    secondary: "#00539b",
    focus: "nursery production and agricultural leadership",
  },
  {
    name: "Tuskegee University",
    slug: "tuskegee-university",
    city: "Tuskegee",
    state: "AL",
    accent: "#8b0015",
    secondary: "#e6b31e",
    focus: "small farms, food systems, and rural prosperity",
  },
  {
    name: "University of Arkansas at Pine Bluff",
    slug: "university-of-arkansas-at-pine-bluff",
    city: "Pine Bluff",
    state: "AR",
    accent: "#1b1b1b",
    secondary: "#f2c230",
    focus: "aquaculture, fisheries, and farm finance",
  },
  {
    name: "University of Maryland Eastern Shore",
    slug: "university-of-maryland-eastern-shore",
    city: "Princess Anne",
    state: "MD",
    accent: "#7b1e3a",
    secondary: "#b0b7bd",
    focus: "coastal agriculture and food safety",
  },
  {
    name: "Virginia State University",
    slug: "virginia-state-university",
    city: "Petersburg",
    state: "VA",
    accent: "#f47c20",
    secondary: "#17365d",
    focus: "industrial hemp and sustainable field crops",
  },
  {
    name: "West Virginia State University",
    slug: "west-virginia-state-university",
    city: "Institute",
    state: "WV",
    accent: "#1b1b1b",
    secondary: "#f4c430",
    focus: "urban agriculture and community development",
  },
];

const eventImages = [stock.field, stock.farmer, stock.greenhouse, stock.produce, stock.research];

export const starterInstitutionEvents: Insert<"events">[] = starterInstitutionDemos.flatMap(
  (institution, index) => {
    const month = String(9 + (index % 4)).padStart(2, "0");
    const day = String(8 + (index % 18)).padStart(2, "0");
    const metadata = {
      demo: true,
      institution_slug: institution.slug,
      institution_name: institution.name,
      theme_accent: institution.accent,
      theme_secondary: institution.secondary,
      image_source: "Unsplash stock photography",
    };
    return [
      {
        slug: `demo-${institution.slug}-extension-showcase-2026`,
        title: `${institution.name} Extension & Innovation Showcase`,
        description: `A demonstration event highlighting ${institution.focus}, student research, Extension partnerships, and community impact.`,
        description_html: `<p>This demo showcase brings producers, students, researchers, Extension professionals, and community partners together around <strong>${institution.focus}</strong>.</p><p>Explore exhibits, lightning talks, partner resources, and practical demonstrations designed for the ${institution.state} community.</p>`,
        starts_at: `2026-${month}-${day}T09:00:00-05:00`,
        ends_at: `2026-${month}-${day}T16:00:00-05:00`,
        location: `${institution.name} Campus`,
        location_address: `${institution.city}, ${institution.state}`,
        image_url: eventImages[index % eventImages.length],
        metadata,
        status: "published",
        is_active: true,
        is_featured: index < 6,
        registration_open: true,
        registration_status: "open",
        timezone: "America/Chicago",
      },
      {
        slug: `demo-${institution.slug}-field-workshop-2027`,
        title: `${institution.name} Hands-On Field Workshop`,
        description: `A practical workshop in ${institution.focus} with demonstrations, planning tools, and peer learning.`,
        description_html: `<p>Practice field-ready techniques with Extension educators and local partners. This demonstration workshop includes guided activities, take-home resources, and a planning clinic focused on ${institution.focus}.</p>`,
        starts_at: `2027-${month}-${day}T10:00:00-05:00`,
        ends_at: `2027-${month}-${day}T15:00:00-05:00`,
        location: `${institution.name} Research and Extension Farm`,
        location_address: `${institution.city}, ${institution.state}`,
        image_url: index % 3 === 0 ? stock.workshop : eventImages[(index + 1) % eventImages.length],
        metadata,
        status: "published",
        is_active: true,
        is_featured: false,
        registration_open: true,
        registration_status: "open",
        timezone: "America/Chicago",
      },
    ];
  },
);

const programWorkshops = [
  ["small-farm-rural-development", "Small Farm Profitability Planning Workshop", stock.farmer],
  ["black-harvest-series", "Black Harvest Community Storytelling Workshop", stock.produce],
  ["black-belt-marketing-innovation-center", "Market Readiness and Brand Lab", stock.workshop],
  ["cisc-dialogue-model", "Community Dialogue Facilitation Workshop", stock.workshop],
  ["family-inc-x-cisc", "Family Resource Navigation Workshop", stock.produce],
  ["environment-economics-energy-academy", "Community Energy and Resilience Lab", stock.solar],
  [
    "state-of-african-americans-black-belt",
    "Community Data and Policy Brief Workshop",
    stock.research,
  ],
  ["tuaic", "Agricultural Innovation Demonstration Day", stock.greenhouse],
  ["value-addition-technology", "Value-Added Product Development Workshop", stock.livestock],
] as const;

export const starterProgramWorkshops: Insert<"events">[] = programWorkshops.map(
  ([programSlug, title, image], index) => ({
    slug: `demo-${programSlug}-workshop-2027`,
    title,
    description: "A network-wide demonstration workshop connected to a JESUP signature program.",
    description_html:
      "<p>Learn through short demonstrations, guided exercises, peer exchange, and a take-home action plan. This demo session is open across the 1890 network.</p>",
    starts_at: `2027-0${2 + (index % 6)}-${String(10 + index).padStart(2, "0")}T10:00:00-05:00`,
    ends_at: `2027-0${2 + (index % 6)}-${String(10 + index).padStart(2, "0")}T14:00:00-05:00`,
    location: index % 2 === 0 ? "JESUP Virtual Classroom" : "Tuskegee University CISC",
    image_url: image,
    metadata: {
      demo: true,
      network_wide: true,
      program_slug: programSlug,
      image_source: "Unsplash stock photography",
    },
    status: "published",
    is_active: true,
    is_featured: index < 3,
    registration_open: true,
    registration_status: "open",
    timezone: "America/Chicago",
  }),
);

export const starterPublications = [
  {
    slug: "demo-small-farm-planning-guide",
    title: "Small Farm Planning Guide",
    author: "JESUP 1890 Network",
    category: "Farm Management",
    content_type: "extension_bulletin",
    description:
      "A practical workbook for goals, production planning, records, risk, and market decisions.",
    cover_image_url: stock.farmer,
    external_url: "https://www.nal.usda.gov/farms-and-agricultural-production-systems",
    metadata: { demo: true, image_source: "Unsplash stock photography" },
    published_at: "2026-08-01T12:00:00Z",
    is_active: true,
    is_featured: true,
  },
  {
    slug: "demo-climate-smart-field-notes",
    title: "Climate-Smart Field Notes",
    author: "JESUP Extension Collaborative",
    category: "Natural Resources",
    content_type: "research_publication",
    description:
      "Field-ready practices for soil cover, water management, heat planning, and resilient production.",
    cover_image_url: stock.field,
    external_url: "https://www.usda.gov/climate-solutions/climate-smart-agriculture-and-forestry",
    metadata: { demo: true, image_source: "Unsplash stock photography" },
    published_at: "2026-07-15T12:00:00Z",
    is_active: true,
    is_featured: true,
  },
  {
    slug: "demo-value-added-readiness-checklist",
    title: "Value-Added Readiness Checklist",
    author: "CISC",
    category: "Enterprise",
    content_type: "external_link",
    description:
      "A concise checklist covering customer discovery, food safety, packaging, pricing, and scale.",
    cover_image_url: stock.produce,
    external_url:
      "https://www.rd.usda.gov/programs-services/business-programs/value-added-producer-grants",
    metadata: { demo: true, image_source: "Unsplash stock photography" },
    published_at: "2026-06-20T12:00:00Z",
    is_active: true,
    is_featured: false,
  },
  {
    slug: "demo-extension-workshop-toolkit",
    title: "Community Workshop Toolkit",
    author: "1890 Cooperative Extension",
    category: "Extension",
    content_type: "extension_bulletin",
    description:
      "Templates for outreach, inclusive facilitation, evaluation, follow-up, and community partnerships.",
    cover_image_url: stock.workshop,
    external_url: "https://nifa.usda.gov/about-nifa/how-we-work/extension",
    metadata: { demo: true, image_source: "Unsplash stock photography" },
    published_at: "2026-05-10T12:00:00Z",
    is_active: true,
    is_featured: false,
  },
] satisfies Insert<"publications">[];

export const starterGrants = [
  {
    id: "d1000000-0000-4000-8000-000000000001",
    title: "Community Food Systems Mini-Grant (Demo)",
    funder: "JESUP 1890 Network",
    amount: "$5,000–$20,000",
    deadline: "2027-02-15",
    description:
      "Demo funding for producer collaboration, food access, youth engagement, and local market pilots.",
    url: "https://www.nifa.usda.gov/grants",
  },
  {
    id: "d1000000-0000-4000-8000-000000000002",
    title: "Climate-Smart Demonstration Grant (Demo)",
    funder: "Extension Innovation Fund",
    amount: "Up to $35,000",
    deadline: "2027-03-31",
    description:
      "Demo support for on-farm demonstrations involving soil, water, energy, or heat resilience.",
    url: "https://www.usda.gov/climate-solutions",
  },
  {
    id: "d1000000-0000-4000-8000-000000000003",
    title: "Rural Enterprise Launch Award (Demo)",
    funder: "JESUP Community Partners",
    amount: "$10,000",
    deadline: "2027-04-30",
    description:
      "Demo seed funding for value-added products and rural enterprises completing a readiness workshop.",
    url: "https://www.rd.usda.gov/programs-services/business-programs",
  },
] satisfies Insert<"grants">[];

export const starterEquipment = [
  {
    id: "d2000000-0000-4000-8000-000000000001",
    name: "Portable Soil Health Field Kit",
    category: "Soil & Water",
    description:
      "Demo kit with sampling tools, pH meter, moisture probe, and field record supplies.",
    quantity_total: 8,
    image_url: stock.field,
  },
  {
    id: "d2000000-0000-4000-8000-000000000002",
    name: "Mobile Workshop AV Kit",
    category: "Community Education",
    description:
      "Projector, screen, speaker, microphone, hotspot, and extension cords for field workshops.",
    quantity_total: 5,
    image_url: stock.workshop,
  },
  {
    id: "d2000000-0000-4000-8000-000000000003",
    name: "Farm Photo and Product Media Kit",
    category: "Marketing",
    description: "Camera, tripod, lights, backdrops, and tabletop setup for product photography.",
    quantity_total: 4,
    image_url: stock.produce,
  },
  {
    id: "d2000000-0000-4000-8000-000000000004",
    name: "Livestock Monitoring Kit",
    category: "Livestock",
    description: "Demo scale, handling supplies, identification tools, and environmental monitors.",
    quantity_total: 3,
    image_url: stock.livestock,
  },
] satisfies Insert<"equipment">[];

export const starterSurveys = [
  {
    id: "d3000000-0000-4000-8000-000000000001",
    title: "1890 Community Priorities Survey (Demo)",
    description:
      "Share the topics, services, and workshop formats that would be most useful in your community.",
    qualtrics_url: "https://cisc1881.org/contact-us/",
  },
  {
    id: "d3000000-0000-4000-8000-000000000002",
    title: "Producer Technology Needs Survey (Demo)",
    description:
      "Help shape future equipment lending, demonstrations, and technical-assistance offerings.",
    qualtrics_url: "https://cisc1881.org/contact-us/",
  },
  {
    id: "d3000000-0000-4000-8000-000000000003",
    title: "Student Career Pathways Survey (Demo)",
    description:
      "Tell the 2FAS team which internships, mentors, and professional-learning topics interest you.",
    qualtrics_url: "https://cisc1881.org/contact-us/",
  },
] satisfies Insert<"surveys">[];
