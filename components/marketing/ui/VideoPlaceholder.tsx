import { cn } from '@/lib/cn';

type Props = {
  title?: string;
  subtitle?: string;
  duration?: string;
  className?: string;
  accent?: 'sky' | 'indigo' | 'emerald';
};

export function VideoPlaceholder({
  title = 'EduFlow 소개 영상',
  subtitle = '2분 안에 핵심 Workflow 파악',
  duration = '2:15',
  className,
  accent = 'sky',
}: Props) {
  const GRADIENTS = {
    sky: 'from-sky-900 via-blue-900 to-indigo-900',
    indigo: 'from-indigo-900 via-violet-900 to-purple-900',
    emerald: 'from-emerald-900 via-teal-900 to-sky-900',
  };

  const RING_COLORS = {
    sky: 'ring-sky-400/30 text-sky-300',
    indigo: 'ring-indigo-400/30 text-indigo-300',
    emerald: 'ring-emerald-400/30 text-emerald-300',
  };

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl bg-gradient-to-br',
        GRADIENTS[accent],
        'aspect-video cursor-pointer',
        className
      )}
      role="img"
      aria-label={`${title} — 영상 준비 중`}
    >
      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.04] [background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAMAAAAp4XiDAAAAUVBMVEWFhYWDg4N3d3dtbW17e3t1dXWBgYGHh4t5eXlzc3OLi4ubm5uVlZWPj4+NjY19fX2JiYl/f39ra2uRkZGZmZlpaWmXl5dvb29xcXGTk5NnZ2c8TV1mAAAAG3RSTlNAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEB34AmUAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4AgKCB4jIXtTEAAAAHJJREFUSMftlckNgDAMBNdJyEUOKJT9d6UgUYL3OfMBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACDsAhVHAAAAAElFTkSuQmCC)]" />

      {/* Grid lines */}
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />

      {/* Glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-48 w-48 rounded-full bg-white/5 blur-3xl" />
      </div>

      {/* Play button */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
        <div
          className={cn(
            'flex h-16 w-16 items-center justify-center rounded-full bg-white/10 ring-2 backdrop-blur-sm transition-transform group-hover:scale-110',
            RING_COLORS[accent]
          )}
        >
          <i className="ri-play-fill ml-1 text-3xl text-white" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="mt-0.5 text-xs text-white/50">{subtitle}</p>
        </div>
      </div>

      {/* Duration badge */}
      <div className="absolute bottom-4 right-4 rounded-md bg-black/40 px-2 py-0.5 text-[11px] font-medium text-white/80 backdrop-blur-sm">
        {duration}
      </div>

      {/* "준비 중" watermark */}
      <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 backdrop-blur-sm">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
        <span className="text-[10px] font-medium text-white/70">영상 준비 중</span>
      </div>
    </div>
  );
}
