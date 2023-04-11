const infoTitle = document.getElementById("infoModal_title");
const infoText = document.getElementById("infoModal_text");
const settingsText = document.getElementById("settingsModal_text");

//if it's mobile device
if ("ontouchstart" in document.documentElement) { 
  infoTitle.innerHTML = "Uso & Gestos Rápidos";
  infoText.innerHTML = "- Toca y arrastra para crear líneas<br> - Usa dos dedos para hacer zoom y mover el canvas<br> - Toque con 2 dedos para deshacer<br> - Toque con 3 dedos para rehacer<br> - Toque con 4 dedos para borrar todo <hr><center><i>Iconos de botones creados por Uniconlabs y Freepik en flaticon.es</i></center>";
}
else
{
  infoTitle.innerHTML = "Uso & Teclas Rápidas:";
  infoText.innerHTML = "<p>- Click izquierdo para crear líneas</p><p>- Rueda del ratón para hacer zoom</p><p>- Click derecho o click en la rueda para mover el canvas</p><p>- <i>Teclas</i>:<br>&emsp;-- <b>'Enter'</b> para crear PF (punto de fuga)<br>&emsp;-- <b>'1'</b>, <b>'2'</b> y <b>'3'</b> para seleccionar los puntos de fuga<br>&emsp;-- <b>'H'</b> para alinear horizonte (y seleccionarlo)<br>&emsp;-- <b>'+'</b> y <b>'-'</b> para añadir líneas al PF seleccionado<br>&emsp;-- <b>'Supr'</b> para borrar todo<br>&emsp;-- <b>'Esc'</b> para abortar crear una línea<br>&emsp;-- <b>'Ctrl+z'</b> y <b>'Ctrl+y'</b> para deshacer y rehacer acciones</p> <hr><center><i>Iconos de botones creados por Uniconlabs y Freepik en flaticon.es</i></center>";
}
