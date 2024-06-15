import {changeToolBarStyle, translation } from './helper.js'; // Import the translation function from helper.js

const canvas = document.getElementById("canvas");
const bgCanvas = document.getElementById("bgCanvas");
const context = canvas.getContext("2d");
const bgContext = bgCanvas.getContext("2d");
const downloadCanvas = document.createElement('canvas');

const canvasMoveScale = document.getElementById("canvasMoveScale");
const moveScaleImg = document.getElementById("moveScaleImg");

const undoButton = document.getElementById("undo");
const redoButton = document.getElementById("redo");
const link = document.getElementById("downloadLink");
const loadImgButton = document.getElementById("loadImg");
const downloadButton = document.getElementById("downloadGrid");
const clearButton = document.getElementById("clearCanvas");

const toolsLeft = document.getElementById("toolsLeft");
const toolsRight = document.getElementById("toolsRight");
const ifaceColor = document.getElementById("ifaceColor");
const ifaceNeutral = document.getElementById("ifaceNeutral");
const colors1 = document.getElementById("colors1");
const colors2 = document.getElementById("colors2");

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

const slider =  document.getElementById("slider");
const sliderLabel = document.getElementById("sliderLabel");

const maxRadialLines = 360;
const minRadialLines = 8;

const defaultSettings = {
  hand: 'left',
  iface: 'colorful',
  colors: 'pyb',
  transparency: '0'
};

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

let aspectRatioWidth = 0.85; //possibly change them in the future to adapt for mobile phones
let asepctRatioHeight = 0.85;

let cameraOffset = { x: window.innerWidth * aspectRatioWidth / 2, y: window.innerHeight * asepctRatioHeight / 2 }
let cameraZoom = 1;
let MAX_ZOOM = 20;
let MIN_ZOOM = 0.05;
let SCROLL_SENSITIVITY = 0.0005;

let mouseWorldPos;

let isDragging = false;
let dragStart = { x: 0, y: 0 };

let initialPinchDistance = null;
let lastZoom = cameraZoom;

let matrix = [1, 0, 0, 1, 0, 0];      // normal matrix
let invMatrix = [1, 0, 0, 1];   // inverse matrix

let timeStart;
let previousDistance;

let isMobile = false;
let pinchPan = 0;

let previousActions = [];
let nextActions = [];

let settings;

/********************************
 ***     INITIALIZATION       ***
 ********************************/

/**
 * Initialize the application.
 */
document.addEventListener("DOMContentLoaded", () => {
  if ("ontouchstart" in document.documentElement) { //is mobile device
    isMobile = true;
    setupTouchEvents();

  }
  else { //Computer
    setupMouseEvents();
  }
  getLocalSettings();
  setupEventListeners();
  resetButtons();
  state = STATE.Init;
  draw();
});

/**
 * Set up touch event listeners.
 */
function setupTouchEvents() {
  canvas.addEventListener("touchstart", handleTouchStart);
  canvas.addEventListener("touchmove", handleTouchMove);
  canvas.addEventListener("touchend", handleTouchEnd);
}

/**
 * Set up mouse event listeners.
 */
function setupMouseEvents() {
  canvas.addEventListener("mousedown", onPointerDown);
  canvas.addEventListener("mouseup", onPointerUp);
  canvas.addEventListener("mousemove", onPointerMove);
  canvas.addEventListener("mouseleave", onPointerLeave);
  canvas.addEventListener("wheel", (e) => { adjustZoom(-e.deltaY * SCROLL_SENSITIVITY); });

  document.body.addEventListener("keydown", handleKeyDown);
}

