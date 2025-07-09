let discRotation = 0;
let rotating = false;
let speed = 0.20;
let rotateDirection = 1;
let isErasing = false;

let discRadius = 250;
let drawingLayer;
let prevDrawPos = null;
let center;

let penColor = "#00ff00";
let penThickness = 10;

let discColors = ["#000000"];

let isDrawing = false;

let showGrid = false;
let radialLineCount = 12;
let ringCount = 5;

let undoStack = [];
let redoStack = [];
const MAX_HISTORY = 20;

function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(RADIANS);
  center = createVector(width / 2, height / 2);

  drawingLayer = createGraphics(width, height);
  drawingLayer.angleMode(RADIANS);
  drawingLayer.clear();

  // 회전 버튼
  const toggleRotateBtn = document.getElementById("toggleRotate");
  toggleRotateBtn.onclick = () => {
    toggleRotation();
  };

  // 회전 방향 토글 버튼
  const toggleDirectionBtn = document.getElementById("toggleDirection");
  toggleDirectionBtn.onclick = () => {
    rotateDirection *= -1;
  };

  // 회전 속도 양방향 연결
  const speedInput = document.getElementById("speedInput");
  const speedSlider = document.getElementById("speedSlider");
  speedInput.oninput = () => {
    speed = parseFloat(speedInput.value) || 0;
    speedSlider.value = speedInput.value;
  };
  speedSlider.oninput = () => {
    speed = parseFloat(speedSlider.value);
    speedInput.value = speedSlider.value;
  };

  // 펜 색상
  const penColorInput = document.getElementById("penColorInput");
  const penColorPicker = document.getElementById("penColorPicker");
  penColorInput.oninput = () => {
    penColor = penColorInput.value;
    penColorPicker.value = penColor;
  };
  penColorPicker.oninput = () => {
    penColor = penColorPicker.value;
    penColorInput.value = penColor;
  };

  // 펜 굵기 양방향 연결
  const thicknessInput = document.getElementById("thicknessInput");
  const thicknessSlider = document.getElementById("thicknessSlider");
  thicknessInput.oninput = () => {
    penThickness = parseInt(thicknessInput.value) || 1;
    thicknessSlider.value = penThickness;
  };
  thicknessSlider.oninput = () => {
    penThickness = parseInt(thicknessSlider.value);
    thicknessInput.value = penThickness;
  };

  // 지우기 모드 토글
  const eraseBtn = document.getElementById("eraseMode");
  eraseBtn.onclick = () => {
    isErasing = !isErasing;
    eraseBtn.textContent = isErasing ? "지우기" : "그리기";
  };

  // 그리드
  document.getElementById("toggleGrid").onclick = () => {
    showGrid = !showGrid;
    document.getElementById("toggleGrid").textContent = showGrid ? "그리드 켜짐" : "그리드 꺼짐";
  };

  // 방사선 개수 양방향 연결
  const radialLinesInput = document.getElementById("radialLinesInput");
  const radialLinesSlider = document.getElementById("radialLinesSlider");
  radialLinesInput.oninput = () => {
    radialLineCount = parseInt(radialLinesInput.value) || 1;
    radialLinesSlider.value = radialLineCount;
  };
  radialLinesSlider.oninput = () => {
    radialLineCount = parseInt(radialLinesSlider.value);
    radialLinesInput.value = radialLineCount;
  };

  // 원형 링 개수 양방향 연결
  const circularRingsInput = document.getElementById("circularRingsInput");
  const circularRingsSlider = document.getElementById("circularRingsSlider");
  circularRingsInput.oninput = () => {
    ringCount = parseInt(circularRingsInput.value) || 1;
    circularRingsSlider.value = ringCount;
  };
  circularRingsSlider.oninput = () => {
    ringCount = parseInt(circularRingsSlider.value);
    circularRingsInput.value = ringCount;
  };

  // 초기화 버튼
  document.getElementById("clearCanvas").onclick = () => {
    saveState();
    drawingLayer.clear();
  };

  // 원판 색상 UI 초기화 및 버튼 이벤트
  initDiscColorsUI();

  document.getElementById("addDiscColor").onclick = () => {
    if (discColors.length >= 10) return; // 최대 10개 제한
    discColors.push("#ffffff");
    updateDiscColorsUI();
  };

  document.getElementById("removeDiscColor").onclick = () => {
    if (discColors.length <= 1) return;
    discColors.pop();
    updateDiscColorsUI();
  };

  // 이미지 저장 버튼
  document.getElementById("saveImage").onclick = () => {
    saveDiscImage();
  };

  // 슬라이더에 마우스 휠 이벤트 연결
  document.querySelectorAll('input[type="range"]').forEach(slider => {
    slider.addEventListener('wheel', e => {
      e.preventDefault();

      const step = parseFloat(slider.step) || 1;
      let value = parseFloat(slider.value);

      if (e.deltaY < 0) {
        value += step;
      } else {
        value -= step;
      }

      value = Math.min(Math.max(value, parseFloat(slider.min)), parseFloat(slider.max));
      slider.value = value;

      // input 이벤트 강제 발생시켜서 연결된 oninput 동작 실행
      slider.dispatchEvent(new Event('input', { bubbles: true }));
    });
  });

  document.getElementById("undoBtn").onclick = () => undo();
  document.getElementById("redoBtn").onclick = () => redo();
}

