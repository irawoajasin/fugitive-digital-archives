let archive = [];
let currentEntry = null;
let fadeAlpha = 0;

// track which keys are being held
let keyStates = {
  q: false,
  p: false
};

// fetch archive from server
async function fetchArchive() {
  try {
    const res = await fetch("/api/archive");
    if (!res.ok) throw new Error(res.status);
    archive = await res.json();
  } catch (err) {
    console.error("Failed to fetch archive:", err);
  }
}

// fetch periodically
setInterval(fetchArchive, 1000);

function setup() {
  createCanvas(windowWidth, windowHeight);
  fetchArchive(); // initial fetch
  textAlign(CENTER, CENTER);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background(30);

  // check if both keys are held
  let reveal = keyStates.q && keyStates.p;

  // fade logic
  if (reveal && archive.length > 0) {
    if (!currentEntry) {
      currentEntry = random(archive); // pick random session
    }
    fadeAlpha = min(fadeAlpha + 5, 255);
  } else {
    fadeAlpha = max(fadeAlpha - 5, 0);
    if (fadeAlpha === 0) currentEntry = null; // reset when fully faded out
  }

    // draw the current entry if fading
    if (currentEntry && fadeAlpha > 0) {
        // bigger size range: 20–80
        let txtSize = map(currentEntry.attentionScore, 1, 10, 20, 80);
        fill(255, 255, 200, fadeAlpha);
        textSize(txtSize);
        text(currentEntry.focus, width / 2, height / 2);

        // show metadata in top-left corner
        fill(200, fadeAlpha);
        textSize(16);
        textAlign(LEFT, TOP);
        text(
            `Duration: ${currentEntry.duration.toFixed(2)}s\nAttention Score: ${currentEntry.attentionScore}\nID: ${currentEntry.id}`,
            20,
            20
        );
    }


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
    "Hold Q + P together to reveal a random session (collaboration required!)",
    width / 2,
    height - 20
  );
}

function keyPressed() {
  if (key === "q" || key === "Q") keyStates.q = true;
  if (key === "p" || key === "P") keyStates.p = true;
}

function keyReleased() {
  if (key === "q" || key === "Q") keyStates.q = false;
  if (key === "p" || key === "P") keyStates.p = false;
}