# MeBa Clients — Resterende Plan (8. sep – 25. sep 2026)

## Hvor vi faktisk er

Oprindelig dag 1–11 er leveret: repo/testramme, penge-/dato-primitiver,
skema, tenant-scoped datalag, validering, rebill-tilstandsmaskinen,
margin-beregning, klientliste-/detaljesider, indtægts- og
udlægstransaktioner koblet til UI'en, samt en portefølje-visning. 38 tests
består.

Ud over den oprindelige plan er der også leveret: kundevendt terminologi
(Modtaget omsætning/Forventet omsætning, Projektomkostninger,
Omkostninger til inddrivelse/inddrevne omkostninger, Overskud,
Overskudsgrad %), en månedsvælger på klientdetaljesiden (som rettede en
reel fejl, hvor tidligere daterede poster fremstod usynlige uden nogen
forklaring), grundlæggende tabel-/formular-CSS, et midlertidigt
dev-only hurtig-tilføj-panel, samt en README med skærmbilleder.

**Ikke gjort endnu, videreført fra den oprindelige plan:**
- Dag 12 — Aldersfordeling (hvad der er lagt ud og ikke inddrevet, fordelt
  på alder)
- Dag 13 — Adversarial-gennemgang (cross-tenant-angrebstests,
  pengegrænsetilfælde)
- Dag 14 — Rigtige data, README dækker allerede delvist dette

**Nyt scope, opstået ved manuel test af appen:**
- En rigtig designgennemgang — den nuværende styling er minimalt
  funktionel, ikke gennemtænkt
- Redigering/sletning af klienter (i dag kun oprettelse, via det
  midlertidige dev-panel)
- Fjernelse af det midlertidige dev-panel og opbygning af et rigtigt
  "tilføj klient"-flow
- Bredere stress-test — større datamængder, samtidige redigeringer,
  fejlbehæftet input ud over det dag 5's validering allerede dækker

---

## Dage i overblik

| Dag | Dato | Leverance |
|---|---|---|
| 1 | Tirs 8. sep | Aldersfordeling: uinddrevne udlæg efter alder |
| 2 | Ons 9. sep | Adversarial-gennemgang — cross-tenant + pengegrænsetilfælde |
| 3 | Tors 10. sep | Rigtig klient-CRUD — erstat dev-panelet med et rigtigt tilføj/rediger/arkivér-flow |
| 4 | Fre 11. sep | Designgennemgang, del 1 — layoutsystem, typografi, afstand |
| 5 | Man 14. sep | Designgennemgang, del 2 — formularer, tabeller, tomme/indlæsnings-tilstande |
| 6 | Tirs 15. sep | Mobil-/responsivt gennemsyn |
| 7 | Ons 16. sep | Stress-test — stor datamængde (500+ rækker), paginering hvis nødvendigt |
| 8 | Tors 17. sep | Stress-test — samtidige redigeringer, fejlbehæftet input ud over Zod |
| 9 | Fre 18. sep | Engagements synliggjort i UI'en (i dag kun i skemaet) |
| 10 | Man 21. sep | Synlighed for tilbagevendende indtægt — "denne aftale forfalder månedligt, hvad er ubetalt" |
| 11 | Tirs 22. sep | Eksport — CSV-download af en klients indtægter/udlæg for en måned |
| 12 | Ons 23. sep | Tilgængelighedsgennemgang — tastaturnavigation, skærmlæser-labels, kontrast |
| 13 | Tors 24. sep | Rigtige MeBa-data indtastet gennem UI'en, tal sanity-tjekket |
| 14 | Fre 25. sep | Buffer, README-opdatering, beslutning om auth/deploy-næste-skridt |

---

## Dag 1 (Tirs 8. sep) — Aldersfordeling

**Mål:** Besvar "hvad har jeg lagt ud og ikke fået tilbage, og hvor længe
siden?"

**Accept:** Grænsetests består ved præcis 30 og præcis 31 dage; begge
renderinger indsat.

---

## Dag 2 (Ons 9. sep) — Adversarial-gennemgang

**Mål:** Forsøg at bryde appen, før rigtige data kommer i nærheden af den.

**Accept:** Hele testsuiten grøn, mindst én reel fejl fundet og rettet.
Hvis intet går i stykker, er testene for milde.

---

## Dag 3 (Tors 10. sep) — Rigtig klient-CRUD

**Mål:** Udfas dev-panelet. Tilføj, rediger og arkivér en klient gennem et
rigtigt flow, som alle kunne bruge — ikke en `NODE_ENV`-styret genvej.

