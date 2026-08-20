import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  Check,
  ChevronDown,
  ChevronRight,
  Clipboard,
  Download,
  FileCode2,
  FileImage,
  Hash,
  HeartHandshake,
  ImageUp,
  LockKeyhole,
  Minimize2,
  MoonStar,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Wand2,
} from "lucide-react";

const SITE_URL = "https://privo.eu.org";
const OG_IMAGE_URL = `${SITE_URL}/og-image.svg`;
const DONATION_ADDRESS = "TGjqDrqUU4mJDbbtcLTyMiumFs16Z2V3mW";

const toolPages = [
  {
    id: "image",
    path: "/compress-image",
    label: "Image Tools",
    shortLabel: "Image Compressor",
    icon: FileImage,
    heroDescription: "Compress and resize images locally with instant previews.",
    title: "Free Online Image Compressor – 100% Private & Browser-Based",
    description: "Compress and resize images in your browser with zero uploads. Free, fast, and private image optimization.",
    keywords:
      "free online image compressor, private image resizer, browser image optimizer, client side image compression, local image resize tool",
    faq: [
      {
        question: "Is the image compressor really private?",
        answer: "Yes. Images are processed with HTML5 Canvas directly in your browser and are never uploaded to a server.",
      },
      {
        question: "Which image formats can I use?",
        answer: "Most modern browsers support JPG, PNG, WebP, and other common image files for local resizing and compression.",
      },
      {
        question: "Will resizing reduce image dimensions?",
        answer: "Only if your image exceeds the max width or max height settings. Smaller files keep their original dimensions.",
      },
    ],
  },
  {
    id: "json",
    path: "/json-formatter",
    label: "JSON Studio",
    shortLabel: "JSON Formatter",
    icon: FileCode2,
    heroDescription: "Format, validate, and inspect JSON with highlighted output.",
    title: "Free JSON Formatter & Validator – Private Browser JSON Tool",
    description: "Validate, format, minify, and inspect JSON instantly in your browser with no API calls or data tracking.",
    keywords:
      "json formatter, json validator, private json tool, browser json viewer, json minifier online free",
    faq: [
      {
        question: "Does the JSON validator send my data anywhere?",
        answer: "No. Your JSON stays in the browser and is parsed locally using native JavaScript.",
      },
      {
        question: "Can I minify JSON after formatting it?",
        answer: "Yes. You can switch between formatted and minified JSON instantly without leaving the page.",
      },
      {
        question: "What happens if the JSON is invalid?",
        answer: "The tool shows the parsing error immediately so you can fix the structure before copying the result.",
      },
    ],
  },
  {
    id: "password",
    path: "/hash-generator",
    label: "Crypto Tools",
    shortLabel: "Hash Generator",
    icon: LockKeyhole,
    heroDescription: "Generate strong passwords and browser-native hashes.",
    title: "Free Password & Hash Generator – Secure, Private, Web Crypto",
    description: "Create strong passwords and SHA hashes locally with Web Crypto. No backend, no storage, no tracking.",
    keywords:
      "password generator, hash generator, sha256 generator, secure password tool, private web crypto generator",
    faq: [
      {
        question: "How are passwords generated?",
        answer: "Passwords are generated locally using the browser's cryptographically secure random number generator.",
      },
      {
        question: "Which hash algorithms are available?",
        answer: "You can generate SHA-256, SHA-384, and SHA-512 hashes directly in the browser.",
      },
      {
        question: "Are generated passwords or hashes stored?",
        answer: "No. Outputs stay in memory unless you choose to copy them, and nothing is sent to a remote server.",
      },
    ],
  },
  {
    id: "qr",
    path: "/qr-generator",
    label: "QR Builder",
    shortLabel: "QR Generator",
    icon: ScanLine,
    heroDescription: "Create custom QR codes and export them as PNG instantly.",
    title: "Free QR Code Generator – Custom Colors, Instant PNG Download",
    description: "Generate QR codes with custom colors and download PNG files instantly in a fully private browser tool.",
    keywords:
      "free qr code generator, private qr generator, custom qr code colors, qr code png download, browser qr builder",
    faq: [
      {
        question: "Can I customize QR code colors?",
        answer: "Yes. You can set both the foreground and background colors and preview the result live.",
      },
      {
        question: "What content can I encode in a QR code?",
        answer: "You can encode URLs, plain text, payment strings, Wi-Fi credentials, and other text-based content.",
      },
      {
        question: "Is the QR code generated offline?",
        answer: "Yes. The QR code is rendered in the browser without any backend requests.",
      },
    ],
  },
];

