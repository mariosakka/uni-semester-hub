import {esc} from "./util.js";
// Pure item helpers. Item strings and titles are trusted HTML written by the data author.
export const link = (url, text) => `<a href="${esc(url)}">${text}</a>`;

// list items: a string ("[ ] title" = tickable, other text = plain) or { title, text?, due?, check?, open? }
export const itemCheck = it => typeof it === "string" ? it.startsWith("[ ] ") : !!(it && it.check === true);
export const itemTitle = it => typeof it === "string" ? (it.startsWith("[ ] ") ? it.slice(4) : it) : String((it && it.title) || "");
export const dueTag = due => due ? ` <span class="tc-due">${esc(due)}</span>` : "";
export const listItemHTML = it => typeof it === "string" ? itemTitle(it) : itemTitle(it) + dueTag(it.due) + (it.text ? `<div class="nt">${it.text}</div>` : ""); // plain lists (outside To-Do)

export const ITEMS = { // kind -> how one item becomes <li> content (news is NewsList.vue)
  list: listItemHTML,
  links: i => link(i.url, i.label) + (i.note ? ` – ${i.note}` : ""),
  contacts: i => [`<b>${i.name}</b>`, i.role, i.email && link("mailto:" + i.email, esc(i.email)), i.phone && link("tel:" + i.phone.replace(/[^\d+]/g, ""), esc(i.phone)), i.note].filter(Boolean).join(" · ")
};
