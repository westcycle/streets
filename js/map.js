/**
 * Map: single dataset (walking & riding crashes on local roads),
 * speed streets, crash circle markers, crash heatmap, percentile indicator
 */

const LGA_DATA_FILE = "data/lga_stats_active_transport_local.geojson";
const SPEED_STREETS_FILE = "data/speed_streets.geojson";
const CRASH_POINTS_FILE = "data/crashes_active_local.geojson";

// ── Map init — light basemap, centred on Perth ──
const map = L.map("map-leaflet", { center: [-31.9, 115.9], zoom: 10 });
L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
  {
    attribution:
      '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    maxZoom: 19,
  }
).addTo(map);

// ── State ──
let lgaLayer = null;
let speedLayer = null;
let heatLayer = null;
let pointsLayer = null;
let selectedLayer = null;
let lgaData = null;
let speedVisible = true;
let heatVisible = false;
let pointsVisible = true;

// ── LGA styles (light basemap) ──
const defaultStyle = {
  fillColor: "rgba(27,25,74,0.0)",
  fillOpacity: 0.05,
  color: "rgba(27,25,74,0.2)",
  weight: 1,
};
const hoverStyle = {
  fillColor: "rgba(239,156,32,0.1)",
  fillOpacity: 0.3,
  color: "#EF9C20",
  weight: 2,
};
const selectedStyle = {
  fillColor: "rgba(239,156,32,0.15)",
  fillOpacity: 0.4,
  color: "#EF9C20",
  weight: 2.5,
};

// ── Speed streets layer ──
fetch(SPEED_STREETS_FILE)
  .then((r) => r.json())
  .then((data) => {
    speedLayer = L.geoJSON(data, {
      interactive: false,
      style: (f) => ({
        color: f.properties.SPEED_LIMIT === "30km/h" ? "#16a34a" : "#d97706",
        weight: 2.5,
        opacity: 0.8,
      }),
    }).addTo(map);
  })
  .catch(() => console.warn("Speed streets data not found"));

// ── Crash data — circle markers + heatmap ──
fetch(CRASH_POINTS_FILE)
  .then((r) => r.json())
  .then((data) => {
    const heatPoints = [];
    const circleMarkers = [];

    data.features.forEach((f) => {
      if (!f.geometry || !f.geometry.coordinates) return;
      const coords = f.geometry.coordinates;
      const lat = coords[1];
      const lng = coords[0];
      const p = f.properties;

      // Heatmap weight by severity
      let heatWeight = 0.5;
      if (p.severity === "Fatal") heatWeight = 3;
      else if (p.severity === "Hospital") heatWeight = 2;
      else if (p.severity === "Medical") heatWeight = 1;
      heatPoints.push([lat, lng, heatWeight]);

      // Circle marker — colour by type
      const hasBike = p.bike > 0;
      const hasPed = p.ped > 0;
      let color;
      if (hasPed) {
        color = "#EC4948"; // red for pedestrian (takes priority if both)
      } else {
        color = "#EF9C20"; // yellow for bike
      }

      // Size by severity
      let radius = 3;
      if (p.severity === "Fatal") radius = 7;
      else if (p.severity === "Hospital") radius = 5;
      else if (p.severity === "Medical") radius = 4;

      const marker = L.circleMarker([lat, lng], {
        radius: radius,
        fillColor: color,
        color: color,
        weight: 1,
        opacity: 0.8,
        fillOpacity: 0.6,
      });

      const typeLabel =
        hasPed && hasBike
          ? "Bike + pedestrian"
          : hasPed
          ? "Pedestrian"
          : "Bike rider";
      marker.bindPopup(
        `<strong>${p.road || "Unknown road"}</strong><br>` +
          `${typeLabel} · ${p.severity || "Unknown"}<br>` +
          `${p.type || ""}`
      );

      circleMarkers.push(marker);
    });

    // Heatmap (off by default)
    heatLayer = L.heatLayer(heatPoints, {
      radius: 18,
      blur: 20,
      maxZoom: 14,
      max: 3,
      minOpacity: 0.3,
      gradient: {
        0.2: "#3b0764",
        0.4: "#7c3aed",
        0.6: "#f59e0b",
        0.8: "#ef4444",
        1.0: "#ffffff",
      },
    });
    if (heatVisible) heatLayer.addTo(map);

    // Circle markers (on by default)
    pointsLayer = L.layerGroup(circleMarkers);
    if (pointsVisible) pointsLayer.addTo(map);
  })
  .catch(() =>
    console.warn(
      "Crash points data not found — add crashes_active_local.geojson to data/"
    )
  );

// ── Toggles ──
document.getElementById("speed-toggle").addEventListener("click", function () {
  speedVisible = !speedVisible;
  this.classList.toggle("off", !speedVisible);
  if (speedLayer)
    speedVisible ? map.addLayer(speedLayer) : map.removeLayer(speedLayer);
});

document.getElementById("points-toggle").addEventListener("click", function () {
  pointsVisible = !pointsVisible;
  this.classList.toggle("off", !pointsVisible);
  if (pointsLayer)
    pointsVisible ? map.addLayer(pointsLayer) : map.removeLayer(pointsLayer);
});

