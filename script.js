const canvas = document.getElementById("canvas");
const bg_canvas = document.getElementById("bgCanvas");
const context = canvas.getContext("2d");
const bg_context = bg_canvas.getContext("2d");
const download_canvas = document.createElement('canvas');
const canvasButton = document.getElementById("canvasButton");
const canvasMoveScale = document.getElementById("canvasMoveScale");
const moveScaleImg = document.getElementById("moveScaleImg");

const undoButton = document.getElementById("undo");
const redoButton = document.getElementById("redo");
const link = document.getElementById("downloadLink");
const loadImgButton = document.getElementById("loadImg");
const downloadButton = document.getElementById("downloadGrid");
const clearButton = document.getElementById("clearCanvas");

const settings1 = document.getElementById("toolsLeft");
const settings2 = document.getElementById("toolsRight");
const settings3 = document.getElementById("ifaceColor");
const settings4 = document.getElementById("ifaceNeutral");
const settings5 = document.getElementById("colors1");
const settings6 = document.getElementById("colors2");


const createVPButton = document.getElementById("createVP");

const vp1Button = document.getElementById("vp1");
const vp2Button = document.getElementById("vp2");
const vp3Button = document.getElementById("vp3");
const horizonButton = document.getElementById("horizon");
const vp1Image = document.getElementById("vp1Image");
const vp2Image = document.getElementById("vp2Image");
const vp3Image = document.getElementById("vp3Image");
const hImage = document.getElementById("hImage");

const moreButton = document.getElementById("more");
const lessButton = document.getElementById("less");
const alertWindow = document.getElementById("alert");
const deleteVPButton = document.getElementById("deleteVP");

const STATE = {
  Init: -1,
  FirstDottedLine: 0,
  FirstLine: 1,
  SecondDottedLine: 2,
  SecondLine: 3,
  VP: 4,
}
let state = STATE.FirstDottedLine;
let currentVP = 0; //when creating them
let selectedVP = -1; //when manipulating them
let radialLines = [20, 20, 20];

let colors = ["HotPink", "Gold", "RoyalBlue"];

let touches = 0;

let isDrawing = false;
let x = 0;
let y = 0;
let offsetX;
let offsetY;
let moveX;

let isMoving = false;

let bgImage;
let bgImageHistory = [];

let dottedLine;
let firstLine;
let secondLine;
let vanishingPoints = [];
let horizonLine;

let cameraOffset = { x: window.innerWidth * 0.85 / 2, y: window.innerHeight * 0.85 / 2 }
let cameraZoom = 1;
let MAX_ZOOM = 20;
let MIN_ZOOM = 0.05;
let SCROLL_SENSITIVITY = 0.0005;

let mouseWorldPos;

let isDragging = false;
let dragStart = { x: 0, y: 0 };

let isZooming = false;
let initialPinchDistance = null;
let lastZoom = cameraZoom;

let matrix = [1, 0, 0, 1, 0, 0];      // normal matrix
let invMatrix = [1, 0, 0, 1];   // inverse matrix

let action; //for undo & redo

let timeStart;
let previousDistance;

let isMobile = false;
let colorOp = 1;
let pinchPan = 0;

