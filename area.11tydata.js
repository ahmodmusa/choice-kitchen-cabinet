module.exports = {
  eleventyComputed: {
    title: (data) => `Best Price Kitchen Cabinets in ${data.area.name} (${data.city.name})`,
    description: (data) => `Discover best-priced kitchen cabinets in ${data.area.name}, ${data.city.name}. Customize your cabinets to suit your style and budget.`,
    city: (data) => data.city,
    area: (data) => data.area
  }
};
