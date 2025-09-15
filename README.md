# Branching-caser for operasjonsstue

Interaktiv, statisk nettside for undervisning (2 × 45 min) med ett dypt, komplekst case som dekker diatermi, anestesiapparat, laparoskopi, pumper/varmer, EMI, kabelføring, vaktbytte m.m.

## Innhold
- `index.html` – inngang/GUI
- `styles.css` – tema/utseende
- `script.js` – motor: meny, steg, valg, poeng, status/flags og sidebar
- `cases.js` – case og branching-struktur (noder med valg, effekter og kompetansemål)

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

## Lisens og kildebruk
Casene er generiske og uten personsensitive opplysninger. Tilpass med lokale prosedyrer og retningslinjer.
