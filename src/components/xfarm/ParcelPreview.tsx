import {
  inCuneo,
  inSriLanka,
  parcelView,
  sriLankaNW,
  sriLankaSE,
  toMap,
} from './parcels';
import type { XFarmField } from './xfarmData';

export function ParcelPreview({ field, detail = false }: { field: XFarmField; detail?: boolean }) {
  const bounded = field.coordinates.length >= 3;
  const cuneo = inCuneo(field.center),
    sriLanka = inSriLanka(field.center);
  const [x, y] = toMap(field.center);
  const side = sriLanka ? 18000 : 125;
  const view = bounded
    ? parcelView(field.coordinates, detail)
    : [x - side / 2, y - side / 2, side, side].join(' ');

  const [vx, vy, vw, vh] = view.split(' ').map(Number);

  return (
    <svg
      viewBox={view}
      preserveAspectRatio={detail ? 'xMidYMid meet' : 'xMidYMid slice'}
      aria-label={field.name}
      role="img"
    >
      {sriLanka && (
        <image
          href="/data/sri-lanka-blue-marble.jpg"
          x={sriLankaNW[0]}
          y={sriLankaNW[1]}
          width={sriLankaSE[0] - sriLankaNW[0]}
          height={sriLankaSE[1] - sriLankaNW[1]}
          preserveAspectRatio="none"
        />
      )}

      {field.id === 'plot-n2' || field.name.includes('Plot N2') ? (
        <image
          href="/images/plot-n2-satellite-hd.jpg"
          x={vx}
          y={vy}
          width={vw}
          height={vh}
          preserveAspectRatio="xMidYMid slice"
          style={{ filter: 'contrast(1.05) brightness(1.02)' }}
        />
      ) : cuneo ? (
        <image
          href="/images/xfarm-satellite-regional-hd.jpg"
          x={0}
          y={0}
          width="1050"
          height="600"
          preserveAspectRatio="none"
          style={{ filter: 'contrast(1.05) brightness(1.02)' }}
        />
      ) : null}

      {bounded ? (
        <polygon
          points={field.coordinates.map(toMap).join(' ')}
          fill={detail ? '#e7bb49' : '#59a848'}
          fillOpacity={detail ? '.45' : '.55'}
          stroke={detail ? '#f5c250' : '#82b35f'}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      ) : (
        <circle
          cx={x}
          cy={y}
          r={side / 25}
          fill="#c8dca0"
          stroke="#fff"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        >
          <title>Farm location</title>
        </circle>
      )}
    </svg>
  );
}
