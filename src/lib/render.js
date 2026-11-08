import {esc} from "./util.js";
// Pure item helpers. Item strings and titles are trusted HTML written by the data author.
export const link = (url, text) => `<a href="${esc(url)}">${text}</a>`;

// list items: a string or { title, text?, due?, open? }
export const itemTitle = it => typeof it === "string" ? it : String((it && it.title) || "");
export const dueTag = due => due ? ` <span class="tc-due">${esc(due)}</span>` : "";
export const listItemHTML = it => typeof it === "string" ? itemTitle(it) : itemTitle(it) + dueTag(it.due) + (it.text ? `<div class="nt">${it.text}</div>` : ""); // plain lists (outside To-Do)

export const ITEMS = { // kind -> how one item becomes <li> content (news is NewsList.vue)
  list: listItemHTML,
  links: i => link(i.url, i.label) + (i.note ? ` – ${i.note}` : ""),
  contacts: i => { // one block per person: name, then role, then email/phone, then note, each on its own line (styled in sections.css)
    const det = [i.email && link("mailto:" + i.email, esc(i.email)), i.phone && link("tel:" + i.phone.replace(/[^\d+]/g, ""), esc(i.phone))].filter(Boolean).join(" · ");
    return `<span class="ct"><span class="ct-name">${i.name}</span>` + (i.role ? `<span class="ct-role">${i.role}</span>` : "") + (det ? `<span class="ct-det">${det}</span>` : "") + (i.note ? `<span class="ct-note">${i.note}</span>` : "") + "</span>";
  }
};
