import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

interface TrendChartProps {
  title: string;
  values: number[];
  color: string;
  max?: number;
  icon: IconDefinition;
  accent: string;
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
  icon,
  accent,
}: TrendChartProps) {
  const width = 420;
  const height = 120;
  const path = buildPath(values, width, height, max);
  const latestValue = values.length > 0 ? values[values.length - 1] : 0;

  return (
    <section className='rounded-[28px] border border-cyanGlow/15 bg-panel p-5 shadow-panel backdrop-blur md:p-6'>
      <div className='mb-4 flex items-start justify-between gap-3'>
        <div>
          <div
            className={`mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] ${accent}`}
          >
            <FontAwesomeIcon icon={icon} />
            Live Trend
          </div>
          <h2 className='text-xl font-semibold text-white'>{title}</h2>
        </div>
        <div className='rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-2 text-right'>
          <p className='text-xs font-semibold uppercase tracking-[0.16em] text-slate-400'>
            Current
          </p>
          <p className='text-lg font-semibold text-white'>
            {latestValue.toFixed(1)}%
          </p>
        </div>
      </div>

      <svg
        className='h-36 w-full'
        viewBox={`0 0 ${width} ${height}`}
        role='img'
        aria-label={`${title} trend`}
      >
        <rect
          width={width}
          height={height}
          fill='rgba(2, 12, 20, 0.45)'
          rx={18}
        />
        {path ? (
          <path d={path} fill='none' stroke={color} strokeWidth={3} />
        ) : null}
      </svg>
    </section>
  );
}
