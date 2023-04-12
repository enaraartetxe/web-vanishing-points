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
const english = /^en\b/.test(navigator.language);
let landscape = window.matchMedia("(orientation: landscape)");


function init() {
  if (english) //English
    setEnglishInfoSettings();

  else //Spanish
    setSpanishInfoSettings();

  if (isPhone) //make screen smaller
  {
    canvas.style.bottom = "2vh";
    bg_canvas.style.bottom = "2vh";
    canvas.style.top = "auto";
    bg_canvas.style.top = "auto";
  }
  setButtons();
}

function setEnglishInfoSettings() {
  document.getElementById("settingsModal_title").innerHTML = "Settings";
  document.getElementById("check1").innerHTML = "<b>- Toolbar for:&emsp;</b>" + document.getElementById("check1").innerHTML;
  document.getElementById("leftLabel").innerHTML = "Right Handed";
  document.getElementById("rightLabel").innerHTML = "Left Handed";
  document.getElementById("check2").innerHTML = "<b>- Interface:&emsp;</b>" + document.getElementById("check2").innerHTML;
  document.getElementById("ifaceColorLabel").innerHTML = "Colorful";
  document.getElementById("ifaceNeutralLabel").innerHTML = "Boring :)";
  document.getElementById("check3").innerHTML = "<b>- Lines:&emsp;</b>" + document.getElementById("check3").innerHTML;
  document.getElementById("colors1Label").innerHTML = "Pink/Yellow/Blue";
  document.getElementById("colors2Label").innerHTML = "Red/Green/Blue";
  document.getElementById("settingsOkButton").innerHTML = "Done";

  //Info text changes on iPad/Computer
  if ("ontouchstart" in document.documentElement) {
    document.getElementById("infoModal_title").innerHTML = "Use and Quick Gestures";
    document.getElementById("infoModal_text").innerHTML = "- Touch and drag to create lines<br> - Use two fingers to zoom and move the canvas (switch between both modes with the bottom right selection button)<br> - 2-finger tap to undo<br> - 3-finger tap to redo<br> - 4-finger tap to clear all <hr><center><i>Button icons created by Uniconlabs and Freepik at flaticon.es</i></center>";
  }
  else {
    document.getElementById("infoModal_title").innerHTML = "Use and Keyboard Shortcuts";
    document.getElementById("infoModal_text").innerHTML = "<p>- Left click to create lines</p><p>- Mouse wheel to zoom</p><p>- Right click or click on the wheel to move the canvas</p><p>- <i> Keys</i>:<br>&emsp;-- <b>'Enter'</b> to create VP (vanishing point)<br>&emsp;-- <b>'1'</b>, < b>'2'</b> and <b>'3'</b> to select vanishing points<br>&emsp;-- <b>'H'</b> to align horizon (and select it) <br>&emsp;-- <b>'+'</b> and <b>'-'</b> to add lines to the selected VP<br>&emsp;-- <b>'Delete'</b > to delete all<br>&emsp;-- <b>'Esc'</b> to abort creating a line<br>&emsp;-- <b>'Ctrl+z'</b> and <b>' Ctrl+y'</b> to undo and redo actions</p> <hr><center><i>Button icons created by Uniconlabs and Freepik at flaticon.es</i></center>";
  }
  document.getElementById("infoOkButton").innerHTML = "Understood";
}

