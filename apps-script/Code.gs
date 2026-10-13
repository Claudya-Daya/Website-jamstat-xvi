/**
 * Penerima pendaftaran Jambore Statistika XVI.
 * Dipasang di Google Apps Script yang terhubung ke Google Sheets panitia.
 * Panduan pemasangan: PANDUAN-FORMULIR.md
 */

var CONFIG = {
  SHEET_NAME: "Pendaftaran",
  FOLDER_NAME: "Berkas Pendaftaran Jambore Statistika XVI",
  NOTIFY_EMAIL: "",            // opsional: email panitia yang diberi tahu tiap ada pendaftar baru
  EVENT_NAME: "Jambore Statistika XVI – ETHEREA",
  MAX_BYTES: 2 * 1024 * 1024,  // 2 MB per berkas
  ALLOWED_TYPES: ["image/jpeg", "image/png", "application/pdf"],
  CODES: {
    "olimpiade": "OLM",
    "esai": "ESA",
    "infografis": "INF",
    "pekan-analisis": "PAS",
    "lkti": "KTI",
    "seminar": "SEM"
  },
  NAMES: {
    "olimpiade": "Olimpiade Statistika",
    "esai": "Kompetisi Esai Siswa",
    "infografis": "Kompetisi Infografis Mahasiswa",
    "pekan-analisis": "Pekan Analisis Statistika",
    "lkti": "Lomba Karya Tulis Ilmiah",
    "seminar": "Seminar Nasional"
  }
};

var HEADERS = [
  "ID", "Waktu", "Lomba", "Nama tim / peserta", "Asal sekolah / kampus",
  "Ketua - nama", "Ketua - email", "Ketua - WhatsApp",
  "Anggota 2", "Anggota 3", "Kartu pelajar / KTM", "Bukti pembayaran", "Status"
];

function doGet() {
  return json_({ ok: true, message: "Endpoint pendaftaran aktif." });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  } catch (err) {
    return json_({ ok: false, error: "Server sedang sibuk. Coba lagi sebentar lagi." });
  }

  try {
    var d = JSON.parse(e.postData.contents);
    var problem = validate_(d);
    if (problem) return json_({ ok: false, error: problem });

    var sheet = getSheet_();
    var id = nextId_(d.lomba);

    // Simpan berkas ke Drive, satu subfolder per pendaftar
    var folder = DriveApp.getFolderById(getFolderId_()).createFolder(id + " - " + clean_(d.namaTim));
    var kartuUrl = saveFile_(folder, id + "-kartu", d.kartu);
    var buktiUrl = saveFile_(folder, id + "-bukti", d.bukti);

    var a2 = d.anggota && d.anggota[0] ? memberText_(d.anggota[0]) : "";
    var a3 = d.anggota && d.anggota[1] ? memberText_(d.anggota[1]) : "";

    sheet.appendRow([
      id, new Date(), CONFIG.NAMES[d.lomba], clean_(d.namaTim), clean_(d.institusi),
      clean_(d.ketuaNama), clean_(d.ketuaEmail), "'" + clean_(d.ketuaWa),
      a2, a3, kartuUrl, buktiUrl, "Menunggu verifikasi"
    ]);

    sendEmails_(id, d);
    return json_({ ok: true, id: id });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: "Pendaftaran gagal diproses. Coba lagi atau hubungi panitia." });
  } finally {
    lock.releaseLock();
  }
}

// ---------- Validasi ----------
function validate_(d) {
  if (!d || typeof d !== "object") return "Data tidak valid.";
  if (!CONFIG.CODES[d.lomba]) return "Lomba tidak dikenali.";
  var req = ["namaTim", "institusi", "ketuaNama", "ketuaEmail", "ketuaWa"];
  for (var i = 0; i < req.length; i++) {
    if (!d[req[i]] || !String(d[req[i]]).trim()) return "Data belum lengkap.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(d.ketuaEmail).trim())) return "Format email tidak valid.";
  if (!/^(\+62|62|0)8\d{7,12}$/.test(String(d.ketuaWa))) return "Format nomor WhatsApp tidak valid.";
  if (d.anggota && d.anggota.length > 2) return "Jumlah anggota melebihi batas.";
  var f = [d.kartu, d.bukti];
  for (var j = 0; j < f.length; j++) {
    if (!f[j] || !f[j].base64) return "Berkas belum lengkap.";
    if (CONFIG.ALLOWED_TYPES.indexOf(f[j].type) === -1) return "Format berkas harus JPG, PNG, atau PDF.";
    if (f[j].base64.length * 0.75 > CONFIG.MAX_BYTES * 1.05) return "Ukuran berkas melebihi 2 MB.";
  }
  return null;
}

// ---------- Penyimpanan ----------
function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(CONFIG.SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getFolderId_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty("FOLDER_ID");
  if (id) {
    try { DriveApp.getFolderById(id); return id; } catch (e) { /* folder dihapus, buat baru */ }
  }
  var folder = DriveApp.createFolder(CONFIG.FOLDER_NAME);
  props.setProperty("FOLDER_ID", folder.getId());
  return folder.getId();
}

function nextId_(lomba) {
  var props = PropertiesService.getScriptProperties();
  var key = "COUNTER_" + lomba;
  var n = Number(props.getProperty(key) || 0) + 1;
  props.setProperty(key, String(n));
  return "JS16-" + CONFIG.CODES[lomba] + "-" + ("000" + n).slice(-4);
}

function saveFile_(folder, baseName, f) {
  var ext = f.type === "application/pdf" ? ".pdf" : (f.type === "image/png" ? ".png" : ".jpg");
  var blob = Utilities.newBlob(Utilities.base64Decode(f.base64), f.type, baseName + ext);
  return folder.createFile(blob).getUrl();
}

// ---------- Email ----------
function sendEmails_(id, d) {
  try {
    var lomba = CONFIG.NAMES[d.lomba];
    MailApp.sendEmail({
      to: String(d.ketuaEmail).trim(),
      subject: "Pendaftaran diterima: " + id,
      body:
        "Halo " + clean_(d.ketuaNama) + ",\n\n" +
        "Pendaftaran " + lomba + " (" + CONFIG.EVENT_NAME + ") sudah kami terima.\n\n" +
        "Nomor pendaftaran: " + id + "\n" +
        "Nama tim / peserta: " + clean_(d.namaTim) + "\n\n" +
        "Panitia akan memverifikasi bukti pembayaran, lalu menghubungi kamu lewat email atau WhatsApp.\n\n" +
        "Salam,\nPanitia " + CONFIG.EVENT_NAME
    });
    if (CONFIG.NOTIFY_EMAIL) {
      MailApp.sendEmail(CONFIG.NOTIFY_EMAIL, "Pendaftar baru: " + id,
        lomba + " – " + clean_(d.namaTim) + " (" + clean_(d.institusi) + ")");
    }
  } catch (err) {
    console.error("Email gagal terkirim: " + err);  // pendaftaran tetap tersimpan
  }
}

// ---------- Pembantu ----------
function memberText_(m) {
  var t = clean_(m.nama);
  if (m.email) t += " (" + clean_(m.email) + ")";
  return t;
}

// Bersihkan teks dan cegah rumus spreadsheet (=, +, -, @ di awal sel)
function clean_(s) {
  s = String(s == null ? "" : s).replace(/[\r\n\t]+/g, " ").trim().slice(0, 200);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
