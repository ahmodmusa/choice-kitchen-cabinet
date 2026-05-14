module.exports = {
  eleventyComputed: {
    title: (data) => `Best Price Kitchen Cabinets in ${data.city.name}`,
    description: (data) => `Discover the best-priced kitchen cabinets in ${data.city.name}. Customize your cabinets to suit your style and budget. Upgrade your kitchen effortlessly!`,
    city: (data) => data.city,
    area: (data) => null
  }
};