/**
* Set up general event listeners.
*/
function setupEventListeners() {
  canvasMoveScale.addEventListener("click", switchZoomPan);
  undoButton.addEventListener("click", (e) => { undo(); manageVPButtons(-1); });
  redoButton.addEventListener("click", (e) => { redo(); manageVPButtons(-1); });
  downloadButton.addEventListener("click", (e) => { downloadGrid(); manageVPButtons(-1); });
  clearButton.addEventListener("click", (e) => { deleteScene(); manageVPButtons(-1); });

  toolsLeft.addEventListener("change", changeSettings);
  toolsRight.addEventListener("change", changeSettings);
  ifaceColor.addEventListener("change", changeSettings);
  ifaceNeutral.addEventListener("change", changeSettings);
  colors1.addEventListener("change", changeSettings);
  colors2.addEventListener("change", changeSettings);
  slider.addEventListener("input", changeBgImgTransparency);

  createVPButton.addEventListener("click", (e) => { createVP(); });

  vp1Button.addEventListener("click", (e) => { manageVPButtons(0); });
  vp2Button.addEventListener("click", (e) => { manageVPButtons(1); });
  vp3Button.addEventListener("click", (e) => { manageVPButtons(2); });
  horizonButton.addEventListener("click", (e) => { manageVPButtons(3); });

  moreButton.addEventListener("click", (e) => { more(); });
  lessButton.addEventListener("click", (e) => { less(); });
  deleteVPButton.addEventListener("click", (e) => { deleteVP(); });
  document.addEventListener("click", (e) => { if (e.target.id == "body") manageVPButtons(-1); });

  loadImgButton.addEventListener("change", loadBGImage); //background
}

/**
 * Reset button states.
 */
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


/********************************
 ***     EVENT HANDLERS       ***
 ********************************/
