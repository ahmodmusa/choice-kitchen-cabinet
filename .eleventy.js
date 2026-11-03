module.exports = function(eleventyConfig) {
  // Copy static assets
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("js");
  eleventyConfig.addPassthroughCopy("images");
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("robots.txt");
  eleventyConfig.addPassthroughCopy("_redirects");
  
  // Add filters
  eleventyConfig.addFilter("slugify", function(str) {
    return str.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  });

  eleventyConfig.addFilter("kebabCase", function(str) {
    return str.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  });

  // Escape a raw string for safe use *inside* a JSON-LD string literal.
  // Nunjucks autoescape would otherwise emit HTML entities (e.g. "&amp;") into JSON.
  eleventyConfig.addFilter("jsonString", function(str) {
    return JSON.stringify(String(str == null ? "" : str)).slice(1, -1).replace(/</g, "\u003c");
  });

  eleventyConfig.addFilter("limit", function(arr, limit) {
    return arr.slice(0, limit);
  });

  return {
    dir: {
      input: ".",
      output: "_site",
      includes: "_includes",
      data: "_data"
    }
  };
};
