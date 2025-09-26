// src/lib/alerts.js
import Swal from "sweetalert2";

const STYLE_ID = "swal-sm-styles";
if (!document.getElementById(STYLE_ID)) {
  const css = `
  .swal-sm{border-radius:12px;padding:.70rem !important}
  .swal-sm-title{font-size:15px !important;margin:0 0 .25rem}
  .swal-sm-html{font-size:13px !important}
  .swal-sm-actions{gap:.4rem}
  .swal-sm-confirm,.swal-sm-cancel{
    font-size:12px;padding:.45rem .7rem;border-radius:8px;border:0;line-height:1.1
  }
  .swal-sm-confirm{background:#3B82F6;color:#fff}
  .swal-sm-cancel{background:#F3F4F6;color:#111827}
  .swal-sm-toast{padding:.5rem .65rem;border-radius:10px;font-size:13px}
  `;
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}

// ❗ Hanya sekali deklarasi & export
export const SmallSwal = Swal.mixin({
  width: 360,
  customClass: {
    popup: "swal-sm",
    title: "swal-sm-title",
    htmlContainer: "swal-sm-html",
    actions: "swal-sm-actions",
    confirmButton: "swal-sm-confirm",
    cancelButton: "swal-sm-cancel",
  },
  buttonsStyling: false,
  showClass: { popup: "swal2-show" },
  hideClass: { popup: "swal2-hide" },
});

export const SmallToast = Swal.mixin({
  toast: true,
  position: "top-end",
  timer: 1600,
  timerProgressBar: true,
  showConfirmButton: false,
  customClass: { popup: "swal-sm-toast" },
});
