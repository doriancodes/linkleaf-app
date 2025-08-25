import { invoke } from "@tauri-apps/api/core";

// let greetInputEl: HTMLInputElement | null;
// let greetMsgEl: HTMLElement | null;

type Link = {
  id: string;
  title: string;
  url: string;
  date: string; // e.g., "2025-08-23"
  summary: string;
  tags: string[];
  via: string;
};

type PageDto = {
  total: number;
  items: Link[];
};

const path = "mylinks.pb";
let offset = 0;
let limit = 10;
let total = 0;

const listEl = document.getElementById("feed-list")!;
const tpl = document.getElementById("link-template") as HTMLTemplateElement;

const btnFirst = document.getElementById("first") as HTMLButtonElement;
const btnPrev = document.getElementById("prev") as HTMLButtonElement;
const btnNext = document.getElementById("next") as HTMLButtonElement;
const btnLast = document.getElementById("last") as HTMLButtonElement;

const btnFirstB = document.getElementById("first-bottom") as HTMLButtonElement;
const btnPrevB = document.getElementById("prev-bottom") as HTMLButtonElement;
const btnNextB = document.getElementById("next-bottom") as HTMLButtonElement;
const btnLastB = document.getElementById("last-bottom") as HTMLButtonElement;

const statusTop = document.getElementById("pager-status")!;
const statusBottom = document.getElementById("pager-status-bottom")!;
const pageSizeSel = document.getElementById("page-size") as HTMLSelectElement;

// async function greet() {
//   if (greetMsgEl && greetInputEl) {
//     // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
//     greetMsgEl.textContent = await invoke("greet", {
//       name: greetInputEl.value,
//     });
//   }
// }

function chip(text: string): HTMLElement {
  const span = document.createElement("span");
  span.className = "tag-chip";
  span.textContent = text;
  return span;
}

function renderItems(items: Link[]) {
  listEl.innerHTML = "";
  if (!items.length) {
    listEl.innerHTML = `<p style="color:var(--muted)">No items on this page.</p>`;
    return;
  }

  for (const link of items) {
    const node = tpl.content.firstElementChild!.cloneNode(true) as HTMLElement;

    // title/link
    const a = node.querySelector("h3 a") as HTMLAnchorElement;
    a.href = link.url;
    a.textContent = link.title;

    // meta
    (node.querySelector(".date") as HTMLElement).textContent = link.date;
    const viaA = node.querySelector(".via") as HTMLAnchorElement;
    const sep = node.querySelector(".sep") as HTMLElement;
    if (link.via) {
      viaA.href = link.via;
      viaA.style.display = "";
      sep.style.display = "";
    } else {
      viaA.style.display = "none";
      sep.style.display = "none";
    }

    // summary
    const sum = node.querySelector(".summary") as HTMLElement;
    if (link.summary) sum.textContent = link.summary;
    else sum.style.display = "none";

    // tags
    const tags = node.querySelector(".tags") as HTMLElement;
    if (link.tags?.length) {
      for (const t of link.tags) tags.appendChild(chip(t));
    } else {
      tags.style.display = "none";
    }

    listEl.appendChild(node);
  }
}

function updatePager() {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.min(totalPages, Math.floor(offset / limit) + 1);
  const start = total === 0 ? 0 : offset + 1;
  const end = Math.min(total, offset + limit);

  const text = `Page ${currentPage} / ${totalPages} • showing ${start}–${end} of ${total}`;

  statusTop.textContent = text;
  statusBottom.textContent = text;

  const atFirst = currentPage <= 1;
  const atLast = currentPage >= totalPages;

  for (const b of [btnFirst, btnPrev, btnFirstB, btnPrevB])
    b.disabled = atFirst;
  for (const b of [btnNext, btnLast, btnNextB, btnLastB]) b.disabled = atLast;
}

async function loadPage() {
  try {
    const page = await invoke<PageDto>("read_feed_page", {
      path,
      offset,
      limit,
    });
    total = page.total;
    renderItems(page.items);
    updatePager();
  } catch (e) {
    listEl.innerHTML = `<p style="color:#ef4444">Failed to load: ${e}</p>`;
  }
}

function goFirst() {
  offset = 0;
  loadPage();
}
function goPrev() {
  offset = Math.max(0, offset - limit);
  loadPage();
}
function goNext() {
  offset = Math.min(Math.max(0, total - 1), offset + limit);
  loadPage();
}
function goLast() {
  if (total === 0) {
    offset = 0;
  } else {
    const remainder = total % limit;
    offset = remainder === 0 ? total - limit : total - remainder;
  }
  loadPage();
}

// window.addEventListener("DOMContentLoaded", () => {
//   greetInputEl = document.querySelector("#greet-input");
//   greetMsgEl = document.querySelector("#greet-msg");
//   document.querySelector("#greet-form")?.addEventListener("submit", (e) => {
//     e.preventDefault();
//     greet();
//   });
// });

window.addEventListener("DOMContentLoaded", () => {
  btnFirst.addEventListener("click", goFirst);
  btnPrev.addEventListener("click", goPrev);
  btnNext.addEventListener("click", goNext);
  btnLast.addEventListener("click", goLast);

  btnFirstB.addEventListener("click", goFirst);
  btnPrevB.addEventListener("click", goPrev);
  btnNextB.addEventListener("click", goNext);
  btnLastB.addEventListener("click", goLast);

  pageSizeSel.addEventListener("change", () => {
    limit = parseInt(pageSizeSel.value, 10);
    offset = 0; // reset to first page when page size changes
    loadPage();
  });

  loadPage();
});
