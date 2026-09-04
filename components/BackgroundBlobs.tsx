export function BackgroundBlobs() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Flowing ribbon forms — elongated, rotated ellipses instead of plain circles */}
      <div
        className="absolute -top-24 -left-32 w-[85vw] max-w-[720px] h-[26vw] max-h-[220px] rounded-full bg-gradient-to-r from-brand-300/40 to-bloom-300/30 blur-3xl animate-ribbon"
        style={{ ["--r" as any]: "-18deg" }}
      />
      <div
        className="absolute top-1/4 -right-40 w-[80vw] max-w-[680px] h-[24vw] max-h-[200px] rounded-full bg-gradient-to-r from-bloom-300/35 to-brand-200/35 blur-3xl animate-ribbon [animation-delay:7s]"
        style={{ ["--r" as any]: "14deg" }}
      />
      <div
        className="absolute -bottom-32 left-1/5 w-[85vw] max-w-[700px] h-[26vw] max-h-[220px] rounded-full bg-gradient-to-r from-brand-200/35 to-bloom-200/30 blur-3xl animate-ribbon [animation-delay:13s]"
        style={{ ["--r" as any]: "-8deg" }}
      />
    </div>
  );
}
