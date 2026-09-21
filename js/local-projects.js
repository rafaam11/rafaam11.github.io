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
  const gaps = {
    'surgical-navigation':['동일 시기의 장치–정합–HoloLens 연결 시연, 실험 절차와 개인 구현 범위를 확인할 자료가 필요합니다.','Needed: a same-period device–registration–HoloLens demonstration, experimental protocol, and evidence of personal implementation scope.'],
    'mandibular-fracture':['점군 입력부터 특징 추출·정복까지 같은 데이터로 이어지는 화면과 신규 그림의 데이터 출처가 필요합니다.','Needed: a continuous same-data sequence from point-cloud input through feature extraction and reduction, plus provenance for the candidate figures.'],
    'digital-occlusion-workflow':['연구진 조작과 오류 복구 흐름을 합성 데이터로 보여주는 추가 녹화가 필요합니다. 과거 교합 자료는 사용하지 않았습니다.','Needed: a synthetic-data recording of researcher interaction and error recovery. Historical occlusion material is not used here.'],
    'life-careverse':['재접속·입력 충돌·음성 상태가 세 클라이언트에 반영되는 녹화가 필요합니다.','Needed: recordings of reconnection, competing input and voice-state behaviour across three clients.'],
    'rtms-navigation':['합성 데이터의 좌표 정합 단계와 장치 상태 변화·복구 화면이 필요합니다.','Needed: synthetic-data registration steps and device-state changes and recovery.'],
    'respiratory-surface-guidance':['동일 조건의 측정 배치와 센서 출력·파형을 연결하는 추가 녹화가 필요합니다.','Needed: a recording linking the controlled measurement setup to sensor output and waveforms.'],
    'skadi-tracking-software':['전용 콘솔 구성을 유지했습니다. OpenEx() 실패·복구와 SDK 호출–화면 대응을 보여줄 자료가 필요합니다.','The dedicated console layout is retained. Needed: OpenEx() failure/recovery and SDK-call-to-screen evidence.'],
    'unmanned-forklift':['센서 좌표 보정과 인지–정책 입력을 한 시점으로 대조할 로그·화면이 필요합니다.','Needed: synchronized logs and screens comparing sensor calibration and perception-to-policy inputs.'],
    'ai-build-lab':['PR 리뷰·수용 기준 확인의 연속 화면과 각 도구별 실제 사용 흐름이 필요합니다.','Needed: continuous PR-review and acceptance-check recordings, and real workflows for each tool.']
  };
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function figure(mid,lang,base,media) {
    const m=media[mid], t=m.translations[lang];
    const visual=m.type==='video'?`<video controls muted playsinline preload="none" poster="${esc(base+m.poster)}" aria-label="${esc(t.alt)}"><source src="${esc(base+m.path)}" type="video/mp4"><a href="${esc(base+m.path)}">${lang==='ko'?'영상 파일 열기':'Open video file'}</a></video>`:`<img src="${esc(base+m.path)}" alt="${esc(t.alt)}" loading="lazy" decoding="async">`;
    return `<figure class="pf-candidate" data-source-id="${mid}" data-media-status="approved-public">${visual}<figcaption><p>${esc(t.caption)}</p><p class="pf-review-note">${mid} · ${lang==='ko'?'공개 승인 파생본':'Approved public derivative'}</p><p class="pf-review-note">${esc(t.note)}</p></figcaption></figure>`;
  }
  function mount(doc,data,local) {
    const lang=doc.body.dataset.lang==='en'?'en':'ko', index=lang==='ko'?0:1, base=doc.body.dataset.base||'';
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
    if(slug==='surgical-navigation') {
      if(lead)article.querySelector('[data-story-section="hololens-interface"] .sc-story__media')?.prepend(lead);
      const section=node(`<section class="pf-context" data-local-section="early-ar"><h2>${lang==='ko'?'초기 AR 탐색 자료 · 연결 확인 대기':'Early AR exploration · association pending'}</h2><p>${lang==='ko'?'2021년 자료 묶음의 실험·전시 후보입니다. 2023.07 이후 SMCNavi 사례와 프로젝트 대응 및 개인 역할은 미확인입니다. M162 파일명은 2021.05를 포함하지만 촬영일을 확정하지 않습니다.':'Experimental and exhibition candidates from the 2021 collection. Their relationship to SMCNavi since July 2023 and the personal role are unconfirmed. M162 includes 2021.05 in its filename; this does not establish a capture date.'}</p></section>`);
      const groups=[['실험 배치와 측정','Setup and measurement',['M159','M160']],['전시 맥락','Exhibition context',['M007']],['AR 시연 비교','AR demonstration comparison',['M162']]];
      groups.forEach(g=>section.insertAdjacentHTML('beforeend',`<h3>${g[index]}</h3><div class="pf-context-media">${g[2].map(id=>figure(id,lang,base,local.media)).join('')}</div>`));
      article.querySelector('.sc-case__links').before(section);
    }
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
    const gap=node(`<aside class="pf-gap"><h2>${lang==='ko'?'다음 설명을 위한 자료':'Material needed for the next explanation'}</h2><p>${esc(gaps[slug][index])}</p></aside>`);
    article.append(gap);
  }
  const api={placement,gaps,figure,mount};if(typeof module==='object'&&module.exports)module.exports=api;root.LocalProjects=api;
  if(root.document)root.document.addEventListener('DOMContentLoaded',()=>mount(root.document,root.PortfolioData,root.LocalMediaData));
})(typeof globalThis!=='undefined'?globalThis:this);
