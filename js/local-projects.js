/* Private project-feed-v2 overlay. Public data and approval policy stay unchanged. */
(function(root) {
  'use strict';
  const placement = {
    'mandibular-fracture': {'gallery-02':'research-pipeline','gallery-03':'published-evidence'},
    'life-careverse': {'gallery-01':'xr-application','gallery-02':'shared-state','gallery-03':'shared-state','gallery-04':'adoption-boundary'},
    'rtms-navigation': {'lead-01':'navigation-ui-workflow','gallery-01':'navigation-ui-workflow','gallery-02':'navigation-ui-workflow','gallery-03':'navigation-ui-workflow'},
    'respiratory-surface-guidance': {'gallery-01':'two-track-optics','gallery-02':'validation-protocol','gallery-03':'measured-findings','gallery-04':'measured-findings','gallery-05':'two-track-optics','gallery-06':'two-track-optics'},
    'unmanned-forklift': {'gallery-01':'integration-evidence','gallery-02':'integration-evidence','gallery-03':'integration-evidence'},
    'ai-build-lab': {'gallery-01':'problem-to-product','gallery-02':'problem-to-product','gallery-03':'human-ai-boundary'}
  };
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function figure(mid,lang,base,media) {
    const m=media[mid], t=m.translations[lang];
    const visual=m.type==='video'?`<video controls muted playsinline preload="none" poster="${esc(base+m.poster)}" aria-label="${esc(t.alt)}"><source src="${esc(base+m.path)}" type="video/mp4"><a href="${esc(base+m.path)}">${lang==='ko'?'영상 파일 열기':'Open video file'}</a></video>`:`<img src="${esc(base+m.path)}" alt="${esc(t.alt)}" loading="lazy" decoding="async">`;
    return `<figure class="pf-candidate" data-source-id="${mid}" data-media-status="approved-public">${visual}<figcaption><p>${esc(t.caption)}</p></figcaption></figure>`;
  }
  function mount(doc,data,local) {
    const lang=doc.body.dataset.lang==='en'?'en':'ko', base=doc.body.dataset.base||'';
    const article=doc.querySelector('[data-case]'); if(!article||article.dataset.localEnhanced)return;
    article.dataset.localEnhanced='true';
    const slug=article.dataset.case, project=data.projects.find(p=>p.slug===slug);
    const node=html=>{const div=doc.createElement('div');div.innerHTML=html;return div.firstElementChild;};
    const block=key=>{const b=project.blocks.find(b=>b.key===key);return b&&Array.from(article.querySelectorAll('.sc-block')).find(n=>n.querySelector('h3')?.textContent===b.translations[lang].heading);};
    const move=(suffix,target)=>{const item=article.querySelector(`img[src$="/${slug}-${suffix}.png"]`);if(item&&target){const f=item.closest('figure');f.dataset.localPlacement='context';target.append(f);}};
    Object.entries(placement[slug]||{}).forEach(([suffix,key])=>move(suffix,block(key)));
    const lead=article.querySelector(':scope > figure');
    const leadTargets={'life-careverse':'multiuser-demo','rtms-navigation':'device-system-integration','unmanned-forklift':'integration-evidence','respiratory-surface-guidance':'two-track-optics'};
    if(lead&&leadTargets[slug]&&block(leadTargets[slug]))block(leadTargets[slug]).append(lead);
    if(slug==='digital-occlusion-workflow'&&lead)article.querySelector('[data-story-section="integrated-workflow"] .sc-story__media')?.prepend(lead);
    if(slug==='surgical-navigation'&&lead)article.querySelector('[data-story-section="hololens-interface"] .sc-story__media')?.prepend(lead);
    if(slug==='mandibular-fracture') {
      ['gallery-01','gallery-04','gallery-05'].forEach(s=>article.querySelector(`img[src$="/${slug}-${s}.png"]`)?.closest('figure').remove());
      const target=block('research-pipeline');
      const stages=[
        ['M076','점군과 단면','Point clouds and cross-sections','특징 설계의 입력을 설명할 장면입니다. 파란 점으로 표현된 단면의 모양을 살펴봅니다.','A candidate view of the input to feature design: inspect the shapes of cross-sections represented by blue points.'],
        ['M077','치열궁과 방향','Dental arch and directions','치열궁의 곡선과 가로지르는 선분을 함께 보며 단면 방향을 설명할 후보입니다. 정확한 기호 의미는 확인 전입니다.','The arch curve and crossing segments provide a candidate illustration of section directions. The exact meaning of the symbols remains unconfirmed.'],
        ['M084','치아 구조 구분','Distinguishing tooth structures','치아별로 다른 색의 점군을 통해 구조 구분을 설명할 후보입니다. 색상만으로 자동 분할 성능을 판단하지 않습니다.','Differently coloured tooth point clouds provide a candidate illustration of structural distinctions. Colours alone do not establish automatic segmentation performance.']
      ];
      const firstExisting=target.querySelector('figure');
      stages.forEach(([id,ko,en,bodyKo,bodyEn])=>{const stage=node(`<section class="pf-context"><h4>${lang==='ko'?ko:en}</h4><p>${lang==='ko'?bodyKo:bodyEn}</p>${figure(id,lang,base,local.media)}</section>`);target.insertBefore(stage,firstExisting);});
      block('published-evidence').insertAdjacentHTML('beforeend',figure('M012',lang,base,local.media)+`<p><a href="${base+(lang==='en'?'en/':'')}news/index.html#news-accas-occlusion-paper-2022">${lang==='ko'?'ACCAS 2022 활동 기록':'ACCAS 2022 activity record'}</a></p>`);
    }
    article.querySelectorAll('.sc-gallery').forEach(g=>{if(!g.querySelector('figure'))g.remove();});
    article.querySelectorAll('video').forEach(v=>{v.muted=true;v.setAttribute('muted','');v.setAttribute('playsinline','');v.removeAttribute('autoplay');v.preload='none';});
    // Reordering must not leave misleading legacy figure numbers.
    article.querySelectorAll('.sc-figure__label').forEach((n,i)=>{n.textContent=(lang==='ko'?'그림 ':'Figure ')+(i+1)+'. ';});
  }
  const api={placement,figure,mount};if(typeof module==='object'&&module.exports)module.exports=api;root.LocalProjects=api;
  if(root.document)root.document.addEventListener('DOMContentLoaded',()=>mount(root.document,root.PortfolioData,root.LocalMediaData));
})(typeof globalThis!=='undefined'?globalThis:this);
