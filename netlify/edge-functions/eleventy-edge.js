// This is the main Eleventy Edge function that enables
// server-rendered content with access to cookies and request data

import { EleventyEdge } from "eleventy-edge";

export default async (request, context) => {
  try {
    // Initialize Eleventy Edge
    const edge = new EleventyEdge("edge", {
      request,
      context,
    });

    // Add authentication status to edge context
    const cookies = request.headers.get('cookie') || '';
    const isAuthenticated = cookies.includes('authenticated=true');

    edge.config((eleventyConfig) => {
      // Make authentication status available in templates
      eleventyConfig.addGlobalData("eleventy.edge.cookies", {
        authenticated: isAuthenticated
      });
    });

    return await edge.handleResponse();
  } catch (e) {
    console.log("ERROR", { e });
    return context.next(e);
  }
};

export const config = {
  path: "/*",
};
