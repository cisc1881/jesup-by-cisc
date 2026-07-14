import type { Database } from "@/integrations/supabase/types";

type Insert<Table extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][Table]["Insert"];

const CONTACT = {
  contact_email: "cisc@tuskegee.edu",
  contact_phone: "334-724-4967",
  website_url: null,
  registration_url: null,
};
const COVERS = {
  community: "/starter/community-extension.jpg",
  economic: "/starter/economic-development.jpg",
  extension: "/starter/agricultural-extension.jpg",
  livestock: "/starter/sustainable-livestock.jpg",
};
const HEROES = {
  community: "/starter/heroes/community-extension-hero.jpg",
  economic: "/starter/heroes/economic-development-hero.jpg",
  extension: "/starter/heroes/agricultural-extension-hero.jpg",
  livestock: "/starter/heroes/sustainable-livestock-hero.jpg",
};

export const starterPrograms = [
  {
    slug: "small-farm-rural-development",
    name: "Small Farm and Rural Development Program",
    tagline: "Practical partnerships for resilient farms and rural communities",
    short:
      "Technical assistance, collaboration, and economic-development pathways for small and underserved producers.",
    description_html:
      "<p>CISC connects small farmers and rural communities with research, outreach, partners, markets, and development opportunities. The program builds on Tuskegee University’s long history of serving limited-resource producers through practical, community-centered Extension.</p>",
    objectives_html:
      "<ul><li>Strengthen small-farm profitability and resilience.</li><li>Expand access to technical assistance and partner networks.</li><li>Support value addition, markets, and rural enterprise development.</li></ul>",
    cover_image_url: COVERS.community,
    metadata: {
      hero_image_url: HEROES.community,
      image_note: "AI-generated illustrative image",
      source_url:
        "https://cisc1881.org/programs-projects/small-farm-and-rural-development-program-3/",
    },
    is_active: true,
    is_featured: true,
    sort_order: 6,
    ...CONTACT,
  },
  {
    slug: "black-harvest-series",
    name: "Black Harvest Series",
    tagline: "Community knowledge, culture, and food-system conversations",
    short:
      "A CISC series elevating Black agricultural knowledge, community voices, and food-system leadership.",
    description_html:
      "<p>The Black Harvest Series creates space for learning and dialogue centered on agriculture, culture, history, and community-led solutions.</p>",
    objectives_html:
      "<ul><li>Elevate community and producer voices.</li><li>Connect agricultural history with present-day practice.</li><li>Share knowledge through accessible public programming.</li></ul>",
    cover_image_url: COVERS.community,
    metadata: { image_note: "AI-generated illustrative image" },
    is_active: true,
    is_featured: false,
    sort_order: 2,
    ...CONTACT,
  },
  {
    slug: "black-belt-marketing-innovation-center",
    name: "Black Belt Marketing and Innovation Center",
    tagline: "Connecting regional enterprise, markets, and innovation",
    short:
      "Market development and innovation support for producers, entrepreneurs, and Black Belt communities.",
    description_html:
      "<p>The Black Belt Marketing and Innovation Center supports practical pathways from ideas and production to stronger markets and sustainable regional enterprise.</p>",
    objectives_html:
      "<ul><li>Strengthen market readiness.</li><li>Support value-added enterprise.</li><li>Connect producers and entrepreneurs with useful resources.</li></ul>",
    cover_image_url: COVERS.economic,
    metadata: { hero_image_url: HEROES.economic, image_note: "AI-generated illustrative image" },
    is_active: true,
    is_featured: true,
    sort_order: 3,
    ...CONTACT,
  },
  {
    slug: "cisc-dialogue-model",
    name: "CISC Dialogue Model",
    tagline: "Structured conversation for community-centered solutions",
    short:
      "A collaborative model for listening, learning, and developing responses with communities and partners.",
    description_html:
      "<p>The CISC Dialogue Model brings stakeholders together to understand priorities, share experience, and shape practical next steps.</p>",
    objectives_html:
      "<ul><li>Center community knowledge.</li><li>Build shared understanding.</li><li>Turn dialogue into coordinated action.</li></ul>",
    cover_image_url: COVERS.community,
    metadata: { image_note: "AI-generated illustrative image" },
    is_active: true,
    is_featured: false,
    sort_order: 4,
    ...CONTACT,
  },
  {
    slug: "family-inc-x-cisc",
    name: "Family INC. x CISC",
    tagline: "Partnership for families, opportunity, and community resilience",
    short:
      "A collaborative initiative connecting families and communities with learning, resources, and opportunity.",
    description_html:
      "<p>Family INC. x CISC combines partnership, outreach, and community engagement to support stronger families and resilient communities.</p>",
    objectives_html:
      "<ul><li>Connect families with relevant resources.</li><li>Expand community learning opportunities.</li><li>Strengthen collaborative service.</li></ul>",
    cover_image_url: COVERS.community,
    metadata: { image_note: "AI-generated illustrative image" },
    is_active: true,
    is_featured: false,
    sort_order: 5,
    ...CONTACT,
  },
  {
    slug: "environment-economics-energy-academy",
    name: "Environment, Economics, and Energy Academy (EEE Academy)",
    tagline: "Powering people, growing prosperity, building resilient communities",
    short:
      "Practical learning connecting environmental stewardship, economic opportunity, energy access, and community leadership.",
    description_html:
      "<p>The EEE Academy helps participants identify environmental, economic, and energy challenges and develop strategies for sustainability, empowerment, and rural prosperity.</p>",
    objectives_html:
      "<ul><li>Build environmental awareness and stewardship.</li><li>Explore rural prosperity and local enterprise.</li><li>Connect energy empowerment with community resilience.</li><li>Develop leadership and planning skills.</li></ul>",
    cover_image_url: COVERS.economic,
    metadata: {
      hero_image_url: HEROES.economic,
      image_note: "AI-generated illustrative image",
      source_url:
        "https://cisc1881.org/programs-projects/environment-economics-and-energy-academy-eee-academy/",
    },
    is_active: true,
    is_featured: true,
    sort_order: 1,
    ...CONTACT,
  },
  {
    slug: "state-of-african-americans-black-belt",
    name: "State of African Americans in the Black Belt",
    tagline: "Research, public education, and policy understanding",
    short:
      "The SAABB initiative develops reports, briefs, presentations, and recommendations focused on Black Belt communities.",
    description_html:
      "<p>SAABB supports research, training, public education, and policy understanding across the Black Belt through public-facing reports and practical recommendations.</p>",
    objectives_html:
      "<ul><li>Translate research for public use.</li><li>Elevate regional priorities and lived experience.</li><li>Support informed policy dialogue.</li></ul>",
    cover_image_url: COVERS.economic,
    metadata: {
      image_note: "AI-generated illustrative image",
      source_url: "https://cisc1881.org/programs-projects/african-americans-in-the-black-belt/",
    },
    is_active: true,
    is_featured: false,
    sort_order: 7,
    ...CONTACT,
  },
  {
    slug: "tuaic",
    name: "TUAIC (Tuskegee University Agricultural Innovation Center)",
    tagline: "Agricultural innovation, learning, and community development",
    short:
      "A Tuskegee University center connecting agricultural innovation with education and community impact.",
    description_html:
      "<p>TUAIC supports teaching, applied learning, food-system innovation, and community development through Tuskegee University’s land-grant mission.</p>",
    objectives_html:
      "<ul><li>Advance practical agricultural innovation.</li><li>Create hands-on learning opportunities.</li><li>Support community-scale food-system development.</li></ul>",
    cover_image_url: COVERS.extension,
    metadata: { hero_image_url: HEROES.extension, image_note: "AI-generated illustrative image" },
    is_active: true,
    is_featured: true,
    sort_order: 8,
    ...CONTACT,
  },
  {
    slug: "value-addition-technology",
    name: "Value Addition & Technology",
    tagline: "Tools and knowledge that move ideas toward market",
    short:
      "Applied technology, product development, and value-addition support for producers and rural enterprises.",
    description_html:
      "<p>Value Addition & Technology helps participants explore tools, processes, and strategies that can improve products, operations, and market opportunity.</p>",
    objectives_html:
      "<ul><li>Build value-added production knowledge.</li><li>Connect participants with appropriate technology.</li><li>Support enterprise and market readiness.</li></ul>",
    cover_image_url: COVERS.livestock,
    metadata: { hero_image_url: HEROES.livestock, image_note: "AI-generated illustrative image" },
    is_active: true,
    is_featured: true,
    sort_order: 9,
    ...CONTACT,
  },
] satisfies Insert<"programs">[];

