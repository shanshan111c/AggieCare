# Aggie Care English search evaluation

The 1,000-sentence test set contains 100 manually labeled needs, each expressed in 10 original English question frames. It covers food, basic needs, sexual/relationship resources, and mental health (250 sentences each). Service vocabulary was checked against public UC Davis pages; these are **not** 1,000 verbatim sentences scraped from the web or private student messages.

Sources used for labels and terminology:

- [Aggie Compass Basic Needs Center](https://aggiecompass.ucdavis.edu/)
- [Aggie Compass food resources](https://aggiecompass.ucdavis.edu/food-security)
- [Aggie Compass housing resources](https://aggiecompass.ucdavis.edu/housing-security)
- [ASUCD Pantry](https://thepantry.ucdavis.edu/)
- [The Love Lab](https://shcs.ucdavis.edu/health-and-wellness/sexual-health/love-lab)
- [Counseling Services](https://shcs.ucdavis.edu/services/counseling-services)
- [CARE confidential advocacy](https://care.ucdavis.edu/support-for-survivors)

The legacy result path was executed from the actual `app/page.tsx` source. The replacement `app/english-search.ts` is the module called by the page for English queries when English is selected, and for recognized English queries in other display languages. Both runs used the same 1,000 labels, the same local Node runtime, and a fixed reference time. Precision is the average share of returned resources that are in each case's allowed set; top-1 is whether the first result is allowed.

| Version | Top-1 | Average precision | Mean core-match time |
| --- | ---: | ---: | ---: |
| Legacy | 85.8% | 71.4% | 71.5 ms/query |
| New, after further structure refinements | 100% | 100% | about 0.05 ms/query |

The score on these authored cases is **not** a claim of 100% accuracy on real student queries. The phrases were also used to refine the rules, so this is a regression benchmark rather than a blind generalization test. Twenty-four additional edge cases cover ambiguous wording, nonmatches, equipment vs mental health, sexual health vs survivor support, and crisis-banner routing. The reported time measures matching only—not network latency, page rendering, or map interaction.

To reproduce with Node 24 or newer:

```sh
node tests/english-search-eval.mjs legacy
node tests/english-search-eval.mjs new
node --test tests/english-search-hardcases.test.mjs
```

The new engine is a small offline intent router, not a trained language model. It combines a reviewable service-name lexicon, selected high-specificity phrases from the original resource lexicon, bounded typo correction, phrase/implication frames, explicit safety context, and relevance scores. Broad words such as “safe,” “boyfriend,” and “kill” are not standalone service triggers. The UI now puts strong exact/phrase evidence ahead of a weak open-now match, while retaining open-first order among comparably relevant services. It deliberately returns no result for ambiguous or unrelated English queries. New abbreviations/slang require a reviewed lexicon update; this is **not** automatic live slang learning. Other languages still use the previous search path and need separate evaluation.

## Sentence-structure feedback pass

An additional 825 English contrast cases exercise first-person versus victim statements, past acts versus intent, negation, fictional/game contexts, indirect concern, and harmless metaphors. A further 26 manually written implication cases cover needs such as not eating for days, lacking a place to sleep, forced sex, passive self-harm wording, and physical danger. A 50-case typo set and a separate semantic-routing test cover abbreviations, service names, implication frames, contextual slang, and unrelated lookalikes. All currently pass. These are authored regression cases, not a blind accuracy estimate.

For a statement such as “I killed my boyfriend,” the app now suppresses ordinary resource cards and displays an emergency panel. Statements about being threatened route to CARE with an emergency option; concern about possibly harming someone routes to counseling with conditional emergency guidance. Negation, games, and quoted lines are not treated as literal harm reports. These decisions are conservative heuristics and cannot establish what happened in real life.

The emergency action follows [UC Davis SHCS crisis guidance](https://shcs.ucdavis.edu/crisis-care-and-urgent-help-resources) and [UC Davis Police contact guidance](https://police.ucdavis.edu/contact-information). CARE is the [confidential survivor-support service](https://care.ucdavis.edu/connect-advocate), not a service for a person who reports harming someone.

```sh
node tests/english-structure-eval.mjs
node --test tests/english-implications.test.mjs
node tests/english-typo-eval.mjs
node --test tests/english-semantic-routing.test.mjs
```
