export type CiscTabStory = {
  eyebrow: string;
  title: string;
  summary: string;
  highlights: string[];
  sourceUrl: string;
  sourceLabel: string;
  videoUrl?: string;
  videoLabel?: string;
};

export const CISC_TAB_CONTENT: Record<string, CiscTabStory> = {
  "/programs": {
    eyebrow: "Research · Education · Service",
    title: "Practical programs rooted in the Carver legacy",
    summary:
      "CISC serves small, underserved, beginning, women, and veteran farmers, ranchers, landowners, cooperatives, and rural communities through farmer-centered research, education, and outreach.",
    highlights: [
      "Environment, Economics, and Energy Academy (EEE Academy)",
      "Black Belt Marketing and Innovation Center",
      "Small Farm and Rural Development Program",
    ],
    sourceUrl: "https://cisc1881.org/programs-projects/",
    sourceLabel: "View the informational source",
  },
  "/events": {
    eyebrow: "Learn together",
    title: "Field days, conferences, workshops, and community learning",
    summary:
      "CISC connects farmers, researchers, students, Extension professionals, and community leaders through practical learning experiences and legacy gatherings such as the Annual Farmers Conference.",
    highlights: [
      "Hands-on agricultural learning",
      "Research and policy exchange",
      "Regional partnership building",
    ],
    sourceUrl: "https://cisc1881.org/events/",
    sourceLabel: "View CISC events",
  },
  "/join": {
    eyebrow: "Connect with CISC",
    title: "Bring your question, project, or partnership idea",
    summary:
      "CISC welcomes interest from farmers, landowners, community organizations, schools, students, researchers, agencies, and prospective partners working toward resilient food systems and thriving rural communities.",
    highlights: [
      "Request program information",
      "Explore a community partnership",
      "Connect with student and career opportunities",
    ],
    sourceUrl: "https://cisc1881.org/contact/",
    sourceLabel: "CISC contact information",
  },
  "/news": {
    eyebrow: "From the field",
    title: "Research, outreach, and community impact",
    summary:
      "Follow CISC work connecting agricultural innovation, education, food systems, sustainable development, and community empowerment across Alabama and the wider 1890 land-grant network.",
    highlights: [
      "Research symposium recaps",
      "Agriculture and innovation stories",
      "Black Belt community initiatives",
    ],
    sourceUrl: "https://cisc1881.org/",
    sourceLabel: "Read the latest from CISC",
  },
  "/resources": {
    eyebrow: "Knowledge into action",
    title: "A growing library for farmers and communities",
    summary:
      "Use JESUP to reach CISC publications, programs, markets, funding opportunities, recordings, surveys, and services from one accessible resource hub.",
    highlights: [
      "SAABB reports and policy briefs",
      "Farm and food-system resources",
      "Official CISC documentaries and conversations",
    ],
    sourceUrl: "https://cisc1881.org/programs-projects/african-americans-in-the-black-belt/",
    sourceLabel: "Explore SAABB resources",
    videoUrl: "https://youtu.be/B0vj7JTfUA0",
    videoLabel: "Watch the Black Belt Food Corridor overview",
  },
  "/podcasts": {
    eyebrow: "CISC Network",
    title: "Conversations for the next generation of agriculture",
    summary:
      "The 2FAS Podcast and CISC network programming share perspectives from students, farmers, researchers, Extension professionals, and community leaders working across food, agriculture, and sustainability.",
    highlights: ["2FAS Podcast", "Earth2TU", "Growing the Green"],
    sourceUrl: "https://cisc1881.org/programs-projects/2faspodcast/",
    sourceLabel: "View the informational source",
  },
  "/partners": {
    eyebrow: "Stronger together",
    title: "Partnerships that extend knowledge and opportunity",
    summary:
      "CISC collaborates with public agencies, universities, community organizations, food-system partners, financial institutions, and producers to address small-farm and rural-development priorities.",
    highlights: [
      "USDA and Extension collaboration",
      "Community-based organizations",
      "Farmer, food-system, and academic networks",
    ],
    sourceUrl: "https://cisc1881.org/partners/",
    sourceLabel: "See the CISC partner network",
  },
  "/donate": {
    eyebrow: "Invest in lasting impact",
    title: "Support farmer-centered research, education, and service",
    summary:
      "Support for CISC helps expand learning, student development, community engagement, sustainable agriculture, and practical resources for historically underserved producers and communities.",
    highlights: [
      "Student learning and leadership",
      "Farmer outreach and technical assistance",
      "Community-centered sustainability work",
    ],
    sourceUrl: "https://cisc1881.org/",
    sourceLabel: "Learn more about CISC",
  },
  "/publications": {
    eyebrow: "Evidence and insight",
    title: "Research made useful for public decisions",
    summary:
      "CISC publications include annual reports, policy briefs, presentations, farm and food-system research, and practical resources such as the State of African Americans in the Black Belt series.",
    highlights: [
      "SAABB annual reports",
      "Agriculture and food-policy briefs",
      "Small-farm research and case studies",
    ],
    sourceUrl: "https://cisc1881.org/programs-projects/african-americans-in-the-black-belt/",
    sourceLabel: "Browse CISC reports",
  },
  "/grants": {
    eyebrow: "Capital for community ideas",
    title: "Funding pathways for Black Belt food and farm projects",
    summary:
      "The Black Belt Food Corridor Mini-Grant Program supports eligible farmers, small food producers, community gardens, and school gardens whose work advances production, stewardship, food access, economic opportunity, or food-waste reduction.",
    highlights: [
      "Farmer economic opportunity",
      "Production and land stewardship",
      "Food access and waste reduction",
    ],
    sourceUrl:
      "https://cisc1881.org/programs-projects/black-belt-food-corridor-mini-grant-program/",
    sourceLabel: "Review the official mini-grant page",
    videoUrl: "https://youtu.be/B0vj7JTfUA0",
    videoLabel: "Watch the official program video",
  },
  "/equipment": {
    eyebrow: "Shared capacity",
    title: "Tools that help move projects from planning to practice",
    summary:
      "JESUP’s equipment catalog is designed to make approved CISC tools, sensors, and field resources easier to discover and reserve for eligible program and community work.",
    highlights: [
      "Clear availability and reservation details",
      "Program-connected field support",
      "Responsible shared-resource use",
    ],
    sourceUrl: "https://cisc1881.org/programs-projects/value-addition-technology/",
    sourceLabel: "Explore CISC value addition and technology",
  },
  "/surveys": {
    eyebrow: "Community voice",
    title: "Help programs respond to real priorities",
    summary:
      "CISC’s community-centered approach depends on listening. Surveys and evaluations help teams understand needs, strengthen learning experiences, and improve how programs serve farmers, students, partners, and communities.",
    highlights: [
      "Share local needs and priorities",
      "Evaluate workshops and services",
      "Inform future program improvements",
    ],
    sourceUrl: "https://cisc1881.org/about/vision-mission/",
    sourceLabel: "Read CISC’s vision and mission",
  },
  "/internships": {
    eyebrow: "2FAS pathways",
    title: "Developing the next generation of agricultural leaders",
    summary:
      "CISC student pathways include paid undergraduate summer experiences, graduate Extension internships and fellowships, mentoring, career readiness, research exposure, and hands-on work with farmers and agricultural professionals.",
    highlights: [
      "CISC HBCU Graduate Fellowship Program",
      "SEI High School and SEI Undergraduates",
      "Graduate Extension Interns/Fellows",
    ],
    sourceUrl: "https://cisc1881.org/fellowships-internships-jobs/",
    sourceLabel: "View the informational source",
  },
};