export const starterPodcasts = [
  {
    slug: "2fas-podcast",
    title: "2FAS Podcast",
    description:
      "Conversations about student pathways, professional development, agriculture, food systems, and the next generation of leaders.",
    category: "2FAS",
    cover_url: COVERS.community,
    is_published: true,
    is_featured: true,
    published_at: "2026-07-01T12:00:00Z",
  },
  {
    slug: "earth2tu",
    title: "Earth2TU",
    description:
      "Tuskegee-centered conversations connecting environmental stewardship, agriculture, sustainability, and community life.",
    category: "Environment",
    cover_url: COVERS.extension,
    is_published: true,
    is_featured: false,
    published_at: "2026-06-15T12:00:00Z",
  },
  {
    slug: "growing-the-green",
    title: "Growing the Green",
    description:
      "Practical conversations about rural prosperity, green enterprise, energy, and sustainable economic opportunity.",
    category: "Economic Development",
    cover_url: COVERS.economic,
    is_published: true,
    is_featured: false,
    published_at: "2026-06-01T12:00:00Z",
  },
] satisfies Insert<"podcast_episodes">[];

export const starterInternships = [
  {
    slug: "cisc-hbcu-graduate-fellowship-program",
    title: "CISC HBCU Graduate Fellowship Program",
    description:
      "A graduate fellowship pathway connecting HBCU scholars with food, agriculture, sustainability, research, and professional development.",
    department: "CISC · 2FAS",
    requirements_html:
      "<p>Submit your interest and qualifications through JESUP. Program staff will review eligibility and follow up inside the application workflow.</p>",
    track: "fellow",
    is_2fas: true,
    is_open: true,
  },
  {
    slug: "sei-high-school",
    title: "SEI High School",
    description:
      "A structured summer experience introducing high-school participants to agriculture, sustainability, careers, and Tuskegee’s land-grant mission.",
    department: "Summer Experience Internship · 2FAS",
    requirements_html:
      "<p>Students apply directly through JESUP. Eligibility details and supporting information are collected in the application.</p>",
    track: "high_school",
    is_2fas: true,
    is_open: true,
  },
  {
    slug: "sei-undergraduates",
    title: "SEI Undergraduates",
    description:
      "An undergraduate summer experience combining mentoring, applied learning, professional development, and exposure to agricultural careers.",
    department: "Summer Experience Internship · 2FAS",
    requirements_html:
      "<p>Undergraduate applicants submit their information and materials directly through JESUP for review.</p>",
    track: "undergraduate",
    is_2fas: true,
    is_open: true,
  },
  {
    slug: "graduate-extension-interns-fellows",
    title: "Graduate Extension Interns/Fellows",
    description:
      "Graduate-level Extension experience involving mentoring, field engagement, community service, and applied professional learning.",
    department: "Cooperative Extension · 2FAS",
    requirements_html:
      "<p>Graduate applicants apply through JESUP and provide the information needed for program review and placement.</p>",
    track: "graduate",
    is_2fas: true,
    is_open: true,
  },
] satisfies Insert<"internships">[];

