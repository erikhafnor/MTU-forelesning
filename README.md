# Branching-caser for operasjonsstue

Interaktiv, statisk nettside for undervisning (2 × 45 min) med ett dypt, komplekst case som dekker diatermi, anestesiapparat, laparoskopi, pumper/varmer, EMI, kabelføring, vaktbytte m.m.

## Innhold
- `index.html` – inngang/GUI
- `styles.css` – tema/utseende
- `script.js` – motor: meny, steg, valg, poeng, status/flags og sidebar
- `cases.js` – case og branching-struktur (noder med valg, effekter og kompetansemål)
 - `vote.html` – enkel studentside for live avstemming (Supabase)
 - `supabase-config.example.js` – malfil; kopier til `supabase-config.js` og fyll inn URL/anon key

## Slik bruker du
1. Åpne `index.html` i nettleser (dobbelklikk eller høyreklikk → Åpne med Safari/Chrome).
2. Velg et case og diskuter valgene i grupper.
3. Bruk hurtigtaster 1–9 for valg, Backspace for å gå til meny.
5. Sidebar-faner: Status (pasient/personell/utstyr), Kunnskap (læringsutbytter), Logg (siste hendelser), Kart (forgreningsoversikt for debrief).
4. Poeng telles i toppbaren. «Nullstill poeng» fra menyen mellom grupper.

Tips: Koble Mac til prosjektor i fullskjerm. Zoom inn/ut med `Cmd` + `+/-` ved behov.

## Kjøre som lokal server (valgfritt)
Hvis nettleseren din begrenser `file://` lasting, kan du kjøre en liten server.

```bash
# macOS (zsh)
python3 -m http.server 8000
# åpne http://localhost:8000 i nettleser og naviger til mappen
```

## Pedagogisk opplegg (forslag)
- 10 min: Intro – sikkerhetsprinsipper (jord, returplate, lekkasjetest, EMI, kabelføring, søl).
- 30–35 min: Spill caset i plenum (eller grupper). Bruk Status/Logg aktivt underveis.
- 30 min: Debrief med Kart-fanen. Diskuter “trap choices” og latente konsekvenser.
- 5 min: Oppsummering og læringspunkter. Vis lokale avviksmeldingsrutiner.

## Tilpassing
- Rediger `cases.js` for å legge til/endre noder, valg, effekter og `competencies`.
- Aktiver latente konsekvenser med `flags` på valg og `flagRedirects` på senere noder.
- Bilder kan legges ved i mappen og refereres fra `nodes[].image`.
- Endre farger/typografi i `styles.css`.

## Live avstemming (valgfritt, Supabase)
Dette er en enkel, frivillig modul som lar studenter stemme på valg fra egen telefon. Fungerer på GitHub Pages.

1) Opprett prosjekt på supabase.com → kopier Project URL og anon-public key.
2) Kopier `supabase-config.example.js` til `supabase-config.js` og lim inn dine verdier.
3) I Supabase SQL editor, kjør dette (oppretter tabeller + RLS):

```sql
-- Krever pgcrypto for gen_random_uuid (Database > Extensions)
create extension if not exists pgcrypto;
create table if not exists public.sessions (
	code text primary key,
	current_node text,
	created_at timestamp with time zone default now()
);

create table if not exists public.votes (
	id uuid primary key default gen_random_uuid(),
	code text not null references public.sessions(code) on delete cascade,
	node_id text not null,
	choice_idx int not null,
	client_id text not null,
	created_at timestamp with time zone default now()
);

-- Unik stemme per klient per node i en sesjon
create unique index if not exists votes_unique_per_client_node on public.votes(code, node_id, client_id);

-- Aktiver RLS
alter table public.sessions enable row level security;
alter table public.votes enable row level security;

-- RLS: alle kan lese/legge inn stemmer innen en gyldig sesjon (idempotent)
drop policy if exists select_sessions on public.sessions;
create policy select_sessions on public.sessions
	for select using (true);

drop policy if exists insert_sessions on public.sessions;
create policy insert_sessions on public.sessions
	for insert with check (true);

drop policy if exists update_sessions on public.sessions;
create policy update_sessions on public.sessions
	for update using (true) with check (true);

drop policy if exists select_votes on public.votes;
create policy select_votes on public.votes
	for select using (true);

drop policy if exists insert_votes on public.votes;
create policy insert_votes on public.votes
	for insert with check (
		exists (select 1 from public.sessions s where s.code = votes.code)
	);
-- Endring av stemme skjer via upsert på (code,node_id,client_id)
```

4) Gå til appen. I sidebar vises fanen «Avstemming». Klikk «Start sesjon» for å få en kode + QR.
5) Studentlenke åpner `vote.html`, f.eks.: `/vote.html?s=CODE`. Studenten trenger ikke ny QR for hvert spørsmål; siden henter gjeldende steg automatisk.
6) I «Avstemming» klikker du «Oppdater telling» og «Bruk flest stemmer» for å anvende resultatet.

Merk:
- Modulen er robust uten server, men avhengig av Supabase tilgjengelighet.
- Konfigurasjonsfilen `supabase-config.js` er ikke sjekket inn – du bruker din lokale.
- Avstemming kan slås av ved å fjerne Supabase-skriptet i `index.html`.

## Lisens og kildebruk
Casene er generiske og uten personsensitive opplysninger. Tilpass med lokale prosedyrer og retningslinjer.