const toolByPath = Object.fromEntries(toolPages.map((tool) => [tool.path, tool]));

const stats = [
  { label: "Client-side only", value: "100%" },
  { label: "Backend calls", value: "0" },
  { label: "Saved remotely", value: "Never" },
];

const initialPasswordOptions = {
  length: 20,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
};

const initialQrOptions = {
  text: "https://example.com",
  foreground: "#34d399",
  background: "#020617",
  size: 320,
};

const initialImageOptions = {
  quality: 82,
  maxWidth: 1920,
  maxHeight: 1920,
  format: "image/jpeg",
};

function useLocalStorageState(key, initialValue) {
  const [state, setState] = useState(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const stored = window.localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Ignore quota and private mode storage errors.
    }
  }, [key, state]);

  return [state, setState];
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

function downloadDataUrl(dataUrl, fileName) {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = fileName;
  anchor.click();
}

function getDataUrlSize(dataUrl) {
  const [, payload = ""] = dataUrl.split(",");
  const padding = payload.endsWith("==") ? 2 : payload.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.round((payload.length * 3) / 4) - padding);
}

function highlightJson(json) {
  return json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(\s*:)?|\btrue\b|\bfalse\b|\bnull\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let color = "text-sky-300";

        if (match.startsWith('"') && match.endsWith(":")) {
          color = "text-emerald-300";
        } else if (match.startsWith('"')) {
          color = "text-amber-300";
        } else if (/true|false/.test(match)) {
          color = "text-fuchsia-300";
        } else if (/null/.test(match)) {
          color = "text-slate-400";
        }

        return `<span class="${color}">${match}</span>`;
      },
    );
}

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isDonationOpen, setIsDonationOpen] = useState(false);
  const currentTool = toolByPath[location.pathname] ?? toolPages[0];

  return (
    <div className="relative overflow-hidden">
      <SeoHead tool={currentTool} />
      <div className="absolute inset-0 bg-grid bg-[size:22px_22px] opacity-20" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <TopNav currentToolPath={currentTool.path} onToolChange={navigate} onSupportClick={() => setIsDonationOpen(true)} />
        <Hero currentTool={currentTool} />
        <main className="mt-8 flex-1">
          <Routes>
            <Route path="/" element={<Navigate to="/compress-image" replace />} />
            <Route path="/compress-image" element={<ToolPage tool={toolPages[0]}><ImageTool /></ToolPage>} />
            <Route path="/json-formatter" element={<ToolPage tool={toolPages[1]}><JsonTool /></ToolPage>} />
            <Route path="/hash-generator" element={<ToolPage tool={toolPages[2]}><PasswordTool /></ToolPage>} />
            <Route path="/qr-generator" element={<ToolPage tool={toolPages[3]}><QrTool /></ToolPage>} />
            <Route path="*" element={<Navigate to="/compress-image" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
      {isDonationOpen && <DonationModal onClose={() => setIsDonationOpen(false)} />}
    </div>
  );
}

function SeoHead({ tool }) {
  useEffect(() => {
    document.title = tool.title;

    const metaEntries = [
      { selector: "meta[name='description']", attribute: "name", key: "description", content: tool.description },
      { selector: "meta[name='keywords']", attribute: "name", key: "keywords", content: tool.keywords },
      { selector: "meta[property='og:title']", attribute: "property", key: "og:title", content: tool.title },
      { selector: "meta[property='og:description']", attribute: "property", key: "og:description", content: tool.description },
      { selector: "meta[property='og:type']", attribute: "property", key: "og:type", content: "website" },
      { selector: "meta[property='og:url']", attribute: "property", key: "og:url", content: `${SITE_URL}${tool.path}` },
      { selector: "meta[property='og:image']", attribute: "property", key: "og:image", content: OG_IMAGE_URL },
      { selector: "meta[name='twitter:card']", attribute: "name", key: "twitter:card", content: "summary_large_image" },
      { selector: "meta[name='twitter:title']", attribute: "name", key: "twitter:title", content: tool.title },
      { selector: "meta[name='twitter:description']", attribute: "name", key: "twitter:description", content: tool.description },
      { selector: "meta[name='twitter:image']", attribute: "name", key: "twitter:image", content: OG_IMAGE_URL },
    ];

    metaEntries.forEach(({ selector, attribute, key, content }) => {
      let element = document.head.querySelector(selector);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    });

    let canonical = document.head.querySelector("link[rel='canonical']");
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", `${SITE_URL}${tool.path}`);

    upsertJsonLd("seo-webapp-jsonld", {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: tool.title,
      applicationCategory: ["DeveloperApplication", "UtilitiesApplication"],
      operatingSystem: "All",
      url: `${SITE_URL}${tool.path}`,
      description: tool.description,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    });

    upsertJsonLd("seo-faq-jsonld", {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: tool.faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    });
  }, [tool]);

  return null;
}

