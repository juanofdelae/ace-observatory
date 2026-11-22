# Delegados y listas — cómo funciona y de dónde salen los datos

> Documento explicativo para el equipo del ACE Data Observatory.
> Cubre tres cosas: (1) cómo funciona la parte de **delegados de cada perfil**,
> (2) **qué datos** agarra y de dónde vienen, y (3) **cómo se generaron
> las listas/PDF** de participantes y de delegados.

---

## 0. Conceptos base (para no confundirnos)

En este proyecto "participante", "alumni" y "delegado" son **la misma persona**
vista desde ángulos distintos:

| Palabra        | Qué significa aquí |
|----------------|--------------------|
| **Participante / Alumni** | La persona en sí. Un registro único por persona en el dataset. |
| **Delegado** | La persona **en el contexto de una edición concreta del ACE** o de un acuerdo (LOI) que firmó. Una persona que asistió a 3 ACEs es "delegado" 3 veces. |
| **Perfil** | La página `/participants/[id]` que muestra a esa persona: foto, cargo, sectores, ediciones y conexiones. |
| **LOI / Acuerdo** | Carta de intención firmada entre dos partes en una edición. Tiene un campo `delegate` (quién firmó). |

La regla de oro del modelo:

> **Una tarjeta / fila de "delegado" = una persona × una edición.**
> Esto es lo que produce el conteo de `cumulativeParticipations` (~1.040)
> que se ve en el Observatory. Si una persona fue a ACE 18 y ACE 20,
> genera **dos** tarjetas de delegado, pero **un solo** perfil.

---

## 1. El modelo de datos de una persona

