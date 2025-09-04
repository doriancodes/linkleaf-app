use linkleaf_core::linkleaf_proto::{Feed, Link};
use linkleaf_core::{add, list};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use uuid::Uuid;

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
    pub summary: Option<String>,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub via: Option<String>,
    #[serde(default)]
    pub id: Option<Uuid>,
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

#[tauri::command]
fn read_feed_page(path: String, offset: usize, limit: usize) -> Result<PageDto, String> {
    let feed = list(&PathBuf::from(path), None, None).unwrap();
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
    let path = PathBuf::from(&path);

    let tags_opt = if link.tags.is_empty() {
        None
    } else {
        Some(link.tags.join(","))
    };

    let new_pb = add(
        &path,
        link.title,
        link.url,
        link.summary,
        tags_opt,
        link.via,
        link.id,
    )
    .unwrap();

    // 4) return the added item to the UI
    Ok(LinkDto::from(new_pb))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![read_feed_page, add_link])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
