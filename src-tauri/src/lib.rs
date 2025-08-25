use linkleaf::feed::read_feed;
use linkleaf::linkleaf_proto::{Feed, Link};
use serde::Serialize;
use std::path::PathBuf;

#[derive(Serialize)]
pub struct FeedDto {
    pub title: String,
    pub version: u32,
    pub links: Vec<LinkDto>,
}

#[derive(Serialize)]
pub struct LinkDto {
    pub id: String,
    pub title: String,
    pub url: String,
    pub date: String,
    pub summary: String,
    pub tags: Vec<String>,
    pub via: String,
}

impl From<Link> for LinkDto {
    fn from(x: Link) -> Self {
        Self {
            id: x.id,
            title: x.title,
            url: x.url,
            date: x.date,
            summary: x.summary,
            tags: x.tags,
            via: x.via,
        }
    }
}

impl From<Feed> for FeedDto {
    fn from(x: Feed) -> Self {
        Self {
            title: x.title,
            version: x.version,
            links: x.links.into_iter().map(LinkDto::from).collect(),
        }
    }
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn read_feed_json(path: String) -> Result<FeedDto, String> {
    let pb = read_feed(&PathBuf::from(path)).map_err(|e| e.to_string())?;
    Ok(FeedDto::from(pb))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .invoke_handler(tauri::generate_handler![read_feed_json])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
