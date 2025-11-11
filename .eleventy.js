const eleventyEdge = require("@11ty/eleventy-plugin-edge");

module.exports = function(eleventyConfig) {
  // Add Eleventy Edge plugin for authentication
  eleventyConfig.addPlugin(eleventyEdge, {
    // Edge functions directory
    functionsDir: "./netlify/edge-functions/",
  });

  // Pass through static assets
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/images");

  // Create a collection for all albums
  eleventyConfig.addCollection("albums", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/albums/*.md").sort((a, b) => {
      return b.date - a.date;
    });
  });

  // Create a collection for public albums only
  eleventyConfig.addCollection("publicAlbums", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/albums/*.md")
      .filter(item => !item.data.private)
      .sort((a, b) => {
        return b.date - a.date;
      });
  });

  // Create a collection for private albums
  eleventyConfig.addCollection("privateAlbums", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/albums/*.md")
      .filter(item => item.data.private === true)
      .sort((a, b) => {
        return b.date - a.date;
      });
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      layouts: "_layouts"
    }
  };
};