function init() {
  if ("ontouchstart" in document.documentElement) { //is mobile device
    isMobile = true;
    canvas.style.right = "2vw";
    bg_canvas.style.right = "2vw";
    document.getElementById("container-v").style.left = "0px";
    alertWindow.style.left = "90vw";
    canvasButton.style.left = "90vw";


    canvas.addEventListener("touchstart", (e) => {
      touches = e.touches.length;
      if (touches > 1)
        e.preventDefault();

      switch (touches) {
        case 1: //draw
          onPointerDown(e);
          break;
        case 2: //pinch
          timeStart = Date.now();
          handlePinchPan(e);
          break;
        case 3:
          if (nextActions.length > 0)
            redo();
          break;
        case 4: //delete
          deleteScene();
          break;
      }
    });
    canvas.addEventListener("touchmove", (e) => {
      if (touches > 1)
        e.preventDefault();
      switch (touches) {
        case 1: //draw
          onPointerMove(e);
          break;
        case 2: //pinch
          if ((Date.now() - timeStart) > 60)
            handlePinchPan(e);
          break;
      }
    });
    canvas.addEventListener("touchend", (e) => {
      if (touches > 1)
        e.preventDefault();
      switch (touches) {
        case 1: //draw
          onPointerUp(e);
          break;
        case 2: //pinch
          if ((Date.now() - timeStart) < 60) {
            if (previousActions.length > 0)
              undo();
          }
          else {
            initialPinchDistance = null;
            lastZoom = cameraZoom;
          }
          break;
      }
      touches = 0;
    });
    canvas.addEventListener("touchout", (e) => { });
    canvas.addEventListener("touchcancel", (e) => { });
    canvas.addEventListener("touchleave", (e) => { });
  }
  else { //Computer
    canvas.style.left = "2vw";
    bg_canvas.style.left = "2vw";
    canvasButton.hidden = true;

    canvas.addEventListener("mousedown", onPointerDown);
    canvas.addEventListener("mouseup", onPointerUp);
    canvas.addEventListener("mousemove", onPointerMove);
    canvas.addEventListener("mouseleave", onPointerLeave);
    canvas.addEventListener("wheel", (e) => { adjustZoom(-e.deltaY * SCROLL_SENSITIVITY) });

    document.body.addEventListener("keydown", (e) => {
      if (e.key == "Enter" && !createVPButton.disabled) {
        createVP();
        manageVPButtons(-1);
      }
      if (e.key == "Escape" || e.key == "Esc") {
        if (state == STATE.FirstDottedLine || state == STATE.SecondDottedLine) {
          isDrawing = false;
          dottedLine = { x, y };
        }
        manageVPButtons(-1);
        isDragging = false;
        isMoving = false;
      }
      if (e.key == "1" && vanishingPoints.length > 0) {
        manageVPButtons(0);
      }
      if (e.key == "2" && vanishingPoints.length > 1) {
        manageVPButtons(1);
      }
      if (e.key == "3" && vanishingPoints.length > 2) {
        manageVPButtons(2);
      }
      if (e.key == "h" && vanishingPoints.length > 1) {
        manageVPButtons(3);
      }
      if (e.ctrlKey && e.key == "z") {
        undo();
      }
      if (e.ctrlKey && e.key == "y") {
        redo();
      }
      if (e.key == "Backspace" || e.key == "Delete") {
        deleteScene();
      }
      if (e.key == "+") {
        if (selectedVP > -1 && selectedVP < 3) {
          more();
        }
      }
      if (e.key == "-") {
        if (selectedVP > -1 && selectedVP < 3) {
          less();
        }
      }
    });
  }

  canvasMoveScale.addEventListener("click", switchZoomPan);

  undoButton.addEventListener("click", (e) => { undo(); manageVPButtons(-1); });
  redoButton.addEventListener("click", (e) => { redo(); manageVPButtons(-1); });
  downloadButton.addEventListener("click", (e) => { downloadGrid(); manageVPButtons(-1); });
  clearButton.addEventListener("click", (e) => { deleteScene(); manageVPButtons(-1); });

  settings1.addEventListener("change", changeSettings);
  settings2.addEventListener("change", changeSettings);
  settings3.addEventListener("change", changeSettings);
  settings4.addEventListener("change", changeSettings);
  settings5.addEventListener("change", changeSettings);
  settings6.addEventListener("change", changeSettings);

  createVPButton.addEventListener("click", (e) => { createVP(); });

  vp1Button.addEventListener("click", (e) => { manageVPButtons(0) });
  vp2Button.addEventListener("click", (e) => { manageVPButtons(1) });
  vp3Button.addEventListener("click", (e) => { manageVPButtons(2) });
  horizonButton.addEventListener("click", (e) => { manageVPButtons(3) });

  moreButton.addEventListener("click", (e) => {
    more();
  });
  lessButton.addEventListener("click", (e) => {
    less();
  });
  deleteVPButton.addEventListener("click", (e) => { deleteVP() });

  document.addEventListener("click", (e) => {
    if (e.target.id == "body")
      manageVPButtons(-1);
  });

  //BACKGROUND
  loadImgButton.addEventListener("change", loadBGImage);

  resetButtons();

  state = STATE.Init;
  draw();
}

function resetButtons() {
  createVPButton.disabled = true;
  downloadButton.disabled = true;
  vp1Button.hidden = true;
  vp2Button.hidden = true;
  vp3Button.hidden = true;
  horizonButton.hidden = true;
  moreButton.hidden = true;
  lessButton.hidden = true;
  deleteVPButton.hidden = true;
}


function draw() {

  canvas.width = window.innerWidth * 0.85;
  canvas.height = window.innerHeight * 0.85;

  bg_canvas.width = window.innerWidth * 0.85;
  bg_canvas.height = window.innerHeight * 0.85;

  const m = matrix;
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  createMatrix(cameraOffset.x, cameraOffset.y, cameraZoom, 0);
  context.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);

  bg_context.setTransform(1, 0, 0, 1, 0, 0);
  bg_context.clearRect(0, 0, bg_canvas.width, bg_canvas.height);
  bg_context.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);

  offsetX = canvas.getBoundingClientRect().left;
  offsetY = canvas.getBoundingClientRect().top;

  if (bgImage != undefined)
    drawBGImage();

  currentVP = 0;
  for (let i = 0; i < vanishingPoints.length; i++) {
    drawVP(vanishingPoints[i]);
    currentVP++;
  }
  if (vanishingPoints.length > 1)
    drawLine(horizonLine, [], "OrangeRed", 3);

  switch (state) {
    case STATE.FirstDottedLine:
      drawLine(dottedLine, [5, 15]);
      break;
    case STATE.FirstLine:
      drawLine(firstLine);
      break;
    case STATE.SecondDottedLine:
      drawLine(firstLine);
      drawLine(dottedLine, [5, 15]);
      break;
    case STATE.SecondLine:
      drawLine(firstLine);
      drawLine(secondLine);
      break;
  }

  requestAnimationFrame(draw);
}

