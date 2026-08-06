// 本地包装插件：文件夹页列表按 frontmatter title 降序排列
// 原版 @quartz-community/folder-page 默认按日期（modified）降序；
// 本插件注入自定义 sort：title 降序（title 以日期开头 → 新的在前）。
import { FolderPage } from "@quartz-community/folder-page"

// 与 @quartz-community/utils 的 isFolderPath 一致（文件夹页 slug 以 index 结尾）
function isFolderPath(slug = "") {
  return (
    slug.endsWith("/") ||
    slug === "index" ||
    slug.endsWith("index.md") ||
    slug.endsWith("index.html")
  )
}

// title 降序（文件夹优先；title 相同则按 slug 降序，保证确定性）
function byTitleDescFolderFirst() {
  return (f1, f2) => {
    const f1IsFolder = isFolderPath(f1.slug ?? "")
    const f2IsFolder = isFolderPath(f2.slug ?? "")
    if (f1IsFolder && !f2IsFolder) return -1
    if (!f1IsFolder && f2IsFolder) return 1
    const f1Title = f1.frontmatter?.title?.toLowerCase() ?? ""
    const f2Title = f2.frontmatter?.title?.toLowerCase() ?? ""
    if (f1Title !== f2Title) return f2Title.localeCompare(f1Title)
    return String(f2.slug ?? "").localeCompare(String(f1.slug ?? ""))
  }
}

export default (opts) => FolderPage({ ...opts, sort: byTitleDescFolderFirst() })