function setSpanishInfoSettings() {
  //Info text changes on iPad/Computer
  if ("ontouchstart" in document.documentElement) {
    document.getElementById("infoModal_title").innerHTML = "Uso y Gestos Rápidos";
    document.getElementById("infoModal_text").innerHTML = "- Toca y arrastra para crear líneas<br> - Usa dos dedos para hacer zoom y mover el canvas (cambia entre ambos modos con el botón de selección abajo a la dcha)<br> - Toque con 2 dedos para deshacer<br> - Toque con 3 dedos para rehacer<br> - Toque con 4 dedos para borrar todo <hr><center><i>Iconos de botones creados por Uniconlabs y Freepik en flaticon.es</i></center>";
  }
  else {
    document.getElementById("infoModal_title").innerHTML = "Uso y Teclas Rápidas";
    document.getElementById("infoModal_text").innerHTML = "<p>- Click izquierdo para crear líneas</p><p>- Rueda del ratón para hacer zoom</p><p>- Click derecho o click en la rueda para mover el canvas</p><p>- <i>Teclas</i>:<br>&emsp;-- <b>'Enter'</b> para crear PF (punto de fuga)<br>&emsp;-- <b>'1'</b>, <b>'2'</b> y <b>'3'</b> para seleccionar los puntos de fuga<br>&emsp;-- <b>'H'</b> para alinear horizonte (y seleccionarlo)<br>&emsp;-- <b>'+'</b> y <b>'-'</b> para añadir líneas al PF seleccionado<br>&emsp;-- <b>'Supr'</b> para borrar todo<br>&emsp;-- <b>'Esc'</b> para abortar crear una línea<br>&emsp;-- <b>'Ctrl+z'</b> y <b>'Ctrl+y'</b> para deshacer y rehacer acciones</p> <hr><center><i>Iconos de botones creados por Uniconlabs y Freepik en flaticon.es</i></center>";
  }
  document.getElementById("infoOkButton").innerHTML = "Entendido";

  document.getElementById("settingsModal_title").innerHTML += "Ajustes";
  document.getElementById("check1").innerHTML = "<b>- Barra de Herramientas para:&emsp;</b>" + document.getElementById("check1").innerHTML;
  document.getElementById("leftLabel").innerHTML = "Diestros";
  document.getElementById("rightLabel").innerHTML = "Zurdos";
  document.getElementById("check2").innerHTML = "<b>- Interfaz:&emsp;</b>" + document.getElementById("check2").innerHTML;
  document.getElementById("ifaceColorLabel").innerHTML = "Colorida";
  document.getElementById("ifaceNeutralLabel").innerHTML = "Aburrida :)";
  document.getElementById("check3").innerHTML = "<b>- Líneas:&emsp;</b>" + document.getElementById("check3").innerHTML;
  document.getElementById("colors1Label").innerHTML = "Rosa/Amarillo/Azul";
  document.getElementById("colors2Label").innerHTML = "Rojo/Verde/Azul";
  document.getElementById("settingsOkButton").innerHTML = "Hecho";
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
    if (english)
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

window.changeToolBarStyle = function (isMobile, isLeft) {
  if (isMobile) { //check if tablet or phone
    if (isPhone) {
      if (isLeft) {
        canvas.style.right = "2vw";
        bg_canvas.style.right = "2vw";
        canvas.style.left = "auto";
        bg_canvas.style.left = "auto";
        containerV.style.left = "0px";
        containerV.style.right = "auto";
        alertWindow.style.left = "90vw";
        canvasButton.style.right = "max(1vw, 2vh)";
      }
      else {
        canvas.style.left = "2vw";
        bg_canvas.style.left = "2vw";
        canvas.style.right = "auto";
        bg_canvas.style.right = "auto";
        containerV.style.right = "0px";
        containerV.style.left = "auto";
        alertWindow.style.left = "79vw";
        canvasButton.style.right = "max(12vw, 10vh)";
      }
    }
    else {
      if (isLeft) {
        canvas.style.right = "2vw";
        bg_canvas.style.right = "2vw";
        canvas.style.left = "auto";
        bg_canvas.style.left = "auto";
        containerV.style.left = "0px";
        containerV.style.right = "auto";
        alertWindow.style.left = "90vw";
        canvasButton.style.right = "max(1vw, 2vh)";
      }
      else {
        canvas.style.left = "2vw";
        bg_canvas.style.left = "2vw";
        canvas.style.right = "auto";
        bg_canvas.style.right = "auto";
        containerV.style.right = "0px";
        containerV.style.left = "auto";
        alertWindow.style.left = "79vw";
        canvasButton.style.right = "max(12vw, 10vh)";
      }
    }
  }
  else {
    canvasButton.hidden = true;
    if (isLeft) {
      canvas.style.left = "2vw";
      bg_canvas.style.left = "2vw";
      canvas.style.right = "auto";
      bg_canvas.style.right = "auto";
      containerV.style.right = "0px";
      containerV.style.left = "auto";
      alertWindow.style.left = "79vw";
    }
    else {
      canvas.style.right = "2vw";
      bg_canvas.style.right = "2vw";
      canvas.style.left = "auto";
      bg_canvas.style.left = "auto";
      containerV.style.left = "0px";
      containerV.style.right = "auto";
      alertWindow.style.left = "90vw";
    }
  }
}

window.addEventListener('resize', function (e) {
  setButtons();
}, true);

landscape.addEventListener("change", function (e) {
  setButtons();
})

init();