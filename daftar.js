/* Formulir pendaftaran – Jambore Statistika XVI */

// ============================================================
// PENGATURAN: tempel URL Web App Google Apps Script di sini.
// Contoh: "https://script.google.com/macros/s/AKfycb.../exec"
// Langkah lengkapnya ada di PANDUAN-FORMULIR.md
// ============================================================
var SCRIPT_URL = "";

// Daftar lomba. "maxAnggota" = jumlah anggota tambahan di luar ketua.
// Sesuaikan dengan ketentuan di guidebook masing-masing lomba.
var COMPETITIONS = {
  "olimpiade":      { nama: "Olimpiade Statistika (siswa)",              jenjang: "Siswa",     maxAnggota: 2, tim: true },
  "esai":           { nama: "Kompetisi Esai Siswa (siswa)",              jenjang: "Siswa",     maxAnggota: 2, tim: true },
  "infografis":     { nama: "Kompetisi Infografis Mahasiswa",            jenjang: "Mahasiswa", maxAnggota: 2, tim: true },
  "pekan-analisis": { nama: "Pekan Analisis Statistika (mahasiswa)",     jenjang: "Mahasiswa", maxAnggota: 2, tim: true },
  "lkti":           { nama: "Lomba Karya Tulis Ilmiah (mahasiswa)",      jenjang: "Mahasiswa", maxAnggota: 2, tim: true },
  "seminar":        { nama: "Seminar Nasional",                          jenjang: "Umum",      maxAnggota: 0, tim: false }
};

var MAX_BYTES = 2 * 1024 * 1024;
var ALLOWED = ["image/jpeg", "image/png", "application/pdf"];

var form = document.getElementById("reg-form");
var selectEl = document.getElementById("lomba");
var membersEl = document.getElementById("members");
var addBtn = document.getElementById("add-member");
var errorEl = document.getElementById("form-error");
var noticeEl = document.getElementById("reg-notice");
var submitBtn = document.getElementById("submit");

// ---------- Isi pilihan lomba ----------
Object.keys(COMPETITIONS).forEach(function (key) {
  var opt = document.createElement("option");
  opt.value = key;
  opt.textContent = COMPETITIONS[key].nama;
  selectEl.appendChild(opt);
});
var placeholder = document.createElement("option");
placeholder.value = "";
placeholder.textContent = "Pilih salah satu";
placeholder.disabled = true;
selectEl.insertBefore(placeholder, selectEl.firstChild);

var preset = new URLSearchParams(location.search).get("lomba");
selectEl.value = preset && COMPETITIONS[preset] ? preset : "";

if (!SCRIPT_URL) {
  noticeEl.hidden = false;
  noticeEl.textContent = "Mode uji: formulir belum tersambung ke penyimpanan data. Isi SCRIPT_URL di daftar.js (lihat PANDUAN-FORMULIR.md).";
}

// ---------- Anggota dinamis ----------
function memberCount() { return membersEl.querySelectorAll(".member").length; }

function renumber() {
  membersEl.querySelectorAll(".member").forEach(function (m, i) {
    m.querySelector("h3").textContent = "Anggota " + (i + 2);
  });
}

function addMember() {
  var cfg = COMPETITIONS[selectEl.value];
  if (!cfg || memberCount() >= cfg.maxAnggota) return;
  var n = memberCount();
  var div = document.createElement("div");
  div.className = "member";
  div.innerHTML =
    "<h3></h3>" +
    '<div class="field"><label>Nama lengkap</label><input type="text" maxlength="100" data-member="nama" required></div>' +
    '<div class="field"><label>Email (boleh dikosongkan)</label><input type="email" maxlength="120" data-member="email"></div>' +
    '<button type="button" class="remove">Hapus anggota ini</button>';
  div.querySelector(".remove").addEventListener("click", function () {
    div.remove();
    renumber();
    refreshMembersUI();
  });
  membersEl.appendChild(div);
  renumber();
  refreshMembersUI();
  div.querySelector("input").focus();
}

function refreshMembersUI() {
  var cfg = COMPETITIONS[selectEl.value];
  var max = cfg ? cfg.maxAnggota : 0;
  addBtn.hidden = !cfg || memberCount() >= max;
  document.getElementById("members-hint").textContent =
    max ? "Boleh menambah sampai " + max + " anggota. Cek batas anggota di guidebook." : "";
}

addBtn.addEventListener("click", addMember);

