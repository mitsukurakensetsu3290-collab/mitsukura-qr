(() => {
  const form=document.getElementById('registration');
  const status=document.getElementById('status');
  const send=document.getElementById('send');
  const targetId=(new URLSearchParams(location.search).get('id')||'').trim();
  let baseUpdatedAt='';
  let imageData='';
  let ready=!targetId;
  let compressing=false;
  let previousPayload=null;
  const targetBox=document.createElement('p');targetBox.className='notice';
  targetBox.textContent=targetId?'管理番号：'+targetId+'（このQR番号を維持します）':'新しい管理番号は管理者の承認時に発行されます。';
  form.before(targetBox);
  const photoBox=document.createElement('div');
  photoBox.innerHTML='<label for="photo">機械・工具の写真（1枚・任意）</label><input id="photo" type="file" accept="image/*"><p style="font-size:13px;color:#657985">自動で縮小・圧縮します（最大1200px・300KB）。新しい写真を選ばない場合、現在の写真はそのまま残ります。</p><img id="photoPreview" alt="写真のプレビュー" hidden style="display:block;width:100%;max-height:300px;object-fit:contain;border-radius:10px"><p id="photoStatus" role="status"></p>';
  send.before(photoBox);
  const photo=document.getElementById('photo');
  const preview=document.getElementById('photoPreview');
  preview.style.display='none';
  const photoStatus=document.getElementById('photoStatus');
  function showPhoto(source){preview.src=source;preview.hidden=false;preview.style.display='block';}
  function updateButton(){send.disabled=!ready||compressing;}
  photo.onchange=async()=>{
    imageData='';previousPayload=null;preview.hidden=true;preview.style.display='none';
    const file=photo.files[0];if(!file){photoStatus.textContent='';return;}
    if(file.size>15000000 || !file.type.startsWith('image/')){photo.value='';photoStatus.textContent='15MB以下の画像を選択してください。';return;}
    compressing=true;updateButton();photoStatus.textContent='写真を縮小中...';
    const source=URL.createObjectURL(file);
    try {
      const image=new Image();image.src=source;await image.decode();
      let scale=Math.min(1,1200/Math.max(image.naturalWidth,image.naturalHeight));
      const canvas=document.createElement('canvas');
      for(let attempt=0;attempt<6;attempt++){
        canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
        const context=canvas.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);
        const result=canvas.toDataURL('image/jpeg',Math.max(.45,.82-attempt*.08));
        if((result.length-result.indexOf(',')-1)*.75<=299000){imageData=result;break;}
        scale*=.8;
      }
      if(!imageData)throw Error('写真を圧縮できませんでした。別の写真を選択してください。');
      showPhoto(imageData);photoStatus.textContent='写真の準備完了：約'+Math.ceil(imageData.length*.75/1000)+'KB';
    } catch(error){photo.value='';imageData='';photoStatus.textContent='写真を読み込めませんでした。JPEGまたはPNG画像でお試しください。';}
    finally {URL.revokeObjectURL(source);compressing=false;updateButton();}
  };
  async function prefill(){
    if(!targetId)return;
    if(!/^[1-9]\d{0,14}$/.test(targetId)){status.textContent='管理番号が無効です。';return;}
    updateButton();status.textContent='現在の情報を読み込み中...';
    try {
      const response=await fetch('https://mitsukura-tools-qr.huyhumg19.chatgpt.site/api/item?id='+encodeURIComponent(targetId),{credentials:'omit',signal:AbortSignal.timeout(25000)});
      const data=await response.json();
      if(response.status===404){status.textContent='未登録のQRです。機械・工具の情報を入力してください。';ready=true;return;}
      if(!response.ok || !data.item)throw Error('load');
      for(const key of ['name','model','unit','quantity','date','vehicleNo','location','note']){
        const input=document.getElementById(key);if(input)input.value=key==='quantity'?(data.item[key]||'1'):data.item[key]||'';
      }
      baseUpdatedAt=data.item.updatedAt||'';
      if(/^https:\/\/mitsukura-tools-qr\.huyhumg19\.chatgpt\.site\/photos\/[a-f0-9-]{36}\/[a-f0-9]{64}\.jpg$/.test(data.item.photoUrl||''))showPhoto(data.item.photoUrl);
      status.textContent='変更したい情報を修正して送信してください。承認までは現在の情報が公開されます。';ready=true;
      document.querySelector('h1').textContent='機械・工具 登録・変更申請';
    } catch {status.textContent='現在の情報を取得できませんでした。ページを再読み込みしてください。';}
    finally {updateButton();}
  }
  form.onsubmit=async event=>{
    event.preventDefault();if(!ready||compressing)return;
    const values={...Object.fromEntries(new FormData(form)),targetId,baseUpdatedAt,imageData};
    if(!values.submitter.trim()||!values.name.trim()){status.textContent='申請者名と機械・工具名を入力してください。';return;}
    if(!previousPayload||Object.entries(values).some(([key,value])=>previousPayload[key]!==value))previousPayload={...values,requestId:crypto.randomUUID()};
    send.disabled=true;status.textContent='申請を送信中です。そのままお待ちください。';
    try {
      const response=await fetch('https://mitsukura-tools-qr.huyhumg19.chatgpt.site/api/requests',{method:'POST',credentials:'omit',headers:{'content-type':'text/plain;charset=utf-8'},body:JSON.stringify(previousPayload),signal:AbortSignal.timeout(35000)});
      const data=await response.json();if(!response.ok||!data.ok)throw Error(data.error||'送信できませんでした。');
      status.textContent='申請を受け付けました。管理者の承認をお待ちください。\n受付番号：'+data.requestId;
      ready=false;send.textContent='送信済み・承認待ち';
    } catch(error){status.textContent=error.name==='TimeoutError'||error instanceof TypeError?'送信結果を確認できませんでした。内容を変えずに再送信してください。':error.message;}
    finally {updateButton();}
  };
  updateButton();prefill();
})();
