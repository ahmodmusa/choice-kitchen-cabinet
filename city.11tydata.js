module.exports = {
  eleventyComputed: {
    title: (data) => data.city.seoTitle || `Best Price Kitchen Cabinets in ${data.city.name}`,
    description: (data) => data.city.seoDescription || `Discover the best-priced kitchen cabinets in ${data.city.name}. Customize your cabinets to suit your style and budget. Upgrade your kitchen effortlessly!`,
    city: (data) => data.city,
    area: (data) => null
  }
};
