// utils/helper.ts - Utility helper functions
import type { Document } from "../lib/types";

/**
 * Extracts title and body content from HTML string
 * @param html - HTML content to parse
 * @returns Object with title and body strings
 */
export const extractTitleAndBody = (html: string): { title: string; body: string } => {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  // Extract title (look for <title> tag or first <h1> or <h2>)
  let title = "";
  const titleTag = tempDiv.querySelector("title");
  const h1Tag = tempDiv.querySelector("h1");
  const h2Tag = tempDiv.querySelector("h2");

  if (titleTag) {
    title = titleTag.textContent || "";
  } else if (h1Tag) {
    title = h1Tag.textContent || "";
  } else if (h2Tag) {
    title = h2Tag.textContent || "";
  }

  // Extract body content (everything except title/headings)
  let body = "";
  const bodyTag = tempDiv.querySelector("body");
  if (bodyTag) {
    body = bodyTag.textContent || "";
  } else {
    // If no body tag, get all text content except title
    const allText = tempDiv.textContent || "";
    body = allText.replace(title, "").trim();
  }

  return { title, body };
};

/**
 * Gets the chronological number (1-based) for a document within a list of documents
 * @param documentId - The ID of the document to find
 * @param allDocuments - Array of all documents for the patent
 * @returns The chronological number (1, 2, 3...) or 0 if not found
 */
export const getChronologicalNumber = (documentId: number, allDocuments: Document[] | null): number => {
  if (!allDocuments) return 0;
  
  // Sort documents by created_at to get chronological order
  const sortedDocuments = [...allDocuments].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  
  const index = sortedDocuments.findIndex(doc => doc.id === documentId);
  return index + 1; // 1-based numbering
}; 