function draw() {
  background(30);
  if (rotating) discRotation += speed * rotateDirection;
  translate(center.x, center.y);

  push();
  rotate(discRotation);
  drawDisc();
  imageMode(CENTER);
  image(drawingLayer, 0, 0);
  if (showGrid) drawGrid();
  pop();

  if (isDrawing) {
    const currDrawPos = getCorrectedMousePos();
    if (!currDrawPos) return;

    const fromCenterPrev = p5.Vector.sub(prevDrawPos, center);
    const fromCenterCurr = p5.Vector.sub(currDrawPos, center);

    if (fromCenterPrev.mag() <= discRadius && fromCenterCurr.mag() <= discRadius) {
      if (isErasing) {
        drawingLayer.erase();
        drawingLayer.strokeWeight(penThickness);
        drawingLayer.line(prevDrawPos.x, prevDrawPos.y, currDrawPos.x, currDrawPos.y);
        drawingLayer.noErase();
      } else {
        drawingLayer.noErase();
        drawingLayer.stroke(penColor);
        drawingLayer.strokeWeight(penThickness);
        drawingLayer.line(prevDrawPos.x, prevDrawPos.y, currDrawPos.x, currDrawPos.y);
      }
      prevDrawPos = currDrawPos;
    }
  }
}

function drawDisc() {
  noStroke();

  if (discColors.length === 1) {
    fill(discColors[0]);
    ellipse(0, 0, discRadius * 2);
  } else {
    const n = discColors.length;
    const anglePer = TWO_PI / n;
    for (let i = 0; i < n; i++) {
      fill(discColors[i]);
      arc(0, 0, discRadius * 2, discRadius * 2, i * anglePer, (i + 1) * anglePer, PIE);
    }
  }
}

function mousePressed() {
  const pos = getCorrectedMousePos();
  if (!pos) return;

  const fromCenter = p5.Vector.sub(pos, center);
  if (fromCenter.mag() > discRadius) {
    prevDrawPos = null;
    isDrawing = false;
    return;
  }

  isDrawing = true;
  saveState();

  if (isErasing) {
    drawingLayer.erase();
    drawingLayer.strokeWeight(penThickness);
    drawingLayer.point(pos.x, pos.y);
    drawingLayer.noErase();
  } else {
    drawingLayer.noErase();
    drawingLayer.stroke(penColor);
    drawingLayer.strokeWeight(penThickness);
    drawingLayer.point(pos.x, pos.y);
  }
  prevDrawPos = pos;
}

function mouseReleased() {
  isDrawing = false;
  prevDrawPos = null;
}

function getCorrectedMousePos() {
  const mx = mouseX - center.x;
  const my = mouseY - center.y;
  const corrected = createVector(mx, my).rotate(-discRotation);
  return createVector(center.x + corrected.x, center.y + corrected.y);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  let newLayer = createGraphics(width, height);
  newLayer.image(drawingLayer, 0, 0);
  drawingLayer = newLayer;
  drawingLayer.angleMode(RADIANS);
  center = createVector(width / 2, height / 2);
}

