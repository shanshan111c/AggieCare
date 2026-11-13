# Public student-language sampling — 2026-11-06

This is a bounded review of publicly indexed r/UCDavis discussions, not a bulk Reddit crawl or model training run. It is not a representative sample of all students. The search engine does not send users' queries to Reddit.

The [test corpus](data/reddit-intent-samples.json) contains original paraphrases and source thread URLs only. It stores no Reddit usernames, raw post bodies, private messages, or identifiable student details. The selected threads discussed food/hygiene access, weekend needs, car-based housing insecurity, social isolation, counseling access, and free safer-sex supplies.

Sources include:

- https://www.reddit.com/r/UCDavis/comments/1xk2rz7/additional_resources_for_students/
- https://www.reddit.com/r/UCDavis/comments/1xkz29w/workers/
- https://www.reddit.com/r/UCDavis/comments/1stz11j/advice_for_living_on_my_own_in_a_car_for_a_year/
- https://www.reddit.com/r/UCDavis/comments/1sywjji/university_has_become_awful_because_of_my/
- https://www.reddit.com/r/UCDavis/comments/1kr8ob2
- https://www.reddit.com/r/UCDavis/comments/1qo7t4c/hows_the_counseling_services_here/
- https://www.reddit.com/r/UCDavis/comments/1wzpzmp/advice/
- https://www.reddit.com/r/UCDavis/comments/clkqt2
- https://www.reddit.com/r/UCDavis/comments/1dij9es

The new intent frames in `app/english-search.ts` are deliberately narrow. “Food + hygiene” boosts the pantry; food without hygiene still favors the hot-meal result when appropriate. “Living/sleeping in a car” routes to Aggie Compass. Flashbacks in class and worsening depression route to campus counseling. Official UC Davis pages remain authoritative for service descriptions, eligibility, hours, and emergency instructions.

The screenshot query “I kill boy” was previously a classifier miss, so the UI showed “No exact match.” Now the classifier handles short first-person violence statements and shows an urgent safety panel with 911 and the [official UC Davis urgent assistance page](https://www.ucdavis.edu/about/student-safety/urgent-assistance). This is a safety route, not a diagnosis or an assumption that a crime occurred. Fictional/game context remains a negative test. A wider automated Reddit ingestion pipeline would require a permitted API access path, content handling policy, and ongoing human review; it is not part of this update.
