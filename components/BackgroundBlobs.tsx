export function BackgroundBlobs() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute -top-32 -left-24 w-[60vw] max-w-[480px] h-[60vw] max-h-[480px] rounded-full bg-brand-300/40 blur-3xl animate-blob" />
      <div className="absolute top-1/3 -right-32 w-[65vw] max-w-[520px] h-[65vw] max-h-[520px] rounded-full bg-indigo-300/30 blur-3xl animate-blob [animation-delay:6s]" />
      <div className="absolute -bottom-40 left-1/4 w-[65vw] max-w-[540px] h-[65vw] max-h-[540px] rounded-full bg-sky-300/30 blur-3xl animate-blob [animation-delay:12s]" />
    </div>
  );
}