function initDiscColorsUI() {
  updateDiscColorsUI();
}

function updateDiscColorsUI() {
  const container = document.getElementById("discColorsContainer");
  container.innerHTML = "";
  discColors.forEach((color, i) => {
    const row = document.createElement("div");
    row.className = "color-row";

    const inputColor = document.createElement("input");
    inputColor.type = "color";
    inputColor.value = color;
    inputColor.title = `원판 색상 ${i + 1}`;
    inputColor.oninput = (e) => {
      discColors[i] = e.target.value;
    };

    const inputText = document.createElement("input");
    inputText.type = "text";
    inputText.value = color;
    inputText.title = `원판 색상 ${i + 1} 해시값`;
    inputText.oninput = (e) => {
      discColors[i] = e.target.value;
      inputColor.value = e.target.value;
    };

    row.appendChild(inputColor);
    row.appendChild(inputText);
    container.appendChild(row);
  });

  document.getElementById("removeDiscColor").disabled = discColors.length <= 1;
}

function toggleRotation() {
  rotating = !rotating;
  document.getElementById("toggleRotate").textContent = rotating ? "⏸ 정지" : "▶ 회전";
}

function saveDiscImage() {
  let saveCanvasGraphic = createGraphics(discRadius * 2, discRadius * 2);
  saveCanvasGraphic.angleMode(RADIANS);

  // 원판 색상 그리기
  if (discColors.length === 1) {
    saveCanvasGraphic.noStroke();
    saveCanvasGraphic.fill(discColors[0]);
    saveCanvasGraphic.ellipse(discRadius, discRadius, discRadius * 2);
  } else {
    const n = discColors.length;
    const anglePer = TWO_PI / n;
    saveCanvasGraphic.noStroke();
    for (let i = 0; i < n; i++) {
      saveCanvasGraphic.fill(discColors[i]);
      saveCanvasGraphic.arc(discRadius, discRadius, discRadius * 2, discRadius * 2, i * anglePer, (i + 1) * anglePer, PIE);
    }
  }

  // 저장 로직
  saveCanvasGraphic.image(
    drawingLayer,
    0, 0,
    discRadius * 2, discRadius * 2,
    center.x - discRadius, center.y - discRadius,
    discRadius * 2, discRadius * 2
  );

  saveCanvasGraphic.save('disc_drawing.png');
}

// 그리드 그리기
function drawGrid() {
  stroke(255, 255, 255, 80);
  strokeWeight(1);
  push();
  rotate(0);
  drawingContext.setLineDash([4, 6]);

  // 방사선
  for (let i = 0; i < radialLineCount; i++) {
    let angle = TWO_PI * i / radialLineCount;
    let x = cos(angle) * discRadius;
    let y = sin(angle) * discRadius;
    line(0, 0, x, y);
  }

  // 원형
  noFill();
  for (let i = 1; i <= ringCount; i++) {
    let r = discRadius * i / ringCount;
    ellipse(0, 0, r * 2, r * 2);
  }

  drawingContext.setLineDash([]);
  pop();
}

// 상태 저장
function saveState() {
  let img = drawingLayer.get();
  undoStack.push(img);
  if (undoStack.length > MAX_HISTORY) undoStack.shift();
  redoStack = [];
}

function undo() {
  if (undoStack.length === 0) return;

  let current = drawingLayer.get();
  redoStack.push(current);

  let previous = undoStack.pop();
  drawingLayer.clear();
  drawingLayer.image(previous, 0, 0);
}

function redo() {
  if (redoStack.length === 0) return;

  let current = drawingLayer.get();
  undoStack.push(current);

  let next = redoStack.pop();
  drawingLayer.clear();
  drawingLayer.image(next, 0, 0);
}

// 단축키
window.addEventListener('keydown', e => {
  if (e.code === 'Space') {
    e.preventDefault();
    toggleRotation();
  }
  if (e.ctrlKey && e.key === 'z') {
    e.preventDefault();
    undo();
  }
  if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
    e.preventDefault();
    redo();
  }
});