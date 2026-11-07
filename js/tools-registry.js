/**
 * EcrioX - Central Tools & Categories Registry
 * Authoritative data source for tools, categories, routes, and statuses.
 * Powers global search, category pages, filter tabs, and related recommendations.
 */

const ECRIOX_CATEGORIES = [
  {
    id: "pdf",
    name: "PDF Tools",
    slug: "pdf",
    route: "/tools/pdf/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
    title: "Free PDF Tools Online – Compress, Merge, Split & Convert PDFs | EcrioX",
    description: "Compress, merge, split, and convert PDF documents quickly and securely with 100% private in-browser processing."
  },
  {
    id: "image",
    name: "Image Tools",
    slug: "image",
    route: "/tools/image/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`,
    title: "Free Online Image Tools – Resize, Compress, Crop & Convert | EcrioX",
    description: "Optimize, resize, crop, and convert image formats right in your browser with zero remote uploads."
  },
  {
    id: "document",
    name: "Document Tools",
    slug: "document",
    route: "/tools/document/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`,
    title: "Free Online Document Tools – Convert and Manage Documents | EcrioX",
    description: "Convert Markdown to HTML, transform CSV to JSON, and inspect document statistics without software installation."
  },
  {
    id: "developer",
    name: "Developer Tools",
    slug: "developer",
    route: "/tools/developer/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`,
    title: "Free Developer Tools Online – JSON, Base64, Regex & Code Utilities | EcrioX",
    description: "Format JSON, encode Base64, generate cryptographic hashes, and inspect tokens with secure client-side code tools."
  },
  {
    id: "text",
    name: "Text Tools",
    slug: "text",
    route: "/tools/text/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>`,
    title: "Free Online Text Tools – Word Counter, Case Converter & Text Utilities | EcrioX",
    description: "Count words, convert case, remove duplicate lines, generate lorem ipsum, and clean excess whitespace in real time."
  },
  {
    id: "calculators",
    name: "Calculators",
    slug: "calculators",
    route: "/tools/calculators/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="16" y1="14" x2="16" y2="14.01"></line><line x1="12" y1="14" x2="12" y2="14.01"></line><line x1="8" y1="14" x2="8" y2="14.01"></line><line x1="16" y1="18" x2="16" y2="18.01"></line><line x1="12" y1="18" x2="12" y2="18.01"></line><line x1="8" y1="18" x2="8" y2="18.01"></line></svg>`,
    title: "Free Online Calculators – Finance, Math, Percentage & Unit Tools | EcrioX",
    description: "Calculate percentages, loan EMIs, exact age differences, and convert physical measurement units accurately."
  },
  {
    id: "media",
    name: "Media Tools",
    slug: "media",
    route: "/tools/media/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>`,
    title: "Free Online Audio and Video Tools – Convert, Trim & Extract | EcrioX",
    description: "Inspect audio and video metadata, boost or normalize volume, and process media assets in your browser."
  },
  {
    id: "ai",
    name: "AI Tools",
    slug: "ai",
    route: "/tools/ai/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path></svg>`,
    title: "Free AI Tools Online – Summarize, Rewrite & Improve Text | EcrioX",
    description: "Generate structured prompts, frameworks, and text ideas using modern generative AI architectures."
  },
  {
    id: "productivity",
    name: "Productivity Tools",
    slug: "productivity",
    route: "/tools/productivity/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
    title: "Free Productivity Tools Online – Timers, Checklists & Task Utilities | EcrioX",
    description: "Pomodoro focus timers, QR code generators, secure password creators, and everyday task utilities."
  },
  {
    id: "tech-lab",
    name: "Technology & Device Lab",
    slug: "tech-lab",
    route: "/tools/tech-lab/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>`,
    title: "Technology & Device Lab – Internet, Wi-Fi & 5G Diagnostics | EcrioX",
    description: "Explore, test and understand the technology behind everyday devices. Measure internet speed, diagnose Wi-Fi signal quality, and check phone 5G band compatibility."
  },
  {
    id: "career",
    name: "Career Studio",
    slug: "career",
    route: "/resume-builder/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>`,
    title: "EcrioX Career Studio – Free ATS Resume Builder, Checker & Career Tools",
    description: "Create ATS-compliant resumes, check resume scores, match job descriptions, generate cover letters, and export print-ready PDFs."
  }
];

