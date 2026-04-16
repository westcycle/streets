# Streets for Everyone

An advocacy and data-exploration tool supporting WestCycle's campaign for safer, more liveable streets in Western Australia. Built as a companion to the [WestCycle Active Transport Vision](https://westcycle.org.au/activetransport).

## What it does

- Presents WestCycle's vision for active transport, grounded in the [Healthy Streets](https://www.healthystreets.com) framework
- Lists low-cost actions local governments can deliver today to make streets safer for walking and riding
- Makes the case for a state-wide 30 km/h default speed limit on local streets
- Provides an interactive map of walking and riding crashes across WA local government areas
- Generates a pre-filled email to any WA Mayor or Shire President

## Tech

Plain HTML, CSS, and JavaScript — no build step. Uses:

- [Leaflet](https://leafletjs.com) for mapping
- [Leaflet.heat](https://github.com/Leaflet/Leaflet.heat) for the crash heatmap
- [Carto Voyager](https://carto.com/basemaps) basemap tiles
- [Google Fonts: Poppins](https://fonts.google.com/specimen/Poppins) for typography

## Running locally

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## File structure

```
safer-speeds/
├── index.html           # Main page
├── css/
│   └── styles.css       # Brand-aligned styles
├── js/
│   ├── councils.js      # All 139 WA LGAs with contact details
│   ├── map.js           # Leaflet map + layer logic
│   ├── email.js         # Letter-writing tool
│   └── nav.js           # Smooth scroll
└── data/
    ├── lga_stats_active_transport_local.geojson
    ├── speed_streets.geojson     # 30/40 km/h streets
    └── crashes_active_local.geojson  # Walking & riding crashes on local roads
```

## Data sources

- **Crash data:** Main Roads Western Australia, 5-year crash data 2019–2023
- **LGA boundaries and 30/40 km/h street network:** Main Roads WA
- **LGA contact details:** publicly listed council email addresses
- **Population data:** ABS 2021 Census

## Branding

Uses the WestCycle brand guidelines (v2.0, April 2022): Sun Yellow #EF9C20, Midnight Blue #1B194A. Poppins substitutes for Atten Round New (Adobe Fonts licence required for the latter).

## Deployment

Static site — deployable to Cloudflare Pages, GitHub Pages, Netlify, or any static host. No build step required.

## Credits

Built by Georgia Scott for [WestCycle](https://www.westcycle.org.au).

Content draws on:

- [WestCycle Active Transport Vision](https://westcycle.org.au/activetransport)
- Lucy Saunders, [Healthy Streets](https://www.healthystreets.com) — 10 indicators framework
- [Better Streets Australia](https://www.betterstreets.org.au) — recommendations and safe speeds position paper
- [NACTO / PeopleForBikes](https://nacto.org/wp-content/uploads/2016PeoplefoBikes_Quick-Builds-for-Better-Streets.pdf) — *Quick Builds for Better Streets*

See the References section on the page for full citations.