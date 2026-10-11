const locations = require('./locations.json');

module.exports = function() {
  return locations.cities.flatMap(city => 
    city.areas.map(area => ({
      ...area,
      city: city,
      title: area.seoTitle ? area.seoTitle : `Kitchen Cabinets ${area.name}, ${city.name} | Choice Kitchen Cabinet`,
      description: area.seoDescription ? area.seoDescription : `Custom kitchen cabinets in ${area.name}, ${city.name}. Premium design, delivery & installation. Free quote on WhatsApp. Trusted by 500+ families.`
    }))
  );
};
