const locations = require('./locations.json');

// Area names that exist under more than one city hub (e.g. Sungai Buloh under Shah Alam and Petaling Jaya).
const slugCities = {};
locations.cities.forEach((c) => c.areas.forEach((a) => { (slugCities[a.slug] = slugCities[a.slug] || []).push(c); }));

module.exports = function() {
  return locations.cities.flatMap(city =>
    city.areas.map(area => ({
      ...area,
      city: city,
      sameName: slugCities[area.slug].filter((c) => c.slug !== city.slug).map((c) => ({ cityName: c.name, url: `/${c.slug}/${area.slug}/` })),
      title: area.seoTitle ? area.seoTitle : `Kitchen Cabinets ${area.name}, ${city.name} | Choice Kitchen Cabinet`,
      description: area.seoDescription ? area.seoDescription : `Custom kitchen cabinets in ${area.name}, ${city.name}. Premium design, delivery & installation. Free quote on WhatsApp. Trusted by 500+ families.`
    }))
  );
};
