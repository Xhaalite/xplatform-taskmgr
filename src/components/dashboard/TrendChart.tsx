interface TrendChartProps {
  title: string;
  values: number[];
  color: string;
  max?: number;
}

function buildPath(
  values: number[],
  width: number,
  height: number,
  max: number,
) {
  if (values.length === 0) {
    return '';
  }

  return values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * width;
      const y = height - (Math.max(0, Math.min(value, max)) / max) * height;
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}

export function TrendChart({
  title,
  values,
  color,
  max = 100,
}: TrendChartProps) {
  const width = 420;
  const height = 120;
  const path = buildPath(values, width, height, max);

  return (
    <section className='panel'>
      <h2>{title}</h2>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role='img'
        aria-label={`${title} trend`}
      >
        <rect
          width={width}
          height={height}
          fill='rgba(255,255,255,0.04)'
          rx={8}
        />
        {path ? (
          <path d={path} fill='none' stroke={color} strokeWidth={3} />
        ) : null}
      </svg>
    </section>
  );
}
