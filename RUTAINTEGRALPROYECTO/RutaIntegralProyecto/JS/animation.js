const characterEl = document.getElementById("character");

// posiciones (en % del ancho)
const lanes = ["35%", "50%", "65%"];
let laneIndex = 1; // inicia en centro

function setLane(index){
  laneIndex = Math.max(0, Math.min(2, index));
  if (characterEl) {
    characterEl.style.left = lanes[laneIndex];
  }
}

// teclado
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a"){
    setLane(laneIndex - 1);
  }
  if (e.key === "ArrowRight" || e.key.toLowerCase() === "d"){
    setLane(laneIndex + 1);
  }
});

// botones móvil
const btnLeft = document.getElementById("btnLeft");
const btnCenter = document.getElementById("btnCenter");
const btnRight = document.getElementById("btnRight");

if (btnLeft) btnLeft.addEventListener("click", () => setLane(0));
if (btnCenter) btnCenter.addEventListener("click", () => setLane(1));
if (btnRight) btnRight.addEventListener("click", () => setLane(2));

// dejarlo centrado al cargar
window.addEventListener("load", () => {
  setLane(1);
});
