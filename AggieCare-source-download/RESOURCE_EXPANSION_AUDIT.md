# UC Davis resource expansion audit — 2026-11-06

Scope: public, campus-accessible, free or pay-what-you-can resources relevant to an immediate student need. This is a curated service directory, not an exhaustive list of UC Davis organizations. Each card links to an official source; location markers use building-level anchors and do not claim to locate an indoor shelf.

| Cards | Official source | Access note |
| --- | --- | --- |
| 10 Aggie Compass satellite pantry cards | https://aggiecompass.ucdavis.edu/aggieeats/satellite-pantries | Building/center hours and stock vary; no fabricated live-open status. |
| ASUCD Mobile Pantry, SCC and ARC | https://thepantry.ucdavis.edu/mobile-pantry | Fall 2026 published stops; schedule automatically becomes “check official schedule” after 2026-12-31. |
| Fruit & Veggie Up, Aggie Compass and South Coho | https://aggiecompass.ucdavis.edu/news/fruit-and-veggie-up | Fall 2026 published stops; while supplies last; schedule automatically becomes uncertain after 2026-12-31. |
| WRRC Feminist Pharmacy | https://wrrc.ucdavis.edu/resources | Stock and room access vary. |
| Gender Affirmation Closet | https://lgbtqia.ucdavis.edu/gender-affirmation-closet | Center-hour access; clothing sizes vary. |
| Student Parent Space | https://studentparents.ucdavis.edu/about/our-space | Published academic-year access; verify around holidays and breaks. |
| Love Lab bag at Student Health & Wellness Center | https://shcs.ucdavis.edu/health-and-wellness/sexual-health/love-lab | Alternative when Health Promotion is closed; ask at the main entrance. |

The four existing Health Promotion pickup cards previously asserted 8:30 AM–5 PM continuously. The official location page (https://shcs.ucdavis.edu/locations-hours) has narrower hours and an extra Health Promotion closure on Tuesday. These cards now conservatively say “check official schedule” until item-specific pickup windows are verified. This avoids incorrect “open now” claims.

Search implementation: `app/resource-prompts.ts` has one reviewed alias/intent profile per added card. Exact campus-service aliases rank above need phrases, which rank above broad food/supply fallback. English sentence-risk overrides and medical-versus-food guards still run last. These are deterministic search rules and curated examples; no language model was trained or connected. User queries are evaluated locally, with no third-party query transmission.

Remaining verification: field-check indoor shelf placement, seasonal schedules, individual holiday closures, and whether all host centers permit unscheduled walk-ins. The public UI should not claim exhaustive coverage or independently verified live stock.
