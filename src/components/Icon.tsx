// Appens ikoner som enkla linjeteckningar, så att de ser likadana ut på iPad, Android och dator
// (emoji ritas olika av olika system). Ikonerna är dekor; texten bredvid säger vad knappen gör.

const paths = {
  globe: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3.6 9h16.8M3.6 15h16.8M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z",
  sound: "M4 9.5v5h4l5 4V5.5l-5 4H4zM16.5 9a4 4 0 0 1 0 6",
  soundOn: "M4 9.5v5h4l5 4V5.5l-5 4H4zM16.5 9a4 4 0 0 1 0 6M19 6.5a7.5 7.5 0 0 1 0 11",
  close: "M6 6l12 12M18 6L6 18",
  mic: "M12 3.5a3 3 0 0 0-3 3V12a3 3 0 0 0 6 0V6.5a3 3 0 0 0-3-3zM6 11.5a6 6 0 0 0 12 0M12 17.5V21M9 21h6",
  info: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v5M12 8h.01",
  download: "M12 4v11M7 10l5 5 5-5M5 20h14",
  arrow: "M5 12h14M13 6l6 6-6 6",
  frukost: "M3 18h18M7 18a5 5 0 0 1 10 0M12 7V4M5.6 10.6 3.5 8.5M18.4 10.6l2.1-2.1",
  lunch: "M12 6a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM12 9.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM3 4v5a2 2 0 0 0 2 2v9M21 4v16M21 4c-2 1-3 3-3 6 0 2 1 3 3 3",
  fika: "M5 10h11v4a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5v-4zM16 11h1.5a2.5 2.5 0 0 1 0 5H16M8 3.5c0 1.2 1 1.2 1 2.5M12 3.5c0 1.2 1 1.2 1 2.5",
  middag: "M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z",
  tilltugg: "M12 7c-1.5-1.6-5-1.8-6.5.6-1.7 2.8-.4 8.5 2.5 11 1.4 1.2 2.6.9 4 .2 1.4.7 2.6 1 4-.2 2.9-2.5 4.2-8.2 2.5-11C17 5.2 13.5 5.4 12 7zM12 7c0-1.8.6-3 2-4",
  thumbUp: "M7 10.5V20H4.5V10.5H7zM7 10.5l3.6-6.3c.3-.6 1-.8 1.6-.5 1 .5 1.4 1.6 1.1 2.7L12.5 10H18a2 2 0 0 1 2 2.3l-1.1 6A2 2 0 0 1 17 20H7",
  thumbDown: "M17 13.5V4h2.5v9.5H17zM17 13.5l-3.6 6.3c-.3.6-1 .8-1.6.5-1-.5-1.4-1.6-1.1-2.7l.8-3.6H6a2 2 0 0 1-2-2.3l1.1-6A2 2 0 0 1 7 4h10",
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, size = 22, strokeWidth = 2 }: { name: IconName; size?: number; strokeWidth?: number }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
