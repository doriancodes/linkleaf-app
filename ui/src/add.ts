import { invoke } from "@tauri-apps/api/core";

type AddLinkDto = {
  title: string;
  url: string;
  summary?: string;
  tags?: string[];
  via?: string;
};

const FEED_PATH = "mylinks.pb"; // keep in sync with your app

function parseTags(input: string): string[] {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function isTauri(): boolean {
  return (
    typeof window !== "undefined" &&
    ("__TAURI_INTERNALS__" in window || "__TAURI__" in window)
  );
}

window.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("add-form") as HTMLFormElement;
  const titleEl = document.getElementById("title") as HTMLInputElement;
  const urlEl = document.getElementById("url") as HTMLInputElement;
  const summaryEl = document.getElementById("summary") as HTMLTextAreaElement;
  const tagsEl = document.getElementById("tags") as HTMLInputElement;
  const viaEl = document.getElementById("via") as HTMLInputElement;
  const saveBtn = form.querySelector(
    'button[type="submit"]',
  ) as HTMLButtonElement;

  // Inline status line (above the buttons)
  const status = document.createElement("p");
  status.id = "form-status";
  status.setAttribute("role", "status");
  status.style.marginTop = ".5rem";
  status.style.color = "var(--muted)";
  form
    .querySelector(".form-actions")
    ?.insertAdjacentElement("beforebegin", status);

  const updateSaveEnabled = () => {
    // Use built-in HTML validation for required/title/url
    saveBtn.disabled = !form.checkValidity();
  };

  // Live validation
  ["input", "change"].forEach((ev) => {
    titleEl.addEventListener(ev, updateSaveEnabled);
    urlEl.addEventListener(ev, updateSaveEnabled);
  });
  updateSaveEnabled();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (!isTauri()) {
      alert("This page must run inside the Tauri app to save.");
      return;
    }

    const payload: AddLinkDto = {
      title: titleEl.value.trim(),
      url: urlEl.value.trim(),
      summary: summaryEl.value.trim(),
      tags: parseTags(tagsEl.value),
      via: viaEl.value.trim(),
    };

    // Remove empty optional fields so the payload stays tidy
    if (!payload.summary) delete payload.summary;
    if (!payload.via) delete payload.via;
    if (!payload.tags?.length) delete payload.tags;

    saveBtn.disabled = true;
    status.textContent = "Saving…";

    try {
      await invoke("add_link", { path: FEED_PATH, link: payload });
      status.textContent = "Saved ✓";
      // Redirect back to the feed after a short pause
      setTimeout(() => {
        window.location.href = "/index.html";
      }, 300);
    } catch (err) {
      status.style.color = "#ef4444";
      status.textContent = `Failed to save: ${err}`;
      saveBtn.disabled = false;
    }
  });
});