La estructura canónica está en [types/index.ts](../types/index.ts#L163) → `interface Participant`:

```ts
interface Participant {
  id: string;                 // slug único, p.ej. p-memphis-45-virginia-avila
  name: string;
  countryId: string;          // FK a data/countries.ts ('intl' si es organismo multilateral)
  organization: string;       // texto libre de la institución
  role: string;               // cargo
  sectorIds: string[];        // FK a data/sectors.ts (temas de trabajo)
  actorType: ActorType;       // Government | Academia | Private Sector | International Organization | Entrepreneurial Ecosystem
  editionIds: string[];       // FK a data/editions.ts — LAS EDICIONES A LAS QUE ASISTIÓ
  areasOfInterest: string[];
  photoUrl?: string;          // ruta bajo /public/participants/... (lleva el basePath del deploy)
  shortBio?: string;
  social?: { twitter, linkedin, facebook, instagram, youtube };
  organizationId?: string;    // FK opcional a data/organizations.ts (IDB, OAS, CAF, UN-HABITAT…)
}
```

El array se ensambla en [data/participants.ts](../data/participants.ts) fusionando **dos fuentes**:

1. **`_memphis-participants.json`** — la edición vigente (ACE Memphis 2026),
   sincronizada desde riacevents.org.
2. **`_historical-participants.json`** — todas las ediciones pasadas (ACE 2–22),
   reconstruidas a partir de PDFs y páginas web archivadas (ver §4).

Durante la fusión:
- Se **deduplica por nombre** (normalizado sin acentos). Si la misma persona
  aparece en el histórico y en Memphis, gana el registro de Memphis y se
  **unen los `editionIds`** de ambos.
- Se mapean textos sueltos a enums canónicos: `sectors[]` → `actorType`
  (`mapActorType`), `expertise[]` → `sectorIds` (`mapSectors`).
- El campo `country` que a veces trae un organismo ("IDB", "CAF", "OAS") se
  resuelve a `countryId='intl' + organizationId` con `matchOrganizationByLabel`
  (matching por palabra completa y por paréntesis, para no falsear "EC" dentro
  de "Economic Development").

> ⚠️ Por la deduplicación, un `id` histórico (`p-hist-ar-...`) puede
> "desaparecer" en favor del de Memphis. Por eso la página de perfil tiene
> `findParticipantByLooseId()`: si no encuentra el id exacto, hace fallback
> por el slug de nombre al final del id. Esto mantiene vivos los deep-links.

---

## 2. La sección de delegados de cada **perfil** (`/participants/[id]`)

Archivo: [app/(public)/participants/[id]/page.tsx](../app/(public)/participants/[id]/page.tsx)

Cada perfil se arma **100% a partir del registro `Participant`** más las tablas
de referencia (countries, editions, sectors, organizations). No hay campos
"sueltos": todo se deriva por FK. Estructura de la página:

### Columna principal
1. **Cabecera** — foto (`photoUrl`, con fallback a ícono si no hay), nombre,
   `role`, `organization`, y chips de: país (`countryId`), `actorType`, y
   organización multilateral (`organizationId`, con su color de marca).
   Links sociales (`social.linkedin/twitter/facebook`) y "See connections".
2. **Sectors of work** — chips por cada `sectorIds`, con color del sector.
3. **ACE editions attended** — lista derivada de `editionIds`, ordenada de la
   más reciente a la más antigua, cada una linkeando a `/editions/[id]`.

### Rail lateral — "Connections" (la parte clave de delegados)
Aquí es donde el perfil deja de ser una ficha estática y se vuelve red. La
lógica de conexión (líneas 65–80):

```ts
// Un "peer" es cualquier OTRO delegado que comparte
//   ≥1 edición  Y  ≥1 sector con esta persona.
const peers = participants
  .filter(o => o.id !== p.id)
  .filter(o => o.editionIds.some(e => p.editionIds.includes(e)))  // misma edición
  .filter(o => o.sectorIds.some(s => p.sectorIds.includes(s)))    // mismo sector
  .map(o => ({ peer: o, sharedEditions, sharedSectors }))
  .sort(por relevancia: sharedEditions*2 + sharedSectors)         // pondera edición doble
  .slice(0, 30);                                                  // top 30
```

**Qué datos agarra la sección de delegados, en resumen:**

| Dato mostrado          | De dónde sale |
|------------------------|---------------|
| Foto, nombre, cargo    | `Participant.photoUrl / name / role` |
| Institución            | `Participant.organization` (+ `organizationId` si es multilateral) |
| País                   | `countryById(countryId)` |
| Tipo de actor          | `Participant.actorType` |
| Sectores               | `sectorIds` → `data/sectors.ts` |
| Ediciones asistidas    | `editionIds` → `data/editions.ts` |
| Conexiones / peers     | Cruce en vivo edición∩sector con el resto del array |
| "At a glance"          | Conteos derivados: nº ediciones, países distintos, nº sectores, nº conexiones |

**Cómo *debe* comportarse (reglas de negocio a respetar si se edita):**
- La conexión requiere **edición compartida Y sector compartido** — no basta
  con una sola. Es lo que hace que la red sea significativa y no ruido.
- La edición pesa **el doble** que el sector en el ordenamiento (haber estado
  en el mismo ACE es señal más fuerte de vínculo real).
- Se cortan a **30 peers** para que el rail no explote. Si se sube el límite,
  vigilar performance porque el cruce es O(n) sobre ~1.000 registros.
- Si falta `photoUrl`, **siempre** hay fallback (ícono o iniciales). Nunca
  dejar imagen rota.

---

## 3. El **directorio de delegados** (export para el sitio del ACE)

Además del perfil individual, existe un export independiente: un directorio
completo, buscable, en **un solo HTML autocontenido** listo para incrustar en
el sitio del ACE (sin build, sin framework, sin llamadas de red).

Script: [scripts/export-delegates-html.ts](../scripts/export-delegates-html.ts)
Salida: `ace-delegates/` → `index.html` + `photos/`

### Cómo correrlo
```bash
npx tsx scripts/export-delegates-html.ts
```

### Qué hace, paso a paso
1. Borra y recrea `ace-delegates/` y `ace-delegates/photos/`.
2. Recorre **todos** los `participants`. Por cada persona:
   - Resuelve la foto con `resolvePhoto()`: quita el `BASE_PATH` del deploy del
     `photoUrl`, la localiza bajo `/public/participants/...`, y **copia solo
     las fotos referenciadas** a `photos/` (deduplicando; si el archivo no
     existe en disco, cae a iniciales).
   - Resuelve país (`countryById`) y organización (`organizationById` o el
     texto libre).
   - **Emite una fila (`Row`) por cada `editionIds`** → una tarjeta por persona
     por edición. Aquí es donde nace el conteo de ~1.040 participaciones.
3. Ordena por edición (más reciente primero) y luego por nombre.
4. Inyecta **todo el dataset como JSON inline** dentro del `<script>` del HTML
   y renderiza la página con `renderHtml()`.

### Cómo se ve / qué trae la página exportada
- **Grid de tarjetas**: avatar (foto o iniciales), nombre, cargo, institución,
  y chips de edición + país.
- **Buscador** por nombre / cargo / institución (normaliza acentos).
- **Filtros** por país, edición y sector (`actor`).
- Contador "X of Y participations" y footer con el total.
- Render por *chunks* para que la primera pintura sea rápida con ~1.000 tarjetas.

Cada `Row` exportada lleva exactamente:
```ts
{ name, role, org, country, edition ("ACE 20"), editionName, actor, photo }
```

> El export es un **artefacto derivado**: no editar el HTML a mano. Si cambian
> los datos, se regenera corriendo el script otra vez. Se entrega arrastrando
> la carpeta `ace-delegates/` completa al host del ACE y linkeando a
> `index.html` (o embebiéndolo en un iframe).

---

## 4. Cómo se generaron las **listas/PDF** de participantes y delegados

Aquí hay que separar dos cosas que se suelen confundir:

### 4a. Los PDF de origen (INPUT) — de dónde salieron los datos históricos

Las listas oficiales de cada ACE llegaron como **PDF y páginas web archivadas**
en [info-reports/](../info-reports/), por ejemplo:
- `ACE3-list-of-participants.pdf`, `ACE2-List-of-Participants.pdf`,
  `ace6-participants.pdf`, `ACE10-Participants.pdf` …
- páginas HTML de los CMS del sitio (`ACE17-Participants ACE Panama.html`,
  `ACE19-Participants – ACE Armenia.html`, …)

El pipeline para convertir esos PDF/HTML en datos estructurados fue:

1. **Extracción de texto del PDF** — `scripts/extract_pdf_content.py` lee cada
   PDF y **cachea** el texto/estructura como JSON en
   [data/_pdf-cache/](../data/_pdf-cache/) (p.ej. `ACE-3-list-of-participants.json`).
   El cache evita re-parsear el PDF en cada corrida.
2. **Extractores por edición** — scripts dedicados parsean el texto cacheado y
   arman registros de persona:
   - `extract_ace3_participants.py`, `extract_ace7_photos.py`,
     `extract_ace9_participants.py`, etc. (formatos distintos por año).
   - `enrich_participants_html.py` procesa las páginas web archivadas (soporta
     dos formatos de CMS: Divi `et_pb_team_member` y Elementor), extrae nombre,
     cargo, institución, bio, foto y redes, y **copia las fotos** a
     `public/participants/historical/`.
3. **Normalización y matching** — todo se vuelca a
   `_historical-participants.json`, deduplicando por nombre normalizado sin
   acentos, con una `NAME_BLACKLIST` para sacar personas que el PDF listaba
   pero que no asistieron.
4. **Fusión final** — `data/participants.ts` une histórico + Memphis (ver §1).

Otros scripts del mismo pipeline: `ingest_participants_csv.py` (cuando la
fuente vino como CSV), `sanitize_pii.py` (limpieza de datos personales),
`sync_memphis_from_riacevents.py` (sincroniza la edición vigente).

### 4b. Las listas/directorio que **generamos nosotros** (OUTPUT)

Lo que **producimos** a partir del dataset ya limpio:

| Salida | Script | Formato |
|--------|--------|---------|
| **Directorio de delegados** (buscable, para el sitio ACE) | `scripts/export-delegates-html.ts` | HTML autocontenido (`ace-delegates/index.html`) |
| **Perfiles individuales** | `app/(public)/participants/[id]/page.tsx` | Páginas estáticas del sitio Next.js |
| **Listado de participantes** | `app/(public)/participants/page.tsx` | Página del sitio |

> **Aclaración importante sobre "PDF":** los PDF son la **entrada** (las listas
> oficiales de cada ACE en `info-reports/`). Lo que nosotros **generamos** es
> HTML/páginas del sitio, no un PDF. Si se necesita un PDF de salida (p.ej. la
> lista de delegados para imprimir), la vía recomendada es:
> abrir `ace-delegates/index.html` en el navegador y usar
> **Imprimir → Guardar como PDF**, o renderizarlo con un headless (Puppeteer)
> apuntando a ese mismo HTML. No hay que reconstruir nada: el HTML ya trae
> todo el dataset inline.

---

## 5. El campo `delegate` en los acuerdos (LOIs)

Hay un tercer lugar donde aparece "delegado": las **cartas de intención**.
Modelo en [data/lois.ts](../data/lois.ts):

```ts
interface LOI {
  edition, editionLabel;
  kind: "delegates" | "academia";
  partyA, countryA, partyB, countryB;
  purpose;
  delegate: string | null;   // quién firmó por las partes
}
```

- Los LOIs se importan de los workbooks del equipo (Córdoba, Belém, Illinois)
  con `scripts/import_lois.py` (idempotente, dedup por
  edición+partyA+partyB+países).
- En el admin, el detalle del acuerdo muestra el delegado:
  [app/admin/agreements/[id]/page.tsx](../app/admin/agreements/[id]/page.tsx#L86).
- Los scripts `link-agreement-delegates.ts` y `backfill-loi-delegates.ts`
  cierran el triángulo **persona ↔ institución ↔ acuerdo**: por cada `delegate`
  de un LOI que no tiene un `Participant` correspondiente, crean el registro
  (rol "Delegate") e infieren su institución/país de la `partyA` del acuerdo.
  Regla: si el "nombre" es en realidad un email (`@`), **no** se fabrica una
  persona — se marca como bug de datos.

---

## 6. Resumen de una frase por tema

- **Perfil de delegado** = ficha derivada 100% del `Participant` + FKs, con un
  rail de "conexiones" que cruza edición∩sector en vivo (top 30).
- **Directorio de delegados** = export HTML autocontenido, una tarjeta por
  persona × edición (~1.040), regenerable con un solo comando.
- **Datos** = fusión de Memphis (riacevents) + histórico (PDFs/HTML de
  `info-reports/` extraídos y cacheados en `_pdf-cache/`), deduplicado por
  nombre.
- **"PDF"** = son la fuente de entrada; nuestra salida es HTML → si se quiere
  PDF, se imprime/headless el HTML ya generado.
