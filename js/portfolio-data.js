(function (root, factory) {
  var value = factory();
  if (typeof module === 'object' && module.exports) module.exports = value;
  root.PortfolioData = value;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  var capabilities = [
    {
      key: 'registration',
      methods: ['PCA', 'ICP', 'CLPSO', 'Open3D', 'OpenCV', 'SciPy'],
      translations: {
        ko: {
          title: '3D 기하 및 정합',
          summary: '특징점, 표면, 센서, 의료영상의 좌표 관계를 모델링하고 반복 가능한 정합과 최적화로 연결합니다.',
          validation: '대응점, 잔차, 변환 경로, 재현 가능한 실험을 함께 남겨 결과를 확인합니다.',
          cardSummary: '좌표계와 3D 데이터를 검증 가능한 정합 문제로 바꿉니다.',
          cardValidation: '변환 경로, 잔차, 반복 실험으로 확인합니다.'
        },
        en: {
          title: '3D Geometry & Registration',
          summary: 'Model coordinate relationships across features, surfaces, sensors, and medical images, then turn them into repeatable registration and optimization workflows.',
          validation: 'Keep correspondences, residuals, transform paths, and reproducible experiments visible with the result.',
          cardSummary: 'Turn coordinate systems and 3D data into testable registration problems.',
          cardValidation: 'Check transform paths, residuals, and repeatable experiments.'
        }
      }
    },
    {
      key: 'sensor-fusion',
      methods: ['ToF-RGB registration', 'SICK TiM LiDAR', 'NAV350', 'Robot localization', 'Zenoh'],
      translations: {
        ko: {
          title: '센서 융합 및 위치추정',
          summary: 'RGB, ToF, LiDAR, 위치추정 신호를 하나의 좌표 모델과 안전 판단 흐름으로 연결합니다.',
          validation: '포인트클라우드, 센서 정렬, 로봇 위치, 정책 결과를 통합과 현장 검증에서 대조합니다.',
          cardSummary: '다중 센서의 좌표와 신호를 위치추정과 안전 판단으로 이어 붙입니다.',
          cardValidation: '정렬, 위치, 정책 결과를 통합과 현장에서 확인합니다.'
        },
        en: {
          title: 'Sensor Fusion & Localization',
          summary: 'Connect RGB, ToF, LiDAR, and localization signals through one coordinate model into a safety-decision flow.',
          validation: 'Compare point clouds, sensor alignment, robot pose, and policy outputs during integration and field validation.',
          cardSummary: 'Connect multi-sensor coordinates and signals to localization and safety decisions.',
          cardValidation: 'Inspect alignment, pose, and policy outputs in integration and field tests.'
        }
      }
    },
    {
      key: 'medical-navigation',
      methods: ['3D Slicer', 'VTK', 'Qt', 'OpenIGTLink', 'Optical tracking'],
      translations: {
        ko: {
          title: '의료 내비게이션 및 시각화',
          summary: '추적 장치, 의료영상, 도구 자세, 정합 상태를 사용자가 이해할 수 있는 내비게이션 화면과 데이터 흐름으로 구성합니다.',
          validation: '동작하는 프로토타입, 반복 가능한 장치 연결, 좌표계 표시, 명시적 한계로 검증합니다.',
          cardSummary: '장치와 영상의 좌표 결과를 읽을 수 있는 내비게이션으로 바꿉니다.',
          cardValidation: '프로토타입, 장치 연결, 좌표 표시를 반복 점검합니다.'
        },
        en: {
          title: 'Medical Navigation & Visualization',
          summary: 'Organize tracking devices, medical images, tool poses, and registration state into a navigation interface and data flow users can understand.',
          validation: 'Use working prototypes, repeatable device connections, visible coordinate frames, and explicit limitations.',
          cardSummary: 'Turn device and image coordinates into navigation users can read.',
          cardValidation: 'Repeat prototype, device, and coordinate-display checks.'
        }
      }
    },
    {
      key: 'xr-engineering',
      methods: ['Unity', 'MRTK', 'Meta Quest', 'Photon PUN2', 'Photon Voice'],
      translations: {
        ko: {
          title: 'XR 애플리케이션 엔지니어링',
          summary: '스패셜 UI, 멀티유저 동기화, 음성, 시나리오, 장치 제약을 하나의 XR 애플리케이션으로 통합합니다.',
          validation: '실제 헤드셋 프로토타입, 멀티유저 시연, 전문가 피드백, 시나리오 재생으로 확인합니다.',
          cardSummary: '스패셜 UI와 네트워크 상호작용을 동작하는 XR 앱으로 통합합니다.',
          cardValidation: '헤드셋 시연, 동기화, 시나리오 재생으로 확인합니다.'
        },
        en: {
          title: 'XR Application Engineering',
          summary: 'Integrate spatial UI, multi-user synchronization, voice, scenarios, and device constraints into one XR application.',
          validation: 'Use on-device prototypes, multi-user demonstrations, expert feedback, and scenario replay.',
          cardSummary: 'Integrate spatial UI and networked interaction into a working XR application.',
          cardValidation: 'Check on-device demos, synchronization, and scenario replay.'
        }
      }
    },
    {
      key: 'ai-product-engineering',
      methods: ['Requirements & architecture', 'Acceptance criteria', 'Automated tests', 'Release operations', 'Human review'],
      translations: {
        ko: {
          title: 'AI 활용 제품 엔지니어링',
          summary: '직접 겪은 문제를 요구사항과 아키텍처로 바꾸고, AI로 구현을 증폭하되 수용 기준과 최종 판단은 사람이 소유합니다.',
          validation: '자동화 테스트, 릴리스 아티팩트, 운영 기록, 사람의 리뷰와 수용 판정으로 검증합니다.',
          cardSummary: '생활에서 발견한 문제를 테스트·릴리스·운영되는 제품으로 만듭니다.',
          cardValidation: '수용 기준, 테스트, 릴리스, 사람 리뷰로 확인합니다.'
        },
        en: {
          title: 'Product Engineering with AI',
          summary: 'Turn personally experienced problems into requirements and architecture, use AI to amplify implementation, and keep acceptance criteria and final judgment human-owned.',
          validation: 'Use automated tests, release artifacts, operating records, and human review and acceptance.',
          cardSummary: 'Turn lived problems into tested, released, and operated products.',
          cardValidation: 'Check acceptance criteria, tests, releases, and human review.'
        }
      }
    }
  ];

  var tiers = [
    { key: 'medical-core', translations: { ko: { label: '의료 코어' }, en: { label: 'Medical Core' } } },
    { key: 'platform', translations: { ko: { label: '플랫폼 소프트웨어' }, en: { label: 'Platform Software' } } },
    { key: 'industrial-spotlight', translations: { ko: { label: '산업 스포트라이트' }, en: { label: 'Industrial Spotlight' } } },
    { key: 'ai-build-lab', translations: { ko: { label: 'AI 빌드 랩' }, en: { label: 'AI Build Lab' } } }
  ];

  var impactMetrics = [];

  function project(record) {
    var primaryCapability = record.capabilityKeys[0];
    var crossCapabilities = record.capabilityKeys.slice(1);
    return Object.assign({
      primaryCapability: primaryCapability,
      crossCapabilities: crossCapabilities,
      links: []
    }, record);
  }

  var highlights = {
    publications: [
      { year: '2024', href: 'https://link.springer.com/article/10.1007/s10278-024-01014-z', translations: {
        ko: { title: 'A Proof of Concept: Optimized Jawbone-Reduction Model for Mandibular Fracture Surgery', venue: 'Journal of Imaging Informatics in Medicine (SCIE Q1) · 공동 제1저자' },
        en: { title: 'A Proof of Concept: Optimized Jawbone-Reduction Model for Mandibular Fracture Surgery', venue: 'Journal of Imaging Informatics in Medicine (SCIE Q1) · joint first author' } } },
      { year: '2022', translations: {
        ko: { title: 'Dental Occlusion Model Using Arch Line for Mandibular Fracture Surgery', venue: 'ACCAS 2022, Bangkok · 구두 발표' },
        en: { title: 'Dental Occlusion Model Using Arch Line for Mandibular Fracture Surgery', venue: 'ACCAS 2022, Bangkok · oral presentation' } } },
      { year: '2019', translations: {
        ko: { title: 'Design of Ping-Pong Ball Launcher', venue: 'ISM 2019 — International Symposium on Mechatronics' },
        en: { title: 'Design of Ping-Pong Ball Launcher', venue: 'ISM 2019 — International Symposium on Mechatronics' } } }
    ],
    patents: {
      filed: 7,
      registered: 3,
      items: [
        { year: '2024', status: 'registered', translations: { ko: { title: '수술도구의 실시간 3차원 위치추적을 위한 좌표계 정합 방법' }, en: { title: 'Coordinate-system registration method for real-time 3D tracking of surgical instruments' } } },
        { year: '2024', status: 'registered', translations: { ko: { title: '위치 추적 장치 및 방법' }, en: { title: 'Position tracking apparatus and method' } } },
        { year: '2015', status: 'registered', translations: { ko: { title: '일회용 종이컵 수거함' }, en: { title: 'Disposable paper-cup collection box' } } }
      ]
    },
    awards: [
      { year: '2024', translations: { ko: { title: '의료메타버스학회 우수포스터상' }, en: { title: 'Best Poster Award, Korean Society of Medical Metaverse' } } },
      { year: '2023', translations: { ko: { title: '대한의료로봇학회 우수논문상' }, en: { title: 'Best Paper Award, Korean Society of Medical Robotics' } } },
      { year: '2020', translations: { ko: { title: 'KIT 엔지니어링 페어 장려상 (4족 보행 로봇)' }, en: { title: 'Encouragement Award, KIT Engineering Fair (quadruped robot)' } } },
      { year: '2020', translations: { ko: { title: 'ROS 기반 자율주행 교육 동상' }, en: { title: 'Bronze Prize, ROS-based Autonomous Driving Course' } } },
      { year: '2019', translations: { ko: { title: '국제 TRIZ 경진대회 대상' }, en: { title: 'Grand Prize, International TRIZ Competition' } } },
      { year: '2019', translations: { ko: { title: '창업아이디어 경진대회 최우수상' }, en: { title: 'First Prize, Startup Idea Competition' } } },
      { year: '2019', translations: { ko: { title: '효성 GREEN 지구 공모전 우수상' }, en: { title: 'Excellence Award, Hyosung GREEN Earth Contest' } } },
      { year: '2019', translations: { ko: { title: '대학창의발명대회 후원기관상' }, en: { title: 'Sponsor Award, University Creative Invention Contest' } } },
      { year: '2015', translations: { ko: { title: '대학창의발명대회 우수상' }, en: { title: 'Excellence Award, University Creative Invention Contest' } } }
    ]
  };

  var projects = [
    project({
      slug: 'surgical-navigation',
      tier: 'medical-core',
      period: '2023.07 – present',
      evidenceState: 'ongoing',
      lifecycleState: 'ongoing',
      capabilityKeys: ['registration', 'medical-navigation', 'xr-engineering'],
      route: 'projects/surgical-navigation/',
      tech: ['HoloLens 2', 'Optical tracking', '3D Slicer', 'Unity', 'MRTK', 'OpenIGTLink'],
      media: {
        lead: { id: 'surgical-navigation-clip-01', type: 'video', status: 'approved', publicPath: 'assets/projects/surgical-navigation/surgical-navigation-clip-01.mp4' },
        video: { id: 'surgical-navigation-clip-01', type: 'video', status: 'approved', publicPath: 'assets/projects/surgical-navigation/surgical-navigation-clip-01.mp4' },
        poster: { id: 'surgical-navigation-poster-01', type: 'image', status: 'approved', publicPath: 'assets/projects/surgical-navigation/surgical-navigation-poster-01.png' },
        gallery: [
          { id: 'surgical-navigation-gallery-01', type: 'image', status: 'approved', publicPath: 'assets/projects/surgical-navigation/surgical-navigation-gallery-01.png', translations: { ko: { caption: '시스템 구성 — 추적 장치·내비게이션 서버·HoloLens 2 클라이언트(ASA·PUN)', alt: '추적 장치와 내비게이션 서버, 두 대의 HoloLens 2가 ASA와 PUN으로 연결된 구성도' }, en: { caption: 'System layout: tracker, navigation server, and HoloLens 2 clients linked through ASA and PUN', alt: 'Diagram of the tracker, navigation server, and two HoloLens 2 clients connected through Azure Spatial Anchors and Photon Unity Networking' } } },
          { id: 'surgical-navigation-gallery-02', type: 'image', status: 'approved', publicPath: 'assets/projects/surgical-navigation/surgical-navigation-gallery-02.png', translations: { ko: { caption: '좌표계 관계 — 추적 장치·환자 마커·프로브 마커 변환', alt: '추적 장치 기준의 환자 마커와 프로브 마커 좌표 변환 개념도' }, en: { caption: 'Coordinate frames: tracker, patient marker, and probe marker transforms', alt: 'Concept diagram of patient-marker and probe-marker transforms relative to the tracker' } } },
          { id: 'surgical-navigation-gallery-03', type: 'image', status: 'approved', publicPath: 'assets/projects/surgical-navigation/surgical-navigation-gallery-03.png', translations: { ko: { caption: '패시브 마커 어댑터를 장착한 추적 수술기구', alt: '반사 마커 4개가 달린 어댑터를 장착한 수술용 기구 사진' }, en: { caption: 'Surgical instrument fitted with a passive-marker adapter', alt: 'Photo of a surgical instrument with a four-sphere reflective marker adapter' } } },
          { id: 'surgical-navigation-gallery-04', type: 'image', status: 'approved', publicPath: 'assets/projects/surgical-navigation/surgical-navigation-gallery-04.png', translations: { ko: { caption: '벤치 셋업 — 광학 추적 장치·내비게이션 화면·두개골 팬텀(영상 패널 블러)', alt: '삼각대 위 광학 추적 장치, 내비게이션 SW 화면, 두개골 팬텀과 마커 기구가 놓인 작업대' }, en: { caption: 'Bench setup: optical tracker, navigation screen, and skull phantom (image panels blurred)', alt: 'Work bench with an optical tracker on a tripod, the navigation software screen, a skull phantom, and marker instruments' } } },
          { id: 'surgical-navigation-gallery-05', type: 'image', status: 'approved', publicPath: 'assets/projects/surgical-navigation/surgical-navigation-gallery-05.png', translations: { ko: { caption: 'HoloLens 시점 — 두개골 홀로그램과 토글 패널', alt: 'HoloLens로 본 두개골 홀로그램과 손 추적·시선 추적 토글 패널' }, en: { caption: 'HoloLens view: skull hologram and the toggle panel', alt: 'Skull hologram and hand- and eye-tracking toggle panel seen through HoloLens' } } },
          { id: 'surgical-navigation-gallery-06', type: 'image', status: 'approved', publicPath: 'assets/projects/surgical-navigation/surgical-navigation-gallery-06.png', translations: { ko: { caption: 'HoloLens 착용 상태의 팬텀 시연', alt: 'HoloLens를 착용한 사용자가 추적 장치 앞에서 팬텀에 기구를 맞추는 장면' }, en: { caption: 'Phantom demonstration while wearing HoloLens', alt: 'User wearing HoloLens aligning an instrument on a phantom in front of the tracker' } } },
        ]
      },
      pdf: { ko: 'assets/pdfs/surgical-navigation-ko.pdf', en: 'assets/pdfs/surgical-navigation-en.pdf' },
      pdfSequence: {
        middle: ['coordinate-chain', 'spatial-feedback', 'demonstration-evidence', 'clinical-boundary'],
        evidenceId: 'surgical-navigation-clip-01',
        diagram: {
          kind: 'coordinate-chain',
          translations: {
            ko: { title: '추적 좌표에서 공간 피드백까지', nodes: ['추적 장치', '영상·도구 좌표', '정합 상태', 'HoloLens 피드백'] },
            en: { title: 'Tracking coordinates to spatial feedback', nodes: ['Tracking hardware', 'Image and tool frames', 'Registration state', 'HoloLens feedback'] }
          }
        }
      },
      translations: {
        ko: {
          title: '수술내비게이션 시스템',
          shortTitle: '수술내비게이션',
          eyebrow: '의료 코어 · 통합 소프트웨어',
          thesis: '정합 결과를 사용자가 이해하고 신뢰할 수 있는 공간 경험으로 바꿉니다.',
          summary: '추적 장치, SDK, 좌표 변환, 데이터 흐름, HoloLens 공간 표시를 하나의 수술내비게이션 경험으로 연결합니다.',
          problem: '장치별 좌표와 정합 상태가 분절되면 사용자는 공간 결과를 판단하기 어렵습니다.',
          role: '장치·SDK·좌표 변환·데이터 흐름을 포함한 통합 소프트웨어와 HoloLens 공간 배치·정합 피드백 경험을 리드했습니다.',
          teamResult: '팀과 외부 협업자가 통합 시연과 수용 검토를 함께 수행했으며, 그 결과를 개인 성과로 재귀속하지 않습니다.',
          evidence: '동작하는 장치 연결, 좌표 변환, 공간 배치, 정합 피드백 시연이 근거입니다.',
          limitation: '시연은 팬텀 대상의 통합 동작을 보여주며 임상 효과나 운영 배포를 주장하지 않습니다.',
          collaboration: '추적 장치, 의료영상, XR, 워크플로 전문가와의 공동 검토가 필요합니다.',
          mediaAlt: 'HoloLens 시점에서 두개골 팬텀 위에 정합된 붉은 홀로그램과 추적 포인터가 보이는 시연 장면.',
          mediaCaption: 'HoloLens 시점에서 두개골 팬텀 위에 정합된 홀로그램과 추적 포인터를 보여주는 시연 클립입니다.',
          status: '진행 중', cardProblem: '분절된 장치·좌표·XR 흐름을 하나의 내비게이션으로 연결합니다.', cardOwnedRole: '통합 SW와 HoloLens 공간 배치·정합 피드백을 리드했습니다.', cardEvidence: '장치 연결·좌표 변환·HoloLens 공간 시연 클립과 구성도·사진이 근거입니다.', problemSummary: '장치별 좌표와 정합 상태를 하나의 사용자 경험으로 연결합니다.', ownedRole: '통합 소프트웨어와 HoloLens 공간 배치·정합 피드백을 리드했습니다.', verifiedEvidence: 'HoloLens 공간 시연 클립, 시스템·좌표 구성도, 벤치 사진이 근거입니다.', visualAlt: 'HoloLens 홀로그램 정합 시연.', visualCaption: 'HoloLens 시점 홀로그램 정합 시연 클립.'
        },
        en: {
          title: 'Surgical Navigation Systems',
          shortTitle: 'Surgical Navigation',
          eyebrow: 'Medical Core · Integrated Software',
          thesis: 'Registration results become a spatial experience users can understand and trust.',
          summary: 'Connect tracking devices, SDKs, coordinate transforms, data flow, and HoloLens spatial presentation into one surgical-navigation experience.',
          problem: 'When device coordinates and registration state stay fragmented, users cannot confidently interpret the spatial result.',
          role: 'Led the integrated software across device, SDK, coordinate transforms, and data flow, plus the HoloLens spatial-placement and registration-feedback experience.',
          teamResult: 'The team and external collaborators jointly conducted integration demonstrations and acceptance reviews; those results are not attributed as individual outcomes.',
          evidence: 'Working device connections, coordinate transforms, spatial placement, and registration-feedback demonstrations provide the evidence.',
          limitation: 'The demonstration shows integrated operation on a phantom; it does not claim clinical efficacy or production deployment.',
          collaboration: 'Joint review spans tracking hardware, medical imaging, XR, and workflow expertise.',
          mediaAlt: 'Demonstration seen through HoloLens: a red hologram registered on a skull phantom with a tracked pointer.',
          mediaCaption: 'Demonstration clip from the HoloLens viewpoint: a hologram registered on a skull phantom with a tracked pointer.',
          status: 'Ongoing', cardProblem: 'Connect fragmented device, coordinate, and XR flows into one navigation experience.', cardOwnedRole: 'Led integrated software and the HoloLens placement and registration-feedback experience.', cardEvidence: 'Device-connection, transform, and HoloLens spatial demonstration clip plus diagrams and photos are the evidence.', problemSummary: 'Connect device coordinates and registration state into one readable user experience.', ownedRole: 'Led integrated software and HoloLens spatial placement and registration feedback.', verifiedEvidence: 'The HoloLens spatial demonstration clip, system and coordinate diagrams, and bench photos are the evidence.', visualAlt: 'HoloLens hologram registration demonstration.', visualCaption: 'HoloLens-view hologram registration demonstration clip.'
        }
      },
      blocks: [
        { key: 'coordinate-chain', type: 'system', translations: { ko: { heading: '좌표 체인', body: '추적 장치에서 영상, 도구, HoloLens까지 변환 경로를 드러냈습니다.' }, en: { heading: 'Coordinate chain', body: 'Made the transform path visible from tracking hardware through images, tools, and HoloLens.' } } },
        { key: 'spatial-feedback', type: 'text', translations: { ko: { heading: '공간 피드백', body: '정합 성공 여부를 단순 숫자가 아닌 배치와 표시로 판단하게 했습니다.' }, en: { heading: 'Spatial feedback', body: 'Made registration state legible through placement and feedback rather than a hidden number.' } } },
        { key: 'demonstration-evidence', type: 'evidence', translations: { ko: { heading: '시연 근거', body: '동작하는 통합 시연을 근거로 삼되 미디어 승인 상태를 별도로 표시합니다.' }, en: { heading: 'Demonstration evidence', body: 'Treat the working integration demo as evidence while keeping media approval explicit.' } } },
        { key: 'clinical-boundary', type: 'limitation', translations: { ko: { heading: '임상 경계', body: '통합 시연은 임상 효과나 운영 배포를 증명하지 않습니다.' }, en: { heading: 'Clinical boundary', body: 'An integration demonstration does not establish clinical efficacy or production deployment.' } } }
      ]
    }),
    project({
      slug: 'mandibular-fracture', tier: 'medical-core', period: '2021.12 – 2023.02', evidenceState: 'verified', lifecycleState: 'completed',
      capabilityKeys: ['registration', 'medical-navigation'], route: 'projects/mandibular-fracture/',
      tech: ['Python', 'Open3D', 'OpenCV', 'SciPy', 'PCA', 'ICP', 'CLPSO', '3D Slicer'],
      media: {
        lead: { id: 'mandibular-fracture-lead-01', type: 'image', status: 'approved', publicPath: 'assets/projects/mandibular-fracture/mandibular-fracture-lead-01.png' },
        references: [{ id: 'mandibular-publication', type: 'publication', status: 'approved', publicPath: 'https://link.springer.com/article/10.1007/s10278-024-01014-z' }],
        gallery: [
          { id: 'mandibular-fracture-gallery-01', type: 'image', status: 'approved', publicPath: 'assets/projects/mandibular-fracture/mandibular-fracture-gallery-01.png', translations: { ko: { caption: '치아 랜드마크 추출 — 상악 정렬·치열궁 곡선·단면·중심구·협측 교두', alt: '상악 모델 정렬, 치열궁 피팅, 수직 단면, 그래프 피크, 중심구와 설측 교두 추출 과정 그림' }, en: { caption: 'Dental landmark extraction: maxilla alignment, arch-line fit, slicing, central groove, and buccal cusp', alt: 'Figure showing maxilla alignment, arch-line fitting, perpendicular slicing, graph peaks, and central-groove and lingual-cusp extraction' } } },
          { id: 'mandibular-fracture-gallery-02', type: 'image', status: 'approved', publicPath: 'assets/projects/mandibular-fracture/mandibular-fracture-gallery-02.png', translations: { ko: { caption: '골절편의 일반 위치 맞춤 — 치열궁 정렬·골절면 특징·중첩 오차', alt: '상악 치열궁에 맞춘 두 하악골 골절편, 협측 교두 추출, 골절면 특징점과 비틀림·부피 중첩 오차 그림' }, en: { caption: 'General positioning of fracture segments: arch alignment, fracture-surface features, and overlap error', alt: 'Figure of two mandibular segments aligned to the maxillary arch, buccal-cusp extraction, fracture-section features, and twisting and volume-overlap error' } } },
          { id: 'mandibular-fracture-gallery-03', type: 'image', status: 'approved', publicPath: 'assets/projects/mandibular-fracture/mandibular-fracture-gallery-03.png', translations: { ko: { caption: '다양한 골절·치아 조건의 표면 거리 맵 — 10–4 분할, 11–3 분할, 치아 2개 결손', alt: '세 가지 골절·결손 조건에서 정복 모델의 표면 거리 맵' }, en: { caption: 'Surface-distance maps for different fracture and tooth conditions: 10–4 split, 11–3 split, two missing teeth', alt: 'Surface-distance maps of the reduction model in three fracture and tooth-loss conditions' } } },
          { id: 'mandibular-fracture-gallery-04', type: 'image', status: 'approved', publicPath: 'assets/projects/mandibular-fracture/mandibular-fracture-gallery-04.png', translations: { ko: { caption: '치열궁 기반 하악 분절 정렬(ACCAS 2022 발표)', alt: '상악 치열궁을 거울 대칭해 두 하악 분절을 정렬하는 개념도' }, en: { caption: 'Arch-line-based alignment of mandibular segments (ACCAS 2022)', alt: 'Concept figure aligning two lower segments to the mirrored upper arch' } } },
          { id: 'mandibular-fracture-gallery-05', type: 'image', status: 'approved', publicPath: 'assets/projects/mandibular-fracture/mandibular-fracture-gallery-05.png', translations: { ko: { caption: 'ACCAS 2022(태국 콘캔) 발표 현장', alt: 'ACCAS 2022 학회 배너 앞에 선 발표자' }, en: { caption: 'Presenting at ACCAS 2022, Khon Kaen', alt: 'Presenter standing in front of the ACCAS 2022 conference banner' } } },
        ]
      },
      pdf: { ko: 'assets/pdfs/mandibular-fracture-ko.pdf', en: 'assets/pdfs/mandibular-fracture-en.pdf' },
      pdfSequence: {
        middle: ['clinical-question', 'research-pipeline', 'published-evidence', 'research-boundary'],
        evidenceId: 'mandibular-fracture-lead-01',
        diagram: {
          kind: 'optimization-loop',
          translations: {
            ko: { title: '교합 제약 기반 최적화 검증 루프', nodes: ['교합 표적', '특징·표면', '최적화·시뮬레이션', '실험·논문'] },
            en: { title: 'Occlusion-constrained optimization loop', nodes: ['Occlusion target', 'Features and surfaces', 'Optimization and simulation', 'Experiments and paper'] }
          }
        }
      },
      links: [{ href: 'https://link.springer.com/article/10.1007/s10278-024-01014-z', translations: { ko: { label: '게재 논문' }, en: { label: 'Publication' } } }],
      translations: {
        ko: {
          title: '하악골 골절 정복 최적화', shortTitle: '하악골 골절 정복', eyebrow: '의료 코어 · 검증된 연구',
          thesis: '모호한 임상 문제를 검증 가능한 3D 정합과 최적화 문제로 바꿉니다.',
          summary: '치아 특징점과 골절 단면을 이용해 하악골 골절편 위치를 최적화하는 수술계획 시뮬레이터와 실험 파이프라인을 구성했습니다.',
          problem: '기하학적으로 가능한 여러 정복 위치 중 교합 관계를 반영하는 재현 가능한 표적이 필요했습니다.',
          role: '문제 정의, 특징·최적화 설계, 시뮬레이터, 실험·분석, 논문으로 이어지는 연구 파이프라인을 공동으로 리드했고 공동 제1저자로 참여했습니다.',
          teamResult: '공동 연구팀은 국제·국내 학술대회 발표, 수상, 동료심사 논문을 남겼습니다.',
          evidence: 'ACCAS 2022 발표, 2022 국내 학술대회 발표, 2023 우수논문상, 2024 Q1 SCIE 동료심사 논문, 정량 실험이 근거입니다.',
          limitation: '공개 근거는 게재 논문 그림과 발표 자료이며 임상 적용이나 단독 제1저자를 주장하지 않습니다.',
          collaboration: '임상 문제 해석, 알고리즘, 실험 설계, 논문 작성을 공동 연구로 수행했습니다.',
          mediaAlt: '골절 전 하악골과 정복 모델 사이의 표면 거리 맵 6개 패널.', mediaCaption: '골절 전 하악골과 정복 모델 사이의 표면 거리 맵입니다(게재 논문 그림 3 일부).',
          status: '검증됨 · 완료', cardProblem: '모호한 정복 위치를 검증 가능한 3D 최적화 문제로 정의했습니다.', cardOwnedRole: '문제 정의부터 실험·논문까지 공동 리드했습니다.', cardEvidence: '게재 논문 그림·학회 발표·Q1 SCIE 논문·정량 실험.', problemSummary: '교합 제약을 반영한 재현 가능한 정복 표적을 정의합니다.', ownedRole: '연구 파이프라인을 공동 리드한 공동 제1저자입니다.', verifiedEvidence: '학술대회 발표, 수상, Q1 SCIE 논문 그림, 정량 실험.', visualAlt: '하악골 정복 표면 거리 맵.', visualCaption: '표면 거리 맵(논문 그림 3 일부).'
        },
        en: {
          title: 'Mandibular Fracture Reduction Optimization', shortTitle: 'Mandibular Fracture Optimization', eyebrow: 'Medical Core · Verified Research',
          thesis: 'Convert an ambiguous clinical problem into a testable 3D registration and optimization problem.',
          summary: 'Built a surgical-planning simulator and experiment pipeline that optimizes mandibular fragment pose using dental features and fracture surfaces.',
          problem: 'Many geometrically plausible reductions existed; the planning target needed a reproducible constraint grounded in occlusion.',
          role: 'Jointly led the research pipeline across problem definition, feature and optimization design, simulator, experiments and analysis, and paper, serving as a co-first author.',
          teamResult: 'The joint research team produced international and domestic presentations, an award, and a peer-reviewed publication.',
          evidence: 'ACCAS 2022, a 2022 domestic conference, a 2023 best-paper award, a 2024 Q1 SCIE peer-reviewed paper, and quantitative experiments provide the evidence.',
          limitation: 'Public evidence is the published figures and presentation material; no clinical use or sole first authorship is claimed.',
          collaboration: 'Clinical interpretation, algorithm design, experiment design, and writing were conducted as joint research.',
          mediaAlt: 'Six-panel surface-distance map between the pre-fracture mandible and the reduction model.', mediaCaption: 'Surface-distance maps between the pre-fracture mandible and the reduction model (part of Fig. 3 in the published paper).',
          status: 'Verified · Completed', cardProblem: 'Frame an ambiguous reduction as a testable 3D optimization problem.', cardOwnedRole: 'Jointly led the pipeline from problem framing through experiments and paper.', cardEvidence: 'Published figures, conference presentation, Q1 SCIE paper, and quantitative experiments.', problemSummary: 'Use occlusion constraints to define a reproducible reduction target.', ownedRole: 'Jointly led the research pipeline and served as a co-first author.', verifiedEvidence: 'Conference presentations, award, Q1 SCIE paper figures, and quantitative experiments.', visualAlt: 'Mandibular reduction surface-distance maps.', visualCaption: 'Surface-distance maps (part of paper Fig. 3).'
        }
      },
      blocks: [
        { key: 'clinical-question', type: 'text', translations: { ko: { heading: '문제 정의', body: '교합 관계를 재현 가능한 정복 표적으로 정의했습니다.' }, en: { heading: 'Problem definition', body: 'Defined occlusion as a reproducible target for fracture reduction.' } } },
        { key: 'research-pipeline', type: 'list', translations: { ko: { heading: '연구 파이프라인', items: ['특징 설계', '최적화', '시뮬레이터', '실험·분석', '논문'] }, en: { heading: 'Research pipeline', items: ['Feature design', 'Optimization', 'Simulator', 'Experiments and analysis', 'Paper'] } } },
        { key: 'published-evidence', type: 'evidence', translations: { ko: { heading: '공개 근거', body: '발표, 수상, 정량 실험, 동료심사 논문을 서로 구분해 제시합니다.' }, en: { heading: 'Published evidence', body: 'Separate presentations, award, quantitative experiments, and the peer-reviewed publication.' } } },
        { key: 'research-boundary', type: 'limitation', translations: { ko: { heading: '연구 경계', body: '준비된 데이터셋의 연구 결과이며 일상 임상 사용을 주장하지 않습니다.' }, en: { heading: 'Research boundary', body: 'Prepared-dataset results do not establish routine clinical use.' } } }
      ]
    }),
    project({
      slug: 'life-careverse', tier: 'medical-core', period: '2023.07 – present', evidenceState: 'ongoing', lifecycleState: 'ongoing',
      capabilityKeys: ['xr-engineering', 'medical-navigation'], route: 'projects/life-careverse/',
      tech: ['Unity 6', 'Photon PUN2', 'Photon Voice', 'OpenXR / Android XR', 'Meta Quest 3 · Galaxy XR', 'DICOM 3D'],
      media: {
        lead: { id: 'life-careverse-clip-01', type: 'video', status: 'approved', publicPath: 'assets/projects/life-careverse/life-careverse-clip-01.mp4' },
        video: { id: 'life-careverse-clip-01', type: 'video', status: 'approved', publicPath: 'assets/projects/life-careverse/life-careverse-clip-01.mp4' },
        poster: { id: 'life-careverse-poster-01', type: 'image', status: 'approved', publicPath: 'assets/projects/life-careverse/life-careverse-poster-01.png' },
        gallery: [
          { id: 'life-careverse-gallery-01', type: 'image', status: 'approved', publicPath: 'assets/projects/life-careverse/life-careverse-gallery-01.png', translations: { ko: { caption: 'VR 상담실 공간 배치 — 원형 테이블 3석과 공유 스크린', alt: '원형 테이블을 둘러싼 의자 3개, 벽면 공유 스크린, 조작 패널이 배치된 VR 상담실 조감도' }, en: { caption: 'VR consultation room layout: three seats around a round table and a shared screen', alt: 'Overhead view of the VR consultation room with three chairs around a round table, a wall-mounted shared screen, and a control panel' } } },
          { id: 'life-careverse-gallery-02', type: 'image', status: 'approved', publicPath: 'assets/projects/life-careverse/life-careverse-gallery-02.png', translations: { ko: { caption: '세 시점에 동일하게 표시되는 수술계획 계측 패널', alt: '세 참가자 시점을 나란히 놓은 화면으로, 각 화면의 공유 스크린이 같은 계측표와 치열궁 도해를 보여준다' }, en: { caption: 'The surgical-plan measurement panel shown identically from all three viewpoints', alt: 'Three participant viewpoints side by side, each shared screen showing the same measurement table and dental-arch diagram' } } },
          { id: 'life-careverse-gallery-03', type: 'image', status: 'approved', publicPath: 'assets/projects/life-careverse/life-careverse-gallery-03.png', translations: { ko: { caption: '상악 분절을 떼어낸 상태가 세 시점에 함께 반영된 장면', alt: '두개골에서 보라색 상악 분절이 분리된 3D 모델과, 같은 상태를 보고 있는 아바타 두 명' }, en: { caption: 'A detached maxillary segment reflected across all three viewpoints at once', alt: 'A 3D model with the purple maxillary segment separated from the skull, and two avatars viewing the same state' } } },
          { id: 'life-careverse-gallery-04', type: 'image', status: 'approved', publicPath: 'assets/projects/life-careverse/life-careverse-gallery-04.png', translations: { ko: { caption: '병원 대기공간에서 진행한 착용 세션 (얼굴은 비식별 처리)', alt: '병원 대기공간 의자에 앉아 헤드셋을 쓰고 컨트롤러를 든 참가자 두 명, 얼굴은 모자이크 처리되어 있다' }, en: { caption: 'A headset session run in a hospital waiting area (faces de-identified)', alt: 'Two participants seated in a hospital waiting area wearing headsets and holding controllers, faces pixelated' } } },
        ]
      },
      pdf: { ko: 'assets/pdfs/life-careverse-ko.pdf', en: 'assets/pdfs/life-careverse-en.pdf' },
      pdfSequence: {
        middle: ['shared-state', 'xr-application', 'multiuser-demo', 'adoption-boundary'],
        evidenceId: 'life-careverse-clip-01',
        diagram: {
          kind: 'sync-topology',
          translations: {
            ko: { title: '3인 세션 공유 상태', nodes: ['의사·환자 3인 세션', 'PUN2 공유 상태', 'Photon Voice', 'DICOM 3D · 계측 패널'] },
            en: { title: 'Three-user shared state', nodes: ['Three-user session', 'PUN2 shared state', 'Photon Voice', 'DICOM 3D and measurements'] }
          }
        }
      },
      translations: {
        ko: {
          title: 'OMFS VR — 멀티유저 수술상담', shortTitle: 'OMFS VR', eyebrow: '의료 코어 · 멀티유저 VR',
          thesis: '의료진과 환자가 같은 VR 상담실에 동시 접속해 하나의 3D 악골 모델과 수술계획을 함께 보는 애플리케이션을 구현합니다.',
          summary: '접속 순서로 역할이 정해지는 3인 VR 상담 세션을 Unity와 Photon PUN2·Voice로 구현하고, 환자 CT에서 만든 3D 악골 모델과 계측 패널을 세 시점이 같은 상태로 공유하도록 만들었습니다.',
          problem: '턱교정 수술 상담은 2D 계측과 3D 골격 변화를 같이 설명해야 하는데, 모니터 한 대를 함께 보는 방식으로는 의료진과 환자가 같은 지점을 보고 있는지 확인할 방법이 없었습니다.',
          role: 'Unity 클라이언트 전체를 맡아 Photon 룸과 역할 배정, 모델 자세·분절·페이지 상태 동기화, 음성 채팅과 발화자 표시, DICOM 볼륨 로딩, 백엔드 연동을 구현했고, 특정 제조사 SDK 의존을 걷어내고 OpenXR·Android XR로 옮기는 이식까지 수행했습니다.',
          teamResult: '소프트웨어 저작권 등록과 환자 데모·설문, 외부 기관 실증 계획은 연구팀 공동 결과이며 각각의 범위를 구분해 적습니다.',
          evidence: '세 참가자 시점을 동시에 녹화한 상담 세션 클립이 근거입니다. 한 사람이 모델을 움직이면 세 화면이 같은 자세와 같은 계측값을 보여줍니다.',
          limitation: '클립은 동기화와 공간 배치가 동작함을 보여줄 뿐, 상담 품질이나 치료 결과가 나아졌다고 주장하지 않습니다.',
          collaboration: '구강악안면외과 의료진이 상담 시나리오와 화면 구성을 검토했고, 연구팀과 함께 착용 세션을 진행했습니다.',
          mediaAlt: '같은 VR 상담실을 세 참가자 시점에서 동시에 보여주는 3분할 화면. 세 화면 모두 같은 3D 두개골·악골 모델을 표시한다.', mediaCaption: '3인 VR 상담 세션을 참가자별 시점으로 동시에 녹화한 24초 클립입니다. 한 사람이 모델을 움직이면 세 화면에 같이 반영됩니다.',
          status: '진행 중', cardProblem: '의료진과 환자가 같은 3D 수술계획을 같은 상태로 봅니다.', cardOwnedRole: '3인 VR 상담 Unity 클라이언트 전체를 구현했습니다.', cardEvidence: '세 시점을 동시에 녹화한 상담 세션 클립이 근거입니다.', problemSummary: '3인이 같은 VR 공간에서 같은 수술계획을 보게 만듭니다.', ownedRole: 'Photon 동기화부터 DICOM 로딩, 플랫폼 이식까지 클라이언트를 구현했습니다.', verifiedEvidence: '세 시점이 같은 모델 자세와 계측값을 보여주는 상담 세션 클립이 근거입니다.', visualAlt: '3인 VR 상담 세션의 3분할 동시 시점.', visualCaption: '3인 VR 상담 세션 동시 시점 클립.'
        },
        en: {
          title: 'OMFS VR — Multi-user surgical consultation', shortTitle: 'OMFS VR', eyebrow: 'Medical Core · Multi-user VR',
          thesis: 'Build an application where clinicians and a patient join the same VR consultation room and look at one shared 3D jaw model and surgical plan together.',
          summary: 'Built a three-user VR consultation session in Unity with Photon PUN2 and Voice, where roles are assigned by join order and all three viewpoints share the same state of a CT-derived 3D jaw model and its measurement panel.',
          problem: 'Orthognathic consultation has to explain 2D measurements and 3D skeletal change at once, and gathering around a single monitor gave no way to confirm that clinician and patient were looking at the same thing.',
          role: 'Owned the Unity client end to end: Photon rooms and role assignment, synchronization of model pose, segments, and page state, voice chat with speaker indication, DICOM volume loading, and backend integration, then carried out the port off a vendor-specific SDK onto OpenXR and Android XR.',
          teamResult: 'Software copyright registration, the patient demonstration and survey, and the planned external validation are joint research-team results, each stated only to its own scope.',
          evidence: 'A consultation-session clip recorded simultaneously from all three participant viewpoints is the evidence: when one person moves the model, all three views show the same pose and the same measurements.',
          limitation: 'The clip shows that synchronization and spatial layout work; it claims no improvement in consultation quality or treatment outcome.',
          collaboration: 'Oral and maxillofacial surgeons reviewed the consultation scenario and screen layout, and ran the headset sessions with the research team.',
          mediaAlt: 'A three-panel view showing the same VR consultation room from three participant viewpoints at once, each displaying the same 3D skull and jaw model.', mediaCaption: 'A 24-second clip of a three-user VR consultation session recorded from each participant viewpoint at once; moving the model in one view updates all three.',
          status: 'Ongoing', cardProblem: 'Let clinicians and a patient see the same 3D surgical plan in the same state.', cardOwnedRole: 'Implemented the whole Unity client for the three-user VR consultation.', cardEvidence: 'A consultation-session clip recorded from three viewpoints at once is the evidence.', problemSummary: 'Put three people in one VR space looking at the same surgical plan.', ownedRole: 'Implemented the client from Photon synchronization to DICOM loading and the platform port.', verifiedEvidence: 'A consultation clip in which all three viewpoints show the same model pose and measurements is the evidence.', visualAlt: 'Three simultaneous viewpoints of a three-user VR consultation session.', visualCaption: 'Simultaneous three-viewpoint clip of a VR consultation session.'
        }
      },
      blocks: [
        { key: 'shared-state', type: 'system', translations: { ko: { heading: '공유 상태', body: '접속 순서로 의사·환자·의사 세 역할을 배정하고, 모델 자세와 분절 상태, 페이지 번호, 발화자 표시를 세 참가자에게 같이 반영했습니다.' }, en: { heading: 'Shared state', body: 'Assigned the clinician, patient, and clinician roles by join order, and reflected model pose, segment state, page number, and speaker indication to all three participants together.' } } },
        { key: 'xr-application', type: 'text', translations: { ko: { heading: '클라이언트 범위', body: '로그인에서 로비를 거쳐 상담룸으로 들어가는 흐름을 만들고, 백엔드에서 받은 환자 케이스를 고르면 해당 CT 볼륨을 3D와 단면으로 불러오도록 했습니다. 이후 입력·카메라 구성을 특정 제조사 SDK에서 OpenXR·Android XR 표준으로 옮겨 같은 빌드가 여러 헤드셋에서 돌아가게 정리했습니다.' }, en: { heading: 'Client scope', body: 'Built the login to lobby to consultation-room flow, so that selecting a patient case served by the backend loads that CT volume as both a 3D model and cross-sections, then moved the input and camera rig off a single vendor SDK onto the OpenXR and Android XR standards so one build runs on more than one headset.' } } },
        { key: 'multiuser-demo', type: 'evidence', translations: { ko: { heading: '멀티유저 시연', body: '세 참가자의 시점을 동시에 녹화해, 한쪽의 조작이 나머지 두 화면에 같은 상태로 나타나는지를 근거로 삼습니다.' }, en: { heading: 'Multi-user demonstration', body: 'Recording all three viewpoints at once makes the evidence checkable: one participant manipulates, and the other two views show the same state.' } } },
        { key: 'adoption-boundary', type: 'limitation', translations: { ko: { heading: '채택 경계', body: '연구팀의 등록·데모·실증 계획을 개인 성과나 임상 효과로 확대하지 않습니다.' }, en: { heading: 'Adoption boundary', body: 'Do not turn the research team registration, demonstrations, or validation plans into individual or clinical-outcome claims.' } } }
      ]
    }),
    project({
      slug: 'rtms-navigation', tier: 'medical-core', period: '2024.07 – present', evidenceState: 'verified', lifecycleState: 'ongoing',
      capabilityKeys: ['medical-navigation', 'registration'], route: 'projects/rtms-navigation/',
      tech: ['3D Slicer', 'VTK', 'PyQt5', 'Python', 'PyTorch', 'Optical tracking', 'TCP/IP binary protocol', 'License gating'],
      media: {
        lead: { id: 'rtms-navigation-lead-01', type: 'image', status: 'approved', publicPath: 'assets/projects/rtms-navigation/rtms-navigation-lead-01.png' },
        gallery: [
          { id: 'rtms-navigation-gallery-01', type: 'image', status: 'approved', publicPath: 'assets/projects/rtms-navigation/rtms-navigation-gallery-01.png', translations: { ko: { caption: 'NeuroPilot 표적 설정 화면 — 대뇌 피질 표면 모델 위의 자극 표적 라벨', alt: '반투명 대뇌 표면 모델 위에 LEFT_DLPFC 등 자극 표적 구가 표시된 NeuroPilot 3D 뷰' }, en: { caption: 'NeuroPilot target view: stimulation targets labelled on the cortical surface model', alt: 'NeuroPilot 3D view with stimulation-target spheres such as LEFT_DLPFC on a translucent cortical surface model' } } },
        ]
      },
      pdf: { ko: 'assets/pdfs/rtms-navigation-ko.pdf', en: 'assets/pdfs/rtms-navigation-en.pdf' },
      pdfSequence: {
        middle: ['navigation-ui-workflow', 'coordinate-registration-chain', 'device-system-integration', 'clinical-product-boundary'],
        evidenceId: 'rtms-navigation-lead-01',
        diagram: {
          kind: 'navigation-loop',
          translations: {
            ko: { title: '입력에서 조준 안내까지의 좌표 루프', nodes: ['트래커·태블릿 입력', '랜드마크+ICP 정합', '환자-코일 변환 체인', 'Slicer 내비게이션 UI'] },
            en: { title: 'Coordinate loop from input to aiming guidance', nodes: ['Tracker + tablet input', 'Landmark + ICP registration', 'Patient-coil transform chain', 'Slicer navigation UI'] }
          }
        }
      },
      translations: {
        ko: {
          title: 'rTMS 코일 내비게이션 소프트웨어 (NeuroPilot)', shortTitle: 'NeuroPilot 코일 내비게이션', eyebrow: '의료 코어 · 검증됨',
          thesis: '광학 트래킹과 3D Slicer를 라이선스로 배포되는 코일 내비게이션 제품으로 완성해, 시술자가 믿고 쓸 수 있는 위치·각도 안내를 만듭니다.',
          summary: '3D Slicer 위에 시술 준비부터 실시간 코일 내비게이션까지 이어지는 화면 흐름, 랜드마크·ICP 정합 엔진, 광학 트래커·태블릿·로봇 연동, 라이선스 기반 제품 구조를 설계해 고객사에 납품하고 계속 유지보수합니다.',
          problem: '서로 다른 좌표계에 있는 의료영상, 트래커, 태블릿, 로봇을 하나의 검증 가능한 흐름으로 묶어야 했습니다.',
          role: '3D Slicer 기반 시술 준비·내비게이션 화면 흐름, 랜드마크와 ICP를 함께 쓰는 정합 엔진과 좌표 변환 체인, 광학 트래커 SDK 마이그레이션·태블릿 프로토콜·로봇 연동, 라이선스 검증과 옵션 기능 게이팅을 포함한 제품 구조를 리드했습니다.',
          teamResult: 'AT&C가 라이선스 운영과 도입을 판단합니다. 정합·좌표 변환·내비게이션 UI 구조는 직접 설계했고 일부 화면 모듈은 동료 한 명과 함께했습니다.',
          evidence: '라이선스로 기능이 게이팅되는 실제 배포 빌드, 이슈 단위로 쌓아 온 회귀 테스트 스위트, 좌표 변환·정합 동작 로그가 근거입니다.',
          limitation: '임상적 유효성, 정량 정확도, 인허가 상태는 주장하지 않고 환자 데이터도 포함하지 않습니다.',
          collaboration: '분할·랜드마크 검출 모델은 외부에서 받아 어댑터 경계 뒤에 통합했고, 그 경계 설계와 후처리·라이선스 게이팅·UI 연동이 제 몫입니다.',
          mediaAlt: '추적 장치·환자 마커·코일 마커 상태와 표적 거리·기울기 안내가 표시된 NeuroPilot 내비게이션 모듈 화면.', mediaCaption: 'NeuroPilot 내비게이션 모듈 화면입니다 — 추적 장치·환자 마커·코일 마커 상태, 표적까지의 거리·기울기 안내, 조준 가이드(프로젝트 경로는 가림).',
          status: '검증됨 · 진행 중', cardProblem: '서로 다른 좌표계의 장치를 하나의 제품 흐름으로 묶습니다.', cardOwnedRole: '화면 흐름·정합 엔진·장치 연동·제품 구조를 리드했습니다.', cardEvidence: '라이선스 게이팅 배포 빌드와 회귀 테스트 스위트.', problemSummary: '트래커·태블릿·로봇을 하나의 내비게이션 제품으로 묶습니다.', ownedRole: '화면 흐름, 정합 엔진, 장치 연동, 제품 구조를 리드했습니다.', verifiedEvidence: '라이선스 게이팅 배포 빌드와 이슈별 회귀 테스트가 근거이며 임상 결과는 주장하지 않습니다.', visualAlt: 'NeuroPilot 코일 내비게이션 모듈 화면.', visualCaption: 'NeuroPilot 코일 내비게이션 모듈 화면입니다.'
        },
        en: {
          title: 'rTMS Coil Navigation Software (NeuroPilot)', shortTitle: 'NeuroPilot Coil Navigation', eyebrow: 'Medical Core · Verified',
          thesis: 'Turn optical tracking and 3D Slicer into a license-gated coil-navigation product that gives operators position and angle guidance they can rely on.',
          summary: 'Designed the 3D Slicer workflow from procedure setup to real-time coil navigation, the landmark-and-ICP registration engine, tracker, tablet, and robot integration, and a license-gated product structure.',
          problem: 'Medical images, a tracker, a tablet, and a robot each sit in their own coordinate frame and had to become one verifiable flow.',
          role: 'Led the 3D Slicer procedure-setup and navigation workflow, the registration engine combining landmarks and ICP with its coordinate-transform chain, the optical-tracker SDK migration with the tablet protocol and robot integration, and the product structure covering license verification and optional-feature gating.',
          teamResult: 'AT&C owns license operations and adoption. I designed the core structure; a colleague built specific screens.',
          evidence: 'The evidence is the license-gated deployment build, a regression-test suite grown issue by issue, and coordinate-transform and registration logs.',
          limitation: 'No clinical efficacy, quantitative accuracy, or regulatory status is claimed, and patient data stays out of this case.',
          collaboration: 'The segmentation and landmark models were supplied externally and integrated behind an adapter boundary. I own that boundary, the post-processing, the license gating, and the UI integration.',
          mediaAlt: 'NeuroPilot navigation module screen showing tracker, patient-marker and coil-marker status with distance and tilt guidance to the target.', mediaCaption: 'NeuroPilot navigation module: tracker, patient-marker and coil-marker status, distance and tilt guidance to the target, and the aiming guide (project path hidden).',
          status: 'Verified · Ongoing', cardProblem: 'Tie devices in different coordinate frames into one product flow.', cardOwnedRole: 'Led the workflow, registration engine, device integration, and product structure.', cardEvidence: 'A license-gated build and a regression-test suite.', problemSummary: 'Tie the tracker, tablet, and robot into one navigation product.', ownedRole: 'Led the workflow, registration engine, device integration, and product structure.', verifiedEvidence: 'The license-gated deployment build and issue-tracked regression tests are the evidence; no clinical outcome is claimed.', visualAlt: 'NeuroPilot coil-navigation module screen.', visualCaption: 'NeuroPilot coil-navigation module screen.'
        }
      },
      blocks: [
        { key: 'navigation-ui-workflow', type: 'system', translations: { ko: { heading: '내비게이션 UI 워크플로', body: '홈 화면 여섯 메뉴가 DICOM 적재부터 재구성·정합·표적 설정·실시간 세션까지 단계를 게이팅하고, 조준은 과녁 뷰와 거리·기울기 안내로 합니다.' }, en: { heading: 'Navigation UI workflow', body: 'Six Home-screen menus gate the run from DICOM load through reconstruction, registration, and targets to the live session, with crosshair aiming.' } } },
        { key: 'coordinate-registration-chain', type: 'text', translations: { ko: { heading: '좌표 변환·정합 엔진', body: '영상·환자·트래커·코일 변환 체인을 명시하고, ICP 정합을 세 가지 모드로 나눴습니다.' }, en: { heading: 'Coordinate and registration engine', body: 'Image, patient, tracker, and coil transforms stay explicit; ICP offers three modes.' } } },
        { key: 'device-system-integration', type: 'evidence', translations: { ko: { heading: '장치·시스템 통합', body: '트래커 SDK 메이저 버전 마이그레이션, 자체 TCP 바이너리 프로토콜, 트래커 단일 소유권, 로봇 접촉 정지 연동.' }, en: { heading: 'Device and system integration', body: 'A major optical-tracker SDK migration, an in-house TCP binary protocol for the tablet, single tracker ownership, and contact-stop robot descent.' } } },
        { key: 'clinical-product-boundary', type: 'limitation', translations: { ko: { heading: '임상·제품 경계', body: '임상적 유효성, 정량 정확도, 인허가 상태는 주장하지 않습니다.' }, en: { heading: 'Clinical and product boundary', body: 'No clinical efficacy, quantitative accuracy, or regulatory status is claimed.' } } }
      ]
    }),
    project({
      slug: 'respiratory-surface-guidance', tier: 'medical-core', period: '2026.06 – present', evidenceState: 'ongoing', lifecycleState: 'research',
      capabilityKeys: ['registration', 'sensor-fusion', 'medical-navigation'], route: 'projects/respiratory-surface-guidance/',
      tech: ['ToF camera', 'Structured light', 'Qt', 'VTK', 'OpenCV', 'Python', '4DCT'],
      media: {
        lead: { id: 'respiratory-surface-guidance-lead-01', type: 'image', status: 'approved', publicPath: 'assets/projects/respiratory-surface-guidance/respiratory-surface-guidance-lead-01.png' },
        gallery: [
        ]
      },
      pdf: { ko: 'assets/pdfs/respiratory-surface-guidance-ko.pdf', en: 'assets/pdfs/respiratory-surface-guidance-en.pdf' },
      pdfSequence: {
        middle: ['surface-to-signal', 'sensor-validation', 'measured-precision', 'research-boundary'],
        evidenceId: 'respiratory-surface-guidance-lead-01',
        diagram: {
          kind: 'surface-gating-chain',
          translations: {
            ko: { title: '광학 표면에서 게이팅 신호까지', nodes: ['3D 센서', '표면·ROI 깊이', '호흡 파형', '게이팅·정합 출력'] },
            en: { title: 'Optical surface to gating signal', nodes: ['3D sensor', 'Surface and ROI depth', 'Respiratory waveform', 'Gating and registration output'] }
          }
        }
      },
      translations: {
        ko: {
          title: '표면유도 호흡추적 (SGRT)', shortTitle: '표면유도 호흡추적', eyebrow: '의료 코어 · 방사선치료 연구',
          thesis: '환자 체표면을 광학 3D로 읽어 셋업 정합과 호흡 게이팅 신호를 만드는 표면유도 방사선치료(SGRT)의 광학 파트를 국산 센서 스택으로 구성합니다.',
          summary: 'K-LINAC 대과제(주관 한국전기연구원, 세부주관 ETRI)의 디지트랙 위탁 연구로, 원거리 표면 재구성과 근거리 실시간 호흡 추적을 상용 3D 센서로 구현하는 초기 단계 연구입니다.',
          problem: '치료 중 환자의 위치와 호흡을 추가 촬영·피부 마킹 없이 알아야 하는데, 기존 상용 시스템은 고가의 외산이며 센서·알고리즘 선택 근거가 공개되어 있지 않습니다.',
          role: '센서 검증 실험을 총괄하며 자체 검증 도구 DtDepthScan(Qt·VTK·OpenCV)을 개발했고, ROI 깊이에서 호흡 파형과 게이팅 신호를 뽑는 추적 알고리즘 설계·구현, 센서 인터페이스와 전송 프로토콜 정의, 과제 실무를 담당합니다.',
          teamResult: '컨소시엄이 4DCT 재구성, 영상유도 체계, 임상 자문을 나누어 맡고 있으며 임상 기관은 서울성모병원 방사선종양학과입니다. 과제 전체 성과를 개인 성과로 쓰지 않습니다.',
          evidence: '상용 3D 센서 5종을 0.5~3 m 거리에서 실리콘 인체 팬텀으로 측정한 정밀도(σ)·실측 fps·Fill rate 표와 DtDepthScan 화면이 본인 측정 근거입니다.',
          limitation: '1차년도 센서 검증 결과이며 임상 성능이나 과제 목표 달성을 주장하지 않고 과제 목표치·연구비·타 기관 지표는 싣지 않습니다.',
          collaboration: '방사선종양학, 4DCT 재구성, 영상유도 체계, 통합 제어 담당 기관과 인터페이스를 맞춥니다.',
          mediaAlt: '상용 3D 센서 5종의 거리별 정밀도 σ·fps·유효 픽셀 비율 실측표.', mediaCaption: '상용 3D 센서 5종의 거리별 정밀도 실측표(본인 측정, 자체 검증 도구 DtDepthScan)입니다.',
          status: '진행 중 · 연구', cardProblem: '추가 촬영 없이 환자 표면과 호흡을 읽는 광학 파트를 국산 센서로 구성합니다.', cardOwnedRole: '센서 검증 실험·검증 도구·호흡 추적 알고리즘·인터페이스를 담당합니다.', cardEvidence: '센서 5종 거리별 정밀도 실측표; 임상 성능은 주장하지 않습니다.', problemSummary: '광학 표면 기반 셋업 정합과 호흡 게이팅 신호를 국산 센서로 만듭니다.', ownedRole: '센서 검증·검증 도구·호흡 추적 알고리즘·프로토콜을 담당합니다.', verifiedEvidence: '본인이 측정한 센서 정밀도·fps·Fill rate 표가 근거입니다.', visualAlt: '센서 정밀도 실측표.', visualCaption: '센서 5종 거리별 정밀도 실측표.'
        },
        en: {
          title: 'Surface-guided Respiratory Tracking (SGRT)', shortTitle: 'Surface-guided Respiratory Tracking', eyebrow: 'Medical Core · Radiotherapy Research',
          thesis: 'Build the optical part of surface-guided radiotherapy — patient-surface setup registration and respiratory gating — on a domestic 3D sensor stack.',
          summary: 'An early-stage research assignment contracted to DIGITRACK within the K-LINAC programme (led by KERI, imaging sub-project led by ETRI): far-field surface reconstruction and near-field real-time breathing tracking with commercial 3D sensors.',
          problem: 'Patient position and breathing must be known during treatment without extra imaging or skin marks; the existing commercial system is imported and its sensor and algorithm choices are not documented publicly.',
          role: 'Lead the sensor validation campaign and wrote the in-house validation tool DtDepthScan (Qt, VTK, OpenCV); design and implement the breathing-tracking algorithm from ROI depth to respiratory waveform and gating signal; define the sensor interface and transport protocol; run day-to-day project work.',
          teamResult: 'Consortium partners own 4DCT reconstruction, the image-guidance framework, and clinical advice; the clinical partner is the radiation oncology department of Seoul St. Mary\'s Hospital. Programme-level results are not attributed to me.',
          evidence: 'My own measurements: precision (σ), measured fps, and fill rate for five commercial 3D sensors at 0.5–3 m against a silicone body phantom, plus DtDepthScan captures.',
          limitation: 'First-year sensor validation only; no clinical performance or programme-target achievement is claimed, and programme targets, budgets, and metrics of other institutions are not published here.',
          collaboration: 'Interfaces are agreed with radiation oncology, 4DCT reconstruction, image guidance, and integrated-control partners.',
          mediaAlt: 'Measured precision σ, fps, and fill rate of five commercial 3D sensors by distance.', mediaCaption: 'Measured precision of five commercial 3D sensors by distance (author-measured with the in-house tool DtDepthScan).',
          status: 'Ongoing · Research', cardProblem: 'Read patient surface and breathing without extra imaging, on domestic sensors.', cardOwnedRole: 'Own sensor validation, the validation tool, the breathing-tracking algorithm, and interfaces.', cardEvidence: 'Five-sensor precision table by distance; no clinical claim.', problemSummary: 'Surface-based setup registration and gating signals on domestic sensors.', ownedRole: 'Own sensor validation, tooling, tracking algorithm, and protocol.', verifiedEvidence: 'Self-measured precision, fps, and fill-rate table.', visualAlt: 'Sensor precision measurement table.', visualCaption: 'Five-sensor precision table by distance.'
        }
      },
      blocks: [
        { key: 'surface-to-signal', type: 'system', translations: { ko: { heading: '표면에서 신호까지', body: '원거리 센서는 표면 재구성과 계획 CT 정합을, 근거리 센서는 흉·복부 ROI 깊이에서 호흡 파형과 게이팅 신호를 맡도록 역할을 나눴습니다.' }, en: { heading: 'Surface to signal', body: 'Far-field sensors reconstruct the surface for planning-CT registration; near-field sensors turn chest and abdomen ROI depth into a respiratory waveform and gating signal.' } } },
        { key: 'sensor-validation', type: 'text', translations: { ko: { heading: '센서 검증 설계', body: '카메라 추상화 구조의 DtDepthScan으로 센서 5종을 같은 절차(거리 5구간, 회당 500프레임)로 녹화해 정밀도·fps·Fill rate를 비교했습니다.' }, en: { heading: 'Sensor validation design', body: 'DtDepthScan abstracts the camera layer so five sensors run the same protocol — five distances, 500 frames per run — for precision, fps, and fill-rate comparison.' } } },
        { key: 'measured-precision', type: 'evidence', translations: { ko: { heading: '측정 근거', body: '거리별 ROI 평균 깊이의 시간 σ, 노출·워밍업에 따른 변화, 반복 측정 재현성을 표로 남겼습니다.' }, en: { heading: 'Measured evidence', body: 'Temporal σ of ROI mean depth by distance, exposure and warm-up effects, and repeat-measurement reproducibility are tabulated.' } } },
        { key: 'research-boundary', type: 'limitation', translations: { ko: { heading: '연구 경계', body: '1차년도 센서·알고리즘 기초 설계 단계이며 임상 성능이나 과제 목표 달성을 주장하지 않습니다.' }, en: { heading: 'Research boundary', body: 'First-year sensor and algorithm groundwork; no clinical performance or programme-target achievement is claimed.' } } }
      ]
    }),
    project({
      slug: 'skadi-tracking-software', tier: 'platform', period: '2023.02 – present', evidenceState: 'ongoing', lifecycleState: 'ongoing',
      capabilityKeys: ['medical-navigation', 'registration'], route: 'projects/skadi-tracking-software/',
      tech: ['SKADI', 'C++', 'Python API', 'Viewer', '3D Slicer', 'Optical tracking'],
      media: {
        lead: { id: 'skadi-tracking-software-clip-01', type: 'video', status: 'approved', publicPath: 'assets/projects/skadi-tracking-software/skadi-tracking-software-clip-01.mp4' },
        video: { id: 'skadi-tracking-software-clip-01', type: 'video', status: 'approved', publicPath: 'assets/projects/skadi-tracking-software/skadi-tracking-software-clip-01.mp4' },
        poster: { id: 'skadi-tracking-software-poster-01', type: 'image', status: 'approved', publicPath: 'assets/projects/skadi-tracking-software/skadi-tracking-software-poster-01.png' },
        gallery: [
          { id: 'skadi-tracking-software-gallery-01', type: 'image', status: 'approved', publicPath: 'assets/projects/skadi-tracking-software/skadi-tracking-software-gallery-01.png', translations: { ko: { caption: 'SKADI Viewer 홈 — 장치 연결, 추적 데이터 표, 영상 스트리밍(네트워크 주소는 가림)', alt: '장치 서버 연결 패널, 마커별 추적 데이터 표, IR 영상 스트리밍 패널이 있는 SKADI Viewer 홈 화면' }, en: { caption: 'SKADI Viewer home: device connection, tracking-data table, and video streaming (network addresses hidden)', alt: 'SKADI Viewer home screen with the device-server panel, per-marker tracking-data table, and IR video-streaming panel' } } },
          { id: 'skadi-tracking-software-gallery-02', type: 'image', status: 'approved', publicPath: 'assets/projects/skadi-tracking-software/skadi-tracking-software-gallery-02.png', translations: { ko: { caption: '추적 뷰 — IR 영상 위의 마커 검출과 프로브·트레이 마커 좌표계', alt: 'IR 영상에 마커 점과 probe·tray marker 좌표축이 겹쳐 표시된 추적 뷰' }, en: { caption: 'Tracking view: marker detection on the IR image with probe and tray-marker frames', alt: 'Tracking view overlaying detected marker points and probe and tray-marker coordinate frames on the IR image' } } },
          { id: 'skadi-tracking-software-gallery-03', type: 'image', status: 'approved', publicPath: 'assets/projects/skadi-tracking-software/skadi-tracking-software-gallery-03.png', translations: { ko: { caption: '추적 기록 뷰어 — 기록된 마커 자세의 3D 재생', alt: '기록된 두 마커의 자세와 궤적을 3D 좌표계에 재생하는 뷰어 화면' }, en: { caption: 'Recording viewer: 3D playback of recorded marker poses', alt: 'Viewer screen replaying the poses and trajectory of two recorded markers in a 3D coordinate frame' } } },
          { id: 'skadi-tracking-software-gallery-04', type: 'image', status: 'approved', publicPath: 'assets/projects/skadi-tracking-software/skadi-tracking-software-gallery-04.png', translations: { ko: { caption: '3D Slicer 커스텀 앱 템플릿 구조 — Loadable·Scripted 모듈과 빌드 산출물', alt: 'src·Applications·Modules(Loadable, Scripted)·Resources와 rel·Slicer-build 산출물로 이어지는 템플릿 구조도' }, en: { caption: '3D Slicer custom-app template layout: Loadable and Scripted modules and build output', alt: 'Diagram of the template layout from src, Applications, Modules (Loadable, Scripted), and Resources to the rel and Slicer-build output' } } },
        ]
      },
      pdf: { ko: 'assets/pdfs/skadi-tracking-software-ko.pdf', en: 'assets/pdfs/skadi-tracking-software-en.pdf' },
      pdfSequence: {
        middle: ['sdk-layers', 'viewer-and-template', 'delivery-evidence', 'hardware-boundary'],
        evidenceId: 'skadi-tracking-software-clip-01',
        diagram: {
          kind: 'tracking-sdk-stack',
          translations: {
            ko: { title: '추적 장치에서 응용까지의 소프트웨어 계층', nodes: ['SKADI 트래커', 'API·SDK', 'Viewer·Slicer 템플릿', '수술내비게이션 응용'] },
            en: { title: 'Software layers from tracker to application', nodes: ['SKADI tracker', 'API and SDK', 'Viewer and Slicer template', 'Surgical-navigation application'] }
          }
        }
      },
      translations: {
        ko: {
          title: 'SKADI 위치추적 소프트웨어 (API·Viewer)', shortTitle: 'SKADI 소프트웨어', eyebrow: '플랫폼 소프트웨어 · 광학 위치추적',
          thesis: '자체 광학식 3차원 위치추적장치 SKADI를 수술내비게이션 기업과 연구기관이 바로 쓸 수 있게 하는 소프트웨어 계층을 만듭니다.',
          summary: 'SKADI의 API·SDK, 장치 상태와 추적 결과를 보여주는 Viewer, 연구자가 바로 시작할 수 있는 3D Slicer 커스텀 앱 템플릿을 개발·유지보수합니다.',
          problem: '광학 트래커는 하드웨어만으로는 쓰이지 않습니다. 좌표계, 마커 정의, 실시간 스트리밍, 오류 상태를 응용 개발자가 다루기 쉬운 인터페이스로 제공해야 합니다.',
          role: 'API·SDK와 Viewer의 설계·구현·유지보수, 3D Slicer 커스텀 앱 템플릿 작성, 고객사 통합 지원과 문의 대응을 담당합니다.',
          teamResult: '장치 하드웨어, 광학·기구 설계, 영업과 납품은 회사의 다른 구성원이 맡습니다. 납품 실적과 매출은 회사 성과이며 여기서 주장하지 않습니다.',
          evidence: 'Viewer 화면, API 구조 다이어그램, Slicer 템플릿 동작 화면이 근거이며 고객 현장 영상은 싣지 않습니다.',
          limitation: '장치 사양·정확도 수치·고객사 명단·판매 수치는 회사 소유 정보로 공개하지 않습니다.',
          collaboration: '광학·하드웨어 설계자, 고객사 내비게이션 개발자, 연구기관 사용자와 인터페이스를 맞춥니다.',
          mediaAlt: '모니터의 SKADI Viewer가 두개골 팬텀 위에서 추적되는 기구를 3D 모델과 단면 뷰로 표시하는 장면.', mediaCaption: 'SKADI Viewer가 두개골 팬텀 위의 추적 기구를 3D 모델과 단면 뷰로 표시하는 시연 클립입니다.',
          status: '진행 중', cardProblem: '광학 트래커를 응용 개발자가 바로 쓰는 API·Viewer 계층으로 만듭니다.', cardOwnedRole: 'API·SDK·Viewer·Slicer 템플릿 개발·유지보수를 담당합니다.', cardEvidence: 'Viewer·추적 뷰·기록 뷰어·Slicer 템플릿 화면; 장치 사양과 판매 수치는 비공개입니다.', problemSummary: '추적 장치를 쓰기 쉬운 소프트웨어 계층으로 감쌉니다.', ownedRole: 'API·SDK·Viewer·Slicer 템플릿을 담당합니다.', verifiedEvidence: 'Viewer 시연 클립과 추적 뷰·기록 뷰어·Slicer 템플릿 화면이 근거입니다.', visualAlt: 'SKADI Viewer 추적 시연.', visualCaption: 'SKADI Viewer 추적 시연 클립.'
        },
        en: {
          title: 'SKADI Tracking Software (API and Viewer)', shortTitle: 'SKADI Software', eyebrow: 'Platform Software · Optical Tracking',
          thesis: 'Make the in-house SKADI optical 3D tracker directly usable by surgical-navigation companies and research groups through its software layer.',
          summary: 'Develop and maintain the SKADI API and SDK, the Viewer that shows device state and tracking results, and a 3D Slicer custom-application template that lets researchers start immediately.',
          problem: 'An optical tracker is not used as bare hardware: coordinate frames, marker definitions, real-time streaming, and error states must be exposed through an interface application developers can work with.',
          role: 'Own the design, implementation, and maintenance of the API, SDK, and Viewer; wrote the 3D Slicer custom-application template; support customer integrations and enquiries.',
          teamResult: 'Device hardware, optical and mechanical design, sales, and delivery belong to other colleagues. Delivery records and revenue are company results and are not claimed here.',
          evidence: 'Viewer screens, an API structure diagram, and the Slicer template in action are the evidence; customer-site footage is excluded.',
          limitation: 'Device specifications, accuracy figures, customer lists, and sales numbers are company-owned and not published.',
          collaboration: 'Interfaces are agreed with optical and hardware designers, customer navigation developers, and research users.',
          mediaAlt: 'SKADI Viewer on a monitor showing an instrument tracked over a skull phantom in the 3D model and section views.', mediaCaption: 'Demonstration clip: the SKADI Viewer shows a tracked instrument over a skull phantom in the 3D model and section views.',
          status: 'Ongoing', cardProblem: 'Turn the optical tracker into an API and Viewer layer developers use directly.', cardOwnedRole: 'Own the API, SDK, Viewer, and Slicer template.', cardEvidence: 'Viewer, tracking-view, recording-viewer, and Slicer-template screens; specs and sales figures stay private.', problemSummary: 'Wrap the tracker in a usable software layer.', ownedRole: 'Own the API, SDK, Viewer, and Slicer template.', verifiedEvidence: 'The Viewer demonstration clip plus tracking-view, recording-viewer, and Slicer-template screens are the evidence.', visualAlt: 'SKADI Viewer tracking demonstration.', visualCaption: 'SKADI Viewer tracking demonstration clip.'
        }
      },
      blocks: [
        { key: 'sdk-layers', type: 'system', translations: { ko: { heading: 'SDK 계층', body: '장치 연결, 마커·좌표계 정의, 실시간 스트리밍, 오류 상태를 API로 드러내고 언어 바인딩을 제공합니다.' }, en: { heading: 'SDK layers', body: 'Device connection, marker and frame definitions, real-time streaming, and error states are exposed through the API with language bindings.' } } },
        { key: 'viewer-and-template', type: 'text', translations: { ko: { heading: 'Viewer와 템플릿', body: 'Viewer는 장치 상태와 추적 결과를 검증하는 도구이고, Slicer 템플릿은 연구자가 내비게이션 프로토타입을 바로 시작하게 합니다.' }, en: { heading: 'Viewer and template', body: 'The Viewer verifies device state and tracking output; the Slicer template lets researchers start a navigation prototype at once.' } } },
        { key: 'delivery-evidence', type: 'evidence', translations: { ko: { heading: '동작 근거', body: 'Viewer·API·템플릿의 실제 동작 화면을 근거로 삼고 고객 현장 영상은 제외합니다.' }, en: { heading: 'Working evidence', body: 'Working Viewer, API, and template screens are the evidence; customer-site footage is excluded.' } } },
        { key: 'hardware-boundary', type: 'limitation', translations: { ko: { heading: '하드웨어 경계', body: '장치 사양·정확도·판매 수치는 회사 소유 정보이며 이 사례는 소프트웨어 계층만 다룹니다.' }, en: { heading: 'Hardware boundary', body: 'Specifications, accuracy, and sales are company-owned; this case covers the software layer only.' } } }
      ]
    }),
    project({
      slug: 'unmanned-forklift', tier: 'industrial-spotlight', period: '2024 – present', evidenceState: 'ongoing', lifecycleState: 'ongoing',
      capabilityKeys: ['sensor-fusion', 'registration'], route: 'projects/unmanned-forklift/',
      tech: ['C++23', 'ROS 2', 'Zenoh', 'ToF', 'RGB', 'SAM3', 'SICK TiM LiDAR', 'NAV350'],
      media: {
        lead: { id: 'unmanned-forklift-clip-01', type: 'video', status: 'approved', publicPath: 'assets/projects/unmanned-forklift/unmanned-forklift-clip-01.mp4' },
        video: { id: 'unmanned-forklift-clip-01', type: 'video', status: 'approved', publicPath: 'assets/projects/unmanned-forklift/unmanned-forklift-clip-01.mp4' },
        poster: { id: 'unmanned-forklift-poster-01', type: 'image', status: 'approved', publicPath: 'assets/projects/unmanned-forklift/unmanned-forklift-poster-01.png' },
        gallery: [
          { id: 'unmanned-forklift-gallery-01', type: 'image', status: 'approved', publicPath: 'assets/projects/unmanned-forklift/unmanned-forklift-gallery-01.png', translations: { ko: { caption: '팔레트 진입 직전의 포크 정렬 — 풀 시나리오 테스트', alt: '시험장 바닥의 팔레트 앞에 포크를 정렬한 무인지게차' }, en: { caption: 'Fork alignment just before pallet entry during the full-scenario test', alt: 'Autonomous forklift aligning its forks in front of a pallet on the test floor' } } },
          { id: 'unmanned-forklift-gallery-02', type: 'image', status: 'approved', publicPath: 'assets/projects/unmanned-forklift/unmanned-forklift-gallery-02.png', translations: { ko: { caption: '궤적 추종 주행 테스트 — 시험장 전경', alt: '시험장 바닥의 경로 표시선을 따라 주행하는 무인지게차 원경' }, en: { caption: 'Trajectory-following drive test, wide view of the test site', alt: 'Wide view of the autonomous forklift following a marked path on the test floor' } } },
          { id: 'unmanned-forklift-gallery-03', type: 'image', status: 'approved', publicPath: 'assets/projects/unmanned-forklift/unmanned-forklift-gallery-03.png', translations: { ko: { caption: '포크 승강 테스트 — 카트 들어올리기', alt: '파란 카트를 포크로 들어올린 무인지게차' }, en: { caption: 'Fork-lift test lifting a cart', alt: 'Autonomous forklift lifting a blue cart with its forks' } } },
        ]
      },
      pdf: { ko: 'assets/pdfs/unmanned-forklift-ko.pdf', en: 'assets/pdfs/unmanned-forklift-en.pdf' },
      pdfSequence: {
        middle: ['sensor-coordinate-chain', 'perception-to-policy', 'integration-evidence', 'field-boundary'],
        evidenceId: 'unmanned-forklift-clip-01',
        diagram: {
          kind: 'sensor-convergence',
          translations: {
            ko: { title: '다중 센서에서 안전 정책으로의 수렴', nodes: ['RGB·ToF·SAM3', 'LiDAR·NAV350 PCD', '로봇 위치·융합', '안전 정책·Zenoh'] },
            en: { title: 'Multi-sensor convergence to safety policy', nodes: ['RGB, ToF, and SAM3', 'LiDAR and NAV350 PCD', 'Robot pose and fusion', 'Safety policy and Zenoh'] }
          }
        }
      },
      translations: {
        ko: {
          title: '무인지게차 다중 센서 정합', shortTitle: '무인지게차 센서 정합', eyebrow: '산업 스포트라이트 · 다중 센서',
          thesis: '센서 간 좌표 정합을 적용하고 인지 결과를 안전 판단과 차량 시스템에 연결합니다.',
          summary: 'ToF-RGB-SAM3 정합, SICK TiM LiDAR와 NAV350 3D PCD 처리, 로봇 위치추정, 센서 융합, 안전 정책, Zenoh 결과 발행을 하나의 통합 흐름으로 연결했습니다.',
          problem: '센서별 데이터가 서로 다른 좌표와 주기로 들어와 안전 판단에 쓰일 수 있는 공통 흐름이 필요했습니다.',
          role: 'ToF-RGB-SAM3 정합, SICK TiM LiDAR·NAV350 3D PCD 처리, 로봇 위치추정, 센서 융합·안전 정책 판단, Zenoh 결과 발행을 담당했습니다.',
          teamResult: '팀은 시스템 통합과 현장 검증을 수행했습니다. 생산 운영, 배포 성공, 고객 성과로 확대하지 않습니다.',
          evidence: '좌표 정합 결과, 3D 포인트클라우드, 로봇 위치, 안전 판단, Zenoh 메시지를 통합과 현장 검증에서 확인했습니다.',
          limitation: '공개 클립과 사진은 시험장 테스트이며 생산 운영 성과나 고객 성과를 주장하지 않습니다.',
          collaboration: '차량 제어, 센서, 안전, 현장 검증 담당자와 공동 통합합니다.',
          mediaAlt: '3D 뷰·카메라 영상·신호 플롯이 함께 표시된 무인지게차 비전 서보잉 테스트 녹화 화면.', mediaCaption: '무인지게차 DOTORI의 비전 서보잉 테스트 화면 녹화입니다(3D 뷰·카메라 영상·신호 플롯).',
          status: '진행 중', cardProblem: '다중 센서 좌표를 정합해 안전 판단과 차량 시스템에 연결합니다.', cardOwnedRole: 'ToF-RGB-SAM3, LiDAR·NAV350 PCD, 위치추정, 안전 정책, Zenoh를 담당했습니다.', cardEvidence: '비전 서보잉 화면 녹화와 시험장 주행·적재 테스트 사진이 근거입니다.', problemSummary: '다중 센서 좌표를 안전 판단과 차량 시스템에 연결합니다.', ownedRole: '정합, PCD, 위치추정, 센서 융합·안전 정책, Zenoh를 담당했습니다.', verifiedEvidence: '비전 서보잉 화면 녹화와 시험장 주행·적재 테스트 사진까지만 공개 결과로 제시합니다.', visualAlt: '무인지게차 비전 서보잉 테스트 녹화.', visualCaption: '비전 서보잉 테스트 화면 녹화 클립.'
        },
        en: {
          title: 'Multi-sensor Registration for an Autonomous Forklift', shortTitle: 'Autonomous Forklift Registration', eyebrow: 'Industrial Spotlight · Multi-sensor System',
          thesis: 'Apply coordinate registration across sensors and connect perception to safety decisions and the vehicle system.',
          summary: 'Connected ToF-RGB-SAM3 registration, SICK TiM LiDAR and NAV350 3D PCD processing, robot localization, sensor fusion, safety policy, and Zenoh publication into one integration flow.',
          problem: 'Sensor streams arrived in different coordinates and cycles and needed a common flow usable by safety decisions.',
          role: 'Owned ToF-RGB-SAM3 registration; SICK TiM LiDAR and NAV350 3D PCD processing; robot localization; sensor fusion and safety-policy decisions; and publishing results through Zenoh.',
          teamResult: 'The team performed system integration and field validation. This is not presented as production operation, deployment success, or customer outcomes.',
          evidence: 'Registration outputs, 3D point clouds, robot pose, safety decisions, and Zenoh messages were checked through integration and field validation.',
          limitation: 'The public clip and photos are test-site runs; they do not claim production or customer outcomes.',
          collaboration: 'Vehicle control, sensing, safety, and field-validation owners integrate the system jointly.',
          mediaAlt: 'Vision-servoing test recording of the autonomous forklift with 3D view, camera feed, and signal plots.', mediaCaption: 'Screen recording of the DOTORI vision-servoing test (3D view, camera feed, signal plots).',
          status: 'Ongoing', cardProblem: 'Register multi-sensor coordinates and connect them to safety decisions and the vehicle system.', cardOwnedRole: 'Owned ToF-RGB-SAM3, LiDAR and NAV350 PCD, localization, safety policy, and Zenoh output.', cardEvidence: 'Vision-servoing screen recording and test-site driving and loading photos are the evidence.', problemSummary: 'Connect registered multi-sensor data to safety decisions and the vehicle system.', ownedRole: 'Owned registration, PCD, localization, sensor fusion and safety policy, and Zenoh output.', verifiedEvidence: 'Public result is limited to the vision-servoing recording and test-site driving and loading photos.', visualAlt: 'Autonomous-forklift vision-servoing test recording.', visualCaption: 'Vision-servoing test screen recording clip.'
        }
      },
      blocks: [
        { key: 'sensor-coordinate-chain', type: 'system', translations: { ko: { heading: '센서 좌표 체인', body: 'RGB·ToF·LiDAR·NAV350을 차량 좌표와 로봇 위치에 연결했습니다.' }, en: { heading: 'Sensor coordinate chain', body: 'Connected RGB, ToF, LiDAR, and NAV350 to vehicle coordinates and robot pose.' } } },
        { key: 'perception-to-policy', type: 'system', translations: { ko: { heading: '인지에서 정책까지', body: '정합과 위치 결과를 안전 정책 판단과 Zenoh 메시지로 이었습니다.' }, en: { heading: 'Perception to policy', body: 'Connected registration and pose outputs to safety-policy decisions and Zenoh messages.' } } },
        { key: 'integration-evidence', type: 'evidence', translations: { ko: { heading: '통합 근거', body: '센서 정합, 포인트클라우드, 위치, 정책 결과를 통합과 현장에서 대조했습니다.' }, en: { heading: 'Integration evidence', body: 'Compared sensor alignment, point clouds, pose, and policy output in integration and field tests.' } } },
        { key: 'field-boundary', type: 'limitation', translations: { ko: { heading: '현장 경계', body: '현장 검증을 생산 운영이나 고객 성과로 확대하지 않습니다.' }, en: { heading: 'Field boundary', body: 'Field validation is not production operation, deployment success, or a customer outcome.' } } }
      ]
    }),
    project({
      slug: 'ai-build-lab', tier: 'ai-build-lab', period: '2024 – present', evidenceState: 'ongoing', lifecycleState: 'ongoing',
      capabilityKeys: ['ai-product-engineering'], route: 'projects/ai-build-lab/',
      tech: ['Electron', 'TypeScript', 'Node.js', 'Cloudflare', 'GitHub Actions', 'Agent workflows'],
      media: {
        lead: { id: 'ai-build-lab-lead-01', type: 'image', status: 'approved', publicPath: 'assets/projects/ai-build-lab/ai-build-lab-lead-01.png' },
        references: [
          { id: 'multi-cli-work-repository', type: 'repository', status: 'approved', publicPath: 'https://github.com/rafaam11/multi-cli-work' },
          { id: 'daegu-bus-repository', type: 'repository', status: 'approved', publicPath: 'https://github.com/rafaam11/public-transportation-info' }
        ],
        gallery: [
          { id: 'ai-build-lab-gallery-01', type: 'image', status: 'approved', publicPath: 'assets/projects/ai-build-lab/ai-build-lab-gallery-01.png', translations: { ko: { caption: '한 프로젝트 안에서 PR 리뷰·문서·터미널 두 개를 4분할로 함께 봅니다', alt: 'PR 리뷰 창, 마크다운 편집기, 두 개의 터미널이 4분할로 배치된 앱 화면' }, en: { caption: 'Four panes in one project: pull-request review, a document, and two terminals', alt: 'Application window split into four panes showing a pull-request review, a markdown editor, and two terminals' } } },
          { id: 'ai-build-lab-gallery-02', type: 'image', status: 'approved', publicPath: 'assets/projects/ai-build-lab/ai-build-lab-gallery-02.png', translations: { ko: { caption: '같은 프롬프트를 선택한 여러 세션에 한 번에 보냅니다', alt: '프롬프트 입력창 아래에 전송 대상 세션 두 개가 체크된 팬아웃 대화상자' }, en: { caption: 'One prompt sent to several selected sessions at once', alt: 'Fan-out dialog with a prompt field and two target sessions checked' } } },
          { id: 'ai-build-lab-gallery-03', type: 'image', status: 'approved', publicPath: 'assets/projects/ai-build-lab/ai-build-lab-gallery-03.png', translations: { ko: { caption: 'PR의 변경 파일과 diff를 앱 안에서 보고 에이전트 리뷰로 넘깁니다', alt: '변경 파일 목록과 diff, 에이전트 리뷰 요청 버튼이 있는 PR 화면' }, en: { caption: 'Changed files and diffs are read in the app, then handed to an agent review', alt: 'Pull-request pane with a changed-file list, a diff view, and agent review buttons' } } }
        ]
      },
      pdf: { ko: 'assets/pdfs/ai-build-lab-ko.pdf', en: 'assets/pdfs/ai-build-lab-en.pdf' },
      pdfSequence: {
        middle: ['problem-to-product', 'human-ai-boundary', 'public-product-proof', 'privacy-metric-boundary'],
        evidenceId: 'ai-build-lab-lead-01',
        diagram: {
          kind: 'product-loop',
          translations: {
            ko: { title: '문제 발견에서 운영까지의 제품 루프', nodes: ['경험한 마찰', '요구사항·아키텍처', '테스트·수용', '릴리스·운영'] },
            en: { title: 'Product loop from friction to operation', nodes: ['Experienced friction', 'Requirements and architecture', 'Tests and acceptance', 'Release and operation'] }
          }
        }
      },
      links: [
        { href: 'https://github.com/rafaam11/multi-cli-work', translations: { ko: { label: 'multi-cli-work 저장소' }, en: { label: 'multi-cli-work repository' } } },
        { href: 'https://github.com/rafaam11/public-transportation-info', translations: { ko: { label: '대구 버스 앱 저장소' }, en: { label: 'Daegu bus app repository' } } }
      ],
      translations: {
        ko: {
          title: 'AI Build Lab - 필요한 도구를 직접 만든다', shortTitle: 'AI Build Lab', eyebrow: 'AI 빌드 랩 · 제품 엔지니어링',
          thesis: '직접 겪은 문제를 요구사항, 아키텍처, 수용 기준, 테스트 제품, 릴리스, 운영으로 바꾸고 AI는 구현을 증폭하는 수단으로 사용합니다.',
          summary: '로컬 지식 시스템, 멀티 CLI 데스크톱 앱, 대구 버스 정보 앱을 하나의 문제-제품 파이프라인으로 묶어 보여줍니다.',
          problem: '자주 겪는 마찰이 임시 스크립트로 남지 않고 반복 사용 가능한 제품 요구사항으로 바뀌어야 했습니다.',
          role: '문제 맥락, 요구사항, 아키텍처, 수용 기준, 테스트, 릴리스, 운영 판단을 소유하고 AI를 구현 보조·증폭 수단으로 사용했습니다.',
          teamResult: '공개 저장소와 릴리스 아티팩트는 확인 가능한 제품 결과이지만 사용자 수, 생산성, 유지보수 효과를 주장하지 않습니다.',
          evidence: 'multi-cli-work 릴리스 빌드의 실제 화면과 두 앱의 공개 저장소·테스트·릴리스를 근거로 삼고, 로컬 지식 시스템의 비공개 데이터는 배제합니다.',
          limitation: '로컬 지식 시스템의 원문·개인 데이터를 공개하지 않고 검증되지 않은 사용자·생산성 지표를 주장하지 않습니다.',
          collaboration: 'AI는 구현 증폭 수단이며 맥락, 아키텍처, 수용 기준, 리뷰와 릴리스 결정은 사람이 소유합니다.',
          mediaAlt: 'multi-cli-work 프로젝트 시작 화면 — PowerShell·Claude Code·Codex·에이전트 세션 시작 버튼과 git 상태·워크트리 카드.', mediaCaption: 'multi-cli-work v1.24 — 프로젝트 하나에서 CLI·에이전트 세션을 열고 git 상태와 워크트리를 함께 봅니다. 로컬 경로는 블러 처리했습니다.',
          status: '진행 중', cardProblem: '직접 겪은 마찰을 테스트·릴리스·운영되는 도구로 바꿉니다.', cardOwnedRole: '맥락·아키텍처·수용 기준을 소유하고 AI로 구현을 증폭합니다.', cardEvidence: '공개 저장소, 테스트, 릴리스; 비공개 데이터와 지표는 배제합니다.', problemSummary: '직접 겪은 문제를 반복 사용 가능한 제품으로 바꿉니다.', ownedRole: '맥락, 아키텍처, 수용 기준, 릴리스 판단을 소유합니다.', verifiedEvidence: '공개 저장소, 테스트, 릴리스 아티팩트.', visualAlt: 'AI Build Lab 공개 제품 근거.', visualCaption: '비공개 데이터와 지표는 포함하지 않습니다.'
        },
        en: {
          title: 'AI Build Lab - Tools I Needed, Built and Shipped', shortTitle: 'AI Build Lab', eyebrow: 'AI Build Lab · Product Engineering',
          thesis: 'Personally experienced problems become requirements, architecture, acceptance criteria, tested products, releases, and operations; AI amplifies implementation but does not own context or acceptance.',
          summary: 'One combined case connects a local-first knowledge system, a multi-CLI desktop application, and a Daegu bus-information application through the same problem-to-product loop.',
          problem: 'Recurring friction needed to become reusable product requirements rather than one-off scripts.',
          role: 'Owned problem context, requirements, architecture, acceptance criteria, tests, releases, and operating decisions while using AI to amplify implementation.',
          teamResult: 'Public repositories and release artifacts are observable product results; no user-count, productivity, or maintainability metrics are claimed.',
          evidence: 'Screens from a released multi-cli-work build, together with the public repositories, tests, and releases of both applications, provide public-safe evidence; private knowledge data is excluded.',
          limitation: 'Never expose private knowledge-system source data or claim unverified user or productivity metrics.',
          collaboration: 'AI amplifies implementation; people own context, architecture, acceptance criteria, review, and release decisions.',
          mediaAlt: 'multi-cli-work project start screen with PowerShell, Claude Code, Codex, and agent session buttons beside git status and worktree cards.', mediaCaption: 'multi-cli-work v1.24: one project opens CLI and agent sessions alongside git status and worktrees. Local paths are blurred.',
          status: 'Ongoing', cardProblem: 'Turn lived friction into tested, released, and operated tools.', cardOwnedRole: 'Own context, architecture, and acceptance while AI amplifies implementation.', cardEvidence: 'Public repositories, tests, and releases; no private data or unverified metrics.', problemSummary: 'Turn personally experienced problems into reusable products.', ownedRole: 'Own context, architecture, acceptance criteria, tests, and releases.', verifiedEvidence: 'Public repositories, tests, and release artifacts.', visualAlt: 'AI Build Lab public product evidence.', visualCaption: 'Private data and unverified metrics are excluded.'
        }
      },
      subcases: [
        { key: 'llm-wiki', translations: { ko: { title: '로컬 지식 시스템', summary: '개인 데이터를 공개하지 않고 맥락과 검증 경계를 관리합니다.' }, en: { title: 'Local-first knowledge system', summary: 'Manage context and verification boundaries without exposing private data.' } } },
        { key: 'multi-cli-work', translations: { ko: { title: 'multi-cli-work', summary: '복수 AI CLI 세션을 운영하는 데스크톱 앱을 테스트하고 릴리스합니다.' }, en: { title: 'multi-cli-work', summary: 'Test and release a desktop application for operating multiple AI CLI sessions.' } } },
        { key: 'daegu-bus', translations: { ko: { title: '대구 버스 정보 앱', summary: '직접 필요한 대중교통 정보를 공개 제품으로 구현합니다.' }, en: { title: 'Daegu bus-information app', summary: 'Implement personally needed public-transport information as a public product.' } } }
      ],
      blocks: [
        { key: 'problem-to-product', type: 'system', translations: { ko: { heading: '문제에서 제품까지', body: '마찰을 요구사항, 아키텍처, 수용 기준, 테스트, 릴리스, 운영으로 이었습니다.' }, en: { heading: 'Problem to product', body: 'Connect friction to requirements, architecture, acceptance, tests, releases, and operations.' } } },
        { key: 'human-ai-boundary', type: 'text', translations: { ko: { heading: '사람과 AI의 경계', body: 'AI는 구현을 증폭하고 사람은 맥락·수용·릴리스 판단을 소유합니다.' }, en: { heading: 'Human-AI boundary', body: 'AI amplifies implementation; people own context, acceptance, and release decisions.' } } },
        { key: 'public-product-proof', type: 'evidence', translations: { ko: { heading: '공개 제품 근거', body: '공개 저장소, 자동화 테스트, 릴리스 아티팩트를 확인 가능한 근거로 삼습니다.' }, en: { heading: 'Public product proof', body: 'Use public repositories, automated tests, and release artifacts as observable evidence.' } } },
        { key: 'privacy-metric-boundary', type: 'limitation', translations: { ko: { heading: '개인정보·지표 경계', body: '비공개 지식 데이터와 검증되지 않은 사용자·생산성 지표를 배제합니다.' }, en: { heading: 'Privacy and metric boundary', body: 'Exclude private knowledge data and unverified user or productivity metrics.' } } }
      ]
    })
  ];

  return {
    capabilities: capabilities,
    tiers: tiers,
    impactMetrics: impactMetrics,
    projects: projects,
    highlights: highlights
  };
});
