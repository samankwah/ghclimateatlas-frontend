export type AtlasIconName =
  | "arrow"
  | "book"
  | "chart"
  | "check"
  | "chevron"
  | "compass"
  | "document"
  | "download"
  | "external"
  | "map"
  | "menu"
  | "close"
  | "play"
  | "rain"
  | "search"
  | "thermometer"
  | "users"
  | "wave";

interface AtlasIconProps {
  name: AtlasIconName;
  size?: number;
  className?: string;
}

const AtlasIcon = ({ name, size = 24, className }: AtlasIconProps) => {
  const paths: Record<AtlasIconName, React.ReactNode> = {
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></>,
    chart: <><path d="M3 3v18h18"/><path d="m7 16 4-5 4 3 5-8"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    compass: <><circle cx="12" cy="12" r="9"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5Z"/></>,
    document: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h6"/></>,
    download: <><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></>,
    external: <><path d="M15 3h6v6"/><path d="m10 14 11-11"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></>,
    map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z"/><path d="M9 3v15M15 6v15"/></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
    play: <path d="m8 5 11 7-11 7Z" />,
    rain: <><path d="M16 13a4 4 0 1 0-1-7.87A6 6 0 0 0 4 8.5 3.5 3.5 0 0 0 4.5 15H16"/><path d="m8 18-1 2M12 18l-1 2M16 18l-1 2"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    thermometer: <><path d="M14 14.76V5a4 4 0 0 0-8 0v9.76a6 6 0 1 0 8 0Z"/><path d="M10 9v8"/></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    wave: <><path d="M3 6c3-2 5 2 8 0s5 2 10 0M3 12c3-2 5 2 8 0s5 2 10 0M3 18c3-2 5 2 8 0s5 2 10 0"/></>,
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
};

export default AtlasIcon;