function drawBGImage() {
  const hRatio = bg_canvas.width / bgImage.width;
  const vRatio = bg_canvas.height / bgImage.height;
  const ratio = Math.min(hRatio, vRatio);
  const centerX = (bg_canvas.width - bgImage.width * ratio) / 2;
  const centerY = (bg_canvas.height - bgImage.height * ratio) / 2;
  bg_context.drawImage(bgImage, -canvas.width / 2 + centerX, -canvas.height / 2 + centerY, bgImage.width * ratio, bgImage.height * ratio);
}

function drawLine(line, lineDash = [], color = colors[currentVP], width = 1) {
  context.beginPath();
  context.strokeStyle = color;
  context.lineWidth = width / cameraZoom;
  context.lineJoin = "round";
  context.setLineDash(lineDash);

  context.moveTo(line.x1, line.y1);
  context.lineTo(line.x2, line.y2);

  context.closePath();
  context.stroke();
}

function drawVP(vp) {
  let degs = 0;
  for (let i = 0; i < radialLines[currentVP]; i++) {
    let line = { x1: vp.x, y1: vp.y, x2: vp.x + 500000 * Math.cos(degs * Math.PI / 180), y2: vp.x + 500000 * Math.sin(degs * Math.PI / 180) }
    drawLine(line);
    degs += 360 / radialLines[currentVP];
  }
}

function onPointerDown(e) {
  if (selectedVP != -1 && (e.button == 0 || touches != 0)) //moving a VP
  {
    isMoving = true;
    if (e.button == 0) {
      if (selectedVP == 3) //horizon line
      {
        saveAction({ n: "MoveHorizonS", p1: { x: vanishingPoints[0].x, y: vanishingPoints[0].y }, p2: { x: vanishingPoints[1].x, y: vanishingPoints[1].y } });

        moveX = (getEventLocation(e).x - cameraOffset.x) / cameraZoom;
        vanishingPoints[0].y = (getEventLocation(e).y - cameraOffset.y) / cameraZoom;
        vanishingPoints[1].y = (getEventLocation(e).y - cameraOffset.y) / cameraZoom;
        createHorizonLine();
      }
      else {
        saveAction({ n: "MoveVPS", p1: { x: vanishingPoints[selectedVP].x, y: vanishingPoints[selectedVP].y }, p2: selectedVP });

        vanishingPoints[selectedVP] = { x: (getEventLocation(e).x - cameraOffset.x) / cameraZoom, y: (getEventLocation(e).y - cameraOffset.y) / cameraZoom };
        if (vanishingPoints.length > 1)
          createHorizonLine();
      }
    }
    else {
      if (selectedVP == 3) //horizon line
      {
        moveX = (getEventLocation(e).x - offsetX - cameraOffset.x) / cameraZoom;
        vanishingPoints[0].y = (getEventLocation(e).y - offsetY - cameraOffset.y) / cameraZoom;
        vanishingPoints[1].y = (getEventLocation(e).y - offsetY - cameraOffset.y) / cameraZoom;
        createHorizonLine();
      }
      else {
        vanishingPoints[selectedVP] = { x: (getEventLocation(e).x - offsetX - cameraOffset.x) / cameraZoom, y: (getEventLocation(e).y - offsetY - cameraOffset.y) / cameraZoom };
        if (vanishingPoints.length > 1)
          createHorizonLine();
      }
    }

    return;
  }
  else if (vanishingPoints.length == 3 && (e.button == 0 || touches == 1)) { //trying to create a new VP
    alert("¡Ya tienes 3 puntos de fuga!!!");
    return;
  }
  else if (isDrawing && dottedLine != undefined) //still drawing but the pointer was realeased outside canvas
  {
    //don't do anything...
  }
  //Drawing
  else if (e.button == 0) {
    isDrawing = true;
    mouseWorldPos = toWorld(getEventLocation(e).x, getEventLocation(e).y);
    x = mouseWorldPos.x;
    y = mouseWorldPos.y;

  }
  else if (touches == 1) { //one finger

    isDrawing = true;

    mouseWorldPos = toWorld(getEventLocation(e).x - offsetX, getEventLocation(e).y - offsetY);
    x = mouseWorldPos.x;
    y = mouseWorldPos.y;
  }
  else { //Dragging with three fingers or right/middle click
    isDragging = true;
    if (touches == 0) {
      dragStart.x = getEventLocation(e).x / cameraZoom - cameraOffset.x;
      dragStart.y = getEventLocation(e).y / cameraZoom - cameraOffset.y;
    }
    else {
      dragStart.x = (e.changedTouches[0].clientX - offsetX) / cameraZoom - cameraOffset.x;
      dragStart.y = (e.changedTouches[0].clientY - offsetY) / cameraZoom - cameraOffset.y;
    }
  }
}

