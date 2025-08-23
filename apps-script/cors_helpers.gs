// ===== CORS helpers (add to your GAS project and redeploy Web App) =====
const ALLOW_ORIGIN = 'https://andropsy-official.com';
const ALLOW_HEADERS = 'Content-Type';
const ALLOW_METHODS = 'POST, GET, OPTIONS';

function _corsOk_(body) {
  const out = HtmlService.createHtmlOutput(body || '');
  out.addHeader('Access-Control-Allow-Origin', ALLOW_ORIGIN);
  out.addHeader('Access-Control-Allow-Methods', ALLOW_METHODS);
  out.addHeader('Access-Control-Allow-Headers', ALLOW_HEADERS);
  return out;
}
function doOptions(e) { return _corsOk_(''); }
// EXAMPLE wrap:
// function doPost(e){ const r = mainPostHandler(e); return _corsOk_(typeof r==='string'? r : JSON.stringify(r)); }
// function doGet(e){  return _corsOk_(JSON.stringify({ok:true})); }
