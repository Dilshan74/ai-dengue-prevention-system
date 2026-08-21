/**
 * Simulates a breeding-site image classifier. There is no real model here —
 * this generates plausible, varied results so the UI (confidence bars,
 * risk badges, detected-object chips) behaves like it would against a
 * trained model.
 */
const LABELS = [
  { label: "Stagnant Water Detected", risk: "High" },
  { label: "Discarded Container Pooling", risk: "High" },
  { label: "Vegetation with Water Trap", risk: "Medium" },
  { label: "Clean / No Breeding Site", risk: "Low" },
  { label: "Blocked Drain", risk: "Medium" },
];

const OBJECT_POOL = [
  "Stagnant water",
  "Discarded container",
  "Larvae indicators",
  "Vegetation debris",
  "Tyre",
  "Flower pot",
  "Roof gutter",
  "Plastic bottle",
];

function randomBetween(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function classifyImage() {
  const choice = pick(LABELS);
  const confidence = randomBetween(choice.risk === "Low" ? 55 : 68, 98);

  const objectCount = Math.floor(Math.random() * 3) + 2;
  const shuffled = [...OBJECT_POOL].sort(() => Math.random() - 0.5);
  const detectedObjects = shuffled.slice(0, objectCount).map((label) => ({
    label,
    conf: randomBetween(40, 98),
  }));

  return {
    label: choice.label,
    risk: choice.risk,
    confidence,
    detectedObjects,
  };
}