function onPointerMove(e) {
  if (isMoving) {
    if (e.button == 0) {
      if (selectedVP == 3) //horizon line
      {
        const offset = (getEventLocation(e).x - cameraOffset.x) / cameraZoom - moveX;

        vanishingPoints[0].x += offset;
        vanishingPoints[1].x += offset;

        moveX = (getEventLocation(e).x - cameraOffset.x) / cameraZoom;

        vanishingPoints[0].y = (getEventLocation(e).y - cameraOffset.y) / cameraZoom;
        vanishingPoints[1].y = (getEventLocation(e).y - cameraOffset.y) / cameraZoom;
        createHorizonLine();
      }
      else {
        vanishingPoints[selectedVP] = { x: (getEventLocation(e).x - cameraOffset.x) / cameraZoom, y: (getEventLocation(e).y - cameraOffset.y) / cameraZoom };
        if (vanishingPoints.length > 1)
          createHorizonLine();
      }
    }
    else {
      if (selectedVP == 3) //horizon line
      {
        const offset = (getEventLocation(e).x - offsetX - cameraOffset.x) / cameraZoom - moveX;

        vanishingPoints[0].x += offset;
        vanishingPoints[1].x += offset;

        moveX = (getEventLocation(e).x - offsetX - cameraOffset.x) / cameraZoom;

        vanishingPoints[1].y = (getEventLocation(e).y - offsetY - cameraOffset.y) / cameraZoom;
        vanishingPoints[0].y = (getEventLocation(e).y - offsetY - cameraOffset.y) / cameraZoom;
        createHorizonLine();
      }
      else {
        vanishingPoints[selectedVP] = { x: (getEventLocation(e).x - offsetX - cameraOffset.x) / cameraZoom, y: (getEventLocation(e).y - offsetY - cameraOffset.y) / cameraZoom };
        if (vanishingPoints.length > 1)
          createHorizonLine();
      }
    }
  }
  else if (isDrawing) {
    if (e.button == 0) {
      mouseWorldPos = toWorld(getEventLocation(e).x, getEventLocation(e).y);
      dottedLine = { x1: x, y1: y, x2: mouseWorldPos.x, y2: mouseWorldPos.y };
    }
    else {
      mouseWorldPos = toWorld(getEventLocation(e).x - offsetX, getEventLocation(e).y - offsetY);
      dottedLine = { x1: x, y1: y, x2: mouseWorldPos.x, y2: mouseWorldPos.y };
    }

    switch (state) {
      case STATE.Init:
        state = STATE.FirstDottedLine;
        break;
      case STATE.FirstLine:
        state = STATE.SecondDottedLine;
        break;
      case STATE.SecondLine: //repaint second line
        state = STATE.SecondDottedLine;
        break;
      case STATE.VP:
        state = STATE.FirstDottedLine;
        break;
    }
  }
  else if (isDragging) {
    if (touches == 0) {
      cameraOffset.x = getEventLocation(e).x / cameraZoom - dragStart.x;
      cameraOffset.y = getEventLocation(e).y / cameraZoom - dragStart.y;

      cameraOffset.x = Math.min(cameraOffset.x, canvas.width);
      cameraOffset.x = Math.max(cameraOffset.x, 0);

      cameraOffset.y = Math.min(cameraOffset.y, canvas.height);
      cameraOffset.y = Math.max(cameraOffset.y, 0);
    }
    else {
      cameraOffset.x = (e.changedTouches[0].clientX - offsetX) / cameraZoom - dragStart.x;
      cameraOffset.y = (e.changedTouches[0].clientY - offsetY) / cameraZoom - dragStart.y;
    }
  }
}

function onPointerUp(e) {
  if (isMoving) {
    isMoving = false;
    if (vanishingPoints.length > 1)
      createHorizonLine();
    if (selectedVP == 3) //horizon line
      saveAction({ n: "MoveHorizon", p1: { x: vanishingPoints[0].x, y: vanishingPoints[0].y }, p2: { x: vanishingPoints[1].x, y: vanishingPoints[1].y } });
    else
      saveAction({ n: "MoveVP", p1: { x: vanishingPoints[selectedVP].x, y: vanishingPoints[selectedVP].y }, p2: selectedVP });
  }
  else if (isDrawing) {
    if (e.button == 0) {
      mouseWorldPos = toWorld(getEventLocation(e).x, getEventLocation(e).y);
      onLineFinished({ x1: x, y1: y, x2: mouseWorldPos.x, y2: mouseWorldPos.y });
    }
    else {
      mouseWorldPos = toWorld(getEventLocation(e).x - offsetX, getEventLocation(e).y - offsetY);
      onLineFinished({ x1: x, y1: y, x2: mouseWorldPos.x, y2: mouseWorldPos.y });
    }
  }
  else if (isDragging) {
    isDragging = false;
  }
}

function onPointerLeave(e) {
  isDragging = false;
  isMoving = false;
}

