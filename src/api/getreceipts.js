/**
 * GetReceipts API client — stubbed for now.
 * When backend/auth is wired, update these functions.
 * All other code calls these functions — this is the only file that changes.
 */

const BASE_URL = "https://getreceipts.com/api/v1";

export function isConnected() {
  // TODO: check for stored delegated token or API key
  return false;
}

export async function uploadEvidence(file, token) {
  if (!token) {
    console.log("[GetReceipts] uploadEvidence: not connected");
    return { ok: false, error: "not_connected" };
  }

  // TODO: POST /api/v1/evidence/upload with multipart form data
  console.log("[GetReceipts] uploadEvidence: would upload", file.name, "to", BASE_URL + "/evidence/upload");
  return {
    ok: true,
    data: {
      url: "https://getreceipts.com/evidence/mock",
      content_hash: "mock_hash",
      mime_type: file.type,
      size: file.size,
    },
  };
}

export async function createReceipt(receipt, token) {
  if (!token) {
    console.log("[GetReceipts] createReceipt: not connected");
    return { ok: false, error: "not_connected" };
  }

  // TODO: POST /api/v1/receipts with receipt payload
  console.log("[GetReceipts] createReceipt: would create receipt at", BASE_URL + "/receipts", receipt);
  return {
    ok: true,
    data: {
      id: "mock_receipt_" + Date.now(),
      status: "draft",
      detail_url: "https://getreceipts.com/receipts/mock",
    },
  };
}
