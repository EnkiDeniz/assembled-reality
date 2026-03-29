import { SECTIONS } from "../constants";

export function exportCarryList(reader, carryList, highlights) {
  const items = carryList[reader] || [];
  const myHighlights = highlights.filter(h => h.reader === reader);

  let md = `# ${reader}'s Carry List\n`;
  md += `*Exported from Assembled Reality v1.0*\n\n`;

  if (items.length > 0) {
    md += `## Carried Lines\n\n`;
    const grouped = {};
    items.forEach(item => {
      const sid = item.anchor?.sectionId || "unknown";
      if (!grouped[sid]) grouped[sid] = [];
      grouped[sid].push(item);
    });
    for (const [sid, sectionItems] of Object.entries(grouped)) {
      const sec = SECTIONS.find(s => s.id === sid);
      md += `### ${sec ? `${sec.num}. ${sec.title}` : sid}\n\n`;
      sectionItems.forEach(item => {
        md += `> ${item.text}\n\n`;
      });
    }
  }

  if (myHighlights.length > 0) {
    md += `## Highlights\n\n`;
    const grouped = {};
    myHighlights.forEach(h => {
      const sid = h.anchor?.sectionId || "unknown";
      if (!grouped[sid]) grouped[sid] = [];
      grouped[sid].push(h);
    });
    for (const [sid, sectionHighlights] of Object.entries(grouped)) {
      const sec = SECTIONS.find(s => s.id === sid);
      md += `### ${sec ? `${sec.num}. ${sec.title}` : sid}\n\n`;
      sectionHighlights.forEach(h => {
        const shape = h.shape === "triangle" ? "\u25B3" : h.shape === "square" ? "\u25A2" : "\u25CB";
        md += `- ${shape} ${h.anchor.textContent}\n`;
      });
      md += "\n";
    }
  }

  if (items.length === 0 && myHighlights.length === 0) {
    md += `*No lines carried or highlighted yet.*\n`;
  }

  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${reader.toLowerCase()}-carry-list.md`;
  a.click();
  URL.revokeObjectURL(url);
}
