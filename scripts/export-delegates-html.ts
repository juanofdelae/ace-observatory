/**
 * Export the full ACE delegates roster as a standalone, self-contained HTML
 * page for embedding on the ACE website.
 *
 * Output: ./ace-delegates/
 *   - index.html   (search + filters + card grid, all data inlined as JSON)
 *   - photos/      (only the referenced participant photos, copied over)
 *
 * Data model: one card PER PERSON PER EDITION ("de qué edición pertenece").
 * A person who attended 3 ACEs produces 3 cards. This matches the
 * `cumulativeParticipations` count (~1,040) surfaced in the Observatory.
 *
 * The page is 100% static: no build step, no framework, no network calls.
 * Drop the whole `ace-delegates/` folder onto the ACE host and link to
 * index.html (or iframe it).
 *
 *   npx tsx scripts/export-delegates-html.ts
 */
import { promises as fs } from "fs";
import path from "path";
import { participants } from "@/data/participants";
import { countryById } from "@/data/countries";
import { editionById } from "@/data/editions";
import { organizations } from "@/data/organizations";
import { BASE_PATH } from "@/lib/asset-path";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "ace-delegates");
const PHOTOS_DIR = path.join(OUT_DIR, "photos");
const PUBLIC_DIR = path.join(ROOT, "public");

const orgName = (id?: string) =>
  id ? organizations.find((o) => o.id === id)?.name : undefined;

/** Turn the Observatory photoUrl (which carries the deploy basePath) back
 *  into a path under /public, plus the portable path we'll use in the export. */
function resolvePhoto(photoUrl?: string): { src: string; rel: string } | null {
  if (!photoUrl) return null;
  let p = photoUrl;
  if (p.startsWith(BASE_PATH + "/")) p = p.slice(BASE_PATH.length); // -> /participants/...
  if (!p.startsWith("/participants/")) return null;
  const src = path.join(PUBLIC_DIR, p); // absolute source under /public
  const rel = "photos/" + p.slice("/participants/".length); // photos/historical/foo.jpg
  return { src, rel };
}

interface Row {
  name: string;
  role: string;
  org: string;
  country: string;
  edition: string; // short label e.g. "ACE 20"
  editionName: string; // full label
  actor: string;
  photo: string; // relative path or "" (initials fallback)
}

async function main() {
  await fs.rm(OUT_DIR, { recursive: true, force: true });
  await fs.mkdir(PHOTOS_DIR, { recursive: true });

  const rows: Row[] = [];
  const copied = new Set<string>();
  let missingPhoto = 0;

  for (const p of participants) {
    const photo = resolvePhoto(p.photoUrl);
    let photoRel = "";
    if (photo) {
      photoRel = photo.rel;
      if (!copied.has(photo.rel)) {
        try {
          await fs.mkdir(path.dirname(path.join(OUT_DIR, photo.rel)), { recursive: true });
          await fs.copyFile(photo.src, path.join(OUT_DIR, photo.rel));
          copied.add(photo.rel);
        } catch {
          missingPhoto++;
          photoRel = ""; // source file not found — fall back to initials
        }
      }
    }

    const country = countryById(p.countryId)?.name ?? "";
    const org = orgName(p.organizationId) ?? p.organization ?? "";

    // One card per edition the person belongs to.
    for (const edId of p.editionIds) {
      const ed = editionById(edId);
      const num = ed ? ed.number : undefined;
      rows.push({
        name: p.name,
        role: p.role ?? "",
        org,
        country,
        edition: num ? `ACE ${num}` : "",
        editionName: ed?.name ?? "",
        actor: p.actorType ?? "",
        photo: photoRel,
      });
    }
  }

  // Sort: most recent edition first, then by name.
  const editionRank = (e: string) => {
    const m = /ACE (\d+)/.exec(e);
    return m ? Number(m[1]) : 0;
  };
  rows.sort((a, b) => editionRank(b.edition) - editionRank(a.edition) || a.name.localeCompare(b.name));

  const html = renderHtml(rows);
  await fs.writeFile(path.join(OUT_DIR, "index.html"), html, "utf8");

  console.log(`✓ ace-delegates/ generated`);
  console.log(`  cards:        ${rows.length}`);
  console.log(`  with photo:   ${rows.filter((r) => r.photo).length}`);
  console.log(`  photos copied:${copied.size}`);
  if (missingPhoto) console.log(`  photos missing on disk: ${missingPhoto}`);
  console.log(`  open:         ${path.join(OUT_DIR, "index.html")}`);
}

