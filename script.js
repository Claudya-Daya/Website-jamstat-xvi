/* ETHEREA – Jambore Statistika XVI */

// Menu mobile
(function () {
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.getElementById("menu");
  if (!toggle || !menu) return;

  function setOpen(open) {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Tutup menu" : "Buka menu");
    menu.classList.toggle("open", open);
  }

  toggle.addEventListener("click", function () {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });
  menu.addEventListener("click", function (e) {
    if (e.target.tagName === "A") setOpen(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setOpen(false);
  });
})();

// Hutan: tiga lapis siluet pohon dibuat dengan angka acak tetap (seed),
// jadi bentuknya selalu sama setiap kali halaman dimuat.
(function () {
  var svg = document.getElementById("forest");
  if (!svg) return;

  var seed = 17;
  function rand() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  }

  var W = 1440, H = 420;
  var layers = [
    { color: "#638f5d", base: 250, minH: 70,  maxH: 150, minW: 60, maxW: 110, opacity: 0.55 },
    { color: "#346841", base: 310, minH: 100, maxH: 200, minW: 70, maxW: 130, opacity: 0.9 },
    { color: "#17482c", base: 370, minH: 130, maxH: 250, minW: 80, maxW: 150, opacity: 1 },
    { color: "#06311d", base: 420, minH: 90,  maxH: 190, minW: 90, maxW: 170, opacity: 1 }
  ];

  var ns = "http://www.w3.org/2000/svg";

  layers.forEach(function (L) {
    var d = "M-40 " + H + " L-40 " + L.base;
    var x = -40;
    while (x < W + 60) {
      var w = L.minW + rand() * (L.maxW - L.minW);
      var h = L.minH + rand() * (L.maxH - L.minH);
      var cx = x + w / 2;
      function pt(dx, fy) {
        return " L" + (cx + dx * w).toFixed(1) + " " + (L.base - fy * h).toFixed(1);
      }
      // Cemara bertingkat: sisi kiri naik, lalu sisi kanan turun
      d += pt(-0.5, 0.15) + pt(-0.14, 0.45) + pt(-0.34, 0.45) + pt(-0.06, 0.78) +
           pt(-0.2, 0.78) + pt(0, 1) + pt(0.2, 0.78) + pt(0.06, 0.78) +
           pt(0.34, 0.45) + pt(0.14, 0.45) + pt(0.5, 0.15);
      d += " L" + (x + w).toFixed(1) + " " + L.base;
      x += w * (0.62 + rand() * 0.3);
    }
    d += " L" + (W + 60) + " " + H + " Z";

    var path = document.createElementNS(ns, "path");
    path.setAttribute("d", d);
    path.setAttribute("fill", L.color);
    path.setAttribute("opacity", L.opacity);
    svg.appendChild(path);
  });

  // Jamur kecil di depan, sebagai sentuhan hutan ajaib
  var shrooms = [[210, 404, 1], [1160, 408, 1.3], [760, 412, 0.8]];
  shrooms.forEach(function (s) {
    var g = document.createElementNS(ns, "g");
    g.setAttribute("transform", "translate(" + s[0] + " " + s[1] + ") scale(" + s[2] + ")");
    g.innerHTML =
      '<rect x="-4" y="-14" width="8" height="16" rx="3" fill="#fdedd4"/>' +
      '<path d="M-20 -12 C-20 -34 20 -34 20 -12 Z" fill="#c64f4b"/>' +
      '<circle cx="-8" cy="-21" r="3" fill="#fdedd4"/>' +
      '<circle cx="6" cy="-24" r="2.5" fill="#fdedd4"/>' +
      '<circle cx="11" cy="-17" r="2" fill="#fdedd4"/>';
    svg.appendChild(g);
  });
})();

// Tautan placeholder (guidebook, pendaftaran, media sosial) diberi tanda
// agar tidak membawa pengunjung ke "#" tanpa penjelasan.
document.querySelectorAll('a[href="#"][data-todo]').forEach(function (a) {
  a.addEventListener("click", function (e) {
    e.preventDefault();
    alert("Tautan ini belum diisi. Ganti href di index.html (atribut data-todo=\"" + a.dataset.todo + "\").");
  });
});
