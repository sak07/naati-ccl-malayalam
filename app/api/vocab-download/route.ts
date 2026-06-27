import vocabularies from "@/lib/vocabularies.json";

export async function GET() {
  const rows: string[] = ["Domain,English,Hindi"];

  for (const list of vocabularies as { id: string; domain: string; terms: { english: string; hindi: string }[] }[]) {
    for (const term of list.terms) {
      const domain = `"${list.domain.replace(/"/g, '""')}"`;
      const english = `"${term.english.replace(/"/g, '""')}"`;
      const hindi = `"${term.hindi.replace(/"/g, '""')}"`;
      rows.push(`${domain},${english},${hindi}`);
    }
  }

  const csv = rows.join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="naati-ccl-malayalam-vocabulary.csv"',
    },
  });
}
