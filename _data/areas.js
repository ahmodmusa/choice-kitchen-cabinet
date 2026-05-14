const locations = require('./locations.json');

module.exports = function() {
  return locations.cities.flatMap(city => 
    city.areas.map(area => ({
      ...area,
      city: city
    }))
  );
};
