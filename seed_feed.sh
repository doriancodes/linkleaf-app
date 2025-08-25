#!/usr/bin/env bash
set -euo pipefail

# Ensure the CLI exists
command -v linkleaf >/dev/null 2>&1 || {
  echo "Error: 'linkleaf' command not found in PATH." >&2
  exit 1
}

# Title|URL pairs
entries=(
"Tokio - Asynchronous Rust|https://tokio.rs/"
"The Rust Book|https://doc.rust-lang.org/book/"
"Rustlings|https://github.com/rust-lang/rustlings"
"Rust by Example|https://doc.rust-lang.org/rust-by-example/"
"Crates.io|https://crates.io/"
"docs.rs|https://docs.rs/"
"Serde|https://serde.rs/"
"Actix Web|https://actix.rs/"
"Axum|https://docs.rs/axum/latest/axum/"
"Warp|https://docs.rs/warp/latest/warp/"
"Hyper|https://hyper.rs/"
"Tonic gRPC|https://docs.rs/tonic/latest/tonic/"
"SeaORM|https://www.sea-ql.org/SeaORM/"
"Diesel ORM|https://diesel.rs/"
"SQLx|https://github.com/launchbadge/sqlx"
"Bevy Engine|https://bevyengine.org/"
"wgpu|https://wgpu.rs/"
"wasm-bindgen|https://rustwasm.github.io/wasm-bindgen/"
"Yew|https://yew.rs/"
"Leptos|https://leptos.dev/"
"Trunk|https://trunkrs.dev/"
"Cargo Book|https://doc.rust-lang.org/cargo/"
"Rust RFCs|https://github.com/rust-lang/rfcs"
"Clippy|https://github.com/rust-lang/rust-clippy"
"Rust Analyzer|https://rust-analyzer.github.io/"
"Rust Std Library|https://doc.rust-lang.org/std/"
"Rustup|https://rustup.rs/"
"tracing (Tokio)|https://tracing.rs/"
"anyhow|https://github.com/dtolnay/anyhow"
"thiserror|https://docs.rs/thiserror/latest/thiserror/"
)

for e in "${entries[@]}"; do
  title="${e%%|*}"
  url="${e#*|}"
  echo "→ Adding: $title"
  linkleaf add --title "$title" --url "$url"
done

echo "Done. Added ${#entries[@]} links."