function onLineFinished(line) {
  //Make the line bigger
  const dx = line.x2 - line.x1;
  const dy = line.y2 - line.y1;

  const x1 = line.x1 + dx * -10000;
  const y1 = line.y1 + dy * -10000;
  const x2 = line.x1 + dx * 10000;
  const y2 = line.y1 + dy * 10000;

  switch (state) {
    case STATE.FirstDottedLine:
      firstLine = { x1: x1, y1: y1, x2: x2, y2: y2 };

      createVPButton.disabled = true;
      saveAction({ n: "FirstLine", s: STATE.Init, p1: { x1: x1, y1: y1, x2: x2, y2: y2 } });
      state = STATE.FirstLine;
      break;
    case STATE.SecondDottedLine:
      secondLine = { x1: x1, y1: y1, x2: x2, y2: y2 };
      saveAction({ n: "SecondLine", s: STATE.FirstLine, p1: { x1: x1, y1: y1, x2: x2, y2: y2 } });
      state = STATE.SecondLine;
      createVPButton.disabled = false;
      break;
  }

  x = 0;
  y = 0;
  isDrawing = false;
  dottedLine = undefined;
}

function handlePinchPan(e) {
  if (pinchPan == 0) {
    let t1 = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    let t2 = { x: e.changedTouches[1].clientX, y: e.changedTouches[1].clientY };
    let currentDistance = Math.sqrt((t1.x - t2.x) ** 2 + (t1.y - t2.y) ** 2);

    if (e.type == "touchstart") {
      previousDistance = currentDistance;
    }
    else {
      previousDistance = currentDistance;
      if (initialPinchDistance == null) {
        initialPinchDistance = currentDistance;
      }
      else {
        adjustZoom(null, currentDistance / initialPinchDistance);
      }
    }
  }
  else {
    if (e.type == "touchstart") {
      dragStart.x = e.changedTouches[1].clientX - offsetX  - cameraOffset.x;
      dragStart.y = e.changedTouches[1].clientY - offsetY  - cameraOffset.y;
    }
    else {
      cameraOffset.x = e.changedTouches[1].clientX - offsetX - dragStart.x;
      cameraOffset.y = e.changedTouches[1].clientY - offsetY  - dragStart.y;
    }
  }

}

function adjustZoom(zoomAmount, zoomFactor) {
  if (!isDragging) {
    if (zoomAmount) {
      cameraZoom += zoomAmount;
    }
    else if (zoomFactor) {
      cameraZoom = zoomFactor * lastZoom;
    }

    cameraZoom = Math.min(cameraZoom, MAX_ZOOM);
    cameraZoom = Math.max(cameraZoom, MIN_ZOOM);
  }
}

// Gets the relevant location from a mouse or single touch event
function getEventLocation(e) {
  if (e.changedTouches && e.changedTouches.length == 1) {
    return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
  }
  else if (e.clientX && e.clientY) {
    return { x: e.offsetX, y: e.offsetY };
  }
}

function createVP() {
  const vp = intersect();
  if (vp != false) { //aqui crear el punto y las lineas radiantes
    vanishingPoints.push(vp);
    saveAction({ n: "VP", s: STATE.SecondLine, p1: { x: vp.x, y: vp.y }, p2: vanishingPoints.length - 1 });

    state = STATE.VP;

    switch (vanishingPoints.length) {
      case 1:
        vp1Button.hidden = false;
        downloadButton.disabled = false;
        break;
      case 2:
        vp2Button.hidden = false;
        horizonButton.hidden = false;
        createHorizonLine();
        break;
      case 3:
        vp3Button.hidden = false;
        break;
    }
    createVPButton.disabled = true;
  }
  else {
    alert("¡Las lineas dibujadas no crean un punto de intersección!")
  }

  manageVPButtons(-1);
}

function createHorizonLine() {
  const dx = vanishingPoints[1].x - vanishingPoints[0].x;
  const dy = vanishingPoints[1].y - vanishingPoints[0].y;

  const x1 = vanishingPoints[0].x + dx * -100;
  const y1 = vanishingPoints[0].y + dy * -100;
  const x2 = vanishingPoints[0].x + dx * 100;
  const y2 = vanishingPoints[0].y + dy * 100;

  horizonLine = { x1, y1, x2, y2 };
}

// Determine the intersection point of two line segments
// Return FALSE if the lines don't intersect
function intersect() {
  const x1 = firstLine.x1
  const y1 = firstLine.y1
  const x2 = firstLine.x2
  const y2 = firstLine.y2
  const x3 = secondLine.x1
  const y3 = secondLine.y1
  const x4 = secondLine.x2
  const y4 = secondLine.y2

  // Check if none of the lines are of length 0
  if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
    return false;
  }

  let denominator = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);

  // Lines are parallel
  if (denominator === 0) {
    return false;
  }

  let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
  let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;

  // is the intersection along the segments
  if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
    return false;
  }

  // Return a object with the x and y coordinates of the intersection
  let x = x1 + ua * (x2 - x1);
  let y = y1 + ua * (y2 - y1);

  return { x, y };
}

function loadBGImage(e) {
  const tgt = e.target;
  const files = tgt.files;

  // FileReader support
  if (FileReader && files && files.length) {
    const fr = new FileReader();
    fr.onload = () => showImage(fr);
    fr.readAsDataURL(files[0]);
  }
};

