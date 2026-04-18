export function Swatch({
  palette,
  label,
  size = 'md',
  rounded = false,
}: {
  palette: [string, string] | string[];
  label: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
  rounded?: boolean;
}) {
  const [c1, c2] = palette as [string, string];
  const initials = label
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  const dim = size === 'sm' ? 44 : size === 'lg' ? 220 : 92;
  const style: React.CSSProperties = {
    width: size === 'full' ? '100%' : dim,
    height: size === 'full' ? 200 : dim,
    background: `linear-gradient(135deg, ${c2 ?? '#d4d4d4'} 0%, ${c2 ?? '#d4d4d4'} 55%, ${c1 ?? '#8c8c8c'} 55%, ${c1 ?? '#8c8c8c'} 100%)`,
  };
  return (
    <div className={`swatch ${rounded ? 'rounded' : ''}`} style={style}>
      <span style={{ color: c1, mixBlendMode: 'multiply' }}>{initials}</span>
    </div>
  );
}
