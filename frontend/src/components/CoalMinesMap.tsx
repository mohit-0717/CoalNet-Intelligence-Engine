import { motion } from "framer-motion";
import { MapPin, Info } from "lucide-react";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const coalMines = [
  { id: 1, name: "Jharia, Dhanbad", state: "Jharkhand", x: 62.09, y: 45.14, status: "good" },
  { id: 2, name: "Bokaro", state: "Jharkhand", x: 60.1, y: 45.03, status: "warning" },
  { id: 3, name: "Jayanti", state: "Jharkhand", x: 62.69, y: 45.32, status: "critical" },
  { id: 4, name: "Godda", state: "Jharkhand", x: 64.73, y: 41.19, status: "good" },
  { id: 5, name: "Giridih (Karbhari Coal Field)", state: "Jharkhand", x: 61.69, y: 43.57, status: "warning" },
  { id: 6, name: "Ramgarh", state: "Jharkhand", x: 59.06, y: 45.57, status: "critical" },
  { id: 7, name: "Karanpura", state: "Jharkhand", x: 58.2, y: 45.32, status: "good" },
  { id: 8, name: "Daltonganj", state: "Jharkhand", x: 54.27, y: 44.11, status: "warning" },
  { id: 9, name: "Raniganj Coalfield", state: "West Bengal", x: 64.43, y: 45.68, status: "critical" },
  { id: 10, name: "Birbhum", state: "West Bengal", x: 66.02, y: 44.59, status: "good" },
  { id: 11, name: "Korba", state: "Chhattisgarh", x: 49.66, y: 50.08, status: "warning" },
  { id: 12, name: "Singrauli", state: "Madhya Pradesh", x: 49.47, y: 43.22, status: "critical" },
  { id: 13, name: "Kusmunda", state: "Chhattisgarh", x: 49.63, y: 50.39, status: "good" },
  { id: 14, name: "Gevra", state: "Chhattisgarh", x: 49.39, y: 50.21, status: "warning" },
  { id: 15, name: "Dipka", state: "Chhattisgarh", x: 49.12, y: 50.35, status: "critical" },
  { id: 16, name: "Rajmahal", state: "Jharkhand", x: 65.12, y: 40.52, status: "good" },
  { id: 17, name: "Nigahi", state: "Madhya Pradesh", x: 49.55, y: 44.11, status: "warning" },
  { id: 18, name: "Jayant", state: "Madhya Pradesh", x: 49.24, y: 43.69, status: "critical" },
  { id: 19, name: "Dudhichua", state: "Madhya Pradesh", x: 49.49, y: 43.52, status: "good" },
  { id: 20, name: "Khadia", state: "Uttar Pradesh", x: 49.92, y: 43.88, status: "warning" },
  { id: 21, name: "Bina", state: "Uttar Pradesh", x: 49.77, y: 43.23, status: "critical" },
  { id: 22, name: "Kakri", state: "Uttar Pradesh", x: 49.58, y: 43.81, status: "good" },
  { id: 23, name: "Krishnashila", state: "Uttar Pradesh", x: 50.02, y: 43.4, status: "warning" },
  { id: 24, name: "Block B", state: "Madhya Pradesh", x: 49.79, y: 43.59, status: "critical" },
  { id: 25, name: "Ashoka", state: "Jharkhand", x: 57.16, y: 44.8, status: "good" },
  { id: 26, name: "Piparwar", state: "Jharkhand", x: 57.59, y: 44.31, status: "warning" },
  { id: 27, name: "Magadh", state: "Jharkhand", x: 57.45, y: 44.92, status: "critical" },
  { id: 28, name: "Amrapali", state: "Jharkhand", x: 57.44, y: 44.62, status: "good" },
  { id: 29, name: "Chandragupt", state: "Jharkhand", x: 57.77, y: 44.86, status: "warning" },
  { id: 30, name: "Sanghamitra", state: "Jharkhand", x: 57.76, y: 44.56, status: "critical" },
  { id: 31, name: "Pachwara", state: "Jharkhand", x: 65.33, y: 40.31, status: "good" },
  { id: 32, name: "Chuperbhita", state: "Jharkhand", x: 66.69, y: 42.03, status: "warning" },
  { id: 33, name: "Gare Palma", state: "Chhattisgarh", x: 52.31, y: 51.16, status: "critical" },
  { id: 34, name: "Chhal", state: "Chhattisgarh", x: 50.03, y: 50.02, status: "good" },
  { id: 35, name: "Baroud", state: "Chhattisgarh", x: 52.51, y: 50.94, status: "warning" },
  { id: 36, name: "Jampali", state: "Chhattisgarh", x: 52.72, y: 50.72, status: "critical" },
  { id: 37, name: "Bijari", state: "Chhattisgarh", x: 52.92, y: 50.5, status: "good" },
  { id: 38, name: "Samaleswari", state: "Odisha", x: 53.63, y: 52.32, status: "warning" },
  { id: 39, name: "Lajkura", state: "Odisha", x: 54.04, y: 52.16, status: "critical" },
  { id: 40, name: "Lilari", state: "Odisha", x: 53.58, y: 52.02, status: "good" },
  { id: 41, name: "Lakhanpur", state: "Odisha", x: 53.81, y: 51.83, status: "warning" },
  { id: 42, name: "Belpahar", state: "Odisha", x: 54.11, y: 51.86, status: "critical" },
  { id: 43, name: "Ananta", state: "Odisha", x: 57.72, y: 55.36, status: "good" },
  { id: 44, name: "Bharatpur", state: "Odisha", x: 58.14, y: 54.94, status: "warning" },
  { id: 45, name: "Bhubaneswari", state: "Odisha", x: 57.93, y: 55.15, status: "critical" },
  { id: 46, name: "Singareni", state: "Telangana", x: 42.74, y: 67.22, status: "good" },
  { id: 47, name: "Chandrapur", state: "Maharashtra", x: 38.34, y: 58.78, status: "warning" },
  { id: 48, name: "Makum", state: "Assam", x: 92.94, y: 32.1, status: "critical" },
];