export const starterEvents = [
  {
    slug: "booker-t-washington-economic-development-summit-2026",
    title: "30th Annual Booker T. Washington Economic Development Summit",
    description:
      "A legacy gathering focused on leadership, innovation, community empowerment, and economic ecosystems that promote development and prosperity.",
    description_html:
      "<p>Leaders, educators, entrepreneurs, students, and community stakeholders gather for dialogue, collaboration, and forward-looking economic-development solutions.</p>",
    starts_at: "2026-09-10T09:00:00-05:00",
    ends_at: "2026-09-11T17:00:00-05:00",
    location: "Tuskegee University Campus",
    location_address: "1200 W Montgomery Rd, Tuskegee, AL 36088",
    image_url: COVERS.economic,
    external_url: "https://www.tuskegee.edu/btwsummit",
    metadata: { hero_image_url: HEROES.economic, image_note: "AI-generated illustrative image" },
    status: "published",
    is_active: true,
    is_featured: true,
    registration_open: false,
    registration_status: "closed",
    timezone: "America/Chicago",
  },
  {
    slug: "professional-agricultural-workers-conference-2026",
    title: "84th Annual Professional Agricultural Workers Conference",
    description:
      "A historic gathering advancing the land-grant mission through agricultural research, education, Extension, training, and networking.",
    starts_at: "2026-10-25T09:00:00-05:00",
    ends_at: "2026-10-27T17:00:00-05:00",
    location: "Renaissance Montgomery Hotel & Spa",
    location_address: "201 Tallapoosa Street, Montgomery, AL",
    image_url: COVERS.extension,
    external_url: "https://pawc.info",
    metadata: { hero_image_url: HEROES.extension, image_note: "AI-generated illustrative image" },
    status: "published",
    is_active: true,
    is_featured: true,
    registration_open: false,
    registration_status: "closed",
    timezone: "America/Chicago",
  },
  {
    slug: "black-belt-meat-summit-2027",
    title: "Black Belt Meat Summit",
    description:
      "Farmers, processors, producers, researchers, and industry leaders collaborate to advance sustainable meat production and strengthen rural Black Belt economies.",
    starts_at: "2027-04-14T09:00:00-05:00",
    ends_at: "2027-04-16T17:00:00-05:00",
    location: "Tuskegee University Campus",
    location_address: "1200 W Montgomery Rd, Tuskegee, AL 36088",
    image_url: COVERS.livestock,
    external_url: "https://www.tuskegee.edu/BlackBeltMeatSummit",
    metadata: {
      hero_image_url: HEROES.livestock,
      image_note: "AI-generated illustrative image",
      contacts: ["charris2@tuskegee.edu", "dburnett@tuskegee.edu"],
    },
    status: "published",
    is_active: true,
    is_featured: true,
    registration_open: false,
    registration_status: "closed",
    timezone: "America/Chicago",
  },
  {
    slug: "eee-academy-2026-2027",
    title: "Environment, Economics, and Energy Academy",
    description:
      "A practical learning series connecting sustainability, economic development, energy empowerment, leadership, and rural prosperity.",
    starts_at: "2026-09-04T09:00:00-05:00",
    ends_at: "2027-05-07T17:00:00-05:00",
    location: "Tuskegee University CISC and CFSRPES",
    image_url: COVERS.community,
    metadata: { image_note: "AI-generated illustrative image" },
    external_url:
      "https://cisc1881.org/programs-projects/environment-economics-and-energy-academy-eee-academy/",
    status: "published",
    is_active: true,
    is_featured: false,
    registration_open: true,
    registration_status: "open",
    timezone: "America/Chicago",
  },
  {
    slug: "ard-research-symposium-recap-2026",
    title: "2026 ARD Research Symposium Recap",
    description:
      "A public recap of research, collaboration, agricultural advancement, sustainability, community resilience, and innovation across the 1890 land-grant network.",
    starts_at: "2026-03-28T09:00:00-05:00",
    ends_at: "2026-03-31T17:00:00-05:00",
    location: "New Orleans, Louisiana",
    image_url: COVERS.extension,
    metadata: { image_note: "AI-generated illustrative image" },
    external_url:
      "https://cisc1881.org/news/2026-ard-research-symposium-recap-advancing-research-collaboration-and-impact/",
    status: "published",
    is_active: true,
    is_featured: false,
    registration_open: false,
    registration_status: "closed",
    timezone: "America/Chicago",
  },
] satisfies Insert<"events">[];