document
  .getElementById("heatmap-toggle")
  .addEventListener("click", function () {
    heatVisible = !heatVisible;
    this.classList.toggle("off", !heatVisible);
    if (heatLayer)
      heatVisible ? map.addLayer(heatLayer) : map.removeLayer(heatLayer);
  });

// ── Percentile helpers ──
function getPercentile(value, allValues) {
  const sorted = [...allValues].sort((a, b) => a - b);
  const below = sorted.filter((v) => v < value).length;
  return Math.round((below / sorted.length) * 100);
}

function getPercentileInfo(percentile) {
  if (percentile >= 80)
    return { color: "#EC4948", desc: "One of the highest crash rates in WA" };
  if (percentile >= 60)
    return { color: "#f59e0b", desc: "Above average crash rate" };
  if (percentile >= 40) return { color: "#9998AE", desc: "Average crash rate" };
  if (percentile >= 20)
    return { color: "#4495D1", desc: "Below average crash rate" };
  return { color: "#46BC96", desc: "One of the lowest crash rates in WA" };
}

function renderPercentileIndicator(
  container,
  percentile,
  rateValue,
  totalCount
) {
  const info = getPercentileInfo(percentile);
  const lowCount = totalCount < 5;

  container.innerHTML = `
    <div class="percentile-wrap">
      <div class="percentile-label" style="color:${info.color}">${
    info.desc
  }</div>
      <div class="percentile-detail">${rateValue} walking &amp; riding crashes per 10,000 people</div>
      <div class="percentile-bar-track">
        <div class="percentile-bar-fill" style="width:${percentile}%; background:${
    info.color
  }"></div>
        <div class="percentile-marker" style="left:${percentile}%"></div>
      </div>
      <div class="percentile-bar-labels">
        <span>Lowest</span>
        <span>Highest</span>
      </div>
      ${
        lowCount
          ? '<div class="percentile-caveat">Based on fewer than 5 crashes — interpret with caution.</div>'
          : ""
      }
      <div class="percentile-caveat">This rate reflects both how safe streets are and how many people walk and ride. LGAs where fewer people walk and ride may appear safer.</div>
    </div>
  `;
}

// ── Load LGA boundaries ──
fetch(LGA_DATA_FILE)
  .then((r) => r.json())
  .then((data) => {
    lgaData = data;
    renderLGA(data);
  })
  .catch(() => console.warn("Could not load LGA data"));

function renderLGA(data) {
  if (lgaLayer) map.removeLayer(lgaLayer);
  lgaLayer = L.geoJSON(data, {
    style: defaultStyle,
    onEachFeature: (feature, layer) => {
      layer.on("click", () => selectLGA(feature, layer));
      layer.on("mouseover", () => {
        if (layer !== selectedLayer) layer.setStyle(hoverStyle);
      });
      layer.on("mouseout", () => {
        if (layer !== selectedLayer) layer.setStyle(defaultStyle);
      });
    },
  }).addTo(map);
  if (speedLayer && speedVisible) speedLayer.bringToFront();
  if (pointsLayer && pointsVisible) pointsLayer.bringToFront();
}

// ── Select LGA ──
function selectLGA(feature, layer) {
  if (selectedLayer) selectedLayer.setStyle(defaultStyle);
  selectedLayer = layer;
  layer.setStyle(selectedStyle);

  const p = feature.properties;
  document.getElementById("lga-placeholder").style.display = "none";
  document.getElementById("lga-stats").style.display = "block";
  document.getElementById("lga-name").textContent = p.lga_name || "Unknown LGA";
  document.getElementById("lga-population").textContent = p.population
    ? `Population (2021): ${Number(p.population).toLocaleString()}`
    : "";

  // Percentile
  const allRates = lgaData.features.map(
    (f) => parseFloat(f.properties.active_per_10k) || 0
  );
  const thisRate = parseFloat(p.active_per_10k) || 0;
  const percentile = getPercentile(thisRate, allRates);
  const totalCount = parseInt(p.total_active_transport) || 0;

  renderPercentileIndicator(
    document.getElementById("percentile-indicator"),
    percentile,
    p.active_per_10k,
    totalCount
  );

  // Stats
  const rows = document.getElementById("stat-rows");
  rows.innerHTML = "";
  addRow(rows, "People on bikes involved", p.total_bikes, true);
  addRow(rows, "People on foot involved", p.total_pedestrians, true);
  addRow(
    rows,
    "Total walking & riding crashes",
    p.total_active_transport,
    true
  );
  addRow(rows, "Per 10,000 people", p.active_per_10k);

  preselectEmailLGA(p.lga_name);
}

function addRow(container, label, value, highlight = false) {
  const row = document.createElement("div");
  row.className = "stat-row";
  row.innerHTML = `<span class="stat-label">${label}</span><span class="stat-value${
    highlight ? " highlight" : ""
  }">${value ?? "—"}</span>`;
  container.appendChild(row);
}

// Fix map rendering when scrolled into view
const mapObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) map.invalidateSize();
    });
  },
  { threshold: 0.1 }
);
mapObserver.observe(document.getElementById("map-leaflet"));