const ECRIOX_TOOLS = [
  // ==========================================
  // PDF TOOLS
  // ==========================================
  {
    id: "pdf-editor",
    name: "PDF Editor",
    category: "pdf",
    categoryName: "PDF Tools",
    description: "Professional online PDF editor. Add text, draw electronic signatures, annotate, insert images, organize pages, and redact securely.",
    route: "/pdf-editor/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`,
    status: "available",
    popular: true,
    tags: ["pdf", "editor", "edit pdf", "sign pdf", "annotate", "electronic signature", "redact", "pdf editor online"]
  },
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
    id: "pdf-to-word",
    name: "PDF to Word Converter",
    category: "pdf",
    categoryName: "PDF Tools",
    description: "Convert PDF documents to editable Microsoft Word (.docx) files online with paragraphs, headings, and formatting preserved.",
    route: "/pdf-to-word/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
    status: "available",
    popular: true,
    tags: ["pdf", "word", "docx", "convert", "pdf to word", "pdf to docx", "editable"]
  },
  {
    id: "add-page-numbers-to-pdf",
    name: "Add Page Numbers to PDF",
    category: "pdf",
    categoryName: "PDF Tools",
    description: "Insert customizable page numbers, headers, and footers into PDF documents with position, font, and format options.",
    route: "/add-page-numbers-to-pdf/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>`,
    status: "available",
    popular: true,
    tags: ["pdf", "page numbers", "paginate", "number pdf", "header", "footer", "add page numbers to pdf"]
  },
  {
    id: "crop-pdf",
    name: "Crop PDF",
    category: "pdf",
    categoryName: "PDF Tools",
    description: "Trim empty white margins or crop PDF pages visually with an interactive marquee box and apply to all pages.",
    route: "/crop-pdf/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2v14a2 2 0 0 0 2 2h14"></path><path d="M18 22V8a2 2 0 0 0-2-2H2"></path></svg>`,
    status: "available",
    popular: true,
    tags: ["pdf", "crop", "trim", "margins", "crop pdf", "trim margins", "resize pdf"]
  },

  // ==========================================
  // IMAGE TOOLS
  // ==========================================
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
    id: "background-remover",
    name: "AI Background Remover",
    category: "image",
    categoryName: "Image Tools",
    description: "Remove image backgrounds automatically in seconds. 100% private in-browser AI processing with HD PNG export.",
    route: "/background-remover/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`,
    status: "available",
    popular: true,
    tags: ["image", "background remover", "remove bg", "transparent background", "ai", "cutout", "png"]
  },
  {
    id: "heic-to-jpg",
    name: "HEIC to JPG Converter",
    category: "image",
    categoryName: "Image Tools",
    description: "Convert Apple HEIC and HEIF iPhone photos into high-quality JPG or PNG images with batch ZIP download.",
    route: "/heic-to-jpg/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`,
    status: "available",
    popular: true,
    tags: ["heic", "heif", "iphone photos", "convert heic to jpg", "heic to png", "apple photos"]
  },
  {
    id: "image-to-text",
    name: "Image to Text OCR",
    category: "image",
    categoryName: "Image Tools",
    description: "Extract readable, editable text from photos, scans, and screenshots with 100% private in-browser OCR.",
    route: "/image-to-text/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3"></path><path d="M9 20h6"></path><path d="M12 4v16"></path></svg>`,
    status: "available",
    popular: true,
    tags: ["ocr", "image to text", "extract text", "photo to text", "screenshot to text", "transcribe"]
  },
  {
    id: "image-color-picker",
    name: "Image Color Picker",
    category: "image",
    categoryName: "Image Tools",
    description: "Sample pixel colors with 10x magnifier loupe, copy HEX, RGB, HSL, and CMYK codes, and extract palettes.",
    route: "/image-color-picker/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polygon points="12 8 8 12 12 16 16 12 12 8"></polygon></svg>`,
    status: "available",
    popular: true,
    tags: ["color picker", "image color picker", "eyedropper", "hex", "rgb", "hsl", "cmyk", "palette"]
  },
  {
    id: "png-to-webp",
    name: "PNG to WebP Converter",
    category: "image",
    categoryName: "Image Tools",
    description: "Batch convert PNG images to lightweight WebP format with alpha transparency preservation and ZIP archive packaging.",
    route: "/png-to-webp/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><polyline points="10 10 14 14 18 10"></polyline></svg>`,
    status: "available",
    popular: true,
    tags: ["png to webp", "convert png to webp", "webp converter", "transparent webp", "compress png"]
  },
  {
    id: "image-metadata-remover",
    name: "Image Metadata Viewer & Remover",
    category: "image",
    categoryName: "Image Tools",
    description: "Inspect hidden EXIF, camera model, and GPS geolocation coordinates in photos, then wipe all metadata for privacy.",
    route: "/image-metadata-remover/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,
    status: "available",
    popular: true,
    tags: ["exif", "metadata", "remove exif", "strip metadata", "wipe gps", "photo privacy", "exif viewer"]
  },

  // ==========================================
  // DEVELOPER TOOLS
  // ==========================================
  {
    id: "json-formatter",
    name: "JSON Formatter & Validator",
    category: "developer",
    categoryName: "Developer Tools",
    description: "Beautify, validate, and minify JSON code with error line detection and one-click copy.",
    route: "/tools/developer/json-formatter/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`,
    status: "available",
    popular: true,
    tags: ["json", "formatter", "validator", "minify", "beautify", "json formatter online", "developer"]
  },
  {
    id: "base64-tool",
    name: "Base64 Encoder & Decoder",
    category: "developer",
    categoryName: "Developer Tools",
    description: "Encode and decode text to and from Base64 with URL-safe encoding and live character counting.",
    route: "/tools/developer/base64/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>`,
    status: "available",
    popular: true,
    tags: ["base64", "encode", "decode", "binary", "developer", "base64 encoder", "base64 decoder"]
  },
  {
    id: "hash-generator",
    name: "Hash Generator",
    category: "developer",
    categoryName: "Developer Tools",
    description: "Compute cryptographic hashes (SHA-256, SHA-512, SHA-384, SHA-1) client-side with Web Crypto API.",
    route: "/tools/developer/hash-generator/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`,
    status: "available",
    popular: false,
    tags: ["hash", "sha256", "sha512", "sha1", "crypto", "checksum", "digest"]
  },
  {
    id: "uuid-generator",
    name: "UUID Generator",
    category: "developer",
    categoryName: "Developer Tools",
    description: "Generate cryptographically secure v4 UUIDs in bulk with uppercase, lowercase, and formatting options.",
    route: "/tools/developer/uuid-generator/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="15"></line><line x1="15" y1="9" x2="9" y2="15"></line></svg>`,
    status: "available",
    popular: false,
    tags: ["uuid", "guid", "generator", "v4", "unique id", "developer"]
  },

  // ==========================================
  // TEXT TOOLS
  // ==========================================
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
  {
    id: "remove-duplicate-lines",
    name: "Remove Duplicate Lines",
    category: "text",
    categoryName: "Text Tools",
    description: "Clean lists and text files by removing duplicate lines, sorting alphabetically, and stripping empty spaces.",
    route: "/tools/text/remove-duplicate-lines/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>`,
    status: "available",
    popular: false,
    tags: ["text", "dedupe", "duplicate lines", "sort", "clean list", "remove duplicate lines"]
  },
  {
    id: "lorem-ipsum",
    name: "Lorem Ipsum Generator",
    category: "text",
    categoryName: "Text Tools",
    description: "Generate placeholder filler text by paragraphs, sentences, or words for mockups and designs.",
    route: "/tools/text/lorem-ipsum/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`,
    status: "available",
    popular: false,
    tags: ["lorem ipsum", "dummy text", "generator", "placeholder", "filler text"]
  },

  // ==========================================
  // CALCULATORS
  // ==========================================
  {
    id: "gst-calculator",
    name: "GST Calculator India",
    category: "calculators",
    categoryName: "Calculators",
    description: "Calculate GST inclusive and exclusive prices, reverse GST, CGST, SGST, and IGST for 5%, 12%, 18%, and 28% slabs.",
    route: "/gst-calculator/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`,
    status: "available",
    popular: true,
    tags: ["gst calculator", "gst india", "reverse gst", "inclusive gst", "cgst sgst", "igst", "tax calculator"]
  },
  {
    id: "invoice-generator",
    name: "Invoice Generator",
    category: "calculators",
    categoryName: "Calculators",
    description: "Create and download professional PDF invoices with custom line items, business logo, GST/VAT taxes, and discounts.",
    route: "/invoice-generator/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`,
    status: "available",
    popular: true,
    tags: ["invoice generator", "create invoice", "free invoice", "pdf invoice", "bill maker", "gst invoice"]
  },
  {
    id: "percentage-calculator",
    name: "Percentage Calculator",
    category: "calculators",
    categoryName: "Calculators",
    description: "Calculate percentages, percentage increase or decrease, and proportions with step-by-step formulas.",
    route: "/tools/calculators/percentage/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="5" x2="5" y2="19"></line><circle cx="6.5" cy="6.5" r="2.5"></circle><circle cx="17.5" cy="17.5" r="2.5"></circle></svg>`,
    status: "available",
    popular: true,
    tags: ["percentage", "calculator", "math", "percent increase", "percent decrease", "percentage calculator"]
  },
  {
    id: "emi-calculator",
    name: "EMI & Loan Calculator",
    category: "calculators",
    categoryName: "Calculators",
    description: "Calculate monthly loan EMIs, total interest payable, and repayment schedules with breakdown charts.",
    route: "/tools/calculators/emi/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"></rect><line x1="12" y1="8" x2="12" y2="12"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>`,
    status: "available",
    popular: true,
    tags: ["emi", "loan", "calculator", "mortgage", "interest", "finance", "emi calculator"]
  },
  {
    id: "age-calculator",
    name: "Age & Date Difference Calculator",
    category: "calculators",
    categoryName: "Calculators",
    description: "Calculate exact age in years, months, days, total weeks, and track the countdown to your next birthday.",
    route: "/age-calculator/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>`,
    status: "available",
    popular: true,
    tags: ["age", "birthday", "date difference", "days between dates", "age calculator", "calculate age online"]
  },
  {
    id: "unit-converter",
    name: "Unit Converter",
    category: "calculators",
    categoryName: "Calculators",
    description: "Convert units of length, weight, temperature, speed, and digital data storage with precision.",
    route: "/tools/calculators/unit-converter/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>`,
    status: "available",
    popular: false,
    tags: ["unit converter", "length", "weight", "temperature", "storage", "metric", "imperial"]
  },

  // ==========================================
  // PRODUCTIVITY TOOLS
  // ==========================================
  {
    id: "pomodoro-timer",
    name: "Pomodoro Focus Timer",
    category: "productivity",
    categoryName: "Productivity Tools",
    description: "Boost focus and track work intervals with customizable Pomodoro sessions, breaks, and audio chimes.",
    route: "/tools/productivity/pomodoro/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
    status: "available",
    popular: true,
    tags: ["pomodoro", "timer", "focus", "productivity", "study timer", "work timer"]
  },
  {
    id: "qr-code-generator",
    name: "QR Code Generator",
    category: "productivity",
    categoryName: "Productivity Tools",
    description: "Generate custom QR codes for URLs, Wi-Fi, WhatsApp, vCards, emails, and SMS with high-res PNG and SVG download.",
    route: "/qr-code-generator/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`,
    status: "available",
    popular: true,
    tags: ["qr code", "generator", "barcode", "wifi qr", "whatsapp qr", "vcard qr", "create qr code", "productivity", "svg qr"]
  },
  {
    id: "password-generator",
    name: "Password Generator",
    category: "productivity",
    categoryName: "Productivity Tools",
    description: "Generate cryptographically secure passwords and memorable passphrases with custom character sets and live entropy meter.",
    route: "/password-generator/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`,
    status: "available",
    popular: true,
    tags: ["password", "generator", "passphrase", "security", "random password", "secure password", "diceware"]
  },

  // ==========================================
  // DOCUMENT TOOLS
  // ==========================================
  {
    id: "markdown-to-html",
    name: "Markdown to HTML Converter",
    category: "document",
    categoryName: "Document Tools",
    description: "Write or paste Markdown and instantly convert it into clean HTML code with live preview and download.",
    route: "/tools/document/markdown-to-html/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>`,
    status: "available",
    popular: true,
    tags: ["markdown", "html", "converter", "md to html", "document"]
  },
  {
    id: "csv-to-json",
    name: "CSV to JSON & JSON to CSV",
    category: "document",
    categoryName: "Document Tools",
    description: "Convert tabular CSV spreadsheets into JSON arrays and JSON objects into CSV files seamlessly.",
    route: "/tools/document/csv-to-json/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`,
    status: "available",
    popular: true,
    tags: ["csv", "json", "converter", "csv to json", "json to csv", "spreadsheet"]
  },

  // ==========================================
  // MEDIA TOOLS
  // ==========================================
  {
    id: "audio-inspector",
    name: "Audio Inspector & Volume Adjuster",
    category: "media",
    categoryName: "Media Tools",
    description: "Inspect audio file metadata, analyze waveform dynamics, and amplify or attenuate volume in your browser.",
    route: "/tools/media/audio-inspector/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`,
    status: "available",
    popular: false,
    tags: ["audio", "volume", "sound", "inspector", "waveform", "media tools", "amplify"]
  },

  // ==========================================
  // AI TOOLS
  // ==========================================
  {
    id: "ai-prompt-generator",
    name: "AI Prompt Studio & Generator",
    category: "ai",
    categoryName: "AI Tools",
    description: "Craft structured, high-performing prompts for ChatGPT, Claude, and Gemini with standard architectural frameworks.",
    route: "/tools/ai/prompt-generator/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path></svg>`,
    status: "available",
    popular: true,
    tags: ["ai", "prompt", "generator", "chatgpt", "claude", "gemini", "framework"]
  },

  // ==========================================
  // TECHNOLOGY & DEVICE LAB
  // ==========================================
  {
    id: "internet-speed-test",
    name: "Internet Speed Test",
    category: "tech-lab",
    categoryName: "Technology & Device Lab",
    description: "Test real-time download speed, upload speed, latency ping, and jitter with an animated speedometer gauge. 100% genuine network transfers.",
    route: "/internet-speed-test/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline><path d="M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"></path></svg>`,
    status: "available",
    popular: true,
    tags: ["internet speed test", "wifi speed test", "broadband speed test", "download speed", "upload speed", "ping test", "jitter", "bandwidth"]
  },
  {
    id: "wifi-analyzer",
    name: "Wi-Fi Analyzer",
    category: "tech-lab",
    categoryName: "Technology & Device Lab",
    description: "Analyze Wi-Fi signal strength in dBm, evaluate 2.4 GHz vs 5 GHz vs 6 GHz frequency bands, view channel overlap interference, and troubleshoot network dead zones.",
    route: "/wifi-analyzer/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>`,
    status: "available",
    popular: true,
    tags: ["wifi analyzer", "wifi signal strength", "wifi network analyzer", "wifi frequency checker", "2.4ghz vs 5ghz", "wifi troubleshooter", "dbm"]
  },
  {
    id: "5g-band-checker",
    name: "5G Band Checker",
    category: "tech-lab",
    categoryName: "Technology & Device Lab",
    description: "Check your smartphone's supported 5G NR (Sub-6 & mmWave) and 4G LTE bands, verify carrier compatibility (Jio, Airtel, T-Mobile, Verizon), and compare phone models.",
    route: "/5g-band-checker/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>`,
    status: "available",
    popular: true,
    tags: ["5g band checker", "phone 5g bands", "supported 5g bands", "mobile network compatibility", "4g lte band checker", "jio 5g", "airtel 5g", "n78", "n28"]
  },
  {
    id: "diwali-wishes-maker",
    name: "Happy Diwali Wishes Maker",
    category: "productivity",
    categoryName: "Productivity Tools",
    description: "Create personalized Diwali greeting cards with custom names, photos, 20 royal templates, 10 Indian languages, and instant WhatsApp sharing.",
    route: "/diwali-wishes-maker/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a5 5 0 0 0-5 5c0 3 5 9 5 9s5-6 5-9a5 5 0 0 0-5-5z"></path><circle cx="12" cy="7" r="1.5"></circle></svg>`,
    status: "available",
    popular: true,
    tags: ["diwali", "diwali wishes", "diwali card maker", "happy diwali", "deepavali", "diwali greeting", "whatsapp wishes", "diwali photo card", "tamil diwali", "hindi diwali"]
  },

  // ==========================================
  // TYPING ARENA TOOLS
  // ==========================================
  {
    id: "typing-speed-test",
    name: "Typing Speed Test (Typing Arena)",
    category: "productivity",
    categoryName: "Productivity Tools",
    description: "Benchmark your typing speed (WPM) and accuracy with clean, distraction-free tests, active word highlighting, and live error analysis.",
    route: "/typing-speed-test/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"></rect><line x1="6" y1="8" x2="6.01" y2="8"></line><line x1="10" y1="8" x2="10.01" y2="8"></line><line x1="14" y1="8" x2="14.01" y2="8"></line><line x1="18" y1="8" x2="18.01" y2="8"></line><line x1="6" y1="12" x2="6.01" y2="12"></line><line x1="18" y1="12" x2="18.01" y2="12"></line><line x1="8" y1="16" x2="16" y2="16"></line></svg>`,
    status: "available",
    popular: true,
    tags: ["typing speed test", "typing test", "wpm test", "typing speed", "typing practice", "keyboard test", "words per minute"]
  },
  {
    id: "wpm-test",
    name: "WPM Test (1-Minute Benchmark)",
    category: "productivity",
    categoryName: "Productivity Tools",
    description: "Test your Words Per Minute in 60 seconds. Accurate Net and Gross WPM calculation with speed percentile ratings.",
    route: "/wpm-test/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
    status: "available",
    popular: true,
    tags: ["wpm test", "words per minute", "1 minute typing test", "wpm calculator", "typing test 60 seconds"]
  },
  {
    id: "typing-games",
    name: "Typing Games Arcade",
    category: "productivity",
    categoryName: "Productivity Tools",
    description: "Play addictive online typing games including Word Rain, Word Blitz 60s, and Keyboard Reaction Challenge.",
    route: "/typing-games/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="6" cy="12" r="1"></circle><circle cx="10" cy="12" r="1"></circle><line x1="15" y1="10" x2="15" y2="14"></line><line x1="13" y1="12" x2="17" y2="12"></line></svg>`,
    status: "available",
    popular: true,
    tags: ["typing games", "word rain", "word blitz", "typing games for adults", "typing arcade", "free typing games"]
  },
  {
    id: "typing-practice",
    name: "Weak Key Detector & Practice",
    category: "productivity",
    categoryName: "Productivity Tools",
    description: "Identify frequently mistyped keys with an interactive error heatmap and generate personalized drills focused on your problem keys.",
    route: "/typing-practice/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>`,
    status: "available",
    popular: true,
    tags: ["typing practice", "weak key detector", "keyboard heatmap", "improve typing accuracy", "touch typing practice"]
  },
  {
    id: "typing-race",
    name: "Typing Race Speedway",
    category: "productivity",
    categoryName: "Productivity Tools",
    description: "Race your car on the typing speedway against calibrated pacer bots or challenge friends with private race rooms.",
    route: "/typing-race/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 17h4V5H10z"></path><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h6z"></path><path d="M4 17h2V9H1a4 4 0 0 0 1.17 2.83L4 13.66V17z"></path></svg>`,
    status: "available",
    popular: true,
    tags: ["typing race", "multiplayer typing", "type racer", "car typing game", "speed typing competition"]
  },
  {
    id: "typing-certificate",
    name: "Typing Speed Certificate",
    category: "productivity",
    categoryName: "Productivity Tools",
    description: "Generate and download a high-resolution, verified typing speed certificate with your WPM score and accuracy for resumes and LinkedIn.",
    route: "/typing-certificate/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><circle cx="12" cy="15" r="3"></circle></svg>`,
    status: "available",
    popular: true,
    tags: ["typing certificate", "wpm certificate", "typing speed certificate", "verified typing test", "resume typing certificate"]
  },

  // ==========================================
  // CAREER STUDIO TOOLS
  // ==========================================
  {
    id: "resume-builder",
    name: "ATS Resume Builder",
    category: "career",
    categoryName: "Career Studio",
    description: "Create professional ATS-compliant resumes with 20+ templates, multi-version management, live preview, and vector PDF export.",
    route: "/resume-builder/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
    status: "available",
    popular: true,
    tags: ["resume builder", "ats resume", "free resume maker", "cv builder", "professional resume", "resume pdf export", "resume templates"]
  },
  {
    id: "ats-resume-checker",
    name: "ATS Resume Checker",
    category: "career",
    categoryName: "Career Studio",
    description: "Audit resume structure, formatting, action verbs, and machine readability with an instant 0–100 score and actionable recommendations.",
    route: "/ats-resume-checker/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline><path d="M22 12h-4"></path><path d="M6 12H2"></path><path d="M12 6V2"></path><path d="M12 22v-4"></path></svg>`,
    status: "available",
    popular: true,
    tags: ["ats checker", "resume score", "resume scanner", "ats score", "ats compatibility", "resume review", "resume test"]
  },
  {
    id: "resume-job-matcher",
    name: "Job Description Matcher",
    category: "career",
    categoryName: "Career Studio",
    description: "Compare your resume against any job description to discover matched technical competencies, missing keywords, and match percentages.",
    route: "/resume-job-matcher/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
    status: "available",
    popular: true,
    tags: ["job matcher", "resume job matcher", "keyword match", "job description match", "resume tailoring", "ats keywords"]
  },
  {
    id: "cover-letter-generator",
    name: "Cover Letter Generator",
    category: "career",
    categoryName: "Career Studio",
    description: "Craft personalized cover letters tailored to your target company and role across formal, tech, and concise tones with printable letterheads.",
    route: "/cover-letter-generator/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`,
    status: "available",
    popular: true,
    tags: ["cover letter", "cover letter generator", "cover letter builder", "job application letter", "letterhead pdf"]
  },
  {
    id: "resume-bullet-improver",
    name: "Resume Bullet Improver",
    category: "career",
    categoryName: "Career Studio",
    description: "Transform weak, passive job descriptions into impactful, achievement-oriented bullets using proven action verb formulas.",
    route: "/resume-bullet-improver/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
    status: "available",
    popular: true,
    tags: ["bullet point improver", "action verbs", "resume bullets", "resume rewrite", "achievement formula"]
  },
  {
    id: "professional-summary-generator",
    name: "Summary Generator",
    category: "career",
    categoryName: "Career Studio",
    description: "Create tailored resume summaries and elevator pitches for experienced specialists, entry-level freshers, and career changers.",
    route: "/professional-summary-generator/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`,
    status: "available",
    popular: false,
    tags: ["summary generator", "resume summary", "resume objective", "profile summary", "career objective"]
  },
  {
    id: "resume-templates",
    name: "20+ Resume Templates",
    category: "career",
    categoryName: "Career Studio",
    description: "Browse 20+ professional resume templates optimized for ATS parsers and human hiring managers across tech, business, and creative fields.",
    route: "/resume-templates/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>`,
    status: "available",
    popular: true,
    tags: ["resume templates", "ats templates", "cv templates", "free resume designs", "software engineer template"]
  },
  {
    id: "resume-keyword-optimizer",
    name: "Keyword Optimizer",
    category: "career",
    categoryName: "Career Studio",
    description: "Analyze term frequency and keyword density across your resume and job postings to maximize search relevance.",
    route: "/resume-keyword-optimizer/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`,
    status: "available",
    popular: false,
    tags: ["keyword optimizer", "resume keywords", "keyword density", "ats density scanner"]
  },

  // ==========================================
  // WORLDVIEW GLOBAL LIVE CAMERAS
  // ==========================================
  {
    id: "world-live-cameras",
    name: "World Live Cameras",
    category: "media",
    categoryName: "Media Tools",
    description: "Explore the world live through an interactive 3D Earth globe, 2D world map, and verified real-time camera feeds across 7 continents.",
    route: "/world-live-cameras/",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`,
    status: "available",
    popular: true,
    tags: ["world live cameras", "live webcams", "earth live cameras", "3d globe webcam", "city live camera", "beach webcam", "traffic camera", "nature live stream", "times square live"]
  }
];

// Helper Functions
const EcrioXRegistry = {
  getCategories: () => ECRIOX_CATEGORIES,
  getCategoryById: (id) => ECRIOX_CATEGORIES.find((c) => c.id === id || c.slug === id),
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
