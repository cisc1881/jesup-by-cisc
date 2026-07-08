import farming from "@/assets/jesup/program-farming.jpg";
import energy from "@/assets/jesup/program-energy.jpg";
import harvest from "@/assets/jesup/program-harvest.jpg";
import marketing from "@/assets/jesup/program-marketing.jpg";
import dialogue from "@/assets/jesup/program-dialogue.jpg";
import family from "@/assets/jesup/program-family.jpg";
import smallfarm from "@/assets/jesup/program-smallfarm.jpg";
import blackbelt from "@/assets/jesup/program-blackbelt.jpg";
import innovation from "@/assets/jesup/program-innovation.jpg";
import valueadd from "@/assets/jesup/program-valueadd.jpg";

export type Program = {
  slug: string;
  name: string;
  short: string;
  tagline: string;
  description: string;
  image: string;
  tags: string[];
};

export const programs: Program[] = [
  {
    slug: "2fas",
    name: "Future Farmers & Agricultural Specialists",
    short: "2FAS",
    tagline: "Cultivating the next generation of agricultural leaders.",
    description: "A pipeline program preparing youth and young adults for careers across the agricultural value chain — from production to research to policy.",
    image: farming,
    tags: ["Youth", "Workforce", "Agriculture"],
  },
  {
    slug: "energy-academy",
    name: "Environment, Economics & Energy Academy",
    short: "3E Academy",
    tagline: "Where sustainability meets opportunity.",
    description: "Training and dialogue around clean energy, environmental stewardship, and rural economic development.",
    image: energy,
    tags: ["Energy", "Environment", "Economics"],
  },
  {
    slug: "black-harvest",
    name: "Black Harvest Series",
    short: "Black Harvest",
    tagline: "Celebrating heritage, food, and community.",
    description: "A cultural and educational series honoring Black agricultural traditions and connecting growers to modern markets.",
    image: harvest,
    tags: ["Culture", "Food Systems"],
  },
  {
    slug: "bbmic",
    name: "Black Belt Marketing & Innovation Center",
    short: "BBMIC",
    tagline: "Building brands rooted in place.",
    description: "Marketing, branding, and innovation support for small businesses and producers across Alabama's Black Belt.",
    image: marketing,
    tags: ["Business", "Marketing"],
  },
  {
    slug: "dialogue-model",
    name: "CISC Dialogue Model",
    short: "Dialogue Model",
    tagline: "Listening first. Building together.",
    description: "A structured community-engagement approach that centers voices from the ground up in program design.",
    image: dialogue,
    tags: ["Community", "Engagement"],
  },
  {
    slug: "family-inc",
    name: "Family INC × CISC",
    short: "Family INC",
    tagline: "Strong families, strong futures.",
    description: "Partnership programming supporting family wellness, financial literacy, and generational wealth.",
    image: family,
    tags: ["Family", "Wellness"],
  },
  {
    slug: "small-farm",
    name: "Small Farm & Rural Development Program",
    short: "Small Farm",
    tagline: "Investing in the backbone of rural America.",
    description: "Direct technical assistance, training, and resources for small and limited-resource farmers.",
    image: smallfarm,
    tags: ["Farmers", "Rural"],
  },
  {
    slug: "black-belt-report",
    name: "State of African Americans in the Black Belt",
    short: "Black Belt Report",
    tagline: "Research that drives policy.",
    description: "An ongoing research initiative documenting outcomes and opportunities across the Black Belt region.",
    image: blackbelt,
    tags: ["Research", "Policy"],
  },
  {
    slug: "tuaic",
    name: "Tuskegee University Agricultural Innovation Center",
    short: "TUAIC",
    tagline: "Where research meets the field.",
    description: "A hub for applied agricultural research, workforce development, and commercialization.",
    image: innovation,
    tags: ["Innovation", "Research"],
  },
  {
    slug: "value-addition",
    name: "Value Addition & Technology",
    short: "Value Add",
    tagline: "Turning raw harvest into premium products.",
    description: "Support for producers to add value through processing, packaging, and technology adoption.",
    image: valueadd,
    tags: ["Processing", "Technology"],
  },
];

export const getProgram = (slug: string) => programs.find((p) => p.slug === slug);