const CoalMinesMap = () => {
  const [hoveredMine, setHoveredMine] = useState<any>(null);

  return (
    <section className="py-24 px-4 bg-muted/10 overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 glass-effect px-4 py-2 rounded-full border border-white/10 text-primary">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium">National Footprint</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
              Monitoring <span className="text-gradient">Every Corner</span> of Indian Mining
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              From the dense coalfields of Jharkhand to the remote hills of Meghalaya, CoalNet Zero provides 24/7 visibility into emissions across all {coalMines.length} major mining hubs in India.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="glass-effect p-4 rounded-2xl border border-white/10">
                <div className="text-3xl font-bold text-primary mb-1">12+</div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">States Covered</div>
              </div>
              <div className="glass-effect p-4 rounded-2xl border border-white/10">
                <div className="text-3xl font-bold text-secondary mb-1">{coalMines.length}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Mining Blocks</div>
              </div>
            </div>

            {/* Mine Info Card (Dynamic) */}
            <div className="relative pt-6 h-32">
              {hoveredMine ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={hoveredMine.id}
                  className="glass-effect p-5 rounded-2xl border border-primary/20 bg-primary/5 shadow-xl"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">{hoveredMine.name}</h3>
                      <p className="text-sm text-muted-foreground">{hoveredMine.state}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      hoveredMine.status === "critical" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                      hoveredMine.status === "warning" ? "bg-orange-400/20 text-orange-400 border border-orange-400/30" :
                      "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    }`}>
                      {hoveredMine.status}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="glass-effect p-5 rounded-2xl border border-white/5 bg-white/5 flex items-center gap-3 text-muted-foreground">
                  <Info className="w-5 h-5" />
                  <p className="text-sm italic">Hover over the dots on the map to see specific site data</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Map Container */}
          <div className="relative aspect-[4/5] md:aspect-square flex items-center justify-center scale-110">
            {/* Pulsing Base Map Glow */}
            <div className="absolute inset-0 bg-primary/5 rounded-full blur-[100px] animate-pulse" />

            <TooltipProvider>
              <div className="relative w-full max-w-md">
                {/* Simplified SVG Map of India (Outline) */}
                <svg
                  viewBox="0 0 100 100"
                  className="w-full h-full drop-shadow-2xl opacity-40 fill-none stroke-primary/40 stroke-[0.8]"
                >
                   {/* Actual outline of India */}
                   <path d="M33.503,0L37.083,4.761L36.746,8.036L38.072,10.075L37.962,12.097L35.572,11.566L36.506,15.899L39.779,18.365L44.409,21.069L42.295,22.814L41.002,26.386L44.229,27.821L47.37,29.675L51.714,31.785L56.281,32.271L58.202,34.172L60.776,34.527L64.784,35.395L67.558,35.333L67.94,33.858L67.501,31.48L67.759,29.86L69.79,29.066L70.07,32.029L70.141,32.78L73.169,34.198L75.263,33.614L78.076,33.865L80.794,33.754L81.028,31.454L79.672,30.254L82.359,29.783L85.391,26.97L89.231,24.545L92.025,25.483L94.4,23.875L95.962,26.247L94.837,27.84L98.429,28.406L98.68,29.837L97.512,30.528L97.785,32.837L95.405,32.16L91.092,34.741L91.193,36.868L89.355,39.966L89.186,41.755L87.701,44.768L85.097,43.938L84.968,47.699L84.215,48.93L84.567,50.461L82.924,51.315L81.169,45.581L80.249,45.592L79.705,47.91L77.881,46.031L78.909,43.959L80.4,43.748L81.936,40.649L80.015,40.021L76.926,40.076L73.756,39.571L73.462,37.002L71.872,36.819L69.233,35.214L68.056,37.731L70.461,39.685L68.378,41.055L67.639,42.391L69.689,43.371L69.122,45.567L70.277,48.294L70.795,51.263L70.318,52.573L68.052,52.528L63.945,53.272L64.137,55.958L62.358,58.062L57.564,60.445L53.836,64.588L51.331,66.797L48.012,69.082L48.007,70.682L46.346,71.538L43.345,72.781L41.789,72.963L40.791,75.601L41.484,80.076L41.661,82.917L40.249,86.159L40.234,91.929L38.51,92.093L36.994,94.672L38.008,95.785L34.97,96.742L33.848,99.033L32.512,100L29.357,96.855L27.815,92.124L26.537,88.703L25.37,87.095L23.6,83.82L22.774,79.538L22.198,77.39L19.168,72.647L17.787,65.897L16.791,61.4L16.803,57.111L16.157,53.771L11.309,55.908L8.961,55.481L4.61,51.142L6.211,49.841L5.227,48.424L1.32,45.346L3.538,42.913L10.869,42.922L10.208,39.772L8.336,37.901L7.957,35.045L5.776,33.371L9.448,29.435L13.316,29.722L16.801,25.75L18.889,21.867L22.123,17.988L22.072,15.208L24.912,12.936L22.224,10.985L21.067,8.294L19.886,4.778L21.519,3.035L26.573,4.022L30.286,3.421Z" />
                </svg>

                {/* Pulsing dots for each mine */}
                {coalMines.map((mine) => (
                  <Tooltip key={mine.id}>
                    <TooltipTrigger asChild>
                      <motion.div
                        className="absolute w-3 h-3 cursor-pointer z-20 group"
                        style={{ left: `${mine.x}%`, top: `${mine.y}%` }}
                        initial={{ x: "-50%", y: "-50%" }}
                        whileHover={{ scale: 1.5, x: "-50%", y: "-50%" }}
                        onMouseEnter={() => setHoveredMine(mine)}
                        onMouseLeave={() => setHoveredMine(null)}
                      >
                        {/* Static central dot */}
                        <div className={`w-1.5 h-1.5 rounded-full mx-auto mt-0.5 ${
                          mine.status === "critical" ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" :
                          mine.status === "warning" ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]" :
                          "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                        }`} />
                        {/* Pulsing ring */}
                        <div className={`absolute inset-0 rounded-full animate-ping opacity-60 ${
                          mine.status === "critical" ? "bg-red-500" :
                          mine.status === "warning" ? "bg-orange-500" :
                          "bg-emerald-500"
                        }`} />
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent className="glass-effect border-white/20">
                      <p className="font-bold text-xs">{mine.name}</p>
                      <p className="text-[10px] opacity-70">{mine.state}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </TooltipProvider>

            {/* Floating Labels */}
            <div className="absolute top-10 right-0 glass-effect p-2 rounded-lg text-[10px] font-bold border border-white/10 uppercase tracking-widest text-emerald-400">
               Live Network
            </div>
            <div className="absolute bottom-10 left-0 glass-effect p-2 rounded-lg text-[10px] font-bold border border-white/10 uppercase tracking-widest text-primary">
               99.9% Uptime
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CoalMinesMap;