**Accept:** Dev-panelet er væk fra kodebasen; det rigtige flow gør alt,
hvad det gjorde, plus redigering og arkivering.

---

## Dag 4 (Fre 11. sep) — Designgennemgang, del 1

**Mål:** Et layoutsystem — ikke ad hoc inline-styling og én global
CSS-fil, der lappes hændelse for hændelse.

**Accept:** Ingen inline `style`-props tilbage til layout (nogle få til
data-drevet farve, fx negativ margin i rødt, er fine); skærmbilleder
indsat.

---

## Dag 5 (Man 14. sep) — Designgennemgang, del 2

**Mål:** Formularer, tabeller og tomme/indlæsnings-tilstande skal føles
som ét samlet produkt.

**Accept:** Skærmbilleder af hver formular og hver tom-tilstand.

---

## Dag 6 (Tirs 15. sep) — Mobil-/responsivt gennemsyn

**Mål:** Dashboardet er brugbart på en telefon, ikke kun i et bredt
desktopvindue.

**Accept:** Ingen vandret side-niveau-scroll; skærmbilleder ved begge
bredder.

---

## Dag 7 (Ons 16. sep) — Stress-test: stor datamængde

**Mål:** Find ud af, hvad der går i stykker først, når data vokser, før en
rigtig klient rammer det.

**Accept:** Et angivet tal (fx "klientdetaljesiden indlæses på under
Xms med 1000 rækker") og enten en rettelse eller en dokumenteret
begrundelse for, at ingen var nødvendig.

---

## Dag 8 (Tors 17. sep) — Stress-test: samtidighed og fejlbehæftet input

**Mål:** To ting, der sker med de samme data på samme tid, og input Zod
ikke allerede afviser.

**Accept:** Hvert scenarie har enten en test eller en dokumenteret,
bevidst beslutning; dobbeltindsendelse kan især enten ikke oprette
dubletter, eller det er bevist, at den ikke gør.

---

## Dag 9 (Fre 18. sep) — Engagements i UI'en

**Mål:** `engagements` har eksisteret i skemaet siden dag 3, men har ingen
UI. Beslut, om det er nødvendigt endnu, og hvis ja, synliggør det.

**Accept:** Enten fungerende engagement-UI med render-bevis, eller en
klar skriftlig begrundelse for, at det er udskudt.

---

## Dag 10 (Man 21. sep) — Synlighed for tilbagevendende indtægt

**Mål:** "Den ene åbne beslutning" fra den oprindelige plan: en aftale
registreret én gang med et gentagelsesinterval viser i dag ikke, hvilke
måneder der er ubetalte.

**Accept:** En tilbagevendende indtægtsrække viser tydeligt sine
ubetalte måneder.

---

## Dag 11 (Tirs 22. sep) — Eksport

**Mål:** Få en måneds tal ud af appen uden at skærmbillede den.

**Accept:** En downloadet CSV, hvis totaler matcher opsummeringen på
skærmen præcist.

---

## Dag 12 (Ons 23. sep) — Tilgængelighedsgennemgang

**Mål:** Brugbar kun med tastatur og med en skærmlæser, ikke kun visuelt.

**Accept:** Fuld tastaturgennemgang gennemført uden mus; kontrast
tjekket mod WCAG AA.

---

## Dag 13 (Tors 24. sep) — Rigtige MeBa-data

**Mål:** MeBas rigtige klienter i systemet, og et ærligt kig på det —
dette er den oprindelige plans dag 14, flyttet hertil nu hvor mere af
appen er solid nok til at betro rigtige tal.

**Accept:** Ud fra dashboardet alene: hvilken klient tjente flest penge
sidste måned, og hvor mange penge sidder der lige nu hos klienter, der
ikke har betalt tilbage endnu.

---

## Dag 14 (Fre 25. sep) — Buffer og næste skridt

**Mål:** Indhentningsdag, og en eksplicit beslutning om, hvad der er
næste skridt.

**Accept:** En kort skriftlig beslutning om auth/deploy, selv hvis
beslutningen er "ikke endnu."

---

## Bevidst ikke med i denne plan

Videreført fra den oprindelige:

- **Dinero-synkronisering** — stadig udskudt, spec stadig gyldig,
  kræver en `external_id`-kolonne, når tiden kommer.
- **Live valutakurser** — indtastes stadig manuelt.
- **Forekomst-materialisering** for tilbagevendende indtægt ud over det,
  dag 10 ovenfor beslutter — byg ikke en fuld planlægningsmotor
  spekulativt.
