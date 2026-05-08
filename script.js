/**
 * World of Tea — interactions
 * - Mobile menu toggle
 * - Menu category filtering
 * - "Add" buttons build WhatsApp order message
 * - Reviews slider
 * - Gallery modal
 */

// TODO: Replace with your real WhatsApp number (country code + number, no + sign).
// Example: "919876543210"
const WHATSAPP_NUMBER = "";

function $(sel, root = document) {
  return root.querySelector(sel);
}
function $all(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

function setAriaSelected(activeBtn, buttons) {
  buttons.forEach((b) => {
    const isActive = b === activeBtn;
    b.classList.toggle("is-active", isActive);
    b.setAttribute("aria-selected", String(isActive));
  });
}

function buildWhatsAppUrl(message) {
  const text = encodeURIComponent(message.trim());

  // If number not set, open WhatsApp with just text (user chooses contact).
  if (!WHATSAPP_NUMBER) return `https://wa.me/?text=${text}`;

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}

function initMobileMenu() {
  const menuBtn = $("[data-menu-btn]");
  const nav = $("[data-nav]");
  if (!menuBtn || !nav) return;

  function close() {
    nav.classList.remove("is-open");
    menuBtn.setAttribute("aria-label", "Open menu");
  }

  menuBtn.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    menuBtn.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
  });

  // Close menu when clicking a nav link (mobile)
  nav.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    close();
  });

  // Close on Escape
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
}

function initMenuFilter() {
  const chipButtons = $all("[data-filter]");
  const cardsWrap = $("[data-menu-cards]");
  if (!chipButtons.length || !cardsWrap) return;

  const cards = $all(".card[data-category]", cardsWrap);

  function apply(filter) {
    cards.forEach((card) => {
      const cat = card.getAttribute("data-category");
      const show = filter === "all" || filter === cat;
      card.style.display = show ? "" : "none";
    });
  }

  chipButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.getAttribute("data-filter") || "all";
      setAriaSelected(btn, chipButtons);
      apply(filter);
    });
  });

  apply("all");
}

function initOrderBuilder() {
  const form = $("[data-order-form]");
  const waBtn = $("[data-whatsapp-btn]");
  if (!form || !waBtn) return;

  const nameEl = $("input[name='name']", form);
  const itemsEl = $("textarea[name='items']", form);
  const modeEl = $("select[name='mode']", form);

  const picked = new Map(); // item -> qty

  function syncItemsTextArea() {
    if (!itemsEl) return;
    const lines = Array.from(picked.entries()).map(([item, qty]) => `${qty} x ${item}`);
    itemsEl.value = lines.join(", ");
  }

  // "Add" buttons from menu cards
  $all("[data-order-item]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.getAttribute("data-order-item") || "Item";
      picked.set(item, (picked.get(item) || 0) + 1);
      syncItemsTextArea();

      // micro-feedback
      const prev = btn.textContent;
      btn.textContent = "Added";
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = prev || "Add";
        btn.disabled = false;
      }, 650);
    });
  });

  waBtn.addEventListener("click", (e) => {
    e.preventDefault();

    const name = (nameEl?.value || "").trim();
    const items = (itemsEl?.value || "").trim();
    const mode = (modeEl?.value || "Pickup").trim();

    const msg = [
      "Hello World of Tea!",
      "",
      `Name: ${name || "—"}`,
      `Mode: ${mode || "Pickup"}`,
      `Items: ${items || "—"}`,
      "",
      "Please confirm total & time. धन्यवाद 🙏",
    ].join("\n");

    window.open(buildWhatsAppUrl(msg), "_blank", "noopener,noreferrer");
  });
}

function initReviews() {
  const wrap = $("[data-reviews]");
  if (!wrap) return;
  const slides = $all(".review", wrap);
  if (!slides.length) return;

  const prev = $("[data-review-prev]");
  const next = $("[data-review-next]");
  let idx = slides.findIndex((s) => s.classList.contains("is-active"));
  if (idx < 0) idx = 0;

  function show(i) {
    idx = (i + slides.length) % slides.length;
    slides.forEach((s, j) => s.classList.toggle("is-active", j === idx));
  }

  prev?.addEventListener("click", () => show(idx - 1));
  next?.addEventListener("click", () => show(idx + 1));

  // Auto-rotate (pauses if user prefers reduced motion)
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (!reduce) setInterval(() => show(idx + 1), 6500);
}

function initGalleryModal() {
  const modal = $("[data-modal]");
  if (!modal || typeof modal.showModal !== "function") return;

  const title = $("[data-modal-title]", modal);
  const body = $("[data-modal-body]", modal);
  const close = $("[data-modal-close]", modal);

  const tiles = $all("[data-gallery-open]");
  if (!tiles.length) return;

  tiles.forEach((tile) => {
    tile.addEventListener("click", () => {
      const id = tile.getAttribute("data-gallery-open");
      const label = $(".gallery__label", tile)?.textContent?.trim() || "Gallery";

      if (title) title.textContent = label;
      if (body) {
        body.textContent =
          `Replace this tile with your ${label.toLowerCase()} embed or images (tile #${id}).`;
      }

      modal.showModal();
    });
  });

  close?.addEventListener("click", () => modal.close());
  modal.addEventListener("click", (e) => {
    // click backdrop closes
    const rect = modal.getBoundingClientRect();
    const inDialog =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;
    if (!inDialog) modal.close();
  });
}

function initCopyButtons() {
  $all("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const value = btn.getAttribute("data-copy") || "";
      if (!value) return;

      try {
        await navigator.clipboard.writeText(value);
        btn.classList.add("is-copied");
        const prev = btn.textContent;
        btn.textContent = "Copied";
        setTimeout(() => {
          btn.textContent = prev || "Copy";
          btn.classList.remove("is-copied");
        }, 900);
      } catch {
        // Fallback: select-copy via prompt (keeps it simple)
        window.prompt("Copy this number:", value);
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initMobileMenu();
  initMenuFilter();
  initOrderBuilder();
  initReviews();
  initGalleryModal();
  initCopyButtons();
});

