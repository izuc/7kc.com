export interface AvatarUser {
  user_id?: string;
  display_name?: string | null;
  color?: string | null;
}

export function Avatar({ user, size = 24 }: { user: AvatarUser; size?: number }) {
  const name = user.display_name || '?';
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, background: user.color || '#888', fontSize: size * 0.42 }}
      title={name}
    >
      {name[0]?.toUpperCase()}
    </span>
  );
}
