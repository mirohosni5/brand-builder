import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { 
  Building2, 
  Newspaper, 
  Instagram, 
  Sparkles, 
  Loader2, 
  ArrowRight, 
  Download,
  AlertCircle,
  LayoutGrid,
  Zap,
  Layers,
  Search,
  ChevronRight,
  Info,
  Maximize2
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

// Initialize AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

type MediumType = 'billboard' | 'newspaper' | 'social';
type PresetType = 'minimal' | 'cyberpunk' | 'luxury' | 'vintage' | 'eco';

interface GenerationResult {
  id: string;
  medium: MediumType;
  imageUrl: string;
  prompt: string;
}

const MEDIUMS: { type: MediumType; label: string; icon: any; aspectRatio: string; description: string }[] = [
  { type: 'billboard', label: 'Billboard', icon: Building2, aspectRatio: '16:9', description: 'Wide-format urban impact' },
  { type: 'social', label: 'Social', icon: Instagram, aspectRatio: '1:1', description: 'Clean platform focus' },
  { type: 'newspaper', label: 'Editorial', icon: Newspaper, aspectRatio: '3:4', description: 'Classic printed press' },
];

const PRESETS: { id: PresetType; label: string; description: string; colors: string; styleKeywords: string }[] = [
  { id: 'minimal', label: 'Minimal', description: 'Clean white, lots of space', colors: 'from-zinc-400 to-zinc-600', styleKeywords: 'minimalist, high-key lighting, white background, clean lines, sparse composition' },
  { id: 'luxury', label: 'Luxury', description: 'Gold, black, premium textures', colors: 'from-yellow-400 to-amber-700', styleKeywords: 'premium, dramatic chiaroscuro lighting, velvet and marble textures, gold accents, dark moody atmosphere, elegant' },
  { id: 'cyberpunk', label: 'Cyberpunk', description: 'Neon, dark, high tech', colors: 'from-cyan-400 to-fuchsia-600', styleKeywords: 'vibrant neon lighting, cyberpunk aesthetic, rainy urban night, futuristic surroundings, deep shadows, cyan and magenta glow' },
  { id: 'vintage', label: 'Vintage', description: 'Retro, warm, grainy', colors: 'from-orange-400 to-stone-600', styleKeywords: '1970s film stock, grainy film texture, warm sepia and faded tones, retro analog vibe, soft natural light, nostalgic' },
  { id: 'eco', label: 'Sustainable', description: 'Organics, greens, earth tones', colors: 'from-emerald-400 to-teal-700', styleKeywords: 'natural soft lighting, organic textures, wooden and stone backdrops, lush plants and greenery, soft earthy palette, bright and airy' },
];

export default function App() {
  const [productDescription, setProductDescription] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<PresetType>('minimal');
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [generationStep, setGenerationStep] = useState<string>("");
  const resultsRef = useRef<HTMLDivElement>(null);

  const generateBrand = async () => {
    if (!productDescription.trim()) return;

    setIsGenerating(true);
    setError(null);
    setGenerationStep("Conceptualizing Brand Strategy...");

    try {
      const preset = PRESETS.find(p => p.id === selectedPreset);
      
      const promptExpansionResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `I need three highly descriptive and stylistically distinct image prompts for a product.
        Product: ${productDescription}
        Target Aesthetic: ${preset?.label} (${preset?.description})
        Required Visual Language: ${preset?.styleKeywords}
        
        Rules:
        1. STRIGENT PRODUCT CONSISTENCY: Describe the product precisely (materials, colors, features) in EVERY prompt.
        2. NO PEOPLE: No humans, hands, faces, or silhouettes. The focus is purely on the product.
        3. AESTHETIC DOMINANCE: Every prompt must be saturated with the "${preset?.label}" look and feel using the provided style keywords.
        4. Medium Specifics:
           - Billboard: High-impact, wide-angle, epic scale.
           - Newspaper: Editorial, classic, possibly grainy or high-contrast magazine style.
           - Social: Centered, clean, high-engagement studio/lifestyle shot.
        
        Return JSON: { "billboard": "...", "newspaper": "...", "social": "..." }`,
        config: { responseMimeType: "application/json" }
      });

      const expandedPrompts = JSON.parse(promptExpansionResponse.text || "{}");

      const generationPromises = MEDIUMS.map(async (medium, idx) => {
        // Stagger the perception of time
        await new Promise(r => setTimeout(r, idx * 500));
        
        const prompt = expandedPrompts[medium.type];
        // Don't dilute the artistic prompt with too many generic instructions
        const safePrompt = `${prompt}. Strictly NO humans or people. Focus on atmosphere and product detail.`;

        setGenerationStep(`Rendering ${medium.label} ${preset?.label} Environment...`);

        const imageResponse = await ai.models.generateContent({
          model: "gemini-2.5-flash-image",
          contents: { parts: [{ text: safePrompt }] },
          config: { imageConfig: { aspectRatio: medium.aspectRatio as any } }
        });

        let imageUrl = "";
        for (const part of imageResponse.candidates?.[0]?.content.parts || []) {
          if (part.inlineData) {
            imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }

        if (!imageUrl) throw new Error(`Failed ${medium.label}`);

        return {
          id: Math.random().toString(36).substr(2, 9),
          medium: medium.type,
          imageUrl,
          prompt: safePrompt
        };
      });

      const newResults = await Promise.all(generationPromises);
      setResults(newResults);
      setGenerationStep("Brand Ready.");
      
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 300);

    } catch (err: any) {
      setError("Analysis failed. Please refine your description.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (result: GenerationResult) => {
    const link = document.createElement('a');
    link.href = result.imageUrl;
    link.download = `studio-brand-${result.medium}.png`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-studio-bg text-zinc-100 font-display transition-colors duration-500 overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-indigo rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-rose rounded-full blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 h-16 border-b border-white/5 bg-studio-bg/80 backdrop-blur-xl z-[100]">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-accent-indigo to-accent-rose flex items-center justify-center shadow-lg shadow-accent-indigo/20">
              <Zap className="w-5 h-5 text-white fill-current" />
            </div>
            <span className="font-bold text-lg tracking-tight">Studio Builder</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
            <span className="hover:text-white transition-colors cursor-pointer">Projects</span>
            <span className="hover:text-white transition-colors cursor-pointer">Assets</span>
            <span className="hover:text-white transition-colors cursor-pointer">Export Settings</span>
          </div>
          <button className="text-xs font-mono px-3 py-1 rounded-full border border-white/10 hover:border-white/20 transition-colors">
            NANO-BANANA ENGINE
          </button>
        </div>
      </nav>

      {/* Hero / Studio Config */}
      <main className="max-w-7xl mx-auto px-6 pt-32 pb-24 relative z-10">
        <div className="grid lg:grid-cols-[1fr_400px] gap-12 items-start">
          {/* Left: Input & Strategy */}
          <div className="space-y-12">
            <header className="space-y-4">
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-5xl md:text-7xl font-bold tracking-tight leading-[0.9]"
              >
                Visualize Your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-indigo via-accent-rose to-orange-400">Vision.</span>
              </motion.h1>
              <p className="text-zinc-400 text-lg max-w-lg leading-relaxed">
                A professional-grade environment to render your product brand across multiple high-impact channels.
              </p>
            </header>

            <div className="space-y-8">
              {/* Preset Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">Brand Aesthetic</span>
                  <Info className="w-4 h-4 text-zinc-600 cursor-help" />
                </div>
                <div className="flex flex-wrap gap-3">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => setSelectedPreset(preset.id)}
                      className={`group relative px-5 py-3 rounded-2xl border transition-all duration-300 ${
                        selectedPreset === preset.id 
                        ? 'border-accent-indigo bg-accent-indigo/10 text-white shadow-xl shadow-accent-indigo/10' 
                        : 'border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10 text-zinc-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${preset.colors}`} />
                        <div className="text-left">
                          <p className="text-sm font-bold">{preset.label}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Prompt */}
              <div className="space-y-4">
                <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">Core Product Parameters</span>
                <div className="relative group">
                  <textarea
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    placeholder="Describe your flagship product in detail... e.g. Minimalist matte black coffee tumbler with copper trim"
                    className="w-full h-40 p-6 rounded-3xl bg-white/5 border border-white/10 focus:border-accent-indigo focus:ring-4 focus:ring-accent-indigo/20 transition-all outline-none text-lg leading-relaxed placeholder:opacity-20"
                  />
                  <div className="absolute top-4 right-4 text-[10px] font-mono opacity-20 group-hover:opacity-40 transition-opacity">
                    {productDescription.length} CHARS
                  </div>
                </div>
              </div>

              <button
                onClick={generateBrand}
                disabled={isGenerating || !productDescription.trim()}
                className="w-full flex items-center justify-center gap-3 py-5 rounded-3xl bg-gradient-to-r from-accent-indigo to-accent-rose text-white font-bold text-lg hover:opacity-90 active:scale-[0.98] transition-all shadow-2xl shadow-accent-indigo/20 disabled:opacity-50 disabled:grayscale transition-all"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="animate-pulse">{generationStep}</span>
                  </>
                ) : (
                  <>
                    Initiate Studio Render
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right: Studio Sidebar */}
          <aside className="space-y-8 lg:sticky lg:top-24">
            <div className="glass-card p-8 rounded-[2rem] space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="w-5 h-5 text-accent-indigo" />
                <h3 className="font-bold">Engine Context</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500">Target Resolution</span>
                  <span className="font-mono text-zinc-300">4096 × 2304</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500">Samples</span>
                  <span className="font-mono text-zinc-300">128px / s</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500">Model Reliability</span>
                  <span className="flex items-center gap-2 text-emerald-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    98.4%
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <p className="text-[10px] text-zinc-500 leading-relaxed uppercase tracking-widest font-mono">
                  The Nano-Banana process ensures perceptual consistency across heterogeneous distribution channels.
                </p>
              </div>
            </div>

            <div className="bg-white/5 rounded-3xl p-6 border border-white/5 space-y-4">
              <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-500">Render Targets</h4>
              <div className="grid grid-cols-3 gap-2">
                {MEDIUMS.map(m => (
                  <div key={m.type} className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 border border-white/5 gap-1">
                    <m.icon className="w-4 h-4 text-zinc-400" />
                    <span className="text-[9px] uppercase font-bold">{m.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

        {/* Dynamic Results Grid */}
        <div ref={resultsRef} className="mt-32 space-y-16">
          <AnimatePresence mode="popLayout">
            {isGenerating && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {MEDIUMS.map((_, i) => (
                  <div key={i} className="aspect-[3/4] rounded-[2.5rem] bg-white/5 border border-white/10 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                    <div className="absolute inset-x-0 bottom-0 p-8 space-y-3">
                      <div className="h-4 w-1/2 bg-white/10 rounded-full" />
                      <div className="h-3 w-3/4 bg-white/5 rounded-full" />
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {!isGenerating && results.length > 0 && (
              <motion.div 
                layout
                className="grid md:grid-cols-12 gap-12"
              >
                {results.map((result, index) => {
                  const medium = MEDIUMS.find(m => m.type === result.medium)!;
                  const isWide = result.medium === 'billboard';

                  return (
                    <motion.div
                      key={result.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                      className={isWide ? "md:col-span-12" : "md:col-span-6"}
                    >
                      <div className="group relative">
                        {/* Header info */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-white/5 text-accent-indigo">
                              <medium.icon className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-bold text-lg">{medium.label}</h4>
                              <p className="text-xs text-zinc-500 uppercase tracking-widest font-mono">{medium.aspectRatio}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleDownload(result)}
                            className="p-3 rounded-full hover:bg-white/10 transition-colors"
                          >
                            <Download className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Image Frame */}
                        <div className="relative overflow-hidden rounded-[3rem] border border-white/10 shadow-3xl bg-black">
                          <img 
                            src={result.imageUrl} 
                            alt={medium.label}
                            className={`w-full ${isWide ? 'aspect-[21/9]' : 'aspect-square'} object-cover group-hover:scale-105 transition-transform duration-1000`}
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-8">
                            <p className="text-xs font-mono text-zinc-400 leading-relaxed italic line-clamp-2">
                              {result.prompt}
                            </p>
                          </div>
                          
                          {/* Corner Accent */}
                          <div className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1.5 rounded-full glass-card border-none text-[9px] font-mono tracking-tighter uppercase">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Live Preview
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Blank State */}
        {!isGenerating && results.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-white/5 rounded-[3rem]"
          >
            <div className="p-6 rounded-full bg-white/5 mb-6">
              <Search className="w-12 h-12 text-zinc-700" />
            </div>
            <h3 className="text-xl font-bold mb-2">Workspace Empty</h3>
            <p className="text-zinc-500 max-w-xs text-center">
              Define your brand identity using the studio controls above to generate your first visualizations.
            </p>
          </motion.div>
        )}
      </main>

      {/* Modern Footer */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 opacity-40 grayscale">
            <Zap className="w-4 h-4" />
            <span className="text-xs font-mono uppercase tracking-widest underline decoration-accent-rose underline-offset-4">Studio Builder System</span>
          </div>
          <p className="text-xs text-zinc-500 font-mono">
            SECURE RECEPTOR: {Math.random().toString(16).substr(2, 8).toUpperCase()}
          </p>
          <div className="flex gap-6 text-[10px] text-zinc-600 uppercase tracking-[0.2em] font-bold">
            <span className="hover:text-white transition-all cursor-pointer">Documentation</span>
            <span className="hover:text-white transition-all cursor-pointer">Privacy</span>
            <span className="hover:text-white transition-all cursor-pointer">Status</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="aspect-[3/4] rounded-[2.5rem] bg-white/5 border border-white/10 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
      <div className="absolute inset-x-0 bottom-0 p-8 space-y-3">
        <div className="h-4 w-1/2 bg-white/10 rounded-full" />
        <div className="h-3 w-3/4 bg-white/5 rounded-full" />
      </div>
    </div>
  );
}
