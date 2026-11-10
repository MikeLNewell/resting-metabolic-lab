# The Metabolic Lab

Fasted vs Fed: The Science of Substrate Oxidation. A self-contained, local-first interactive practical for University of Bedfordshire undergraduate Principles of Nutrition students.

## Use it

1. Start in **Mission Control** and enter a team name and anonymous participant identifier.
2. Explore fuel selection, gas exchange, and molecular respiratory quotients.
3. Use **Experimental Protocol** to guide a 10-minute supine rest, 10-minute fasted expired-air recording, meal ingestion and two 10-minute postprandial recordings at 20–30 and 50–60 minutes.
4. At the final mouthful, record postprandial time zero using the meal-finished control. The clock time can be corrected in the protocol, and is preserved in session data. Complete optional team challenges in appropriate waiting periods. Do not interfere with respiratory measurement or the participant's rest.
5. In **Data Lab**, enter the average VO2 and VCO2 from the last five minutes of each recording, or import a Cortex spreadsheet/CSV and map its columns.
6. Inspect charts, compare conditions, and write your scientific interpretation in the **Mission Debrief**.
7. Export the CSV and a complete JSON session backup before leaving the laboratory. The printable report uses the browser's Print / Save as PDF option.

## Meal specification: lecturer confirmation

The source worksheet lists 30 g cornflakes + 125 mL semi-skimmed milk but also refers to a 40 g : 150 mL ratio. The interface defaults to the former **without resolving the discrepancy**. The lecturer must confirm the intended meal amounts. Label-based carbohydrate and energy values are entered manually; no nutritional values are invented.

## Local server

There are no npm packages, build tools, APIs, user accounts or backend services.

```sh
cd the-metabolic-lab
python3 -m http.server 8000
```

Visit http://localhost:8000 in a modern browser. ES modules do not work reliably over `file://`.

## GitHub Pages publication

Create a new, separate GitHub repository (for example `Metabolic-Lab`). Upload all files, retaining their folders. In **Settings → Pages**, select **Deploy from a branch**, `main`, root `/`, and save. Relative asset paths work under a project subdirectory. Alternatively, use an established deployment workflow. This application does not require any GitHub secret or university institutional system.

## Privacy and limitations

- Session state is stored in `localStorage` on the current browser/device. The application does not sync teams or transmit participant information to a backend.
- A JSON backup restores an entire session locally; JSON and CSV exports can be transferred through your institution's existing channels.
- Team result CSV files can be aggregated in Lecturer Control to calculate mean ± sample SD and build a local leaderboard. This is not real-time team synchronisation.
- The lecturer panel is **not authenticated**. It contains only non-sensitive class tools and publicly explainable teaching resources.
- Timers use the local device clock and support pause/resume and page refresh. Do not rely on a browser timer as the only means of timing clinical or laboratory procedures.
- Approved consent and screening paperwork must be completed outside the application. Do not enter participant names, medical histories or consent data.
- The Cortex importer accepts CSV, pasted tabular values, and uncomplicated XLSX worksheet exports. Excel import relies on browser-native decompression support. Use CSV as a fallback. Check time/VO2/VCO2 columns and units before applying the final-five-minute average. A sample spanning less than five minutes is warned about.
- Frayn (1983) oxidation estimates use VO2 and VCO2 in mL/min for mg/min, or L/min for g/min. The reported energy expenditure uses the worksheet's simplified 9 kcal/g fat and 4 kcal/g carbohydrate equivalents. Negative estimates and RER outside 0.70–1.00 are not silently changed.
- Offline caching is enabled through a service worker after initial HTTPS loading. Browser cache behaviour varies; save a session backup before using shared computers.
- Chart export creates individual SVG images. Printed browser output can be saved as PDF.
- Example data are entirely synthetic and labelled DEMONSTRATION DATA. Loading them replaces the active local measurements after confirmation.

## Science calculations

For VO2 and VCO2 in mL/min:

- `RER = VCO2 / VO2`
- `fat_mg_min = 1.67 * (VO2 - VCO2)`
- `CHO_mg_min = 4.55 * VCO2 - 3.21 * VO2`
- `fat_kcal_min = fat_mg_min / 1000 * 9`
- `CHO_kcal_min = CHO_mg_min / 1000 * 4`
- `total_kcal_min = fat_kcal_min + CHO_kcal_min`

Assumes appropriate steady-state conditions and no independently quantified protein oxidation. RQ and RER are related but distinct measurements.

## Automated tests

```sh
node tests/science.test.mjs
```

Scientific calculation tests cover unit conversion, RER, oxidation rates, energy equivalents, invalid and negative results, CSV parsing, class import and final-five-minute averaging. Browser smoke-test the interface before first use in a practical.

## File layout

- `index.html` static document and application shell
- `styles.css` responsive visual system
- `app.js` application UI, session state, navigation, timers, challenges, charting, reporting and imports
- `science.mjs` tested pure numerical and CSV utilities
- `xlsx.mjs` browser-native, dependency-free basic Excel worksheet reader
- `service-worker.js` optional offline caching under HTTPS
- `manifest.webmanifest` installable application metadata
- `tests/science.test.mjs` pure-science tests
- `examples/` sample synthetic result CSVs

## Reference

Frayn, K. N. (1983). Calculation of substrate oxidation rates in vivo from gaseous exchange. *Journal of Applied Physiology*, 55(2), 628–634.

Original teaching material: Dr Julia Fruer.