/**
 * Handle PointerDown events.
 */
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
        if (vanishingPoints.length > 1) createHorizonLine();
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
        if (vanishingPoints.length > 1) createHorizonLine();
      }
    }

    return;
  }
  else if (vanishingPoints.length == 3 && (e.button == 0 || touches == 1)) { //trying to create a new VP
    alert(translation("threeVPsAlert"));
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

/**
 * Handle PointerMove events.
 */
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
        if (vanishingPoints.length > 1) createHorizonLine();
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
        if (vanishingPoints.length > 1) createHorizonLine();
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

/**
 * Handle PointerUp events.
 */
function onPointerUp(e) {
  if (isMoving) {
    isMoving = false;
    if (vanishingPoints.length > 1) createHorizonLine();
    if (selectedVP == 3) //horizon line
      saveAction({ n: "MoveHorizon", p1: { x: vanishingPoints[0].x, y: vanishingPoints[0].y }, p2: { x: vanishingPoints[1].x, y: vanishingPoints[1].y } });
    else
      saveAction({ n: "MoveVP", p1: { x: vanishingPoints[selectedVP].x, y: vanishingPoints[selectedVP].y }, p2: selectedVP });
  }
  else if (isDrawing) {
    if (e.button == 0) {
      mouseWorldPos = toWorld(getEventLocation(e).x, getEventLocation(e).y);
      createLine({ x1: x, y1: y, x2: mouseWorldPos.x, y2: mouseWorldPos.y });
    }
    else {
      mouseWorldPos = toWorld(getEventLocation(e).x - offsetX, getEventLocation(e).y - offsetY);
      createLine({ x1: x, y1: y, x2: mouseWorldPos.x, y2: mouseWorldPos.y });
    }
  }
  else if (isDragging) {
    isDragging = false;
  }
}

/**
 * Handle PointerLeave events.
 */
function onPointerLeave(e) {
  isDragging = false;
  isMoving = false;
}

/**
 * Touch Start
 */
function handleTouchStart(e) {
  touches = e.touches.length;
  if (touches > 1) e.preventDefault();

  switch (touches) {
    case 1: onPointerDown(e); break;
    case 2:
      timeStart = Date.now();
      handlePinchPan(e);
      break;
    case 3:
      if (nextActions.length > 0) redo();
      break;
    case 4: deleteScene(); break;
  }
}

/**
 * Touch Move
 */
function handleTouchMove(e) {
  if (touches > 1) e.preventDefault();
  switch (touches) {
    case 1: onPointerMove(e); break;
    case 2: if ((Date.now() - timeStart) > 60) handlePinchPan(e); break;
  }
}

/** 
 * Touch End
 */
function handleTouchEnd(e) {
  if (touches > 1) e.preventDefault();
  switch (touches) {
    case 1: onPointerUp(e); break;
    case 2:
      if ((Date.now() - timeStart) < 60) {
        if (previousActions.length > 0) undo();
      } else {
        initialPinchDistance = null;
        lastZoom = cameraZoom;
      }
      break;
  }
  touches = 0;
}

/**
 * Handle key down events.
 */
function handleKeyDown(e) {
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
}

/**
 * Get settings from the local storage
 */
function getLocalSettings() {
  const savedSettings = localStorage.getItem('userSettings');
  if (savedSettings) {
    settings = JSON.parse(savedSettings);
  } else {
    settings = defaultSettings;
  }

  updateSettingsButtons(); //Make sure the right radio buttons are checked
  showCustomizedInterface();
}

/**
 * Update the radio buttons
 */
function updateSettingsButtons() {
  toolsLeft.checked = settings.hand === "left";
  toolsRight.checked = settings.hand === "right";
  ifaceColor.checked = settings.iface === "colorful";
  ifaceNeutral.checked = settings.iface === "neutral";
  colors1.checked = settings.colors === "pyb";
  colors2.checked = settings.colors === "rgb";
  slider.value = settings.transparency * 100;
  sliderLabel.innerHTML = `${slider.value}%`
}

/**
 * Save settings to local storage
 */
function saveSettings() {
  localStorage.setItem('userSettings', JSON.stringify(settings));
}

/**
 * Show updated settings in the webpage
 */
function showCustomizedInterface() {
  changeToolBarStyle(isMobile, settings.hand === "left");
  colors = settings.colors === "pyb" ? ["deeppink", "gold", "slateblue"] : ["limegreen", "blue", "orangered"];
  canvas.style.backgroundColor = `rgba(255, 255, 255, ${settings.transparency}`;
}

/**
 * Change settings based on user input.
 */
function changeSettings(e) {
  switch (e.target.value) {
    case "left":
      settings.hand = "left";
      break;
    case "right":
      settings.hand = "right";
      break;
    case "colorful":
      settings.iface = "colorful";
      break;
    case "neutral":
      settings.iface = "neutral";
      break;
    case "pyb":
      settings.colors = "pyb";
      break;
    case "rgb":
      settings.colors = "rgb";
      break;
  }
  saveSettings();
  showCustomizedInterface();
  manageVPButtons(-1);
}

/**
 * Change image background transparency
 */
function changeBgImgTransparency(e)
{
  settings.transparency = e.target.value/100;
  sliderLabel.innerHTML = `&emsp;${e.target.value}%`;
  saveSettings();
  showCustomizedInterface();
  manageVPButtons(-1);
}

/**
 * Switch between zoom and pan modes.
 */
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

/********************************
 ***     DRAWING FUNCTIONS    ***
 ********************************/
/**
 * Drawing loop.
 */
function draw() {

  canvas.width = window.innerWidth * aspectRatioWidth;
  canvas.height = window.innerHeight * asepctRatioHeight;

  bgCanvas.width = window.innerWidth * aspectRatioWidth;
  bgCanvas.height = window.innerHeight * asepctRatioHeight;

  const m = matrix;
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  createMatrix(cameraOffset.x, cameraOffset.y, cameraZoom, 0);
  context.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);

  bgContext.setTransform(1, 0, 0, 1, 0, 0);
  bgContext.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
  bgContext.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);

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

/**
 * Draw the background image on the canvas (inside draw loop).
 */
function drawBGImage() {
  const hRatio = bgCanvas.width / bgImage.width;
  const vRatio = bgCanvas.height / bgImage.height;
  const ratio = Math.min(hRatio, vRatio);
  const centerX = (bgCanvas.width - bgImage.width * ratio) / 2;
  const centerY = (bgCanvas.height - bgImage.height * ratio) / 2;
  bgContext.drawImage(bgImage, -canvas.width / 2 + centerX, -canvas.height / 2 + centerY, bgImage.width * ratio, bgImage.height * ratio);
}

/**
 * Draw a line on the canvas (inside draw loop).
 */
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

/**
 * Draw a vanishing point with radial lines (inside draw loop)
 */
function drawVP(vp) {
  let degs = 0;
  for (let i = 0; i < radialLines[currentVP]; i++) {
    let line = { x1: vp.x, y1: vp.y, x2: vp.x + 500000 * Math.cos(degs * Math.PI / 180), y2: vp.x + 500000 * Math.sin(degs * Math.PI / 180) }
    drawLine(line);
    degs += 360 / radialLines[currentVP];
  }
}

