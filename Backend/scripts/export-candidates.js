/**
 * One-time export: candidate list with position + status details.
 * Columns: Candidate, Position Name, Candidate Status, Position Status (active/paused),
 *          Last Status Changed, Changed By.
 *
 * Run from Backend/:  node scripts/export-candidates.js
 * Output: ../candidates_report.xlsx (project root)
 */
const path = require("path");
const XLSX = require("xlsx");
const { db } = require("../router/firebase_ad");

const toDate = (v) => {
  if (!v) return null;
  if (v.toDate) return v.toDate();
  if (v._seconds) return new Date(v._seconds * 1000);
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};
const fmt = (v) => {
  const d = toDate(v);
  return d ? d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "";
};

(async () => {
  try {
    // Build ClientSPOC map: email -> name (admin_db)
    const spocSnap = await db.collection("admin_db").get();
    const spocMap = {};
    spocSnap.docs.forEach((d) => {
      const s = d.data();
      if (s.email) spocMap[s.email.toLowerCase()] = s.name || s.email;
    });
    console.log(`Loaded ${Object.keys(spocMap).length} client SPOCs.`);

    // Build position map: pos_id -> { name, status, clientspoc }
    const posSnap = await db.collection("admin_AddPos").get();
    const posMap = {};
    posSnap.docs.forEach((d) => {
      const p = d.data();
      if (p.pos_id) posMap[p.pos_id] = { name: p.position || "", status: (p.status || "active"), clientspoc: (p.clientspoc || "") };
    });
    console.log(`Loaded ${Object.keys(posMap).length} positions.`);

    const INITIAL_STATUSES = ["Submitted", "Applied"];
    const spocNameFor = (pos) => {
      const email = (pos.clientspoc || "").toLowerCase();
      return spocMap[email] || pos.clientspoc || "";
    };

    const candSnap = await db.collection("candidate_db").get();
    console.log(`Loaded ${candSnap.size} candidates.`);

    const rows = candSnap.docs.map((d) => {
      const c = d.data();
      const pos = posMap[c.pos_id] || {};
      const lastChanged = c.statusChangedAt || c.statusaDate || c.updatedAt || c.datePosted;
      const status = c.statusa || "Submitted";
      // Who changed: prefer recorded changer; otherwise, any status other than the
      // initial Submitted/Applied was set by the position's ClientSPOC.
      let changedBy = c.statusChangedByName || c.statusChangedBy || "";
      if (!changedBy && !INITIAL_STATUSES.includes(status)) {
        changedBy = spocNameFor(pos);
      }
      return {
        "Candidate": c.candidate || c.name || "",
        "Position Name": pos.name || c.pos_name || "",
        "Candidate Status": status,
        "Position Status": (pos.status || "").toLowerCase() === "paused" ? "Paused" : "Active",
        "Last Status Changed": fmt(lastChanged),
        "Changed By": changedBy,
        "Recruiter": c.recEmail || "",
        "Position ID": c.pos_id || "",
      };
    });

    // Sort by last status changed (newest first)
    rows.sort((a, b) => (b["Last Status Changed"] || "").localeCompare(a["Last Status Changed"] || ""));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 28 }, { wch: 32 }, { wch: 24 }, { wch: 16 }, { wch: 18 }, { wch: 24 }, { wch: 28 }, { wch: 12 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Candidates");

    const out = path.join(__dirname, "..", "..", "candidates_report.xlsx");
    XLSX.writeFile(wb, out);
    console.log(`✅ Wrote ${rows.length} rows to ${out}`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Export failed:", err);
    process.exit(1);
  }
})();
