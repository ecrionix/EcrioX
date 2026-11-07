/**
 * EcrioX - Central Tools & Categories Registry
 * Authoritative data source for tools, categories, routes, and statuses.
 * Enables zero-code catalog scaling and consistent navigation across pages.
 */

const ECRIOX_CATEGORIES = [
  {
    id: "pdf",
    name: "PDF Tools",
    slug: "pdf",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
    description: "Compress, merge, split, and convert PDF documents quickly and securely."
  },
  {
    id: "image",
    name: "Image Tools",
    slug: "image",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`,
    description: "Optimize, resize, crop, and convert image formats right in your browser."
  },
  {
    id: "document",
    name: "Document Tools",
    slug: "document",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`,
    description: "Format, convert, and manage text and office document formats effortlessly."
  },
  {
    id: "developer",
    name: "Developer Tools",
    slug: "developer",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`,
    description: "Code formatters, encoders, regex testers, JSON validators, and utility scripts."
  },
  {
    id: "text",
    name: "Text Tools",
    slug: "text",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>`,
    description: "Case converters, word counters, diff checkers, and text formatting helpers."
  },
  {
    id: "calculators",
    name: "Calculators",
    slug: "calculators",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="16" y1="14" x2="16" y2="14.01"></line><line x1="12" y1="14" x2="12" y2="14.01"></line><line x1="8" y1="14" x2="8" y2="14.01"></line><line x1="16" y1="18" x2="16" y2="18.01"></line><line x1="12" y1="18" x2="12" y2="18.01"></line><line x1="8" y1="18" x2="8" y2="18.01"></line></svg>`,
    description: "Financial, mathematical, percentage, date, and unit conversion calculators."
  },
  {
    id: "media",
    name: "Media Tools",
    slug: "media",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>`,
    description: "Audio and video conversion, trimming, extraction, and playback utilities."
  },
  {
    id: "ai",
    name: "AI Tools",
    slug: "ai",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path></svg>`,
    description: "Intelligent prompts, summarizers, text rewriting, and AI-assisted workflows."
  },
  {
    id: "productivity",
    name: "Productivity Tools",
    slug: "productivity",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
    description: "Pomodoro timers, checklist generators, notes, and task management helpers."
  }
];

const ECRIOX_TOOLS = [
  // --- Active & Production-Ready Tools ---
  {
    id: "pdf-compressor",
    name: "PDF Compressor",
    category: "pdf",
    categoryName: "PDF Tools",
    description: "Reduce PDF document size while preserving readable text, crisp vector graphics and document quality.",
    route: "/pdf-compressor/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><polyline points="10 13 12 11 14 13"></polyline><line x1="12" y1="11" x2="12" y2="17"></line></svg>`,
    status: "available",
    popular: true,
    tags: ["pdf", "compress", "shrink", "reduce", "optimize", "reduce pdf size", "compress pdf online"]
  },
  {
    id: "merge-pdf",
    name: "Merge PDF",
    category: "pdf",
    categoryName: "PDF Tools",
    description: "Combine multiple PDF files into one document online for free. Arrange file order, preview, and download.",
    route: "/merge-pdf/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"></rect><line x1="12" y1="9" x2="12" y2="15"></line><line x1="9" y1="12" x2="15" y2="12"></line></svg>`,
    status: "available",
    popular: true,
    tags: ["pdf", "merge", "combine", "join", "merge pdf online", "combine pdf files"]
  },
  {
    id: "split-pdf",
    name: "Split PDF",
    category: "pdf",
    categoryName: "PDF Tools",
    description: "Extract selected pages, separate page ranges or create individual PDFs from your document.",
    route: "/split-pdf/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><line x1="20" y1="4" x2="8.12" y2="15.88"></line><line x1="14.47" y1="14.48" x2="20" y2="20"></line><line x1="8.12" y1="8.12" x2="12" y2="12"></line></svg>`,
    status: "available",
    popular: true,
    tags: ["pdf", "split", "extract", "pages", "split pdf online", "separate pdf pages"]
  },
  {
    id: "jpg-to-pdf",
    name: "JPG to PDF",
    category: "pdf",
    categoryName: "PDF Tools",
    description: "Convert JPG and JPEG images into PDF files online. Arrange images, select page size, orientation, and margins.",
    route: "/jpg-to-pdf/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><circle cx="10" cy="13" r="1.5"></circle></svg>`,
    status: "available",
    popular: true,
    tags: ["pdf", "jpg", "convert", "image to pdf", "jpg to pdf", "jpeg to pdf", "photos to pdf"]
  },
  {
    id: "pdf-to-jpg",
    name: "PDF to JPG",
    category: "pdf",
    categoryName: "PDF Tools",
    description: "Convert PDF pages into high-quality JPG images online. Choose resolution, preview, and download individually or as ZIP.",
    route: "/pdf-to-jpg/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><polyline points="8 17 12 13 16 17"></polyline></svg>`,
    status: "available",
    popular: true,
    tags: ["pdf", "jpg", "export", "extract image", "pdf to jpg", "pdf to jpeg", "convert pdf to jpg"]
  },
  {
    id: "image-resizer",
    name: "Image Resizer",
    category: "image",
    categoryName: "Image Tools",
    description: "Resize images online for free. Change pixel dimensions or percentages, maintain aspect ratio, and export JPG, PNG, or WebP.",
    route: "/image-resizer/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>`,
    status: "available",
    popular: true,
    tags: ["image", "resize", "scale", "dimensions", "pixels", "image resizer online", "resize jpg", "resize png"]
  },
  {
    id: "image-compressor",
    name: "Image Compressor & Optimizer",
    category: "image",
    categoryName: "Image Tools",
    description: "Compress JPEG, PNG, and WebP images client-side with zero data leaving your browser.",
    route: "/tools/image-compressor/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`,
    status: "available",
    popular: true,
    tags: ["image", "compress", "optimize", "reduce size", "photo", "jpg", "png", "webp"]
  },
  {
    id: "text-analyzer",
    name: "Text Analyzer & Case Converter",
    category: "text",
    categoryName: "Text Tools",
    description: "Count words, characters, sentences, reading time, and transform case formats instantly.",
    route: "/tools/text-analyzer/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>`,
    status: "available",
    popular: true,
    tags: ["text", "word counter", "case converter", "uppercase", "lowercase", "reading time"]
  },

  // --- Upcoming Roadmap Tools ---
  {
    id: "image-converter",
    name: "Image Converter",
    category: "image",
    categoryName: "Image Tools",
    description: "Convert images seamlessly between PNG, JPG, WebP, GIF, and SVG formats.",
    route: "/tools/?cat=image",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>`,
    status: "coming_soon",
    popular: false,
    tags: ["image", "convert", "format", "png", "webp", "jpg"]
  }
];

// Helper Functions
const EcrioXRegistry = {
  getCategories: () => ECRIOX_CATEGORIES,
  getAllTools: () => ECRIOX_TOOLS,
  getAvailableTools: () => ECRIOX_TOOLS.filter((t) => t.status === "available"),
  getPopularTools: () => ECRIOX_TOOLS.filter((t) => t.popular && t.status === "available"),
  getToolsByCategory: (categorySlug) => ECRIOX_TOOLS.filter((t) => t.category === categorySlug),
  getToolById: (id) => ECRIOX_TOOLS.find((t) => t.id === id),
  searchTools: (query) => {
    if (!query || typeof query !== "string") return [];
    const q = query.toLowerCase().trim();
    return ECRIOX_TOOLS.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.categoryName.toLowerCase().includes(q) ||
        (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(q)))
    );
  }
};

// Global attachment
if (typeof window !== "undefined") {
  window.EcrioXRegistry = EcrioXRegistry;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = EcrioXRegistry;
}
