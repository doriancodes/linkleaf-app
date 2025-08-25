<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="logo-monochrome.svg">
    <img alt="Linkleaf" src="logo.svg" width="420">
  </picture>
</p>

<h1 align="center">Linkleaf-rs</h1>

<p align="center">
  Manage <strong>protobuf-only</strong> Linkleaf feeds (<code>linkleaf.v1</code>).
</p>

A tiny desktop and mobile link-aggregator built with Tauri (Rust backend) and a vanilla TypeScript frontend.
It reads a protobuf file (e.g. mylinks.pb), converts it to JSON in Rust, and renders a clean, Hacker News/Lobsters-style list in the UI using a Tokyo Night dark theme.
