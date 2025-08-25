import { invoke } from "@tauri-apps/api/core";

type Link = {
  id: string;
  title: string;
  url: string;
  date: string;
  summary: string;
  tags: string[];
  via: string;
};
type PageDto = { total: number; items: Link[] };

const FEED_PATH = "mylinks.pb";

function parseTags(input: string): string[] {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
function tagsToString(tags?: string[]): string {
  return (tags ?? []).join(", ");
}
function getIdFromQuery(): string | null {
  const id = new URL(window.location.href).searchParams.get("id");
  return id && id.trim() ? id.trim() : null;
}
function isTauri(): boolean {
  return (
    typeof window !== "undefined" &&
    ("__TAURI_INTERNALS__" in window || "__TAURI__" in window)
  );
}

async function findLinkById(id: string): Promise<Link | null> {
  const first = await invoke<PageDto>("read_feed_page", {
    path: FEED_PATH,
    offset: 0,
    limit: 1,
  });
  if (first.total === 0) return null;
  const pageSize = 100;
  for (let offset = 0; offset < first.total; offset += pageSize) {
    const page = await invoke<PageDto>("read_feed_page", {
      path: FEED_PATH,
      offset,
      limit: pageSize,
    });
    const hit = page.items.find((x) => x.id === id);
    if (hit) return hit;
    if (page.items.length === 0) break;
  }
  return null;
}

function setStatus(text: string, ok = true) {
  const el = document.getElementById("form-status")!;
  el.textContent = text;
  el.style.color = ok ? "var(--muted)" : "#ef4444";
}

function fillView(link: Link) {
  (
    document.getElementById("detail-title-link") as HTMLAnchorElement
  ).textContent = link.title;
  (document.getElementById("detail-title-link") as HTMLAnchorElement).href =
    link.url;
  (document.getElementById("detail-url") as HTMLAnchorElement).textContent =
    link.url;
  (document.getElementById("detail-url") as HTMLAnchorElement).href = link.url;
  (document.getElementById("detail-open") as HTMLAnchorElement).href = link.url;

  (document.getElementById("detail-date") as HTMLElement).textContent =
    link.date;
  const viaA = document.getElementById("detail-via") as HTMLAnchorElement;
  const sep = viaA?.previousElementSibling as HTMLElement | null; // the " · "
  if (link.via) {
    viaA.href = link.via;
    viaA.style.display = "";
    if (sep) sep.style.display = "";
  } else {
    viaA.style.display = "none";
    if (sep) sep.style.display = "none";
  }

  const sum = document.getElementById("detail-summary") as HTMLElement;
  sum.textContent = link.summary || "—";

  const tagsWrap = document.getElementById("detail-tags") as HTMLElement;
  tagsWrap.innerHTML = "";
  if (link.tags?.length) {
    for (const t of link.tags) {
      const span = document.createElement("span");
      span.className = "tag-chip";
      span.textContent = t;
      tagsWrap.appendChild(span);
    }
  } else {
    const none = document.createElement("span");
    none.className = "hint";
    none.textContent = "No tags";
    tagsWrap.appendChild(none);
  }
}

function fillEdit(link: Link) {
  (document.getElementById("id") as HTMLInputElement).value = link.id;
  (document.getElementById("title") as HTMLInputElement).value = link.title;
  (document.getElementById("url") as HTMLInputElement).value = link.url;
  (document.getElementById("open-url") as HTMLAnchorElement).href = link.url;
  (document.getElementById("via") as HTMLInputElement).value = link.via ?? "";
  (document.getElementById("summary") as HTMLTextAreaElement).value =
    link.summary ?? "";
  (document.getElementById("tags") as HTMLInputElement).value = tagsToString(
    link.tags,
  );
}

function setMode(mode: "view" | "edit") {
  const root = document.querySelector(".link-detail") as HTMLElement;
  root.dataset.mode = mode;
}

window.addEventListener("DOMContentLoaded", async () => {
  if (!isTauri()) {
    setStatus("Open this page inside the Tauri app.", false);
    return;
  }

  const id = getIdFromQuery();
  if (!id) {
    setStatus("No id provided in the URL.", false);
    return;
  }

  setStatus("Loading…");
  const editBtn = document.getElementById("edit-toggle") as HTMLButtonElement;
  const saveBtn = document.getElementById("edit-save") as HTMLButtonElement;
  const cancelBtn = document.getElementById("edit-cancel") as HTMLButtonElement;
  const form = document.getElementById("edit-form") as HTMLFormElement;

  let current: Link | null = null;

  try {
    const link = await findLinkById(id);
    if (!link) {
      setStatus("Link not found.", false);
      return;
    }
    current = link;
    fillView(link);
    fillEdit(link);
    setStatus("");
  } catch (e) {
    setStatus(`Failed to load: ${e}`, false);
    return;
  }

  // Enable/disable Save based on validity
  const updateEnabled = () => {
    saveBtn.disabled = !form.checkValidity();
  };
  form.addEventListener("input", updateEnabled);
  updateEnabled();

  editBtn.addEventListener("click", () => {
    if (!current) return;
    fillEdit(current);
    setMode("edit");
    updateEnabled();
    setStatus("");
  });

  cancelBtn.addEventListener("click", () => {
    if (!current) return;
    fillEdit(current);
    setMode("view");
    setStatus("Edit canceled.");
  });

  saveBtn.addEventListener("click", async () => {
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    // Build payload for upsert
    const payload = {
      id: (document.getElementById("id") as HTMLInputElement).value.trim(),
      title: (
        document.getElementById("title") as HTMLInputElement
      ).value.trim(),
      url: (document.getElementById("url") as HTMLInputElement).value.trim(),
      summary: (
        document.getElementById("summary") as HTMLTextAreaElement
      ).value.trim(),
      tags: parseTags(
        (document.getElementById("tags") as HTMLInputElement).value,
      ),
      via: (document.getElementById("via") as HTMLInputElement).value.trim(),
    };

    // remove empties
    if (!payload.summary) delete (payload as any).summary;
    if (!payload.via) delete (payload as any).via;
    if (!payload.tags?.length) delete (payload as any).tags;

    saveBtn.disabled = true;
    setStatus("Saving…");

    try {
      await invoke("add_link", { path: FEED_PATH, link: payload });
      // Update in-memory current, refresh view, switch back to view
      current = {
        ...(current as Link),
        title: payload.title,
        url: payload.url,
        summary: (payload as any).summary ?? "",
        tags: (payload as any).tags ?? [],
        via: (payload as any).via ?? "",
      };
      fillView(current);
      setMode("view");
      setStatus("Saved ✓");
    } catch (e) {
      setStatus(`Failed to save: ${e}`, false);
    } finally {
      saveBtn.disabled = false;
    }
  });
});