// ---------- Ubah tampilan sesuai lomba ----------
function applyCompetition() {
  var cfg = COMPETITIONS[selectEl.value];
  var isTeam = cfg ? cfg.tim : true;
  var seminar = selectEl.value === "seminar";

  document.getElementById("members-set").hidden = !cfg || cfg.maxAnggota === 0;
  document.getElementById("legend-tim").textContent = isTeam ? "Tim" : "Peserta";
  document.getElementById("label-tim").textContent = isTeam ? "Nama tim" : "Nama panggilan atau nama di sertifikat";
  document.getElementById("legend-ketua").textContent = isTeam ? "Ketua tim" : "Data peserta";
  document.getElementById("label-kartu").textContent = seminar
    ? "Kartu identitas (kartu pelajar, KTM, atau KTP)"
    : "Kartu pelajar atau KTM ketua";
  document.getElementById("lomba-hint").textContent = cfg ? "Jenjang: " + cfg.jenjang : "";

  // Hapus anggota yang melebihi batas lomba terpilih
  var max = cfg ? cfg.maxAnggota : 0;
  while (memberCount() > max) membersEl.lastElementChild.remove();
  renumber();
  refreshMembersUI();
}
selectEl.addEventListener("change", applyCompetition);
applyCompetition();

// ---------- Utilitas ----------
function showError(msg, field) {
  errorEl.textContent = msg;
  errorEl.hidden = false;
  if (field) { field.setAttribute("aria-invalid", "true"); field.focus(); }
}
function clearErrors() {
  errorEl.hidden = true;
  form.querySelectorAll("[aria-invalid]").forEach(function (el) { el.removeAttribute("aria-invalid"); });
}

function readFile(input) {
  return new Promise(function (resolve, reject) {
    var f = input.files && input.files[0];
    if (!f) return reject(new Error("Berkas belum dipilih."));
    if (ALLOWED.indexOf(f.type) === -1) return reject(new Error("Format berkas harus JPG, PNG, atau PDF."));
    if (f.size > MAX_BYTES) return reject(new Error("Ukuran berkas \"" + f.name + "\" melebihi 2 MB."));
    var r = new FileReader();
    r.onload = function () {
      var result = String(r.result);
      resolve({ name: f.name, type: f.type, base64: result.slice(result.indexOf(",") + 1) });
    };
    r.onerror = function () { reject(new Error("Gagal membaca berkas.")); };
    r.readAsDataURL(f);
  });
}

// ---------- Kirim ----------
form.addEventListener("submit", function (e) {
  e.preventDefault();
  clearErrors();

  if (form.elements.website.value) return; // bot

  var cfg = COMPETITIONS[selectEl.value];
  if (!cfg) return showError("Pilih lomba terlebih dahulu.", selectEl);

  var required = form.querySelectorAll("[required]");
  for (var i = 0; i < required.length; i++) {
    var el = required[i];
    if (el.closest("[hidden]")) continue;
    if (el.type === "checkbox" ? !el.checked : !el.value.trim()) {
      var label = el.type === "checkbox" ? "Centang pernyataan persetujuan." : "Lengkapi kolom yang bertanda merah.";
      return showError(label, el);
    }
  }

  var email = form.elements.ketua_email;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) return showError("Format email belum benar.", email);

  var wa = form.elements.ketua_wa;
  var waClean = wa.value.replace(/[\s\-().]/g, "");
  if (!/^(\+62|62|0)8\d{7,12}$/.test(waClean)) return showError("Nomor WhatsApp belum benar. Contoh: 081234567890.", wa);

  if (!SCRIPT_URL) return showError("Formulir belum tersambung ke penyimpanan data. Hubungi panitia web.");

  var members = [];
  membersEl.querySelectorAll(".member").forEach(function (m) {
    members.push({
      nama: m.querySelector('[data-member="nama"]').value.trim(),
      email: m.querySelector('[data-member="email"]').value.trim()
    });
  });

  submitBtn.disabled = true;
  submitBtn.textContent = "Mengirim...";

  Promise.all([readFile(form.elements.kartu), readFile(form.elements.bukti)])
    .then(function (files) {
      var payload = {
        lomba: selectEl.value,
        namaTim: form.elements.nama_tim.value.trim(),
        institusi: form.elements.institusi.value.trim(),
        ketuaNama: form.elements.ketua_nama.value.trim(),
        ketuaEmail: email.value.trim(),
        ketuaWa: waClean,
        anggota: members,
        kartu: files[0],
        bukti: files[1]
      };
      // text/plain menghindari preflight CORS pada Apps Script
      return fetch(SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (!data || !data.ok) throw new Error((data && data.error) || "Pendaftaran gagal disimpan.");
      form.hidden = true;
      noticeEl.hidden = true;
      document.getElementById("reg-id").textContent = data.id;
      var s = document.getElementById("success");
      s.hidden = false;
      s.scrollIntoView({ behavior: "smooth", block: "start" });
    })
    .catch(function (err) {
      showError(err.message || "Terjadi kesalahan. Coba lagi beberapa saat.");
    })
    .then(function () {
      submitBtn.disabled = false;
      submitBtn.textContent = "Kirim pendaftaran";
    });
});
