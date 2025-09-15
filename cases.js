// En samlet, troverdig «branching narrative» for én operasjon basert på meldte hendelser (Aisys CS2, Olympus ESG‑400, FT10,
// og kjente risikoer ved bipolar/irrigasjon). Fokus: sannsynlige årsaker, trygg håndtering og læring.

const CASES = [
  {
    id: 'or-hendelseskjede',
    title: 'Dagkirurgisk TUR-V – én operasjon, flere hendelser',
    subtitle: 'Aisys CS2 (ingen flow) • Olympus ESG-400 (smell/brentlukt) • FT10 (feilkobling) • Bipolar/irrigasjon (brannskade)',
    domain: 'OR – Anestesi og diatermi',
    difficulty: 'Krevende',
    start: 'brief',
    nodes: {
      brief: {
        order: 1,
        text: 'Pasient til dagkirurgisk TUR-V (blæretumor). Team: Anestesisykepleier Nora, operasjonssykepleier Kari og kirurg dr. Holm. Aisys CS2 står ved hodet, ESG-400 som primær, FT10 som reserve. Bipolar slyngediatermi planlagt (uten returplate). Ortopedibord MAQUET ORTHOSTAR II hentes opp – fjernkontrollen ligger i «lykkeboden». Høyre armbord er nær infusjonsstativ. Nora kjenner et lite sug i magen: “Alt må flyte i dag.” Kari tenker: “Få kontroll på kabler og instrumentparkering.” Hva forbereder du før innledning?',
        learn: 'Forebygg alternativ retur (isolér armbord/metall), sjekk gass/ventilasjon/AMBU-beredskap og kabel-/portoppsett før aktivering.',
        competencies: ['Forebyggende arbeid', 'Sikker bruk', 'Kirurgiske instrumenter'],
        choices: [
          { label: 'Sjekk Aisys, legg AMBU klar, polstr armbord/hånd, flytt metall bort; hent/sett opp ORTHOSTAR-fjernkontroll', points: +3, goto: 'orthostar', effects: { equipment: { anesthesia: 'apparat OK' }, log: 'AMBU klar, armbord isolert, metall flyttet, fjernkontroll funnet.' } },
          { label: 'Kjør team-brief og sjekkliste (AMBU klar, kabler, instrumentparkering, bord)', points: +2, goto: 'orthostar', effects: { log: 'Team-brief gjennomført.' } },
          { label: 'Gå rett på innledning – “vi tar ting underveis”', points: -2, goto: 'orthostar', effects: { log: 'Forberedelser nedprioritert.', flags: { metal_kontakt: true } } },
          { label: 'Send assistent for å hente fjernkontroll senere – start annet oppsett nå', points: -1, goto: 'orthostar', effects: { log: 'Fjernkontroll forsinkes.' } },
        ],
      },
      orthostar: {
        order: 1.5,
        text: 'Kari monterer ORTHOSTAR II: benplater låses med spak (sort kule), hodeplaten skyves inn og skrus. Hun trykker fotpedalen i hodeenden: rødt symbol (låst). “Lås for å kunne justere,” tenker hun. Fjernkontrollen klikkes ut av lader. “0”-knappen settes: et kort lydsignal bekrefter nøytral. Dr. Holm ønsker lett Trendelenburg senere. Hva gjør dere nå?',
        learn: 'Bordet må være låst (rød) for å kunne justeres med fjernkontroll; pedal opp (grønn) for å flytte på hjul. “0” gir nøytral posisjon med lydsignal.',
        competencies: ['Sikker bruk', 'Standarder/prosedyrer'],
        choices: [
          { label: 'Bekreft lås (rød), test fjernkontroll og planlegg bevegelsesvei; dokumenter nøytral (“0”-beep)', points: +2, goto: 'induksjon', effects: { equipment: { notes: ['ORTHOSTAR OK'] }, log: 'Bord låst og testet, “0” bekreftet.' } },
          { label: 'La bordet stå ulåst for å være “klar til flytting”', points: -2, goto: 'induksjon', effects: { log: 'Bord står ulåst.', flags: { bord_ulast: true } } },
          { label: 'Sett retningsspak og gå gjennom hjulbanen; løft kabler og gi ansvar til en person under all flytting', points: +1, goto: 'induksjon', effects: { log: 'Hjulbane avklart og kabler løftes ved flytting.' } },
          { label: 'Utsett bordtest – “kan ta det når vi først tiler”', points: -1, goto: 'induksjon', effects: { log: 'Bordtest utsatt.' } },
        ],
      },
      induksjon: {
        order: 2,
        text: 'Induksjon med LMA. Pasienten desaturerer. Manuell ventilasjon via Aisys CS2 gir ingen flow. Når du bytter til AMBU, kommer det ventilasjon og metningen stiger.',
        learn: 'Først sikre ventilasjon (AMBU). Deretter sjekk APL/FGF/ventiler/koblinger/lekasje i apparatkretsen.',
        competencies: ['Akutt håndtering', 'Teknologi for overvåkning'],
        choices: [
          { label: 'Fortsett med AMBU; sjekk APL er åpen, øk FGF, kontroller èn-veisventiler, koblinger og lekkasje', points: +4, goto: 'oppsett-esu', effects: { equipment: { anesthesia: 'AMBU-ventilasjon' }, outcome: 'pasient ventilert sikkert', log: 'AMBU brukt, APL/FGF/ventiler sjekket.' } },
          { label: 'Behold Aisys, øk FGF og klem reservoar – “det ordner seg”', points: -3, goto: 'oppsett-esu', effects: { outcome: 'langvarig desat', log: 'Prøvde via apparat for lenge.' } },
          { label: 'Kall på assistanse (anestesi-lege) og fortsett AMBU', points: +2, goto: 'oppsett-esu', effects: { log: 'Assistanse tilkalt.' } },
          { label: 'Bytt til maskeventilasjon uten å feilsøke kretsen i det hele tatt', points: -1, goto: 'oppsett-esu', effects: { log: 'Kretsfeil uadressert.' } },
        ],
      },
      'oppsett-esu': {
        order: 3,
        text: 'Kirurgen er klar. ESG-400 primær. Bipolar slyngediatermi kobles opp. Armbordet er nær metall fra stativ/skinneklemmer. Kari kjenner et lite ubehag: “Har vi virkelig fjernet all metallkontakt?” Dr. Holm ser på skjermen: “Vi må kunne tilte snart.” Hvordan sikrer du oppsettet?',
        learn: 'Bipolar trenger ikke returplate, men pasient må ikke ha hudkontakt med metall. Alternativ strømbane kan gi brannskade på finger/hånd.',
        choices: [
          { label: 'Bekreft isolasjon av armbord/hånd og fjern metall, kabelstrekk ordnes, så “test i luft”', points: +3, goto: 'bord-posisjon', effects: { log: 'Isolasjon bekreftet, “test i luft” OK.' } },
          { label: 'Legg et tørt håndkle mellom hånd og armbord og gå videre', points: 0, goto: 'bord-posisjon', effects: { log: 'Midlertidig skille lagt inn.' } },
          { label: 'Ingen ekstra tiltak – “bipolar er trygt”', points: -2, goto: 'bord-posisjon', effects: { log: 'Isolasjon ikke verifisert.', flags: { metal_kontakt: true } } },
          { label: 'Sett “bipolar only” og informer teamet om instrumentparkering/holder', points: +2, goto: 'bord-posisjon', effects: { log: 'Modus og parkering avklart.' } },
        ],
      },
      'bord-posisjon': {
        order: 3.5,
        text: 'Dr. Holm ber om 10° Trendelenburg. Kari trykker på fjernkontrollen, men ingenting skjer. Bordet rikker seg ikke. Hun ser ned: fotpedalen… var det rød (låst) eller grønn (ulåst)? “Hva har jeg oversett?” tenker hun. Samtidig står Aisys tett mot sokkelen, med kabler på gulvet.',
        learn: 'Justering krever låst bord (rød). For flytting må pedalen stå i grønn og retningsspak settes. Kabler må ryddes før bevegelse for å unngå klem/skade.',
        competencies: ['Sikker bruk', 'Forebygging (miljø/MTU)'],
        choices: [
          { label: 'Sett fotpedal til rød (låst), juster med fjernkontrollen; planlegg flytting med grønn + retningsspak og rydd kabler først', points: +3, goto: 'flytt-anes', effects: { log: 'Bordjustering gjennomført sikkert.' } },
          { label: 'Prøv å “hjelpe” bordet fysisk mens det er ulåst', points: -3, goto: 'flytt-anes', effects: { log: 'Feil håndtering av bord – risiko for skade.', flags: { bord_ulast: true } } },
          { label: 'Rop på hjelp og utsett tilt til kabler/hjulbane er sikker', points: +1, goto: 'flytt-anes', effects: { log: 'Tilt utsatt til sikker bane.' } },
          { label: 'Trykk flere ganger raskt på fjernkontrollen for å “vekke” bordet', points: -1, goto: 'flytt-anes', effects: { log: 'Uklar fjernkontrollbruk.' } },
        ],
      },
      'flytt-anes': {
        order: 3.7,
        text: 'For å gi plass flytter Nora Aisys noen centimeter. “Bare litt,” tenker hun. En svak knas høres når hjulet ruller over en skjult strømkabel under duk. Ingen reagerer med en gang, men Kari kjenner en uro i brystet.',
        learn: 'Trillehjul over kabel kan skade isolasjon. Skadet kabel kan gi berøringsspenning og jordfeil. Rydd og løft kabler ved forflytning.',
        choices: [
          { label: 'Stopp, løft kabler, inspiser for klem/skade; bytt mistenkt kabel før videre bruk', points: +3, goto: 'smell-esg', effects: { log: 'Kabler inspisert og sikret.' } },
          { label: 'Fortsett – “det går fint”', points: -2, goto: 'smell-esg', effects: { log: 'Mulig kabelskade oversett.', flags: { cable_damage: true } } },
          { label: 'Hent strips/kabelbro og løft kabler systematisk', points: +1, goto: 'smell-esg', effects: { log: 'Kabler løftet fra gulv.' } },
          { label: 'Be portør stå vakt og passe på kabler manuelt', points: 0, goto: 'smell-esg', effects: { log: 'Midlertidig kabelvakt.' } },
        ],
      },
      'smell-esg': {
        order: 4,
        text: 'Under bruk høres et smell fra ESG-400. Brentlukt. Effekt uteblir. Teamet stopper.',
        learn: 'Ved intern feil: ta ut av bruk umiddelbart, ikke restart i feltet. Sikre pasient/omgivelser og bytt til reserve.',
        choices: [
          { label: 'Koble fra, ta ESG-400 ut av bruk, hent FT10, dokumenter og meld til MTA/leverandør', points: +4, goto: 'ft10-setup', effects: { outcome: 'apparatfeil håndtert', log: 'ESG-400 tatt ut av bruk, FT10 inn.' } },
          { label: 'Prøv å slå på igjen og fortsett', points: -4, goto: 'eskaler', effects: { outcome: 'risiko brann/elektrisk skade', log: 'Fortsetter etter intern feil.' } },
          { label: 'Bytt til manuell hemostase midlertidig, mens teknisk tilkalles', points: 0, goto: 'ft10-setup', effects: { log: 'Midlertidige tiltak mens reserve settes opp.' } },
        ],
        flagRedirects: [ { flag: 'cable_damage', goto: 'monitor-beroring' } ],
      },
      'monitor-beroring': {
        order: 4.2,
        text: 'Kari kjenner prikking i fingertuppene når hun flytter på en monitorledning. Nora ser et lite glimt ved en skjøtekabel. “Har vi en skadet kabel?” Tenker raskt at pasienten og teamet må beskyttes før videre energibruk.',
        learn: 'Skadet isolasjon kan legge fase mot ledende deler. Tiltak: ta krets ut av drift, bytt kabel/fordeler, verifiser jordfeilbryter og berøringssikkerhet.',
        choices: [
          { label: 'Stans, ta ut mistenkt kurs/kabel, bytt skjøtekabel, re-rut sensitive ledninger – test jordfeilbryter', points: +4, goto: 'ft10-setup', effects: { outcome: 'kabelskade utbedret', log: 'Skadet kabel byttet; jordfeilbryter testet.' } },
          { label: 'Tape over skaden og fortsett', points: -3, goto: 'jordfeil', effects: { log: 'Taping valgt – høy risiko.', flags: { latent_shock: true } } },
          { label: 'Behold alt som det er – “det var sikkert statisk”', points: -2, goto: 'ft10-setup', effects: { log: 'Mulig berøringsspenning ignorert.' } },
        ],
      },
      jordfeil: {
        order: 4.4,
        text: 'Plutselig går jordfeilbryteren. Aisys mister nett, Nora går umiddelbart over på AMBU. “Dette kunne gått galt,” tenker hun, men pusten er stabil.',
        learn: 'Ved GFCI-utløsning: sikr ventilasjon (AMBU), isoler feilkurs og bytt ut mistenkt kabel/fordeler før re-etablering.',
        choices: [
          { label: 'Sikre AMBU, identifiser feilkurs/kabel og bytt før videre drift', points: +3, goto: 'ft10-setup', effects: { equipment: { anesthesia: 'AMBU-ventilasjon' }, outcome: 'jordfeil håndtert', log: 'Feilkurs isolert, bytte utført.' } },
        ],
      },
      'ft10-setup': {
        order: 5,
        text: 'Valleylab FT10 er rullet inn. Flere porter for mono/bipolar og pedaler. Ny assistent kobler raskt.',
        learn: 'Riktig portmapping og “test i luft” er avgjørende. Feilkobling kan gi uventet aktivering av bipolar uten pedal.',
        choices: [
          { label: 'Stans opp: verifiser porter, test pedal/hånd i luft før bruk', points: +3, goto: 'ft10-aktivering', effects: { log: 'Porter/pedaler verifisert OK.' } },
          { label: 'La assistent koble “som vanlig” og gå videre', points: -2, goto: 'ft10-aktivering', effects: { log: 'Portmapping ikke verifisert.', flags: { ft10_misplug: true } } },
          { label: 'Be om “to-personers sjekk” av porter/pedaler og merk kabler med tape/farge', points: +2, goto: 'ft10-aktivering', effects: { log: 'To-personers sjekk og merking gjort.' } },
          { label: 'Gjør vaktbytte nå for å avlaste – ny anestesi overtar', points: 0, goto: 'vaktbytte', effects: { staff: { vaktbytte: 'initiert' }, log: 'Vaktbytte trigget før aktivering.' } },
        ],
      },
      vaktbytte: {
        order: 5.4,
        text: 'Vaktbytte: ny anestesisykepleier (Lars) overtar midt i oppsett. Han har ikke sett kablene kobles. Nora prøver å oppsummere raskt mens kirurgen venter.',
        learn: 'Strukturert overlevering med sjekkliste reduserer feil – spesielt rundt porter/pedaler, AMBU-status og bordlås.',
        choices: [
          { label: 'Bruk sjekkliste og pek fysisk på porter/pedaler/kabler (les opp høyt)', points: +2, goto: 'ft10-aktivering', effects: { staff: { vaktbytte: 'gjennomført med sjekkliste' }, log: 'Strukturert overlevering.' } },
          { label: 'Muntlig “det går greit” og fortsett', points: -1, goto: 'ft10-aktivering', effects: { staff: { vaktbytte: 'uformell' }, log: 'Ustrukturert overlevering.', flags: { handover_risk: true } } },
        ],
      },
      'ft10-aktivering': {
        order: 6,
        text: 'Kirurgen løfter bipolartangen. Strøm ser ut til å gå før fotpedal er trykket.',
        learn: 'Sannsynlig feilkobling/feil kanal. Tiltak: Standby, frakoble, koble riktig og re-test.',
        choices: [
          { label: 'Standby → frakoble → koble riktig (bipolar→bipolar) → re-test', points: +4, goto: 'parkering', effects: { outcome: 'uventet aktivering stoppet', log: 'Rekobling utført.' } },
          { label: 'Ignorere og fortsette', points: -3, goto: 'skade-hud', effects: { outcome: 'hudskade', log: 'Ignorert uventet aktivering.' } },
          { label: 'Reduser effekt og be kirurgen “ta det forsiktig”', points: -2, goto: 'parkering', effects: { log: 'Effekt redusert uten å adressere årsak.' } },
          { label: 'Koble om pedaler først – kanskje feil pedal er aktiv', points: 0, goto: 'parkering', effects: { log: 'Pedaler re-sjekket.' } },
        ],
        flagRedirects: [ { flag: 'ft10_misplug', goto: 'skade-hud' } ],
      },
      'skade-hud': {
        order: 6.5,
        text: 'Et overflatisk sår sees ved berøringspunkt. Pedal var ikke aktivert. Teamet erkjenner koblingsfeil.',
        learn: 'Feilkobling kan bypasse aktiveringslogikk. Innfør streng kabel-/pedalkontroll og merking.',
        choices: [ { label: 'Dokumenter, meld, korriger og re-test', points: +2, goto: 'parkering' } ],
      },
      parkering: {
        order: 7,
        text: 'Kirurgen legger fra seg bipolartang under duk ved overarmen. Irrigasjon pågår og samler seg i feltet.',
        learn: 'Aktive instrument skal i isolert holder, spisser synlige. Væske og hudkontakt kan gi strømbane/overslag.',
        choices: [
          { label: 'Bruk isolert holder/silikonmatte, hold spisser synlige og tøm væske fra felt', points: +3, goto: 'irrigasjon', effects: { log: 'Instrument parkert i holder, væske håndtert.' } },
          { label: 'La tangen ligge – “vi bruker den straks”', points: -2, goto: 'irrigasjon', effects: { log: 'Pinsett ligger mot hud/duk.', flags: { pinsett_pahud: true } } },
          { label: 'Deleger til Kari å overvåke instrumentparkering aktivt', points: +1, goto: 'irrigasjon', effects: { log: 'Instrumentvakt etablert.' } },
          { label: 'Be kirurgen holde tangen over kant – “jeg følger med”', points: 0, goto: 'irrigasjon', effects: { log: 'Uformell løsning på parkering.' } },
        ],
      },
      irrigasjon: {
        order: 8,
        text: 'Under irrigasjon høres tone fra generator uten aktiv bruk. Ved avdekking sees rødme i albuekroken.',
        learn: 'Ledende væske og instrument på hud kan gi strøm i “hvile”. Sjekk pedaler/kanaler, isoler instrument, fjern væske, og re-test.',
        choices: [
          { label: 'Stans, test pedaler/kanaler, isoler instrument, tørk/tøm, re-test før videre bruk', points: +4, goto: 'stabil-drift', effects: { outcome: 'årsaker identifisert', log: 'Pedaler/kanaler testet, væske fjernet.' } },
          { label: 'Fortsett – “lite utslag”', points: -3, goto: 'eskaler', effects: { log: 'Ignorert unormal tone.' } },
          { label: 'Skru ned effekt og fortsett uten å endre noe annet', points: -1, goto: 'eskaler', effects: { log: 'Symptombehandling uten årsakskontroll.' } },
          { label: 'Bytt instrument og feltduker, og gjenoppta først etter tørre forhold', points: +2, goto: 'stabil-drift', effects: { log: 'Ny start med tørre forhold.' } },
        ],
        flagRedirects: [ { flag: 'pinsett_pahud', goto: 'skade-overarm' }, { flag: 'metal_kontakt', goto: 'postop-tommel' } ],
      },
      'stabil-drift': {
        order: 9,
        text: 'Etter tiltak er driften stabil. Kabler er ryddet, instrumenter i holder, og bordbevegelser skjer kontrollert. Teamet finner rytmen.',
        choices: [ { label: 'Gå mot avslutning', points: +1, goto: 'avslutning', effects: { log: 'Stabil drift etablert.' } } ],
      },
      'skade-overarm': {
        order: 8.5,
        text: 'Brannsår på overarm bekreftet. Ingen alarmer hørtes underveis.',
        learn: 'Synlighet og holderrutiner hindrer skjult kontakt. Væskehåndtering reduserer ledende baner.',
        choices: [ { label: 'Behandle, dokumenter, meld og re-brief team', points: +2, goto: 'avslutning' } ],
      },
      'postop-tommel': {
        order: 8.6,
        text: 'Postoperativt oppdages avbleket område på høyre tommel. Armbord/hånd kan ha hatt metallkontakt.',
        learn: 'Sannsynlig alternativ retur via metall. Tiltak: polstring/isolasjon i sjekkliste og fysisk avstand fra metall.',
        choices: [ { label: 'Dokumenter, meld, og oppdater prosedyre/sjekkliste', points: +2, goto: 'avslutning' } ],
      },
      eskaler: {
        order: 9,
        text: 'Situasjonen eskalerer: gnist/svidd lukt fra feil kanal/utstyr. Teamet er stresset.',
        learn: 'Nødstans og trygg re-etablering av utstyr er viktigere enn tempo.',
        choices: [
          { label: 'Nødstans relevante kretser, koble fra, varsle og re-etabler trygt', points: +1, goto: 'avslutning', effects: { outcome: 'nødstans/varsling', log: 'Nødstans gjennomført.' } },
          { label: 'Fortsett for enhver pris', points: -5, goto: 'avslutning', effects: { outcome: 'unødig risiko', log: 'Fortsatte til tross for klare faresignaler.' } },
        ],
      },
      avslutning: {
        order: 10,
        text: 'Operasjonen nærmer seg slutt. Nora slipper skuldrene litt når pasienten puster rolig. Kari noterer nøkkelpunkt i loggen: kabler, bordlås, instrumentparkering. Dr. Holm sier lavt: “Det viktigste er at vi er trygge – tempo kommer etterpå.” Teamet gjør en strukturert debrief.',
        learn: 'Debrief: Hva utløste hendelsene? Hvilke tiltak virket? Hva endrer vi i sjekklister og opplæring (ORTHOSTAR, AMBU-beredskap, ESU-porter, instrumentholder, kabelhåndtering)?',
        choices: [
          { label: 'Avslutt (suksess – læring)', end: true, points: +5, summary: 'Ventilasjonsproblem håndtert med AMBU. ESG-400 intern feil håndtert korrekt. FT10-feilkobling stoppet og rutiner forbedret. Instrumentparkering, væske- og kabelhåndtering innskjerpet. Bordlås og bevegelsesplan brukt etter prosedyre.' },
        ],
      },
    },
  },
];
