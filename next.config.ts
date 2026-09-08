import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfjs-dist"],
  // pdf.js reaches for its worker through a dynamic import, which the build
  // tracer cannot see — without this the deployed function is missing the file
  // and every upload fails with "Setting up fake worker failed".
  outputFileTracingIncludes: {
    "/api/cv/parse": ["./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"],
  },
};

export default nextConfig;
