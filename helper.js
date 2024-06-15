const undo = document.getElementById("undo");
const redo = document.getElementById("redo");
const uploadImg = document.getElementById("uploadImg");
const download = document.getElementById("downloadGrid");
const clearCanvas = document.getElementById("clearCanvas");
const settings = document.getElementById("settings");
const info = document.getElementById("info");
const createVP = document.getElementById("createVP");
const deleteVP = document.getElementById("deleteVP");

const canvas = document.getElementById("canvas");
const bg_canvas = document.getElementById("bgCanvas");
const containerV = document.getElementById("container-v");
const alertWindow = document.getElementById("alert");
const canvasButton = document.getElementById("canvasButton");

const isPhone = /mobile/i.test(navigator.userAgent) && !/ipad|tablet/i.test(navigator.userAgent);

const messages = {
  en: {
    threeVPsAlert: "You already have 3 vanishing points!!!",
    noIntersectionAlert: "The drawn lines do not create an intersection point!",
  },
  es: {
    threeVPsAlert: "¡Ya tienes 3 puntos de fuga!!!",
    noIntersectionAlert: "¡Las líneas dibujadas no crean un punto de intersección!",
  }
};

const getLanguage = () => /^en\b/.test(navigator.language) ? 'en' : 'es';

const translation = (key) => {
  const lang = getLanguage();
  return messages[lang][key];
}

const setCanvasStyle = (position, leftOffset, rightOffset) => {
  canvas.style[position] = leftOffset;
  bg_canvas.style[position] = leftOffset;
  canvas.style[opposite(position)] = rightOffset;
  bg_canvas.style[opposite(position)] = rightOffset;
};

const opposite = (position) => (position === 'left' ? 'right' : 'left');

let landscape = window.matchMedia("(orientation: landscape)");

document.addEventListener("DOMContentLoaded", () => {
  if (getLanguage() === 'en') {
    setEnglishInfoSettings();
  } else {
    setSpanishInfoSettings();
  }

  if (isPhone) //make screen smaller
  {
    canvas.style.bottom = "2vh";
    bg_canvas.style.bottom = "2vh";
    canvas.style.top = "auto";
    bg_canvas.style.top = "auto";
  }
  setButtons();
});

function setInfoText(title, text) {
  document.getElementById("infoModal_title").innerHTML = title;
  document.getElementById("infoModal_text").innerHTML = text;
}

function setEnglishInfoSettings() {
  document.getElementById("settingsModal_title").innerHTML = "Settings";

  document.getElementById("check1").insertAdjacentHTML('afterbegin', "<b>- Toolbar for:&emsp;</b>");
  document.getElementById("leftLabel").innerHTML = "Right Handed";
  document.getElementById("rightLabel").innerHTML = "Left Handed";
  document.getElementById("check2").insertAdjacentHTML('afterbegin', "<b>- Interface:&emsp;</b>");
  document.getElementById("ifaceColorLabel").innerHTML = "Colorful";
  document.getElementById("ifaceNeutralLabel").innerHTML = "Boring :)";
  document.getElementById("check3").insertAdjacentHTML('afterbegin', "<b>- Lines:&emsp;</b>");
  document.getElementById("colors1Label").innerHTML = "Pink/Yellow/Blue";
  document.getElementById("colors2Label").innerHTML = "Red/Green/Blue";
  document.getElementById("transparencySlider").insertAdjacentHTML('afterbegin',"<b>- Bg image transparency:&emsp;</b>");
  document.getElementById("settingsOkButton").innerHTML = "Done";

  //Info text changes on iPad/Computer
  if ("ontouchstart" in document.documentElement) {
    setInfoText("Use and Quick Gestures", "- Touch and drag to create lines<br>" +
      "- Use two fingers to zoom and move the canvas (switch between both modes with the bottom right selection button)<br>" +
      "- 2-finger tap to undo<br> - 3-finger tap to redo<br>" +
      "- 4-finger tap to clear all <hr><center><i>Button icons created by Uniconlabs and Freepik at flaticon.es</i></center>");
  }
  else {
    setInfoText("Use and Keyboard Shortcuts",
      "<p>- Left click to create lines</p>" +
      "<p>- Mouse wheel to zoom</p>" +
      "<p>- Right click or click on the wheel to move the canvas</p>" +
      "<p>- <i> Keys</i>:<br>&emsp;" +
      "-- <b>'Enter'</b> to create VP (vanishing point)<br>&emsp;" +
      "-- <b>'1'</b>, < b>'2'</b> and <b>'3'</b> to select vanishing points<br>&emsp;" +
      "-- <b>'H'</b> to align horizon (and select it) <br>&emsp;" +
      "-- <b>'+'</b> and <b>'-'</b> to add lines to the selected VP<br>&emsp;" +
      "-- <b>'Delete'</b > to delete all<br>&emsp;" +
      "-- <b>'Esc'</b> to abort creating a line<br>&emsp;" +
      "-- <b>'Ctrl+z'</b> and <b>' Ctrl+y'</b> to undo and redo actions</p>" +
      "<hr><center><i>Button icons created by Uniconlabs and Freepik at flaticon.es</i></center>");
  }
  document.getElementById("infoOkButton").innerHTML = "Understood";
}

