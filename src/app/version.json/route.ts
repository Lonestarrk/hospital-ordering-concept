// Vilken version av appen som är publicerad. Appen jämför med sin egen version och
// erbjuder en uppdatering när de skiljer sig (viktigt för installerade appar på iPad,
// som inte laddas om när man öppnar dem igen).
export const dynamic = "force-static";

export function GET() {
  return Response.json({ version: process.env.NEXT_PUBLIC_APP_VERSION ?? "dev" });
}