export const starterNews = [
  {
    slug: "advancing-research-collaboration-impact",
    title: "Advancing Research, Collaboration, and Impact",
    summary:
      "Highlights from the 2026 ARD Research Symposium and the 1890 community’s work across agriculture, sustainability, and resilience.",
    content_html:
      "<p>The 2026 ARD Research Symposium brought researchers, educators, students, and industry leaders together to exchange knowledge and explore practical responses to agricultural and community challenges.</p><h2>The conversation continues</h2><p>CISC is sharing session recordings and resources so the wider community can stay connected to this work.</p>",
    cover_image_url: COVERS.extension,
    author: "CISC",
    category: "Research",
    is_published: true,
    is_featured: true,
    published_at: "2026-04-03T12:00:00Z",
    reading_time_minutes: 3,
    sort_order: 1,
  },
  {
    slug: "empowering-communities-agriculture-innovation",
    title: "Empowering Communities Through Agriculture and Innovation",
    summary:
      "How education, outreach, and practical innovation support farmers, families, and sustainable food systems.",
    content_html:
      "<p>CISC connects research with service by creating opportunities for farmers, students, and community partners to learn together. This work supports responsible land stewardship, resilient enterprises, and healthier local food systems.</p>",
    cover_image_url: COVERS.community,
    author: "CISC",
    category: "Community Impact",
    is_published: true,
    is_featured: true,
    published_at: "2026-05-12T12:00:00Z",
    reading_time_minutes: 3,
    sort_order: 2,
  },
  {
    slug: "urban-agriculture-innovation-center",
    title: "Urban Agriculture and Innovation in Montgomery",
    summary:
      "Teaching, learning, food access, and community development come together in the historic Peacock Tract community.",
    content_html:
      "<p>The Tuskegee University Urban Agriculture & Innovation Center is designed as a community space for education around sustainable urban food systems, food safety, growing, postharvest practices, economic development, and youth development.</p>",
    cover_image_url: COVERS.economic,
    author: "CISC",
    category: "Urban Agriculture",
    is_published: true,
    is_featured: false,
    published_at: "2026-05-28T12:00:00Z",
    reading_time_minutes: 3,
    sort_order: 3,
  },
  {
    slug: "black-belt-food-corridor-opportunity",
    title: "Black Belt Food Corridor Builds Local Opportunity",
    summary:
      "A community-centered approach to production, stewardship, food access, food-waste reduction, and farmer economic opportunity.",
    content_html:
      "<p>The Black Belt Food Corridor initiative supports farmers, small food producers, community gardens, and school gardens while strengthening connections across the regional food system.</p>",
    cover_image_url: COVERS.extension,
    author: "CISC",
    category: "Food Systems",
    is_published: true,
    is_featured: false,
    published_at: "2026-06-10T12:00:00Z",
    reading_time_minutes: 3,
    sort_order: 4,
  },
  {
    slug: "developing-next-generation-ag-leaders",
    title: "Developing the Next Generation of Agricultural Leaders",
    summary:
      "2FAS pathways connect students with paid experiences, mentors, research, Extension, policy, and sustainable agriculture careers.",
    content_html:
      "<p>Through internships, fellowships, mentoring, and professional development, CISC helps students build practical knowledge and networks for careers in agriculture, food systems, natural resources, public service, and Extension.</p>",
    cover_image_url: COVERS.community,
    author: "CISC",
    category: "2FAS",
    is_published: true,
    is_featured: false,
    published_at: "2026-06-24T12:00:00Z",
    reading_time_minutes: 3,
    sort_order: 5,
  },
] satisfies Insert<"news_articles">[];