function showImage(fileReader) {
  bgImage = new Image();
  bgImage.src = fileReader.result;

  bgImage.onload = function () {
    bgImageHistory.push(bgImage);
    saveAction({ n: "BgImage", p1: bgImageHistory.length - 1 });
  };
}

function downloadGrid(e) {
  download_canvas.width = 2048;
  download_canvas.height = 2048 * canvas.height / canvas.width;
  download_canvas.getContext('2d').drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, download_canvas.width, download_canvas.height);

  const image = download_canvas.toDataURL("image/png");
  link.href = image;
  link.download = "grid";
  link.click();
};

function deleteScene(save = true) {
  if (save)
    saveAction({ n: "DeleteAll", s: state, p1: dottedLine, p2: firstLine, p3: secondLine, p4: horizonLine, p5: vanishingPoints, p6: bgImage });

  bgImage = undefined;

  dottedLine = undefined;
  firstLine = undefined;
  secondLine = undefined;
  horizonLine = undefined;
  vanishingPoints = [];

  resetButtons();

  state = STATE.Init;
};

function manageVPButtons(button) {
  vp1Image.src = "./images/1.png";
  vp2Image.src = "./images/2.png";
  vp3Image.src = "./images/3.png";
  hImage.src = "./images/H.png";

  switch (button) {
    case 0:
      if (selectedVP == 0) //deselect
      {
        selectedVP = -1;
      }
      else {
        if (colorOp == 1)
          vp1Image.src = "./images/1_selected.png";
        else
          vp1Image.src = "./images/1_selected2.png";
        selectedVP = 0;
      }
      break;
    case 1:
      if (selectedVP == 1) //deselect
      {
        selectedVP = -1;
      }
      else {
        if (colorOp == 1)
          vp2Image.src = "./images/2_selected.png";
        else
          vp2Image.src = "./images/2_selected2.png";
        selectedVP = 1;
      }
      break;
    case 2:
      if (selectedVP == 2) //deselect
      {
        selectedVP = -1;
      }
      else {
        vp3Image.src = "./images/3_selected.png";
        selectedVP = 2;
      }
      break;
    case 3:
      if (selectedVP == 3) //deselect
      {
        selectedVP = -1;
      }
      else {
        selectedVP = 3;
        hImage.src = "./images/H_selected.png";
        alignHorizon();
      }
      break;
    default:
      selectedVP = -1;
      break;
  }

  if (selectedVP == -1 || selectedVP == 3) {
    moreButton.hidden = true;
    lessButton.hidden = true;
    deleteVPButton.hidden = true;
  }
  else {
    moreButton.hidden = false;
    lessButton.hidden = false;
    deleteVPButton.hidden = false;
  }
}

function alignHorizon(save = true) {
  if (save)
    saveAction({ n: "Horizon", p1: vanishingPoints[0].y, p2: vanishingPoints[1].y });
  const y = (vanishingPoints[1].y - vanishingPoints[0].y) / 2;
  vanishingPoints[1].y -= y;
  vanishingPoints[0].y += y;
  createHorizonLine();
}

function more(save = true) {
  if (radialLines[selectedVP] >= 270)
    return;
  if (save)
    saveAction({ n: "More", p1: selectedVP });

  radialLines[selectedVP] += 4;
  alertWindow.innerHTML = radialLines[selectedVP] / 4;
  alertWindow.style.opacity = 1;
  setTimeout(function () {
    fadeOut(alertWindow);
  }, 200); // <-- time in milliseconds
}

function less(save = true) {
  if (radialLines[selectedVP] <= 8)
    return;
  if (save)
    saveAction({ n: "Less", p1: selectedVP });

  radialLines[selectedVP] -= 4;
  alertWindow.innerHTML = radialLines[selectedVP] / 4;
  alertWindow.style.opacity = 1;
  setTimeout(function () {
    fadeOut(alertWindow);
  }, 200); // <-- time in milliseconds
}

function fadeOut(target) {
  var fadeEffect = setInterval(function () {
    if (!target.style.opacity) {
      target.style.opacity = 1;
    }
    if (target.style.opacity > 0) {
      target.style.opacity -= 0.1;
    } else {
      clearInterval(fadeEffect);
    }
  }, 100);
}


function deleteVP(save = true) {
  if (save)
    saveAction({ n: "DeleteVP", s: STATE.VP, p1: vanishingPoints[selectedVP], p2: selectedVP });

  vanishingPoints.splice(selectedVP, 1);
  switch (vanishingPoints.length) {
    case 2:
      vp3Button.hidden = true;
      break;
    case 1:
      vp2Button.hidden = true;
      horizonButton.hidden = true;
      horizonLine = undefined;
      break;
    case 0:
      vp1Button.hidden = true;
      downloadButton.disabled = true;
      break;
  }
  manageVPButtons(selectedVP); //and hide
}

document.addEventListener("DOMContentLoaded", init);