function upsertJsonLd(id, data) {
  let script = document.getElementById(id);
  if (!script) {
    script = document.createElement("script");
    script.id = id;
    script.type = "application/ld+json";
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

function TopNav({ currentToolPath, onToolChange, onSupportClick }) {
  return (
    <header className="panel sticky top-4 z-30 animate-fade-up px-4 py-4 sm:px-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/20">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <div className="text-lg font-extrabold tracking-tight text-white">Private Utility Suite</div>
            <div className="text-sm text-slate-400">A polished browser toolkit that never sends your data anywhere.</div>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex flex-wrap gap-2">
            {toolPages.map((tool) => {
              const Icon = tool.icon;
              const isActive = currentToolPath === tool.path;

              return (
                <button
                  key={tool.path}
                  type="button"
                  onClick={() => onToolChange(tool.path)}
                  className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm transition ${
                    isActive
                      ? "bg-white text-slate-950 shadow-lg shadow-white/10"
                      : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tool.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">
              <ShieldCheck className="h-4 w-4" />
              100% Free & Private
            </div>
            <button type="button" onClick={onSupportClick} className="button-primary">
              <HeartHandshake className="h-4 w-4" />
              Support Project
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function Hero({ currentTool }) {
  return (
    <section className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="panel animate-fade-up p-6 sm:p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">
          <MoonStar className="h-4 w-4" />
          Browser-native SaaS
        </div>
        <h1 className="mt-5 max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          {currentTool.shortLabel} with zero uploads, instant results, and privacy-first local processing.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">{currentTool.description}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <div className="button-primary">
            <Wand2 className="h-4 w-4" />
            Route: {currentTool.path}
          </div>
          <div className="button-secondary">
            <BadgeCheck className="h-4 w-4 text-emerald-300" />
            Local settings stored only in your browser
          </div>
        </div>
      </div>

      <div className="panel animate-fade-up p-6 [animation-delay:120ms] sm:p-8">
        <div className="grid gap-4">
          {stats.map((item) => (
            <div key={item.label} className="panel-muted flex items-center justify-between px-4 py-4">
              <span className="text-sm text-slate-400">{item.label}</span>
              <span className="text-xl font-bold text-white">{item.value}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-slate-950/80 p-5">
          <div className="text-sm font-semibold text-white">{currentTool.label}</div>
          <p className="mt-2 text-sm leading-6 text-slate-400">{currentTool.heroDescription}</p>
        </div>
      </div>
    </section>
  );
}

function ToolPage({ tool, children }) {
  return (
    <div className="space-y-6">
      {children}
      <PrivacyContentBlock tool={tool} />
      <FaqSection tool={tool} />
    </div>
  );
}

function ToolFrame({ title, description, icon: Icon, children, aside }) {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="panel animate-fade-up p-5 sm:p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">
              <Icon className="h-4 w-4 text-emerald-300" />
              Tool Workspace
            </div>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">{title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{description}</p>
          </div>
        </div>
        {children}
      </div>
      <div className="panel animate-fade-up p-5 [animation-delay:120ms] sm:p-6">{aside}</div>
    </section>
  );
}

function Dropzone({ onFiles, accept, label, hint }) {
  const inputRef = useRef(null);
  const [isOver, setIsOver] = useState(false);

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsOver(false);
        onFiles(Array.from(event.dataTransfer.files || []));
      }}
      className={`rounded-3xl border border-dashed px-6 py-10 text-center transition ${
        isOver ? "border-emerald-400 bg-emerald-400/10" : "border-white/10 bg-slate-900/60 hover:bg-slate-900/80"
      }`}
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-emerald-300">
        <UploadCloud className="h-7 w-7" />
      </div>
      <div className="mt-4 text-lg font-semibold text-white">{label}</div>
      <p className="mt-2 text-sm text-slate-400">{hint}</p>
      <button type="button" onClick={() => inputRef.current?.click()} className="button-secondary mt-5">
        Choose File
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => onFiles(Array.from(event.target.files || []))}
      />
    </div>
  );
}

function ImageTool() {
  const [settings, setSettings] = useLocalStorageState("suite-image-settings", initialImageOptions);
  const [source, setSource] = useState(null);
  const [result, setResult] = useState(null);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState("");

  const handleFiles = async (files) => {
    const [file] = files;
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please drop a valid image file.");
      return;
    }

    setError("");
    setResult(null);
    const previewUrl = URL.createObjectURL(file);
    setSource({
      file,
      name: file.name.replace(/\.[^.]+$/, ""),
      size: file.size,
      previewUrl,
    });
  };

  useEffect(() => {
    if (!source) {
      return undefined;
    }

    return () => {
      URL.revokeObjectURL(source.previewUrl);
    };
  }, [source]);

  const processImage = async () => {
    if (!source) {
      setError("Add an image first.");
      return;
    }

    setIsWorking(true);
    setError("");

    try {
      const image = await loadImage(source.previewUrl);
      const canvas = document.createElement("canvas");
      const ratio = Math.min(settings.maxWidth / image.width, settings.maxHeight / image.height, 1);
      canvas.width = Math.round(image.width * ratio);
      canvas.height = Math.round(image.height * ratio);
      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Canvas unavailable");
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL(settings.format, settings.quality / 100);

      setResult({
        dataUrl,
        width: canvas.width,
        height: canvas.height,
        size: getDataUrlSize(dataUrl),
        format: settings.format,
      });
    } catch {
      setError("Image processing failed in the browser.");
    } finally {
      setIsWorking(false);
    }
  };

  const savings = source && result ? Math.max(0, 100 - (result.size / source.size) * 100).toFixed(1) : null;

  return (
    <ToolFrame
      title="Image Compressor & Resizer"
      description="A local-first image pipeline powered by HTML5 Canvas. Resize, recompress, preview, and download optimized output without sending files to any server."
      icon={ImageUp}
      aside={
        <div className="space-y-4">
          <div>
            <div className="label">Quality</div>
            <input
              type="range"
              min="10"
              max="100"
              value={settings.quality}
              onChange={(event) => setSettings((current) => ({ ...current, quality: Number(event.target.value) }))}
              className="mt-3 w-full accent-emerald-400"
            />
            <div className="mt-2 text-sm text-slate-400">{settings.quality}%</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label>
              <div className="label">Max Width</div>
              <input
                type="number"
                min="64"
                className="input mt-2"
                value={settings.maxWidth}
                onChange={(event) => setSettings((current) => ({ ...current, maxWidth: Number(event.target.value) || 1 }))}
              />
            </label>
            <label>
              <div className="label">Max Height</div>
              <input
                type="number"
                min="64"
                className="input mt-2"
                value={settings.maxHeight}
                onChange={(event) => setSettings((current) => ({ ...current, maxHeight: Number(event.target.value) || 1 }))}
              />
            </label>
          </div>

          <label>
            <div className="label">Export Format</div>
            <select
              className="input mt-2"
              value={settings.format}
              onChange={(event) => setSettings((current) => ({ ...current, format: event.target.value }))}
            >
              <option value="image/jpeg">JPEG</option>
              <option value="image/png">PNG</option>
              <option value="image/webp">WebP</option>
            </select>
          </label>

          <button type="button" onClick={processImage} className="button-primary w-full" disabled={isWorking}>
            <Minimize2 className="h-4 w-4" />
            {isWorking ? "Processing..." : "Compress & Resize"}
          </button>

          {source && result && (
            <div className="panel-muted p-4">
              <div className="text-sm font-semibold text-white">Optimization result</div>
              <div className="mt-3 space-y-2 text-sm text-slate-400">
                <div className="flex justify-between">
                  <span>Original</span>
                  <span>{formatBytes(source.size)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Compressed</span>
                  <span>{formatBytes(result.size)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Saved</span>
                  <span className="text-emerald-300">{savings}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      }
    >
      <div className="space-y-5">
        <Dropzone
          onFiles={handleFiles}
          accept="image/*"
          label="Drop an image here"
          hint="JPG, PNG, WebP, or any browser-readable format. Processing stays entirely in this tab."
        />

        {error && <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</div>}

        {(source || result) && (
          <div className="grid gap-4 lg:grid-cols-2">
            {source && (
              <div className="panel-muted p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-white">Original</div>
                  <div className="text-xs text-slate-400">{formatBytes(source.size)}</div>
                </div>
                <img src={source.previewUrl} alt="Original preview" className="mt-4 max-h-80 w-full rounded-2xl object-contain" />
              </div>
            )}

            {result && (
              <div className="panel-muted p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-white">Optimized</div>
                  <button
                    type="button"
                    onClick={() => downloadDataUrl(result.dataUrl, `${source.name}-optimized.${result.format.split("/")[1]}`)}
                    className="button-ghost"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </button>
                </div>
                <img src={result.dataUrl} alt="Compressed preview" className="mt-4 max-h-80 w-full rounded-2xl object-contain" />
                <div className="mt-4 text-sm text-slate-400">
                  {result.width} × {result.height}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ToolFrame>
  );
}

function JsonTool() {
  const [input, setInput] = useLocalStorageState(
    "suite-json-input",
    '{\n  "name": "Private Utility Suite",\n  "privacy": true,\n  "features": ["image", "json", "password", "qr"]\n}',
  );
  const [treeOpen, setTreeOpen] = useState(true);

  const parsed = useMemo(() => {
    try {
      const value = JSON.parse(input);
      return {
        valid: true,
        value,
        pretty: JSON.stringify(value, null, 2),
        minified: JSON.stringify(value),
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
      };
    }
  }, [input]);

  return (
    <ToolFrame
      title="JSON Formatter & Validator"
      description="Parse JSON instantly inside the browser, clean it up with one click, and inspect nested structures through an interactive tree view."
      icon={FileCode2}
      aside={
        <div className="space-y-4">
          <div className={`rounded-2xl border px-4 py-4 ${parsed.valid ? "border-emerald-400/20 bg-emerald-400/10" : "border-rose-400/20 bg-rose-400/10"}`}>
            <div className="text-sm font-semibold text-white">{parsed.valid ? "Valid JSON" : "Validation error"}</div>
            <p className={`mt-2 text-sm ${parsed.valid ? "text-emerald-200" : "text-rose-200"}`}>
              {parsed.valid ? "Your structure is valid and ready for formatting or inspection." : parsed.error}
            </p>
          </div>
          <div className="grid gap-3">
            <button
              type="button"
              onClick={() => parsed.valid && setInput(parsed.pretty)}
              className="button-primary w-full"
              disabled={!parsed.valid}
            >
              <Wand2 className="h-4 w-4" />
              Format JSON
            </button>
            <button
              type="button"
              onClick={() => parsed.valid && setInput(parsed.minified)}
              className="button-secondary w-full"
              disabled={!parsed.valid}
            >
              <RefreshCw className="h-4 w-4" />
              Minify JSON
            </button>
          </div>
          {parsed.valid && (
            <div className="panel-muted p-4">
              <button type="button" onClick={() => setTreeOpen((current) => !current)} className="flex w-full items-center justify-between text-left">
                <div className="text-sm font-semibold text-white">Tree view</div>
                {treeOpen ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
              </button>
              {treeOpen && <JsonTree data={parsed.value} path="root" />}
            </div>
          )}
        </div>
      }
    >
      <div className="grid gap-4 xl:grid-cols-2">
        <div>
          <div className="label">Input JSON</div>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            spellCheck="false"
            className="input mt-2 min-h-[420px] resize-none font-mono text-sm leading-6"
          />
        </div>
        <div>
          <div className="label">Highlighted Output</div>
          <pre
            className="mt-2 min-h-[420px] overflow-auto rounded-3xl border border-white/10 bg-slate-950/90 p-5 font-mono text-sm leading-7 text-slate-200"
            dangerouslySetInnerHTML={{
              __html: parsed.valid ? highlightJson(parsed.pretty) : `<span class="text-rose-300">${parsed.error}</span>`,
            }}
          />
        </div>
      </div>
    </ToolFrame>
  );
}

function JsonTree({ data, path }) {
  const isObject = data !== null && typeof data === "object";

  if (!isObject) {
    return <div className="mt-3 text-sm text-slate-300">{String(data)}</div>;
  }

  const entries = Array.isArray(data) ? data.map((value, index) => [index, value]) : Object.entries(data);

  return (
    <div className="mt-4 space-y-2">
      {entries.map(([key, value]) => (
        <JsonTreeNode key={`${path}-${key}`} nodeKey={key} value={value} path={`${path}-${key}`} />
      ))}
    </div>
  );
}

function JsonTreeNode({ nodeKey, value, path }) {
  const [open, setOpen] = useState(true);
  const nested = value !== null && typeof value === "object";

  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-3 py-2">
      <button type="button" onClick={() => nested && setOpen((current) => !current)} className="flex w-full items-center gap-2 text-left">
        {nested ? (
          open ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />
        ) : (
          <span className="h-4 w-4" />
        )}
        <span className="font-mono text-sm text-emerald-300">{nodeKey}</span>
        {!nested && <span className="font-mono text-sm text-slate-300">{JSON.stringify(value)}</span>}
      </button>
      {nested && open && (
        <div className="ml-4 border-l border-white/5 pl-3">
          <JsonTree data={value} path={path} />
        </div>
      )}
    </div>
  );
}

function PasswordTool() {
  const [options, setOptions] = useLocalStorageState("suite-password-options", initialPasswordOptions);
  const [password, setPassword] = useState("");
  const [hashInput, setHashInput] = useLocalStorageState("suite-hash-input", "Private Utility Suite");
  const [hashAlgorithm, setHashAlgorithm] = useLocalStorageState("suite-hash-algorithm", "SHA-256");
  const [hashValue, setHashValue] = useState("");
  const [copied, setCopied] = useState("");

  const charset = [
    options.uppercase ? "ABCDEFGHJKLMNPQRSTUVWXYZ" : "",
    options.lowercase ? "abcdefghijkmnopqrstuvwxyz" : "",
    options.numbers ? "23456789" : "",
    options.symbols ? "!@#$%^&*()-_=+[]{};:,.?" : "",
  ].join("");

  const copy = async (value, key) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied(""), 1600);
    } catch {
      setCopied("");
    }
  };

  const generatePassword = () => {
    if (!charset.length) {
      setPassword("");
      return;
    }

    const bytes = new Uint32Array(options.length);
    crypto.getRandomValues(bytes);
    const generated = Array.from(bytes, (value) => charset[value % charset.length]).join("");
    setPassword(generated);
  };

  const generateHash = async () => {
    const encoded = new TextEncoder().encode(hashInput);
    const buffer = await crypto.subtle.digest(hashAlgorithm, encoded);
    const hex = Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, "0")).join("");
    setHashValue(hex);
  };

  useEffect(() => {
    generatePassword();
  }, [charset, options.length]);

  useEffect(() => {
    generateHash();
  }, [hashInput, hashAlgorithm]);

  return (
    <ToolFrame
      title="Secure Password & Hash Generator"
      description="Use the Web Crypto API for truly local randomness and hashing. No password generation requests, no telemetry, and no syncing."
      icon={Hash}
      aside={
        <div className="space-y-4">
          <div>
            <div className="label">Password Length</div>
            <input
              type="range"
              min="8"
              max="64"
              value={options.length}
              onChange={(event) => setOptions((current) => ({ ...current, length: Number(event.target.value) }))}
              className="mt-3 w-full accent-emerald-400"
            />
            <div className="mt-2 text-sm text-slate-400">{options.length} characters</div>
          </div>
          <div className="grid gap-3">
            {[
              ["uppercase", "Uppercase letters"],
              ["lowercase", "Lowercase letters"],
              ["numbers", "Numbers"],
              ["symbols", "Symbols"],
            ].map(([key, label]) => (
              <label key={key} className="panel-muted flex items-center justify-between px-4 py-3 text-sm text-slate-300">
                {label}
                <input
                  type="checkbox"
                  checked={options[key]}
                  onChange={(event) => setOptions((current) => ({ ...current, [key]: event.target.checked }))}
                  className="h-4 w-4 rounded border-white/10 bg-slate-950 text-emerald-400"
                />
              </label>
            ))}
          </div>
          <button type="button" onClick={generatePassword} className="button-primary w-full">
            <RefreshCw className="h-4 w-4" />
            Regenerate Password
          </button>
        </div>
      }
    >
      <div className="grid gap-5">
        <div className="panel-muted p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="label">Generated Password</div>
              <div className="mt-3 break-all font-mono text-lg text-white">{password || "Enable at least one character group."}</div>
            </div>
            <button type="button" onClick={() => copy(password, "password")} className="button-secondary shrink-0" disabled={!password}>
              {copied === "password" ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
              {copied === "password" ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_auto]">
          <label className="block">
            <div className="label">Hash Input</div>
            <textarea
              value={hashInput}
              onChange={(event) => setHashInput(event.target.value)}
              className="input mt-2 min-h-[180px] resize-none font-mono text-sm"
              spellCheck="false"
            />
          </label>
          <label className="block xl:w-48">
            <div className="label">Algorithm</div>
            <select className="input mt-2" value={hashAlgorithm} onChange={(event) => setHashAlgorithm(event.target.value)}>
              <option value="SHA-256">SHA-256</option>
              <option value="SHA-384">SHA-384</option>
              <option value="SHA-512">SHA-512</option>
            </select>
          </label>
        </div>

        <div className="panel-muted p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="label">Digest Output</div>
              <div className="mt-3 break-all font-mono text-sm leading-7 text-slate-200">{hashValue}</div>
            </div>
            <button type="button" onClick={() => copy(hashValue, "hash")} className="button-secondary shrink-0" disabled={!hashValue}>
              {copied === "hash" ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
              {copied === "hash" ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      </div>
    </ToolFrame>
  );
}

function QrTool() {
  const [options, setOptions] = useLocalStorageState("suite-qr-options", initialQrOptions);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    QRCode.toDataURL(options.text || " ", {
      margin: 1,
      width: Number(options.size),
      color: {
        dark: options.foreground,
        light: options.background,
      },
    })
      .then((url) => {
        setQrDataUrl(url);
        setError("");
      })
      .catch(() => {
        setQrDataUrl("");
        setError("Use valid HEX colors like #34d399 and #020617.");
      });
  }, [options]);

  return (
    <ToolFrame
      title="Custom QR Code Generator"
      description="Generate QR codes in real time, customize their colors, and download crisp PNG output instantly. Everything happens directly in the browser."
      icon={ScanLine}
      aside={
        <div className="space-y-4">
          <label className="block">
            <div className="label">Foreground</div>
            <div className="mt-2 flex items-center gap-3">
              <input
                type="color"
                value={options.foreground}
                onChange={(event) => setOptions((current) => ({ ...current, foreground: event.target.value }))}
                className="h-12 w-16 rounded-2xl border border-white/10 bg-transparent"
              />
              <input
                type="text"
                value={options.foreground}
                onChange={(event) => setOptions((current) => ({ ...current, foreground: event.target.value }))}
                className="input"
              />
            </div>
          </label>
          <label className="block">
            <div className="label">Background</div>
            <div className="mt-2 flex items-center gap-3">
              <input
                type="color"
                value={options.background}
                onChange={(event) => setOptions((current) => ({ ...current, background: event.target.value }))}
                className="h-12 w-16 rounded-2xl border border-white/10 bg-transparent"
              />
              <input
                type="text"
                value={options.background}
                onChange={(event) => setOptions((current) => ({ ...current, background: event.target.value }))}
                className="input"
              />
            </div>
          </label>
          <label className="block">
            <div className="label">Size</div>
            <input
              type="range"
              min="160"
              max="1024"
              step="32"
              value={options.size}
              onChange={(event) => setOptions((current) => ({ ...current, size: Number(event.target.value) }))}
              className="mt-3 w-full accent-emerald-400"
            />
            <div className="mt-2 text-sm text-slate-400">{options.size}px PNG</div>
          </label>
          <button type="button" onClick={() => downloadDataUrl(qrDataUrl, "qr-code.png")} className="button-primary w-full">
            <Download className="h-4 w-4" />
            Download PNG
          </button>
          {error && <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</div>}
        </div>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <label className="block">
          <div className="label">QR Content</div>
          <textarea
            value={options.text}
            onChange={(event) => setOptions((current) => ({ ...current, text: event.target.value }))}
            className="input mt-2 min-h-[260px] resize-none"
            placeholder="Paste URL, text, Wi-Fi config, or payment details"
          />
        </label>
        <div className="panel-muted flex flex-col items-center justify-center p-5">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR code preview" className="w-full max-w-[280px] rounded-3xl border border-white/10 bg-white p-4" />
          ) : (
            <div className="text-sm text-slate-400">Generating QR preview...</div>
          )}
        </div>
      </div>
    </ToolFrame>
  );
}

function PrivacyContentBlock({ tool }) {
  return (
    <section className="panel animate-fade-up p-6 sm:p-8">
      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">
        <ShieldCheck className="h-4 w-4 text-emerald-300" />
        Privacy-First SEO Content
      </div>
      <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">Why Privacy-First Local Processing Matters</h2>
      <div className="mt-4 space-y-4 text-sm leading-7 text-slate-300 sm:text-base">
        <p>
          Privacy-first local processing means sensitive files, passwords, structured data, and QR content stay inside the user's browser instead of being uploaded to a remote server. That matters for speed, compliance, trust, and SEO-driven product positioning because users searching for a free online image compressor, JSON formatter, QR generator, or hash generator increasingly want tools that are both useful and private.
        </p>
        <p>
          For {tool.shortLabel.toLowerCase()} workflows, browser-based execution reduces latency, removes backend costs, and eliminates the usual concern that files or text might be stored, inspected, or logged. This client-side architecture is also resilient, globally accessible, and ideal for lightweight SaaS utilities because it can deliver instant results without signups, API keys, or hidden tracking scripts.
        </p>
        <p>
          From a content strategy perspective, a privacy-first browser tool answers high-intent search queries with a strong value proposition: fast, free, secure, and easy to use. That combination improves conversion potential for organic traffic while giving users a clear reason to trust the application and share it socially.
        </p>
      </div>
    </section>
  );
}

function FaqSection({ tool }) {
  return (
    <section className="panel animate-fade-up p-6 sm:p-8">
      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">
        <FileCode2 className="h-4 w-4 text-emerald-300" />
        Frequently Asked Questions
      </div>
      <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">{tool.shortLabel} FAQs</h2>
      <div className="mt-6 space-y-3">
        {tool.faq.map((item) => (
          <AccordionItem key={item.question} question={item.question} answer={item.answer} />
        ))}
      </div>
    </section>
  );
}

function AccordionItem({ question, answer }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/60">
      <button type="button" onClick={() => setOpen((current) => !current)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
        <span className="text-base font-semibold text-white">{question}</span>
        {open ? <ChevronDown className="h-5 w-5 text-slate-400" /> : <ChevronRight className="h-5 w-5 text-slate-400" />}
      </button>
      {open && <div className="border-t border-white/10 px-5 py-4 text-sm leading-7 text-slate-300">{answer}</div>}
    </div>
  );
}

function DonationModal({ onClose }) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    QRCode.toDataURL(DONATION_ADDRESS, {
      margin: 1,
      width: 300,
      color: {
        dark: "#34d399",
        light: "#ffffff",
      },
    }).then(setQrDataUrl);
  }, []);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(DONATION_ADDRESS);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-md">
      <div className="panel w-full max-w-2xl p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">
              <HeartHandshake className="h-4 w-4" />
              USDT (TRC-20)
            </div>
            <h3 className="mt-4 text-2xl font-bold tracking-tight text-white">Support the project</h3>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
              This SaaS is 100% free, ad-free, and serverless. Your donations keep the project open-source and active.
            </p>
          </div>
          <button type="button" onClick={onClose} className="button-ghost">
            Close
          </button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_260px]">
          <div className="space-y-4">
            <div className="panel-muted p-4">
              <div className="label">Wallet Address</div>
              <div className="mt-3 break-all font-mono text-sm leading-7 text-white">{DONATION_ADDRESS}</div>
            </div>
            <button type="button" onClick={copyAddress} className="button-primary">
              {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
              {copied ? "Copied to clipboard!" : "Copy Address"}
            </button>
          </div>

          <div className="panel-muted flex items-center justify-center p-4">
            {qrDataUrl && <img src={qrDataUrl} alt="USDT TRC-20 wallet QR code" className="w-full max-w-[220px] rounded-3xl bg-white p-4" />}
          </div>
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-8 px-2 pb-4 pt-8 text-center text-sm text-slate-500">
      100% free. Privacy-first. No backend, no tracking, no API keys.
    </footer>
  );
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

export default App;