export const starterMarkets = [
  {
    slug: "macon-county-farmers-market",
    name: "Macon County Farmers Market",
    description:
      "A seasonal community market connecting Tuskegee-area shoppers with local growers and producers.",
    address: "Intersection of Elm & Spring Streets",
    city: "Tuskegee",
    state: "AL",
    hours: "Wednesday and Saturday, 8:30 AM–2:00 PM",
    season: "June–November; confirm current schedule",
    image_url: COVERS.community,
    metadata: {
      hero_image_url: HEROES.community,
      image_note: "AI-generated illustrative image",
      source: "Alabama Farmers Market Authority / USDA directory",
    },
    accepts_credit: true,
    accepts_snap_ebt: false,
    is_active: true,
    is_featured: true,
  },
  {
    slug: "lowndes-county-farmers-market",
    name: "Lowndes County Farmers Market",
    description: "Seasonal produce and community market access in Hayneville.",
    address: "653 State Highway South (Orchard Healthcare)",
    city: "Hayneville",
    state: "AL",
    hours: "Wednesday 7–11 AM; Friday 3–6 PM; Saturday 8–11 AM",
    season: "June–August; confirm current schedule",
    image_url: COVERS.extension,
    metadata: { source: "2026 Alabama Statewide Redemption Sites" },
    contact_name: "George Hunter",
    phone: "334-548-2535",
    email: "ghunter@tuskegee.edu",
    accepts_credit: false,
    accepts_snap_ebt: false,
    is_active: true,
    is_featured: false,
  },
  {
    slug: "selma-farmers-market",
    name: "Selma Farmers Market",
    description: "A Dallas County seasonal market serving Selma-area residents and producers.",
    address: "Bloch Park, Dallas Avenue & Marina Drive",
    city: "Selma",
    state: "AL",
    hours: "Tuesday, Thursday, and Saturday, 6 AM–2 PM",
    season: "June–November; confirm current schedule",
    image_url: COVERS.economic,
    metadata: { source: "Alabama Farmers Market Authority" },
    accepts_credit: false,
    accepts_snap_ebt: false,
    is_active: true,
    is_featured: false,
  },
  {
    slug: "montgomery-curb-market",
    name: "Montgomery Curb Market",
    description:
      "A historic downtown market with local farmers and vendors offering seasonal produce, baked goods, plants, crafts, and Alabama-made products.",
    address: "1004 Madison Avenue",
    city: "Montgomery",
    state: "AL",
    hours: "Tuesday, Thursday, and Saturday, 5:30 AM–2:00 PM",
    season: "Year-round; confirm holiday hours",
    image_url: COVERS.economic,
    metadata: {
      image_note: "AI-generated illustrative image",
      source: "City of Montgomery",
    },
    website_url: "https://www.montgomeryal.gov/live/community/montgomery-curb-market",
    phone: "334-625-4636",
    accepts_credit: true,
    accepts_snap_ebt: false,
    is_active: true,
    is_featured: true,
  },
  {
    slug: "sweet-creek-farm-market",
    name: "Sweet Creek Farm Market",
    description:
      "A Pike Road farm market featuring seasonal produce, Alabama-made goods, prepared foods, and family-friendly amenities.",
    address: "85 Meriwether Road",
    city: "Pike Road",
    state: "AL",
    hours: "Daily; confirm current hours with the market",
    season: "Year-round",
    image_url: COVERS.community,
    metadata: {
      image_note: "AI-generated illustrative image",
      source: "Sweet Creek Farm Market",
    },
    website_url: "https://sweetcreekfarmmarket.com",
    phone: "334-280-3276",
    accepts_credit: true,
    accepts_snap_ebt: false,
    is_active: true,
    is_featured: false,
  },
] satisfies Insert<"markets">[];