function setSpanishInfoSettings() {
  document.getElementById("settingsModal_title").innerHTML += "Ajustes";
  document.getElementById("check1").insertAdjacentHTML('afterbegin', "<b>- Barra de Herramientas para:&emsp;</b>");
  document.getElementById("leftLabel").innerHTML = "Diestros";
  document.getElementById("rightLabel").innerHTML = "Zurdos";
  document.getElementById("check2").insertAdjacentHTML('afterbegin', "<b>- Interfaz:&emsp;</b>");
  document.getElementById("ifaceColorLabel").innerHTML = "Colorida";
  document.getElementById("ifaceNeutralLabel").innerHTML = "Aburrida :)";
  document.getElementById("check3").insertAdjacentHTML('afterbegin', "<b>- Líneas:&emsp;</b>");
  document.getElementById("colors1Label").innerHTML = "Rosa/Amarillo/Azul";
  document.getElementById("colors2Label").innerHTML = "Rojo/Verde/Azul";
  document.getElementById("transparencySlider").insertAdjacentHTML('afterbegin',"<b>- Transparencia img fondo:&emsp;</b>");
  document.getElementById("settingsOkButton").innerHTML = "Hecho";

  //Info text changes on iPad/Computer
  if ("ontouchstart" in document.documentElement) {
    setInfoText("Uso y Gestos Rápidos",
      "- Toca y arrastra para crear líneas<br>" +
      "- Usa dos dedos para hacer zoom y mover el canvas (cambia entre ambos modos con el botón de selección abajo a la dcha)<br>" +
      "- Toque con 2 dedos para deshacer<br>" +
      "- Toque con 3 dedos para rehacer<br>" +
      "- Toque con 4 dedos para borrar todo <hr><center><i>Iconos de botones creados por Uniconlabs y Freepik en flaticon.es</i></center>");
  }
  else {
    setInfoText("Uso y Teclas Rápidas",
      "<p>- Click izquierdo para crear líneas</p>" +
      "<p>- Rueda del ratón para hacer zoom</p>" +
      "<p>- Click derecho o click en la rueda para mover el canvas</p>" +
      "<p>- <i>Teclas</i>:<br>&emsp;" +
      "-- <b>'Enter'</b> para crear PF (punto de fuga)<br>&emsp;" +
      "-- <b>'1'</b>, <b>'2'</b> y <b>'3'</b> para seleccionar los puntos de fuga<br>&emsp;" +
      "-- <b>'H'</b> para alinear horizonte (y seleccionarlo)<br>&emsp;" +
      "-- <b>'+'</b> y <b>'-'</b> para añadir líneas al PF seleccionado<br>&emsp;" +
      "-- <b>'Supr'</b> para borrar todo<br>&emsp;" +
      "-- <b>'Esc'</b> para abortar crear una línea<br>&emsp;" +
      "-- <b>'Ctrl+z'</b> y <b>'Ctrl+y'</b> para deshacer y rehacer acciones</p> " +
      "<hr><center><i>Iconos de botones creados por Uniconlabs y Freepik en flaticon.es</i></center>");
  }
  document.getElementById("infoOkButton").innerHTML = "Entendido";
}