function renderHtml(rows: Row[]): string {
  const data = JSON.stringify(rows);
  const countries = Array.from(new Set(rows.map((r) => r.country).filter(Boolean))).sort();
  const editions = Array.from(new Set(rows.map((r) => r.edition).filter(Boolean))).sort(
    (a, b) => Number(/\d+/.exec(b)?.[0] ?? 0) - Number(/\d+/.exec(a)?.[0] ?? 0),
  );
  const actors = Array.from(new Set(rows.map((r) => r.actor).filter(Boolean))).sort();
  const opt = (arr: string[]) => arr.map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>ACE Delegates Directory</title>
<style>
  :root{
    --ink:#0B1F3A; --ink2:#0f2749; --line:rgba(255,255,255,.10);
    --muted:#93a4bd; --accent:#2563EB; --card:#12233f;
  }
  *{box-sizing:border-box}
  body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    background:#0a1a30;color:#e8eef7;-webkit-font-smoothing:antialiased}
  header{background:linear-gradient(160deg,var(--ink),var(--ink2));padding:34px 20px 22px;border-bottom:1px solid var(--line)}
  .wrap{max-width:1240px;margin:0 auto;padding:0 20px}
  h1{margin:0;font-size:26px;letter-spacing:-.02em}
  .sub{color:var(--muted);margin-top:6px;font-size:14px}
  .count{color:#cfe0ff;font-weight:600}
  .controls{max-width:1240px;margin:18px auto 0;display:flex;flex-wrap:wrap;gap:10px}
  input,select{background:var(--card);border:1px solid var(--line);color:#e8eef7;border-radius:10px;
    padding:10px 12px;font-size:14px;outline:none}
  input{flex:1;min-width:220px}
  input::placeholder{color:#6f82a0}
  select{min-width:150px}
  main{max-width:1240px;margin:0 auto;padding:22px 20px 60px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px}
  .card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px;display:flex;gap:13px;align-items:flex-start}
  .avatar{width:56px;height:56px;border-radius:12px;object-fit:cover;flex:none;background:#1b3157}
  .ph{width:56px;height:56px;border-radius:12px;flex:none;display:flex;align-items:center;justify-content:center;
    background:linear-gradient(135deg,#1e3a68,#12233f);color:#9fc0ff;font-weight:700;font-size:18px}
  .info{min-width:0}
  .nm{font-weight:600;font-size:15px;line-height:1.25}
  .rl{color:#c3d2ea;font-size:12.5px;margin-top:2px;line-height:1.3}
  .og{color:var(--muted);font-size:12px;margin-top:3px;line-height:1.3}
  .tags{margin-top:8px;display:flex;flex-wrap:wrap;gap:5px}
  .tag{font-size:10.5px;font-weight:600;letter-spacing:.02em;padding:3px 8px;border-radius:999px}
  .tag.ed{background:rgba(37,99,235,.18);color:#9fc0ff}
  .tag.co{background:rgba(255,255,255,.07);color:#cdd8ea}
  .empty{color:var(--muted);text-align:center;padding:60px 0}
  .foot{color:#6f82a0;font-size:12px;text-align:center;padding:24px}
</style>
</head>
<body>
<header>
  <div class="wrap">
    <h1>ACE Delegates Directory</h1>
    <div class="sub">Leaders from government, private sector, academia and international organizations across the Americas — <span class="count" id="count"></span></div>
  </div>
  <div class="controls">
    <input id="q" type="search" placeholder="Search name, role or institution…" />
    <select id="country"><option value="">All countries</option>${opt(countries)}</select>
    <select id="edition"><option value="">All editions</option>${opt(editions)}</select>
    <select id="actor"><option value="">All sectors</option>${opt(actors)}</select>
  </div>
</header>
<main>
  <div class="grid" id="grid"></div>
  <div class="empty" id="empty" hidden>No delegates match your filters.</div>
</main>
<div class="foot">Americas Competitiveness Exchange · ${rows.length} participations across all editions</div>

<script>
const DATA = ${data};
const grid = document.getElementById('grid');
const empty = document.getElementById('empty');
const countEl = document.getElementById('count');
const q = document.getElementById('q');
const fCountry = document.getElementById('country');
const fEdition = document.getElementById('edition');
const fActor = document.getElementById('actor');
const norm = s => (s||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase();
function initials(name){return (name||'').split(/\\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase();}
function esc(s){return (s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}

function card(r){
  const av = r.photo
    ? '<img class="avatar" loading="lazy" src="'+esc(r.photo)+'" alt="'+esc(r.name)+'" onerror="this.outerHTML=\\'<div class=&quot;ph&quot;>'+esc(initials(r.name))+'</div>\\'">'
    : '<div class="ph">'+esc(initials(r.name))+'</div>';
  return '<div class="card">'+av+'<div class="info">'
    +'<div class="nm">'+esc(r.name)+'</div>'
    +(r.role?'<div class="rl">'+esc(r.role)+'</div>':'')
    +(r.org?'<div class="og">'+esc(r.org)+'</div>':'')
    +'<div class="tags">'
      +(r.edition?'<span class="tag ed">'+esc(r.edition)+'</span>':'')
      +(r.country?'<span class="tag co">'+esc(r.country)+'</span>':'')
    +'</div></div></div>';
}

function render(){
  const nq = norm(q.value);
  const c = fCountry.value, e = fEdition.value, a = fActor.value;
  const out = DATA.filter(r=>{
    if(c && r.country!==c) return false;
    if(e && r.edition!==e) return false;
    if(a && r.actor!==a) return false;
    if(nq && !norm(r.name+' '+r.org+' '+r.role).includes(nq)) return false;
    return true;
  });
  countEl.textContent = out.length.toLocaleString()+' of '+DATA.length.toLocaleString()+' participations';
  empty.hidden = out.length>0;
  // Chunked render keeps the initial paint fast with ~1,000 cards.
  grid.innerHTML='';
  const frag=[];
  for(const r of out) frag.push(card(r));
  grid.innerHTML = frag.join('');
}
[q,fCountry,fEdition,fActor].forEach(el=>el.addEventListener('input',render));
render();
</script>
</body>
</html>`;
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
