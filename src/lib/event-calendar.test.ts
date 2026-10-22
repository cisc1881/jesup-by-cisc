import { expect, it } from "vitest";
import { buildEventIcs } from "./event-calendar";

it("exports FC135 as February 18–19 all-day dates without inventing session times", () => {
  const result = buildEventIcs({ id:"fc135",title:"135th Annual Farmers Conference",description:"A Legacy in the Soil, A Vision in the Seed",location:"Tuskegee University Historic Campus",startsAt:"2027-02-18T06:00:00Z",endsAt:"2027-02-20T06:00:00Z",metadata:{date_only:true,start_date:"2027-02-18",end_date:"2027-02-19"} });
  expect(result).toContain("DTSTART;VALUE=DATE:20270218");
  expect(result).toContain("DTEND;VALUE=DATE:20270220");
  expect(result).not.toContain("DTSTART:20270218T060000Z");
});