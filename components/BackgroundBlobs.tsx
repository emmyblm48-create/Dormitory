import { Sparkle } from "@/components/Sparkle";

// Ambient decoration layer: soft warm color washes drifting slowly, plus a
// scatter of twinkling sparkle stars -- the poster's collage energy, kept
// quiet enough to stay behind the actual content.
const STARS = [
  { top: "8%", left: "12%", size: "w-5 h-5", color: "text-mustard-400", delay: "0s", mobile: true },
  { top: "18%", left: "82%", size: "w-4 h-4", color: "text-bloom-500", delay: "0.6s", mobile: true },
  { top: "62%", left: "6%", size: "w-3.5 h-3.5", color: "text-mint-500", delay: "1.2s", mobile: false },
  { top: "78%", left: "88%", size: "w-5 h-5", color: "text-brand-400", delay: "1.8s", mobile: true },
  { top: "42%", left: "94%", size: "w-3 h-3", color: "text-mustard-500", delay: "2.4s", mobile: false },
  { top: "88%", left: "40%", size: "w-4 h-4", color: "text-bloom-400", delay: "0.3s", mobile: false },
];

export function BackgroundBlobs() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div
        className="absolute -top-24 -left-32 w-[80vw] max-w-[640px] h-[60vw] max-h-[480px] rounded-full bg-brand-300/25 blur-3xl animate-drift"
        style={{ ["--r" as any]: "-6deg" }}
      />
      <div
        className="absolute top-1/4 -right-40 w-[70vw] max-w-[560px] h-[50vw] max-h-[420px] rounded-full bg-mustard-300/25 blur-3xl animate-drift [animation-delay:7s]"
        style={{ ["--r" as any]: "8deg" }}
      />
      <div
        className="absolute -bottom-32 left-1/5 w-[75vw] max-w-[600px] h-[55vw] max-h-[440px] rounded-full bg-mint-300/20 blur-3xl animate-drift [animation-delay:13s]"
        style={{ ["--r" as any]: "-4deg" }}
      />

      {STARS.map((s, i) => (
        <Sparkle
          key={i}
          className={`absolute ${s.size} ${s.color} animate-sparkle ${s.mobile ? "" : "hidden md:block"}`}
          style={{ top: s.top, left: s.left, animationDelay: s.delay }}
        />
      ))}
    </div>
  );
}