function setButtons() {
  undo.innerHTML = "<img class=\"icon\" src=\"images/undo.png\" />";
  redo.innerHTML = "<img class=\"icon\" src=\"images/redo.png\" />";
  uploadImg.innerHTML = "<img class=\"icon\" src=\"images/image.png\" />";
  download.innerHTML = "<img class=\"icon\" src=\"images/download.png\" />";
  clearCanvas.innerHTML = "<img class=\"icon\" src=\"images/delete.png\" />";
  settings.innerHTML = "<img class=\"icon\" src=\"images/settings.png\" />";
  info.innerHTML = "<img class=\"icon\" src=\"images/info.png\" />";
  createVP.innerHTML = "<img class=\"icon\" src=\"images/vp.png\" />";
  deleteVP.innerHTML = "<img class=\"icon\" src=\"images/delete.png\" />";

  if (!isPhone && window.innerWidth > window.innerHeight) {//If portrait or mobile don't add text to buttons
    if (getLanguage() === 'en')
      setEnglishButtons();
    else
      setSpanishButtons();
  }
}

function setEnglishButtons() {
  undo.innerHTML += " Undo";
  redo.innerHTML += " Redo";
  uploadImg.innerHTML += "&nbsp;Image";
  download.innerHTML += " Download";
  clearCanvas.innerHTML += " Delete";
  settings.innerHTML += " Settings";
  info.innerHTML += " Info&nbsp;&nbsp;";
  createVP.innerHTML += "<br>Create Vanishing Point";
  deleteVP.innerHTML += "<br>Delete Vanishing Point";
}

function setSpanishButtons() {
  undo.innerHTML = "<img class=\"icon\" src=\"images/undo.png\" /> Deshacer";
  redo.innerHTML = "<img class=\"icon\" src=\"images/redo.png\" /> Rehacer";
  uploadImg.innerHTML = "<img class=\"icon\" src=\"images/image.png\" />&nbsp;Imagen";
  download.innerHTML = "<img class=\"icon\" src=\"images/download.png\" /> Descargar";
  clearCanvas.innerHTML = "<img class=\"icon\" src=\"images/delete.png\" /> Borrar";
  settings.innerHTML = "<img class=\"icon\" src=\"images/settings.png\" /> Ajustes";
  info.innerHTML = "<img class=\"icon\" src=\"images/info.png\" /> Info&nbsp;&nbsp;";
  createVP.innerHTML = "<img class=\"icon\" src=\"images/vp.png\" /><br>Crear Punto de Fuga";
  deleteVP.innerHTML = "<img class=\"icon\" src=\"images/delete.png\" /><br>Borrar Punto de Fuga";
}

function changeToolBarStyle (isMobile, isLeft) {
  if (isMobile) { //check if tablet or phone
    if (isPhone) {
      setCanvasStyle(isLeft ? 'right' : 'left', "2vw", "auto");
      containerV.style[isLeft ? 'left' : 'right'] = "0px";
      containerV.style[opposite(isLeft ? 'left' : 'right')] = "auto";
      alertWindow.style.left = isLeft ? "90vw" : "79vw";
      canvasButton.style.right = isLeft ? "max(1vw, 2vh)" : "max(12vw, 10vh)";
    }
    else {
      setCanvasStyle(isLeft ? 'right' : 'left', "2vw", "auto");
      containerV.style[isLeft ? 'left' : 'right'] = "0px";
      containerV.style[opposite(isLeft ? 'left' : 'right')] = "auto";
      alertWindow.style.left = isLeft ? "90vw" : "79vw";
      canvasButton.style.right = isLeft ? "max(1vw, 2vh)" : "max(12vw, 10vh)";
    }
  }
  else {
    canvasButton.hidden = true;
    canvasButton.hidden = true;
    setCanvasStyle(isLeft ? 'left' : 'right', "2vw", "auto");
    containerV.style[isLeft ? 'right' : 'left'] = "0px";
    containerV.style[opposite(isLeft ? 'right' : 'left')] = "auto";
    alertWindow.style.left = isLeft ? "79vw" : "90vw";
  }
}

window.addEventListener('resize', function (e) {
  setButtons();
}, true);

landscape.addEventListener("change", function (e) {
  setButtons();
})

// Export the translation function
export { changeToolBarStyle, translation };