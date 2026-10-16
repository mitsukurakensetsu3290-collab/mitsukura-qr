const upstream = 'https://script.google.com/macros/s/AKfycbyxp2fPngfsV1EtDAZqm8ZmSf7hgbquPhK9W5oC35rY0SWCHe9l8jdEwac5-XfTkSRc9g/exec';
const fields = [['name','機械・工具名'],['model','規格・型式'],['unit','単位'],['quantity','数量'],['date','購入日'],['disposalDate','廃棄日'],['disposalReason','廃棄理由'],['vehicleNo','積載車輌NO.'],['location','保管場所'],['note','備考'],['updatedAt','最終更新日時']];
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const id = (url.searchParams.get('id') || '').trim();
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed',{status:405});
    if (url.pathname !== '/') return new Response('Not found',{status:404});
    let item = null;
    let error = '';
    let status = 200;
    if (id && !/^[1-9]\d{0,14}$/.test(id)) {error='管理番号を確認してください。';status=400;}
    else if (id) {
      try {
        const response = await fetch(upstream + '?format=json&id=' + encodeURIComponent(id), {redirect:'follow',signal:AbortSignal.timeout(15000)});
        if (!response.ok) throw new Error('upstream');
        const data = await response.json();
        item = data.item;
        if (!item) {error='この管理番号は未登録です。';status=404;}
      } catch {error='データを取得できませんでした。しばらくしてから再読み込みしてください。';status=503;}
    }
    const contact = `<aside aria-label="所有会社・拾得時の連絡先" style="background:#fff8e8;border:1px solid #eddbac;border-radius:10px;padding:18px;margin-bottom:20px"><strong style="display:block;font-size:20px">三倉建設株式会社</strong><p style="margin:10px 0;font-size:14px;line-height:1.7">この機械・工具は当社の所有物です。<br>お拾いになった方は、下記までご連絡ください。</p><a href="tel:0339323225" style="display:inline-block;font-size:22px;font-weight:700;padding:8px 0" aria-label="三倉建設株式会社に電話する 03-3932-3225">03-3932-3225</a><div style="font-size:12px;color:#657985">タップして電話する</div></aside>`;
    const content = contact + (item ? `<div class="number">管理番号 <strong>${escape(id)}</strong></div><dl>${fields.map(([key,label])=>`<div><dt>${label}</dt><dd>${escape(item[key] || '—')}</dd></div>`).join('')}</dl>` : `<p role="status">${escape(error || 'QRコードを読み取るか、管理番号を入力してください。')}</p>`);
    const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${id ? 'NO. '+escape(id)+' · ' : ''}機械・工具照会</title><style>*{box-sizing:border-box}body{margin:0;background:#f2f5f8;color:#182c3a;font-family:system-ui,sans-serif}header{background:#123a3b;color:white;padding:23px max(20px,calc((100% - 620px)/2))}header small{color:#a9c8c4;letter-spacing:.12em}h1{font-size:22px;margin:8px 0}main{max-width:660px;margin:24px auto;padding:0 18px}.card{background:white;border:1px solid #e1e8ec;border-radius:16px;padding:24px;box-shadow:0 6px 25px #16383b08}.number{background:#e9f5f0;color:#19654c;padding:14px 18px;border-radius:9px}.number strong{font-size:25px;margin-left:12px}dl{margin:12px 0}dl>div{padding:15px 0;border-bottom:1px solid #edf0f2}dt{font-size:12px;color:#657985}dd{margin:5px 0 0;font-size:16px;white-space:pre-wrap;overflow-wrap:anywhere}form{display:flex;gap:8px;margin-top:20px}input{min-width:0;flex:1;border:1px solid #c8d4da;border-radius:8px;padding:12px;font-size:16px}button{background:#19654c;border:0;border-radius:8px;color:white;padding:12px 18px;font-size:15px}footer{text-align:center;color:#73858d;font-size:12px;padding:20px}a{color:#19654c}</style></head><body><header><small>EQUIPMENT REGISTRY</small><h1>機械・工具 詳細情報</h1></header><main><section class="card">${content}<form method="get"><input name="id" aria-label="管理番号" placeholder="管理番号" inputmode="numeric" pattern="[1-9][0-9]{0,14}" required value="${escape(id)}"><button>照会</button></form></section><footer>閲覧専用 · ログイン不要<br>情報の変更は管理者へお問い合わせください。</footer></main></body></html>`;
    return new Response(request.method==='HEAD'?null:html,{status,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer','content-security-policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'"}});
  }
};
