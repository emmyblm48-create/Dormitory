// Ambient decoration layer: soft blue color washes drifting slowly behind
// the content, kept quiet enough to stay out of the way.
export function BackgroundBlobs() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute -top-24 -left-32 w-[80vw] max-w-[640px] h-[60vw] max-h-[480px] rounded-full bg-brand-300/20 blur-3xl animate-drift" />
      <div
        className="absolute top-1/4 -right-40 w-[70vw] max-w-[560px] h-[50vw] max-h-[420px] rounded-full bg-bloom-300/20 blur-3xl animate-drift [animation-delay:7s]"
      />
      <div
        className="absolute -bottom-32 left-1/5 w-[75vw] max-w-[600px] h-[55vw] max-h-[440px] rounded-full bg-brand-200/20 blur-3xl animate-drift [animation-delay:13s]"
      />
    </div>
  );
}
