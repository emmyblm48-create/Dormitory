export function Sparkle({
  className = "w-4 h-4 text-mustard-500",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0c.6 5.6 1.3 8.9 3 10.7 1.8 1.8 5.1 2.5 9 3-3.9.5-7.2 1.2-9 3-1.7 1.8-2.4 5.1-3 10.7-.6-5.6-1.3-8.9-3-10.7-1.8-1.8-5.1-2.5-9-3 3.9-.5 7.2-1.2 9-3C10.7 8.9 11.4 5.6 12 0Z" />
    </svg>
  );
}