/********************************
 ***     VANISHING POINT       ***
 ********************************/
/**
 * Create the line
 */
function createLine(line) {
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
      saveAction({ n: "FirstLine", s: STATE.Init, p1: { x1: x1, y1: y1, x2: x2, y2: y2 } });
      state = STATE.FirstLine;
      break;
    case STATE.SecondDottedLine:
      secondLine = { x1: x1, y1: y1, x2: x2, y2: y2 };
      saveAction({ n: "SecondLine", s: STATE.FirstLine, p1: { x1: x1, y1: y1, x2: x2, y2: y2 } });
      state = STATE.SecondLine;
      break;
  }

  x = 0;
  y = 0;
  isDrawing = false;
  dottedLine = undefined;

  updateVPButtons();
}

/**
 * Create a vanishing point at the intersection of two lines.
 */
function createVP() {
  const vp = intersect();
  if (vp != false) { //create the vp and the radiating lines
    vanishingPoints.push(vp);
    saveAction({ n: "VP", s: STATE.SecondLine, p1: { x: vp.x, y: vp.y }, p2: vanishingPoints.length - 1 });

    state = STATE.VP;

    if (vanishingPoints.length > 1) createHorizonLine();
  }
  else {
    alert(translation('noIntersectionAlert'));
  }

  updateVPButtons();
  manageVPButtons(-1);
}

/**
 * Create the horizon line between two vanishing points.
 */
function createHorizonLine() {
  const dx = vanishingPoints[1].x - vanishingPoints[0].x;
  const dy = vanishingPoints[1].y - vanishingPoints[0].y;

  const x1 = vanishingPoints[0].x + dx * -100;
  const y1 = vanishingPoints[0].y + dy * -100;
  const x2 = vanishingPoints[0].x + dx * 100;
  const y2 = vanishingPoints[0].y + dy * 100;

  horizonLine = { x1, y1, x2, y2 };
}

/**
 * Determine the intersection point of two line segments.
 * Return FALSE if the lines don't intersect.
 */
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

/**
 * Manage the visibility of vanishing point buttons.
 */
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
        if (settings.colors === "pyb")
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
        if (settings.colors === "pyb")
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
        if (settings.colors === "pyb")
          vp3Image.src = "./images/3_selected.png";
        else
          vp3Image.src = "./images/3_selected2.png";
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

/**
 * Update the visibility of vanishing point buttons and the state of the download button.
 */
function updateVPButtons() {
  vp1Button.hidden = vanishingPoints.length < 1;
  vp2Button.hidden = vanishingPoints.length < 2;
  vp3Button.hidden = vanishingPoints.length < 3;
  horizonButton.hidden = vanishingPoints.length < 2;
  downloadButton.disabled = vanishingPoints.length < 1;
  createVPButton.disabled = state !== STATE.SecondLine || vanishingPoints.length >= 3;
}

/**
 * Align the horizon line.
 */
function alignHorizon(save = true) {
  if (save)
    saveAction({ n: "Horizon", p1: vanishingPoints[0].y, p2: vanishingPoints[1].y });
  const y = (vanishingPoints[1].y - vanishingPoints[0].y) / 2;
  vanishingPoints[1].y -= y;
  vanishingPoints[0].y += y;
  createHorizonLine();
}

/**
 * Increase the number of radial lines for the selected vanishing point.
 */
