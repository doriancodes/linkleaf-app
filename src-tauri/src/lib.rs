use linkleaf::feed::{read_feed, write_feed};
use linkleaf::linkleaf_proto::{Feed, Link};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::path::PathBuf;
use time::OffsetDateTime;

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

#[derive(Deserialize, Debug, Clone)]
pub struct AddLinkDto {
    pub title: String,
    pub url: String,
    #[serde(default)]
    pub summary: String,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub via: String,
    // if omitted, we’ll use today (UTC) as "YYYY-MM-DD"
    pub date: Option<String>,
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

#[derive(Serialize)]
struct PageDto {
    total: usize,
    items: Vec<LinkDto>,
}

fn derive_id(url: &str, date: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(url.as_bytes());
    hasher.update(b"|");
    hasher.update(date.as_bytes());
    let digest = hasher.finalize();
    let hexed = hex::encode(digest);
    hexed[..12].to_string()
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

#[tauri::command]
fn read_feed_page(path: String, offset: usize, limit: usize) -> Result<PageDto, String> {
    let feed = read_feed(&PathBuf::from(path)).map_err(|e| e.to_string())?;
    let total = feed.links.len();
    let end = (offset + limit).min(total);
    let items = if offset >= total {
        vec![]
    } else {
        feed.links
            .into_iter()
            .skip(offset)
            .take(limit)
            .map(LinkDto::from)
            .collect()
    };
    Ok(PageDto { total, items })
}

#[tauri::command]
fn add_link(path: String, link: AddLinkDto) -> Result<LinkDto, String> {
    // 1) read or create a new feed if missing
    let mut feed = match read_feed(&PathBuf::from(&path)) {
        Ok(f) => f,
        Err(_e) => Feed {
            title: "My Links".to_string(),
            version: 1,
            links: vec![],
        },
    };

    let date = OffsetDateTime::now_utc().date().to_string();
    // 2) build the new link
    let new_pb = Link {
        id: derive_id(&link.url, &date),
        title: link.title,
        url: link.url,
        date: date,
        summary: link.summary,
        tags: link.tags,
        via: link.via,
    };

    // 3) append and write atomically
    // put newest at the beginning
    feed.links.insert(0, new_pb.clone());
    write_feed(&PathBuf::from(path), feed).map_err(|e| e.to_string())?;

    // 4) return the added item to the UI
    Ok(LinkDto::from(new_pb))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        //.invoke_handler(tauri::generate_handler![greet])
        //.invoke_handler(tauri::generate_handler![read_feed_json])
        .invoke_handler(tauri::generate_handler![read_feed_page, add_link])
        //.invoke_handler(tauri::generate_handler![add_link])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
