module.exports = {
  eleventyExcludeFromCollections: true,
  eleventyComputed: {
    permalink: (data) => (data.privacy.mode === 'off' ? false : '/privacy-policy/index.html'),
    privacyDraft: (data) => data.privacy.mode === 'preview'
  }
};