function more(save = true) {
  if (radialLines[selectedVP] >= maxRadialLines)
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

/**
 * Decrease the number of radial lines for the selected vanishing point.
 */
function less(save = true) {
  if (radialLines[selectedVP] <= minRadialLines)
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

/**
 * Delete the selected vanishing point.
 */
function deleteVP(save = true) {
  if (save)
    saveAction({ n: "DeleteVP", s: STATE.VP, p1: vanishingPoints[selectedVP], p2: selectedVP });

  vanishingPoints.splice(selectedVP, 1);
  updateVPButtons();
  manageVPButtons(selectedVP); //and hide
}

/********************************
***      SCENE MANAGEMENT     ***
********************************/
/**
 * Load the background image.
 */
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

/**
 * Show the loaded background image.
 */
function showImage(fileReader) {
  bgImage = new Image();
  bgImage.src = fileReader.result;

  bgImage.onload = function () {
    bgImageHistory.push(bgImage);
    saveAction({ n: "BgImage", p1: bgImageHistory.length - 1 });
  };
}

/**
 * Download the grid image.
 */
function downloadGrid(e) {
  downloadCanvas.width = 2048;
  downloadCanvas.height = 2048 * canvas.height / canvas.width;
  downloadCanvas.getContext('2d').drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, downloadCanvas.width, downloadCanvas.height);

  const image = downloadCanvas.toDataURL("image/png");
  link.href = image;
  link.download = "grid";
  link.click();
};

/**
 * Delete the current scene.
 */
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
/********************************
***        UNDO/REDO          ***
********************************/
/**
 * Save an action to the history stack.
 */
function saveAction(action) {
  previousActions.push(action);
  nextActions = [];

  undoButton.disabled = false;
  redoButton.disabled = true;
}

/**
 * Undo the last action.
 */
function undo() {
  const action = previousActions.pop();
  nextActions.push(action);
  let prev; //going back on the history

  console.log(action.n);
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
      break;
    case "DeleteVP": //redo VP
      if (action.p2 == vanishingPoints.length)
        vanishingPoints.push(action.p1);
      else
        vanishingPoints.splice(action.p2, 0, action.p1);
      state = STATE.VP;

      if (vanishingPoints.length > 1) createHorizonLine();

      break;
    case "DeleteAll": //redo eveeeerything :)
      state = action.s;
      dottedLine = action.p1;
      firstLine = action.p2;
      secondLine = action.p3;
      horizonLine = action.p4;
      vanishingPoints = action.p5;
      bgImage = action.p6;
      if (vanishingPoints.length > 1) createHorizonLine();
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
        if (vanishingPoints.length > 1) createHorizonLine();
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

  updateVPButtons();

  if (previousActions.length == 0)
    undoButton.disabled = true;
  if (redoButton.disabled)
    redoButton.disabled = false;
}

/**
 * Redo the last undone action.
 */
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
      break;
    case "VP": //redo VP
      if (action.p2 == vanishingPoints.length)
        vanishingPoints.push(action.p1);
      else
        vanishingPoints.splice(action.p2, 0, action.p1);
      state = STATE.VP;

      if (vanishingPoints > 1) createHorizonLine();
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

  updateVPButtons();

  if (nextActions.length == 0)
    redoButton.disabled = true;
  if (undoButton.disabled)
    undoButton.disabled = false;
}

/********************************
 ***        UTILITIES         ***
 ********************************/
/**
 * Get the relevant location from a mouse or single touch event.
 */
function getEventLocation(e) {
  if (e.changedTouches && e.changedTouches.length == 1) {
    return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
  }
  else if (e.clientX && e.clientY) {
    return { x: e.offsetX, y: e.offsetY };
  }
}

/**
 * Handle pinch and pan gestures.
 */
function handlePinchPan(e) {
  if (pinchPan == 0) {
    let t1 = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    let t2 = { x: e.changedTouches[1].clientX, y: e.changedTouches[1].clientY };
    let currentDistance = Math.sqrt((t1.x - t2.x) ** 2 + (t1.y - t2.y) ** 2);

    previousDistance = currentDistance;
    if (e.type !== "touchstart") {
      if (initialPinchDistance === null) {
        initialPinchDistance = currentDistance;
      }
      else {
        adjustZoom(null, currentDistance / initialPinchDistance);
      }
    }
  }
  else {
    if (e.type == "touchstart") {
      dragStart.x = e.changedTouches[1].clientX - offsetX - cameraOffset.x;
      dragStart.y = e.changedTouches[1].clientY - offsetY - cameraOffset.y;
    }
    else {
      cameraOffset.x = e.changedTouches[1].clientX - offsetX - dragStart.x;
      cameraOffset.y = e.changedTouches[1].clientY - offsetY - dragStart.y;
    }
  }

}

/**
 * Adjust the zoom level.
 */
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


/**
 * Create the transformation matrix.
 */
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

/**
 * Transform screen coordinates to world coordinates.
 */
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

/**
 * Fade out the message
 */
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