//Code from:
//https://stackoverflow.com/questions/34597160/html-canvas-mouse-position-after-scale-and-translate/34598847#34598847
//----------------------------------------------------------------------------
function createMatrix(x, y, scale, rotate) {
  const m = matrix; // just to make it easier to type and read
  const im = invMatrix; // just to make it easier to type and read
  // create the scale and rotation part of the matrix
  m[3] = m[0] = Math.cos(rotate) * scale;
  m[2] = -(m[1] = Math.sin(rotate) * scale);
  // translation
  m[4] = x;
  m[5] = y;

  // calculate the inverse transformation
  // first get the cross product of x axis and y axis
  const cross = m[0] * m[3] - m[1] * m[2];
  // now get the inverted axies
  im[0] = m[3] / cross;
  im[1] = -m[1] / cross;
  im[2] = -m[2] / cross;
  im[3] = m[0] / cross;
}

// function to transform to world space
function toWorld(x, y) {
  let xx, yy, m;
  m = invMatrix;
  xx = x - matrix[4];
  yy = y - matrix[5];
  return {
    x: xx * m[0] + yy * m[2],
    y: xx * m[1] + yy * m[3]
  }
}
//----------------------------------------------------------------------------

let previousActions = [];
let nextActions = [];

function saveAction(action) {
  previousActions.push(action);
  nextActions = [];

  undoButton.disabled = false;
  redoButton.disabled = true;
}

function undo() {
  const action = previousActions.pop();
  nextActions.push(action);
  let prev; //going back on the history

  switch (action.n) {
    case "FirstLine": //delete first line
      firstLine = { x, y };
      state = action.s;
      break;
    case "SecondLine": //delete second line (see if there are other before)
      prev = previousActions.pop();
      if (prev.n == "SecondLine") {
        secondLine = prev.p1;
        nextActions.push(prev);
      }
      else //delete and push again
      {
        previousActions.push(prev);
        secondLine = { x, y };
        state = action.s;
      }
      downloadButton.disabled = true;
      break;
    case "VP": //delete VP and show first and second lines
      selectedVP = vanishingPoints.length - 1;
      deleteVP(false);
      selectedVP = - 1;

      state = action.s;
      let i = 1;
      prev = previousActions[previousActions.length - i];//second line
      secondLine = prev.p1;
      i++;
      prev = previousActions[previousActions.length - i];//looking for first line
      while (prev.n != "FirstLine") {
        i++;
        prev = previousActions[previousActions.length - i];
      }
      firstLine = prev.p1;
      createVPButton.disabled = false;
      break;
    case "DeleteVP": //redo VP
      if (action.p2 == vanishingPoints.length)
        vanishingPoints.push(action.p1);
      else
        vanishingPoints.splice(action.p2, 0, action.p1);
      state = STATE.VP;

      switch (vanishingPoints.length) {
        case 1:
          vp1Button.hidden = false;
          downloadButton.disabled = false;
          break;
        case 2:
          vp2Button.hidden = false;
          horizonButton.hidden = false;
          createHorizonLine();
          break;
        case 3:
          vp3Button.hidden = false;
          break;
      }
      createVPButton.disabled = true;
      break;
    case "DeleteAll": //redo eveeeerything :)
      state = action.s;
      dottedLine = action.p1;
      firstLine = action.p2;
      secondLine = action.p3;
      horizonLine = action.p4;
      vanishingPoints = action.p5;
      bgImage = action.p6;
      switch (vanishingPoints.length) {
        case 0:
          if (firstLine != undefined && secondLine != undefined)
            createVPButton.disabled = false;
          break;
        case 1:
          vp1Button.hidden = false;
          downloadButton.disabled = false;
          break;
        case 2:
          vp1Button.hidden = false;
          vp2Button.hidden = false;
          horizonButton.hidden = false;
          createHorizonLine();
          break;
        case 3:
          vp1Button.hidden = false;
          vp2Button.hidden = false;
          vp3Button.hidden = false;
          horizonButton.hidden = false;
          createHorizonLine();
          break;
      }
      break;
    case "BgImage": //Remove image (see if there are previous ones)
      if (action.p1 == 0) //it's first image --> remove it
        bgImage = undefined;
      else
        bgImage = bgImageHistory[action.p1 - 1];
      break;
    case "Horizon": //Unalign horizon
      vanishingPoints[0].y = action.p1;
      vanishingPoints[1].y = action.p2;
      createHorizonLine();
      break;
    case "MoveHorizon": //Undo move of 2 points
      prev = previousActions[previousActions.length - 1];
      if (prev.n == "MoveHorizonS") {
        prev = previousActions.pop();
        nextActions.push(prev);
        vanishingPoints[0] = { x: prev.p1.x, y: prev.p1.y };
        vanishingPoints[1] = { x: prev.p2.x, y: prev.p2.y };
        createHorizonLine();
      }
      break;
    case "MoveVP": //Undo move of 1 point
      prev = previousActions[previousActions.length - 1];
      if (prev.n == "MoveVPS") {
        prev = previousActions.pop();
        nextActions.push(prev);
        vanishingPoints[prev.p2] = { x: prev.p1.x, y: prev.p1.y };
        if (vanishingPoints.length > 1)
          createHorizonLine();
      }
      break;
    case "More":
      selectedVP = action.p1;
      less(false);
      break;
    case "Less":
      selectedVP = action.p1;
      more(false);
      break;
  }

  if (previousActions.length == 0)
    undoButton.disabled = true;
  if (redoButton.disabled)
    redoButton.disabled = false;
}

