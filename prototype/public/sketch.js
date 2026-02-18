let angle = 0;
let prevAngle = 0;
let angularVelocity = 0;
let direction = null;
let isTilling = false;

let lastSent = 0;
let archive = [];
let visibleEntries = [];
const minVisible = 2;
const maxVisible = 5;

// fetch archive from server
async function fetchArchive() {
  try {
    const res = await fetch("/api/archive");
    if (!res.ok) throw new Error(res.status);
    archive = await res.json();

    archive.forEach(entry => {
      entry.x = entry.x ?? random(width * 0.1, width * 0.9);
      entry.y = entry.y ?? random(height * 0.2, height * 0.8);
      entry.phase = entry.phase ?? random(TWO_PI);
      entry.opacity = entry.opacity ?? 255;
      entry.visible = entry.visible ?? false;
    });

    ensureVisibleEntries();
  } catch (err) {
    console.error("Failed to fetch archive:", err);
  }
}

// make sure there are between minVisible and maxVisible entries showing
function ensureVisibleEntries() {
  const hiddenEntries = archive.filter(e => !e.visible);
  while (visibleEntries.length < minVisible && hiddenEntries.length > 0) {
    const idx = floor(random(hiddenEntries.length));
    const entry = hiddenEntries[idx];
    entry.visible = true;
    entry.opacity = 255;
    visibleEntries.push(entry);
    hiddenEntries.splice(idx, 1);
  }
}

setInterval(fetchArchive, 1000);

function setup() {
  createCanvas(windowWidth, windowHeight);
  fetchArchive();
  textAlign(CENTER, CENTER);
}

function draw() {
  background(101, 67, 33); // brown soil

  // auto-turn dial if mouse is pressed
  if (mouseIsPressed) {
    angle += 0.08; // faster rotation
    direction = "right";
    isTilling = true;
  } else {
    isTilling = false;
  }

  angularVelocity = angle - prevAngle;

  if (isTilling && millis() - lastSent > 100) {
    sendTillGesture();
    lastSent = millis();
  }

  if (abs(angularVelocity) > 0.001) {
    tillVisibleEntries();
  }

  prevAngle = angle;

  // instructions
  fill(200);
  textSize(14);
  textAlign(CENTER, TOP);
  text(
    "MOMENTS OF BOREDOM DATA",
    width / 2,
    20
  );
  textAlign(CENTER, BOTTOM);
  text(
    "Till the data compost by holding down mouse",
    width / 2,
    height - 20
  );

  drawVisibleEntries();
}

function drawVisibleEntries() {
  noStroke();
  visibleEntries.forEach(entry => {
    // wobble & drift
    entry.phase += angularVelocity / map(entry.attentionScore, 1, 10, 1, 0.3);
    let wobbleX = sin(entry.phase) * 20;
    let wobbleY = cos(entry.phase / 2) * 10;

    entry.x += wobbleX * 0.02; // gentle drift
    entry.y += wobbleY * 0.02;

    // keep inside canvas
    entry.x = constrain(entry.x, width * 0.05, width * 0.95);
    entry.y = constrain(entry.y, height * 0.1, height * 0.9);

    // size based on attentionScore
    let size = map(entry.attentionScore, 1, 10, 12, 36);

    // draw title
    fill(255, entry.opacity);
    textSize(size * 1.25);
    textAlign(CENTER, CENTER);
    text(entry.focus, entry.x, entry.y);

    // draw metadata below
    fill(200, entry.opacity * 0.7);
    textSize(size * 0.5);
    text(`duration: ${entry.duration.toFixed(1)}s, attention: ${entry.attentionScore}`, entry.x, entry.y + size);
  });
}

function tillVisibleEntries() {
  visibleEntries.forEach(entry => {
    // opacity decreases faster for smaller entries
    let sizeFactor = map(entry.attentionScore, 1, 10, 2, 0.5); 
    entry.opacity -= abs(angularVelocity * 20) * sizeFactor; // faster fade
  });

  // remove fully faded entries
  visibleEntries = visibleEntries.filter(e => e.opacity > 0);

  // add new entries randomly if less than maxVisible
  const hiddenEntries = archive.filter(e => !e.visible);
  while (visibleEntries.length < maxVisible && hiddenEntries.length > 0 && random() < 0.1) {
    const idx = floor(random(hiddenEntries.length));
    const entry = hiddenEntries[idx];
    entry.visible = true;
    entry.opacity = 255;
    visibleEntries.push(entry);
    hiddenEntries.splice(idx, 1);
  }
}

function sendTillGesture() {
  fetch("/api/till", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      angleDelta: angularVelocity,
      velocity: angularVelocity * 10,
      direction
    })
  });
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}