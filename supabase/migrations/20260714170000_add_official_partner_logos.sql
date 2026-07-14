-- Use unmodified marks published by each partner on its official website.
-- These URLs remain editable in the partner admin if an organization supplies
-- a preferred brand asset later.
update public.partners
set logo_url = case slug
  when 'tuskegee-university-caens' then
    'https://www.tuskegee.edu/_files/images/logos/TU_logo_horizontal_transparent_red.png'
  when 'usda' then
    'https://www.climatehubs.usda.gov/sites/default/files/styles/large/public/USDA_logo.jpg?itok=9xfuvZcL'
  when 'alabama-department-agriculture-industries' then
    'https://agi.alabama.gov/wp-content/uploads/2025/02/AGI-2020-HEADER-COLOR-Web.png'
  when 'heart-of-alabama-food-bank' then
    'https://hafb.org/wp-content/uploads/2024/12/hafb-40th-horizontal-with-main-full-color-rgb-900px-w-144ppi.png'
  when 'infas' then
    'https://asi.ucdavis.edu/sites/g/files/dgvnsk5751/files/media/images/Horizontal-Lockup_Color.jpg'
  else logo_url
end
where slug in (
  'tuskegee-university-caens',
  'usda',
  'alabama-department-agriculture-industries',
  'heart-of-alabama-food-bank',
  'infas'
);