function redo() {
  const action = nextActions.pop();
  previousActions.push(action);
  let next; //going forward on the history

  switch (action.n) {
    case "FirstLine": //create first line again
      firstLine = action.p1;
      state = STATE.FirstLine;
      break;
    case "SecondLine": //redo second line
      secondLine = action.p1;
      state = STATE.SecondLine;
      createVPButton.disabled = false;
      break;
    case "VP": //redo VP
      if (action.p2 == vanishingPoints.length)
        vanishingPoints.push(action.p1);
      else
        vanishingPoints.splice(action.p2, 0, action.p1);
      state = STATE.VP;

      switch (vanishingPoints.length) {
        case 1:
          vp1Button.hidden = false;
          downloadButton.disabled = false;
          break;
        case 2:
          vp2Button.hidden = false;
          horizonButton.hidden = false;
          createHorizonLine();
          break;
        case 3:
          vp3Button.hidden = false;
          break;
      }
      createVPButton.disabled = true;
      break;
    case "DeleteVP": //delete VP
      selectedVP = vanishingPoints.length - 1;
      deleteVP(false);
      selectedVP = -1;
      state = STATE.Init;
      break;
    case "DeleteAll": //Delete everything again
      deleteScene(false);
      break;
    case "BgImage": //Redo Image
      bgImage = bgImageHistory[action.p1];
      break;
    case "Horizon": //Align horizon
      alignHorizon(false);
      break;
    case "MoveHorizonS": //Move horizon again
      next = nextActions[nextActions.length - 1];
      if (next.n == "MoveHorizon") {
        next = nextActions.pop();
        previousActions.push(next);
        vanishingPoints[0] = { x: next.p1.x, y: next.p1.y };
        vanishingPoints[1] = { x: next.p2.x, y: next.p2.y };
        createHorizonLine();
      }
      break;
    case "MoveVPS": //Undo move of 1 point
      next = nextActions[nextActions.length - 1];
      if (next.n == "MoveVP") {
        next = nextActions.pop();
        previousActions.push(next);
        vanishingPoints[next.p2] = { x: next.p1.x, y: next.p1.y };
        if (vanishingPoints.length > 1)
          createHorizonLine();
      }
      break;
    case "More":
      selectedVP = action.p1;
      more(false);
      break;
    case "Less":
      selectedVP = action.p1;
      less(false);
      break;
  }

  if (nextActions.length == 0)
    redoButton.disabled = true;
  if (undoButton.disabled)
    undoButton.disabled = false;
}

function changeSettings(e) {
  // console.log(e.target.value);
  switch (e.target.value) {
    case "left":
      if (isMobile) {
        canvas.style.right = "2vw";
        bg_canvas.style.right = "2vw";
        canvas.style.left = "auto";
        bg_canvas.style.left = "auto";
        document.getElementById("container-v").style.left = "0px";
        document.getElementById("container-v").style.right = "auto";
        alertWindow.style.left = "90vw";
        canvasButton.style.left = "92vw";
      }
      else {
        canvas.style.left = "2vw";
        bg_canvas.style.left = "2vw";
        canvas.style.right = "auto";
        bg_canvas.style.right = "auto";
        document.getElementById("container-v").style.right = "0px";
        document.getElementById("container-v").style.left = "auto";
        alertWindow.style.left = "79vw";
      }
      break;
    case "right":
      if (isMobile) {
        canvas.style.left = "2vw";
        bg_canvas.style.left = "2vw";
        canvas.style.right = "auto";
        bg_canvas.style.right = "auto";
        document.getElementById("container-v").style.right = "0px";
        document.getElementById("container-v").style.left = "auto";
        alertWindow.style.left = "79vw";
        canvasButton.style.left = "81vw";
      }
      else {
        canvas.style.right = "2vw";
        bg_canvas.style.right = "2vw";
        canvas.style.left = "auto";
        bg_canvas.style.left = "auto";
        document.getElementById("container-v").style.left = "0px";
        document.getElementById("container-v").style.right = "auto";
        alertWindow.style.left = "90vw";
      }
      break;
    case "colorful":
      break;
    case "neutral":
      break;
    case "ryb":
      colorOp = 1;
      colors = ["HotPink", "Gold", "RoyalBlue"];
      break;
    case "rgb":
      colorOp = 2;
      colors = ["Red", "Green", "Blue"];
      break;
  }
  manageVPButtons(-1);
}

function switchZoomPan(e) {
  if (pinchPan == 0) {
    moveScaleImg.src = "./images/pan.png";
    pinchPan = 1;
  }
  else {
    moveScaleImg.src = "./images/pinch.png";
    pinchPan = 0;
  }
}

