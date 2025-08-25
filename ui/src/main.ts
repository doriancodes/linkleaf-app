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

type Feed = {
  title: string;
  version: number;
  links: Link[];
};

function chip(text: string): HTMLElement {
  const span = document.createElement("span");
  span.className = "tag-chip";
  span.textContent = text;
  return span;
}

function renderFeed(feed: Feed) {
  const root = document.getElementById("feed");
  if (!root) return;

  root.innerHTML = ""; // clear

  const h2 = document.createElement("h2");
  h2.textContent = `${feed.title} (v${feed.version})`;
  root.appendChild(h2);

  const list = document.createElement("div");
  list.className = "feed-list";
  root.appendChild(list);

  for (const link of feed.links) {
    const card = document.createElement("article");
    card.className = "link-card";

    // title + URL
    const h3 = document.createElement("h3");
    const a = document.createElement("a");
    a.href = link.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = link.title;
    h3.appendChild(a);
    card.appendChild(h3);

    // meta (date, via)
    const meta = document.createElement("div");
    meta.className = "meta";
    const date = document.createElement("span");
    date.textContent = link.date;
    meta.appendChild(date);

    if (link.via) {
      const sep = document.createElement("span");
      sep.textContent = " · ";
      meta.appendChild(sep);

      const via = document.createElement("a");
      via.href = link.via;
      via.target = "_blank";
      via.rel = "noopener noreferrer";
      via.textContent = "via";
      meta.appendChild(via);
    }
    card.appendChild(meta);

    // summary
    if (link.summary) {
      const p = document.createElement("p");
      p.textContent = link.summary;
      card.appendChild(p);
    }

    // tags
    if (link.tags?.length) {
      const tagRow = document.createElement("div");
      tagRow.className = "tags";
      for (const t of link.tags) tagRow.appendChild(chip(t));
      card.appendChild(tagRow);
    }

    list.appendChild(card);
  }
}

// async function greet() {
//   if (greetMsgEl && greetInputEl) {
//     // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
//     greetMsgEl.textContent = await invoke("greet", {
//       name: greetInputEl.value,
//     });
//   }
// }

async function loadFeed() {
  try {
    const feed = await invoke<Feed>("read_feed_json", { path: "mylinks.pb" });
    renderFeed(feed);
  } catch (e) {
    const root = document.getElementById("feed");
    if (root) root.textContent = `Failed to load feed: ${e}`;
  }
}

// window.addEventListener("DOMContentLoaded", () => {
//   greetInputEl = document.querySelector("#greet-input");
//   greetMsgEl = document.querySelector("#greet-msg");
//   document.querySelector("#greet-form")?.addEventListener("submit", (e) => {
//     e.preventDefault();
//     greet();
//   });
// });

window.addEventListener("DOMContentLoaded", loadFeed);
