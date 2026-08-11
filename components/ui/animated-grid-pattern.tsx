export function AnimatedGridPattern({
  className,
  style,
  numSquares,
  maxOpacity,
  duration,
  repeatDelay,
}: {
  className?: string;
  style?: React.CSSProperties;
  numSquares: number;
  maxOpacity: number;
  duration: number;
  repeatDelay: number;
}) {
  return (
    <div className={className} style={style}>
      {Array.from({ length: numSquares }).map((_, index) => (
        <div
          key={index}
          className="absolute bg-white-200/10 blur-xl"
          style={{
            width: `${20 + (index % 5) * 8}px`,
            height: `${20 + (index % 5) * 8}px`,
            top: `${(index * 37) % 100}%`,
            left: `${(index * 23) % 100}%`,
            opacity: maxOpacity,
            animation: `pulse ${duration}s ease-in-out ${index * 0.08}s infinite`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.08; }
          50% { transform: scale(1.15); opacity: ${maxOpacity}; }
        }
      `}</style>
    </div>
  );
}