export const starterPartners = [
  {
    slug: "tuskegee-university-caens",
    name: "Tuskegee University College of Agriculture, Environment and Nutrition Sciences",
    short_description: "CISC’s academic home and a leader in research, teaching, and Extension.",
    description:
      "CAENS prepares students and serves communities through agriculture, environment, nutrition, research, and Cooperative Extension.",
    category: "University",
    website_url: "https://www.tuskegee.edu/caens",
    partnership_areas: ["Research", "Education", "Extension", "Student development"],
    social_links: {},
    is_published: true,
    is_featured: true,
    sort_order: 1,
  },
  {
    slug: "usda",
    name: "United States Department of Agriculture",
    short_description: "Federal programs, research, technical assistance, and producer support.",
    category: "Government",
    website_url: "https://www.usda.gov",
    partnership_areas: ["Small farms", "Natural resources", "Rural development", "Research"],
    social_links: {},
    is_published: true,
    is_featured: true,
    sort_order: 2,
  },
  {
    slug: "alabama-department-agriculture-industries",
    name: "Alabama Department of Agriculture and Industries",
    short_description: "State agriculture services, market information, and producer resources.",
    category: "Government",
    website_url: "https://agi.alabama.gov",
    partnership_areas: ["Farmers markets", "Producer services", "Food systems"],
    social_links: {},
    is_published: true,
    is_featured: false,
    sort_order: 3,
  },
  {
    slug: "heart-of-alabama-food-bank",
    name: "Heart of Alabama Food Bank",
    short_description: "Regional hunger-relief and food-access partner serving central Alabama.",
    category: "Community",
    website_url: "https://hafb.org",
    partnership_areas: ["Food access", "Black Belt Food Corridor", "Community partnerships"],
    social_links: {},
    is_published: true,
    is_featured: false,
    sort_order: 4,
  },
  {
    slug: "infas",
    name: "Inter-Institutional Network for Food, Agriculture and Sustainability",
    short_description:
      "An inter-institutional network supporting food-systems scholarship, mentorship, and collaboration.",
    category: "Academic Network",
    website_url: "https://asi.ucdavis.edu/programs/infas",
    partnership_areas: [
      "HBCU fellowship",
      "Mentoring",
      "Food-systems research",
      "Professional development",
    ],
    social_links: {},
    is_published: true,
    is_featured: false,
    sort_order: 5,
  },
] satisfies Insert<"partners">[];
