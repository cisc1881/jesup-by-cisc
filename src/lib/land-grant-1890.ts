/** University names and marks from the 1890 Universities Foundation directory. */
export const LAND_GRANT_1890_SOURCE = "https://www.1890foundation.org/1890-universities/";
const logoBase = "https://www.1890foundation.org/wp-content/uploads/2026/08/";

export const landGrant1890Universities = [
  {
    slug: "alabama-a-and-m-university",
    name: "Alabama A&M University",
    location: "Normal, AL",
    logo: "AAMU-2.png",
  },
  {
    slug: "alcorn-state-university",
    name: "Alcorn State University",
    location: "Lorman, MS",
    logo: "alcorn-state.png",
  },
  {
    slug: "central-state-university",
    name: "Central State University",
    location: "Wilberforce, OH",
    logo: "Central-State-Primary-Logo-Maroon-scaled.png",
  },
  {
    slug: "delaware-state-university",
    name: "Delaware State University",
    location: "Dover, DE",
    logo: "logos-university-_0015_delaware-state-university.png",
  },
  {
    slug: "florida-a-and-m-university",
    name: "Florida A&M University",
    location: "Tallahassee, FL",
    logo: "logos-university-_0014_florida-agricultural-mech-unviersity.png",
  },
  {
    slug: "fort-valley-state-university",
    name: "Fort Valley State University",
    location: "Fort Valley, GA",
    logo: "logos-university-_0013_fort-valley.png",
  },
  {
    slug: "kentucky-state-university",
    name: "Kentucky State University",
    location: "Frankfort, KY",
    logo: "logos-university-_0012_kentucky-state.png",
  },
  {
    slug: "langston-university",
    name: "Langston University",
    location: "Langston, OK",
    logo: "logos-university-_0011_langston-university.png",
  },
  {
    slug: "lincoln-university",
    name: "Lincoln University",
    location: "Jefferson City, MO",
    logo: "logos-university-_0010_lincoln-missouri-university.png",
  },
  {
    slug: "north-carolina-a-and-t-state-university",
    name: "North Carolina A&T State University",
    location: "Greensboro, NC",
    logo: "NCAT_3-stack-logo.png",
  },
  {
    slug: "prairie-view-a-and-m-university",
    name: "Prairie View A&M University",
    location: "Prairie View, TX",
    logo: "logos-university-_0008_prairie-view.png",
  },
  {
    slug: "south-carolina-state-university",
    name: "South Carolina State University",
    location: "Orangeburg, SC",
    logo: "logos-university-_0007_sc-state-university.png",
  },
  {
    slug: "southern-university-and-a-and-m-college",
    name: "Southern University and A&M College",
    location: "Baton Rouge, LA",
    logo: "southernuniversitylogo.png",
  },
  {
    slug: "tennessee-state-university",
    name: "Tennessee State University",
    location: "Nashville, TN",
    logo: "logos-university-_0005_TN-state.png",
  },
  {
    slug: "tuskegee-university",
    name: "Tuskegee University",
    location: "Tuskegee, AL",
    logo: "logos-university-_0004_tuskegee.png",
  },
  {
    slug: "university-of-arkansas-at-pine-bluff",
    name: "University of Arkansas at Pine Bluff",
    location: "Pine Bluff, AR",
    logo: "logos-university-_0003_arkansas.png",
  },
  {
    slug: "university-of-maryland-eastern-shore",
    name: "University of Maryland Eastern Shore",
    location: "Princess Anne, MD",
    logo: "logos-university-_0002_maryland.png",
  },
  {
    slug: "virginia-state-university",
    name: "Virginia State University",
    location: "Petersburg, VA",
    logo: "logos-university-_0001_virginia-state.png",
  },
  {
    slug: "west-virginia-state-university",
    name: "West Virginia State University",
    location: "Institute, WV",
    logo: "logos-university-_0000_west-virginia-state.png",
  },
] as const;

export function landGrant1890Logo(slug: string): string | null {
  const university = landGrant1890Universities.find((item) => item.slug === slug);
  return university ? `${logoBase}${university.logo}` : null;
}
