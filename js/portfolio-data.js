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
      visualKey: 'nav-digitaltwin-pipeline',
      media: {
        lead: { id: 'surgical-navigation-demo', type: 'video', status: 'pending-approval' },
        video: { id: 'surgical-navigation-demo', type: 'video', status: 'pending-approval' },
        poster: { id: 'surgical-navigation-demo-poster', type: 'image', status: 'pending-approval' }
      },
      pdf: { ko: 'assets/pdfs/surgical-navigation-ko.pdf', en: 'assets/pdfs/surgical-navigation-en.pdf' },
      pdfSequence: {
        middle: ['coordinate-chain', 'spatial-feedback', 'demonstration-evidence', 'clinical-boundary'],
        evidenceId: 'surgical-navigation-demo',
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
          limitation: '실제 판텀·장비·HoloLens 시연 미디어는 공개 승인 대기 중이며 임상 효과를 주장하지 않습니다.',
          collaboration: '추적 장치, 의료영상, XR, 워크플로 전문가와의 공동 검토가 필요합니다.',
          mediaAlt: '추적 장치와 의료영상 모델이 HoloLens 공간 표시로 연결되는 수술내비게이션 시연.',
          mediaCaption: '실제 통합 시연은 공개 승인 후에만 게시합니다.',
          status: '진행 중', cardProblem: '분절된 장치·좌표·XR 흐름을 하나의 내비게이션으로 연결합니다.', cardOwnedRole: '통합 SW와 HoloLens 공간 배치·정합 피드백을 리드했습니다.', cardEvidence: '장치 연결·좌표 변환·공간 시연; 미디어는 승인 대기 중입니다.', problemSummary: '장치별 좌표와 정합 상태를 하나의 사용자 경험으로 연결합니다.', ownedRole: '통합 소프트웨어와 HoloLens 공간 배치·정합 피드백을 리드했습니다.', verifiedEvidence: '동작하는 통합 시연이 근거이며 실제 미디어는 승인 대기 중입니다.', visualAlt: '추적·정합·HoloLens 통합 흐름.', visualCaption: '공개 가능한 시스템 관계 다이어그램.'
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
          limitation: 'Actual phantom, equipment, and HoloLens demonstration media remains pending approval, and no clinical efficacy is claimed.',
          collaboration: 'Joint review spans tracking hardware, medical imaging, XR, and workflow expertise.',
          mediaAlt: 'Surgical-navigation demonstration connecting tracked equipment and medical-image models to a HoloLens spatial view.',
          mediaCaption: 'The actual integrated demonstration will be published only after approval.',
          status: 'Ongoing', cardProblem: 'Connect fragmented device, coordinate, and XR flows into one navigation experience.', cardOwnedRole: 'Led integrated software and the HoloLens placement and registration-feedback experience.', cardEvidence: 'Device, transform, and spatial demonstrations; media pending approval.', problemSummary: 'Connect device coordinates and registration state into one readable user experience.', ownedRole: 'Led integrated software and HoloLens spatial placement and registration feedback.', verifiedEvidence: 'A working integrated demonstration is the evidence; actual media is pending approval.', visualAlt: 'Tracking, registration, and HoloLens integration flow.', visualCaption: 'Public-safe system-relationship diagram.'
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
      tech: ['Python', 'Open3D', 'OpenCV', 'SciPy', 'PCA', 'ICP', 'CLPSO', '3D Slicer'], visualKey: 'coordinate-signal',
      media: {
        lead: { id: 'mandibular-presentation-award', type: 'image', status: 'pending-approval' },
        references: [{ id: 'mandibular-publication', type: 'publication', status: 'approved', publicPath: 'https://link.springer.com/article/10.1007/s10278-024-01014-z' }]
      },
      pdf: { ko: 'assets/pdfs/mandibular-fracture-ko.pdf', en: 'assets/pdfs/mandibular-fracture-en.pdf' },
      pdfSequence: {
        middle: ['clinical-question', 'research-pipeline', 'published-evidence', 'research-boundary'],
        evidenceId: 'mandibular-presentation-award',
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
          limitation: '준비된 연구 데이터셋의 결과이며 일상 임상 사용이나 단독 제1저자를 주장하지 않습니다.',
          collaboration: '임상 문제 해석, 알고리즘, 실험 설계, 논문 작성을 공동 연구로 수행했습니다.',
          mediaAlt: '하악골 골절 정복 연구의 학술대회 발표와 수상 근거.', mediaCaption: '발표·수상 미디어는 공개 승인 대기 중이며 게재 논문은 공개 참조할 수 있습니다.',
          status: '검증됨 · 완료', cardProblem: '모호한 정복 위치를 검증 가능한 3D 최적화 문제로 정의했습니다.', cardOwnedRole: '문제 정의부터 실험·논문까지 공동 리드했습니다.', cardEvidence: '발표·수상·Q1 SCIE 논문·정량 실험.', problemSummary: '교합 제약을 반영한 재현 가능한 정복 표적을 정의합니다.', ownedRole: '연구 파이프라인을 공동 리드한 공동 제1저자입니다.', verifiedEvidence: '학술대회 발표, 수상, Q1 SCIE 논문, 정량 실험.', visualAlt: '하악골 정복 정합과 최적화 근거.', visualCaption: '발표·수상 미디어는 승인 대기 중입니다.'
        },
        en: {
          title: 'Mandibular Fracture Reduction Optimization', shortTitle: 'Mandibular Fracture Optimization', eyebrow: 'Medical Core · Verified Research',
          thesis: 'Convert an ambiguous clinical problem into a testable 3D registration and optimization problem.',
          summary: 'Built a surgical-planning simulator and experiment pipeline that optimizes mandibular fragment pose using dental features and fracture surfaces.',
          problem: 'Many geometrically plausible reductions existed; the planning target needed a reproducible constraint grounded in occlusion.',
          role: 'Jointly led the research pipeline across problem definition, feature and optimization design, simulator, experiments and analysis, and paper, serving as a co-first author.',
          teamResult: 'The joint research team produced international and domestic presentations, an award, and a peer-reviewed publication.',
          evidence: 'ACCAS 2022, a 2022 domestic conference, a 2023 best-paper award, a 2024 Q1 SCIE peer-reviewed paper, and quantitative experiments provide the evidence.',
          limitation: 'Results are from prepared research datasets; this does not claim routine clinical use or sole first authorship.',
          collaboration: 'Clinical interpretation, algorithm design, experiment design, and writing were conducted as joint research.',
          mediaAlt: 'Presentation and award evidence for mandibular fracture reduction research.', mediaCaption: 'Presentation and award media remains pending approval; the publication is publicly referenced.',
          status: 'Verified · Completed', cardProblem: 'Frame an ambiguous reduction as a testable 3D optimization problem.', cardOwnedRole: 'Jointly led the pipeline from problem framing through experiments and paper.', cardEvidence: 'Conference, award, publication, and experiment evidence.', problemSummary: 'Use occlusion constraints to define a reproducible reduction target.', ownedRole: 'Jointly led the research pipeline and served as a co-first author.', verifiedEvidence: 'Presentations, award, Q1 SCIE paper, and quantitative experiments.', visualAlt: 'Mandibular registration and optimization evidence.', visualCaption: 'Presentation and award media remains pending approval.'
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
      tech: ['Meta Quest', 'Unity', 'Photon PUN2', 'Photon Voice', 'Spatial UI'], visualKey: 'hololens-ar-concept',
      media: { lead: { id: 'life-careverse-multiuser-demo', type: 'video', status: 'pending-approval' }, video: { id: 'life-careverse-multiuser-demo', type: 'video', status: 'pending-approval' }, poster: { id: 'life-careverse-multiuser-poster', type: 'image', status: 'pending-approval' } },
      pdf: { ko: 'assets/pdfs/life-careverse-ko.pdf', en: 'assets/pdfs/life-careverse-en.pdf' },
      pdfSequence: {
        middle: ['shared-state', 'xr-application', 'multiuser-demo', 'adoption-boundary'],
        evidenceId: 'life-careverse-multiuser-demo',
        diagram: {
          kind: 'sync-topology',
          translations: {
            ko: { title: '멀티유저 공유 상태 토폴로지', nodes: ['Quest 사용자', 'PUN2 공유 상태', 'Photon Voice', '시나리오·공간 UI'] },
            en: { title: 'Multi-user shared-state topology', nodes: ['Quest users', 'PUN2 shared state', 'Photon Voice', 'Scenario and spatial UI'] }
          }
        }
      },
      translations: {
        ko: {
          title: 'Life Careverse - 멀티유저 XR', shortTitle: 'Life Careverse', eyebrow: '의료 코어 · 멀티유저 XR',
          thesis: 'Quest, Unity, Photon/PUN2, 음성, 스패셜 UI, 시나리오 통합으로 XR 애플리케이션 계층을 구현합니다.',
          summary: '다수 사용자가 공간과 음성, 시나리오 상태를 공유하는 Quest 기반 XR 앱을 통합했습니다.',
          problem: '단일 사용자 장면이 아니라 복수 사용자의 상태, 음성, 공간 UI, 시나리오를 일관되게 맞춰야 했습니다.',
          role: 'Quest·Unity·Photon/PUN2·음성·스패셜 UI·시나리오 통합을 포함한 XR 앱 전체를 리드했습니다.',
          teamResult: '팀의 채택, 소프트웨어 등록, 연구 테스트는 공동 결과이며 각각의 범위와 확정 수준을 구분합니다.',
          evidence: '동작하는 멀티유저 동기화, 음성, 스패셜 UI, 시나리오 시연이 근거입니다.',
          limitation: '시연 미디어는 공개 승인 대기 중이며 사용자 효과나 생산성 지표를 주장하지 않습니다.',
          collaboration: '시나리오 전문가, 연구자, 소프트웨어 팀의 공동 검토로 진행했습니다.',
          mediaAlt: 'Quest 헤드셋 사용자 간 공간 상태와 음성이 동기화되는 Life Careverse 시연.', mediaCaption: '멀티유저 시연 미디어는 공개 승인 후에만 게시합니다.',
          status: '진행 중', cardProblem: '다수 사용자의 공간·음성·시나리오 상태를 통합합니다.', cardOwnedRole: 'Quest 멀티유저 XR 앱 전체를 리드했습니다.', cardEvidence: '동작하는 동기화·음성·시나리오 시연.', problemSummary: '멀티유저 XR의 공간·음성·시나리오 상태를 통합합니다.', ownedRole: 'Quest 기반 XR 앱 전체를 리드했습니다.', verifiedEvidence: '동작하는 멀티유저 시연; 미디어는 승인 대기 중입니다.', visualAlt: '멀티유저 XR 동기화 시연.', visualCaption: '시연 미디어는 승인 대기 중입니다.'
        },
        en: {
          title: 'Life Careverse - Multi-user XR', shortTitle: 'Life Careverse', eyebrow: 'Medical Core · Multi-user XR',
          thesis: 'Implement the XR application layer through Quest, Unity, Photon/PUN2, voice, spatial UI, and scenario integration.',
          summary: 'Integrated a Quest-based XR application in which multiple users share spatial, voice, and scenario state.',
          problem: 'Multiple users needed consistent state across voice, spatial UI, and scenarios rather than isolated single-user scenes.',
          role: 'Led the XR application overall across Quest, Unity, Photon/PUN2, voice, spatial UI, and scenario integration.',
          teamResult: 'Team adoption, software registration, and research testing remain joint results, each stated only to its qualified evidence level.',
          evidence: 'Working multi-user synchronization, voice, spatial UI, and scenario demonstrations provide the evidence.',
          limitation: 'Demo media remains pending approval; no user-effect or productivity metrics are claimed.',
          collaboration: 'Scenario experts, researchers, and the software team reviewed the application together.',
          mediaAlt: 'Life Careverse demonstration synchronizing spatial state and voice between Quest headset users.', mediaCaption: 'The multi-user demonstration will be published only after approval.',
          status: 'Ongoing', cardProblem: 'Integrate spatial, voice, and scenario state across multiple users.', cardOwnedRole: 'Led the Quest multi-user XR application overall.', cardEvidence: 'Working synchronization, voice, and scenario demonstrations.', problemSummary: 'Integrate spatial, voice, and scenario state for a multi-user XR application.', ownedRole: 'Led the Quest-based XR application overall.', verifiedEvidence: 'A working multi-user demonstration is the evidence; media is pending approval.', visualAlt: 'Multi-user XR synchronization demonstration.', visualCaption: 'Demo media remains pending approval.'
        }
      },
      blocks: [
        { key: 'shared-state', type: 'system', translations: { ko: { heading: '공유 상태', body: '사용자, 스패셜 객체, 음성, 시나리오 상태를 동기화했습니다.' }, en: { heading: 'Shared state', body: 'Synchronized users, spatial objects, voice, and scenario state.' } } },
        { key: 'xr-application', type: 'text', translations: { ko: { heading: 'XR 애플리케이션', body: '장면 제작을 넘어 사용 흐름과 장치 제약을 애플리케이션 계층에서 통합했습니다.' }, en: { heading: 'XR application', body: 'Integrated user flow and device constraints beyond scene construction.' } } },
        { key: 'multiuser-demo', type: 'evidence', translations: { ko: { heading: '멀티유저 시연', body: '동기화·음성·시나리오 재생을 동작 근거로 삼습니다.' }, en: { heading: 'Multi-user demo', body: 'Use synchronization, voice, and scenario replay as operating evidence.' } } },
        { key: 'adoption-boundary', type: 'limitation', translations: { ko: { heading: '채택 경계', body: '팀 채택과 연구 테스트를 개인 성과나 사용자 효과로 확대하지 않습니다.' }, en: { heading: 'Adoption boundary', body: 'Do not turn team adoption or research testing into individual or user-outcome claims.' } } }
      ]
    }),
    project({
      slug: 'rtms-navigation', tier: 'medical-core', period: '2024.07 – present', evidenceState: 'prototype', lifecycleState: 'ongoing',
      capabilityKeys: ['medical-navigation', 'registration'], route: 'projects/rtms-navigation/',
      tech: ['3D Slicer', 'VTK', 'Qt', 'OpenIGTLink', 'Optical tracking', 'C++', 'Python'], visualKey: 'coordinate-signal',
      media: { lead: { id: 'rtms-prototype-recording', type: 'video', status: 'pending-approval' }, video: { id: 'rtms-prototype-recording', type: 'video', status: 'pending-approval' }, poster: { id: 'rtms-prototype-poster', type: 'image', status: 'pending-approval' } },
      pdf: { ko: 'assets/pdfs/rtms-navigation-ko.pdf', en: 'assets/pdfs/rtms-navigation-en.pdf' },
      pdfSequence: {
        middle: ['slicer-architecture', 'coordinate-visibility', 'repeatable-prototype', 'prototype-boundary'],
        evidenceId: 'rtms-prototype-recording',
        diagram: {
          kind: 'navigation-loop',
          translations: {
            ko: { title: '표적 가시화와 반복 내비게이션 루프', nodes: ['추적 입력', '좌표 변환', '의료영상 표적', 'Slicer UI'] },
            en: { title: 'Target-visibility navigation loop', nodes: ['Tracking input', 'Coordinate transform', 'Medical-image target', 'Slicer UI'] }
          }
        }
      },
      translations: {
        ko: {
          title: 'rTMS 내비게이션 프로토타입', shortTitle: 'rTMS 내비게이션', eyebrow: '의료 코어 · 프로토타입',
          thesis: '추적과 좌표 데이터를 반복 가능한 Slicer 내비게이션 프로토타입으로 빠르게 바꿉니다.',
          summary: '3D Slicer 구조, 추적 장치, 좌표 흐름, UI를 연결해 반복 실험이 가능한 연구 내비게이션 환경을 만들었습니다.',
          problem: '추적 데이터와 의료영상 표적을 좌표 가정이 숨지 않는 반복 가능한 흐름으로 만들어야 했습니다.',
          role: 'Slicer 구조, 장치 연동, 좌표 흐름, UI, 반복 실험 환경을 리드했습니다.',
          teamResult: '팀은 동작하는 연구 프로토타입을 공유했으며 임상 효과나 정량 정확도 결과로 확대하지 않습니다.',
          evidence: '반복 실행할 수 있는 Slicer 프로토타입과 추적·좌표·시각화 흐름이 근거입니다.',
          limitation: '연구 프로토타입이며 임상 효과, 정량 정확도, 상용 배포를 주장하지 않습니다.',
          collaboration: '추적 장치와 연구 워크플로 검토를 위해 도메인 전문가와 협업합니다.',
          mediaAlt: '실시간 코일 자세, 환자 정합, 의료영상 표적을 표시하는 Slicer 프로토타입 녹화.', mediaCaption: '동작 프로토타입 녹화는 공개 승인 대기 중입니다.',
          status: '프로토타입 · 진행 중', cardProblem: '추적·좌표 데이터를 반복 가능한 Slicer 흐름으로 바꿉니다.', cardOwnedRole: 'Slicer 구조·장치·좌표·UI·실험 환경을 리드했습니다.', cardEvidence: '동작하는 연구 프로토타입과 반복 실험 흐름.', problemSummary: '추적·좌표 데이터를 반복 가능한 내비게이션으로 바꿉니다.', ownedRole: 'Slicer 구조, 장치 연동, 좌표 흐름, UI를 리드했습니다.', verifiedEvidence: '동작하는 연구 프로토타입; 임상·정량 결과는 주장하지 않습니다.', visualAlt: 'Slicer 내비게이션 프로토타입.', visualCaption: '프로토타입 미디어는 승인 대기 중입니다.'
        },
        en: {
          title: 'rTMS Navigation Prototype', shortTitle: 'rTMS Navigation', eyebrow: 'Medical Core · Prototype',
          thesis: 'Rapidly turn tracking and coordinate data into a repeatable Slicer navigation prototype.',
          summary: 'Connected Slicer structure, tracking devices, coordinate flow, and UI into a repeatable research-navigation environment.',
          problem: 'Tracking data and medical-image targets needed a repeatable flow that did not hide coordinate assumptions.',
          role: 'Led the Slicer structure, device integration, coordinate flow, UI, and repeatable experiment environment.',
          teamResult: 'The team shared a working research prototype; this is not extended into a clinical-efficacy or quantitative-accuracy result.',
          evidence: 'A repeatable Slicer prototype and visible tracking, coordinate, and visualization flow provide the evidence.',
          limitation: 'This is a research prototype and does not claim clinical efficacy, quantitative accuracy, or commercial deployment.',
          collaboration: 'Domain experts review the tracking hardware and research workflow.',
          mediaAlt: 'Slicer prototype recording showing live coil pose, patient registration, and medical-image targets.', mediaCaption: 'The working prototype recording remains pending approval.',
          status: 'Prototype · Ongoing', cardProblem: 'Turn tracking and coordinate data into a repeatable Slicer workflow.', cardOwnedRole: 'Led Slicer structure, devices, coordinates, UI, and the experiment environment.', cardEvidence: 'Working research prototype and repeatable experiment flow.', problemSummary: 'Turn tracking and coordinate data into repeatable navigation.', ownedRole: 'Led Slicer structure, device integration, coordinate flow, and UI.', verifiedEvidence: 'A working research prototype; no clinical or quantitative outcome claim.', visualAlt: 'Slicer navigation prototype.', visualCaption: 'Prototype media remains pending approval.'
        }
      },
      blocks: [
        { key: 'slicer-architecture', type: 'system', translations: { ko: { heading: 'Slicer 구조', body: '장치 입력, 좌표 변환, 표적, UI를 반복 실행 가능한 구조로 연결했습니다.' }, en: { heading: 'Slicer architecture', body: 'Connected device input, transforms, targets, and UI into a repeatable structure.' } } },
        { key: 'coordinate-visibility', type: 'text', translations: { ko: { heading: '좌표 가시성', body: '어떤 좌표계와 변환을 쓰는지 프로토타입에 드러냈습니다.' }, en: { heading: 'Coordinate visibility', body: 'Kept coordinate frames and transforms explicit in the prototype.' } } },
        { key: 'repeatable-prototype', type: 'evidence', translations: { ko: { heading: '반복 프로토타입', body: '동일한 장치·좌표·UI 흐름을 반복 실행하는 것을 근거로 삼습니다.' }, en: { heading: 'Repeatable prototype', body: 'Use repeated execution of the same device, coordinate, and UI flow as evidence.' } } },
        { key: 'prototype-boundary', type: 'limitation', translations: { ko: { heading: '프로토타입 경계', body: '임상 효과와 정량 정확도는 별도 검증 없이 주장하지 않습니다.' }, en: { heading: 'Prototype boundary', body: 'Clinical efficacy and quantitative accuracy require separate validation.' } } }
      ]
    }),
    project({
      slug: 'unmanned-forklift', tier: 'industrial-spotlight', period: '2024 – present', evidenceState: 'ongoing', lifecycleState: 'ongoing',
      capabilityKeys: ['sensor-fusion', 'registration'], route: 'projects/unmanned-forklift/',
      tech: ['C++23', 'ROS 2', 'Zenoh', 'ToF', 'RGB', 'SAM3', 'SICK TiM LiDAR', 'NAV350'], visualKey: 'forklift-sim-to-real',
      media: { lead: { id: 'forklift-registration-pointcloud', type: 'image', status: 'pending-approval' } },
      pdf: { ko: 'assets/pdfs/unmanned-forklift-ko.pdf', en: 'assets/pdfs/unmanned-forklift-en.pdf' },
      pdfSequence: {
        middle: ['sensor-coordinate-chain', 'perception-to-policy', 'integration-evidence', 'field-boundary'],
        evidenceId: 'forklift-registration-pointcloud',
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
          limitation: '공개 결과는 통합과 현장 검증까지이며 생산 운영, 배포 성공, 고객 성과를 주장하지 않습니다.',
          collaboration: '차량 제어, 센서, 안전, 현장 검증 담당자와 공동 통합합니다.',
          mediaAlt: 'ToF-RGB 정합 결과와 LiDAR·NAV350 3D 포인트클라우드가 무인지게차 좌표에 표시된 장면.', mediaCaption: '포인트클라우드·정합 미디어는 공개 승인 대기 중입니다.',
          status: '진행 중', cardProblem: '다중 센서 좌표를 정합해 안전 판단과 차량 시스템에 연결합니다.', cardOwnedRole: 'ToF-RGB-SAM3, LiDAR·NAV350 PCD, 위치추정, 안전 정책, Zenoh를 담당했습니다.', cardEvidence: '시스템 통합과 현장 검증; 운영·고객 성과는 주장하지 않습니다.', problemSummary: '다중 센서 좌표를 안전 판단과 차량 시스템에 연결합니다.', ownedRole: '정합, PCD, 위치추정, 센서 융합·안전 정책, Zenoh를 담당했습니다.', verifiedEvidence: '시스템 통합과 현장 검증까지만 공개 결과로 제시합니다.', visualAlt: '무인지게차 다중 센서 정합과 포인트클라우드.', visualCaption: '현장 미디어는 승인 대기 중입니다.'
        },
        en: {
          title: 'Multi-sensor Registration for an Autonomous Forklift', shortTitle: 'Autonomous Forklift Registration', eyebrow: 'Industrial Spotlight · Multi-sensor System',
          thesis: 'Apply coordinate registration across sensors and connect perception to safety decisions and the vehicle system.',
          summary: 'Connected ToF-RGB-SAM3 registration, SICK TiM LiDAR and NAV350 3D PCD processing, robot localization, sensor fusion, safety policy, and Zenoh publication into one integration flow.',
          problem: 'Sensor streams arrived in different coordinates and cycles and needed a common flow usable by safety decisions.',
          role: 'Owned ToF-RGB-SAM3 registration; SICK TiM LiDAR and NAV350 3D PCD processing; robot localization; sensor fusion and safety-policy decisions; and publishing results through Zenoh.',
          teamResult: 'The team performed system integration and field validation. This is not presented as production operation, deployment success, or customer outcomes.',
          evidence: 'Registration outputs, 3D point clouds, robot pose, safety decisions, and Zenoh messages were checked through integration and field validation.',
          limitation: 'The public result is integration and field validation only, not production operation, deployment success, or customer outcomes.',
          collaboration: 'Vehicle control, sensing, safety, and field-validation owners integrate the system jointly.',
          mediaAlt: 'Autonomous-forklift view showing ToF-RGB registration and LiDAR and NAV350 point clouds in vehicle coordinates.', mediaCaption: 'Point-cloud and registration media remains pending approval.',
          status: 'Ongoing', cardProblem: 'Register multi-sensor coordinates and connect them to safety decisions and the vehicle system.', cardOwnedRole: 'Owned ToF-RGB-SAM3, LiDAR and NAV350 PCD, localization, safety policy, and Zenoh output.', cardEvidence: 'System integration and field validation only; no operations or customer-outcome claim.', problemSummary: 'Connect registered multi-sensor data to safety decisions and the vehicle system.', ownedRole: 'Owned registration, PCD, localization, sensor fusion and safety policy, and Zenoh output.', verifiedEvidence: 'Public result is limited to system integration and field validation.', visualAlt: 'Autonomous-forklift multi-sensor registration and point clouds.', visualCaption: 'Field media remains pending approval.'
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
      tech: ['Electron', 'TypeScript', 'Node.js', 'Cloudflare', 'GitHub Actions', 'Agent workflows'], visualKey: 'decision-signal',
      media: {
        lead: { id: 'multi-cli-work-repository', type: 'repository', status: 'approved', publicPath: 'https://github.com/rafaam11/multi-cli-work' },
        references: [{ id: 'daegu-bus-repository', type: 'repository', status: 'approved', publicPath: 'https://github.com/rafaam11/public-transportation-info' }]
      },
      pdf: { ko: 'assets/pdfs/ai-build-lab-ko.pdf', en: 'assets/pdfs/ai-build-lab-en.pdf' },
      pdfSequence: {
        middle: ['problem-to-product', 'human-ai-boundary', 'public-product-proof', 'privacy-metric-boundary'],
        evidenceId: 'multi-cli-work-repository',
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
          evidence: 'multi-cli-work와 대구 버스 앱의 공개 저장소·테스트·릴리스를 근거로 삼고, 로컬 지식 시스템의 비공개 데이터는 배제합니다.',
          limitation: '로컬 지식 시스템의 원문·개인 데이터를 공개하지 않고 검증되지 않은 사용자·생산성 지표를 주장하지 않습니다.',
          collaboration: 'AI는 구현 증폭 수단이며 맥락, 아키텍처, 수용 기준, 리뷰와 릴리스 결정은 사람이 소유합니다.',
          mediaAlt: 'multi-cli-work와 대구 버스 앱의 공개 저장소와 릴리스 근거.', mediaCaption: '공개 저장소와 릴리스만 참조하며 비공개 지식 데이터는 포함하지 않습니다.',
          status: '진행 중', cardProblem: '직접 겪은 마찰을 테스트·릴리스·운영되는 도구로 바꿉니다.', cardOwnedRole: '맥락·아키텍처·수용 기준을 소유하고 AI로 구현을 증폭합니다.', cardEvidence: '공개 저장소, 테스트, 릴리스; 비공개 데이터와 지표는 배제합니다.', problemSummary: '직접 겪은 문제를 반복 사용 가능한 제품으로 바꿉니다.', ownedRole: '맥락, 아키텍처, 수용 기준, 릴리스 판단을 소유합니다.', verifiedEvidence: '공개 저장소, 테스, 릴리스 아티팩트.', visualAlt: 'AI Build Lab 공개 제품 근거.', visualCaption: '비공개 데이터와 지표는 포함하지 않습니다.'
        },
        en: {
          title: 'AI Build Lab - Tools I Needed, Built and Shipped', shortTitle: 'AI Build Lab', eyebrow: 'AI Build Lab · Product Engineering',
          thesis: 'Personally experienced problems become requirements, architecture, acceptance criteria, tested products, releases, and operations; AI amplifies implementation but does not own context or acceptance.',
          summary: 'One combined case connects a local-first knowledge system, a multi-CLI desktop application, and a Daegu bus-information application through the same problem-to-product loop.',
          problem: 'Recurring friction needed to become reusable product requirements rather than one-off scripts.',
          role: 'Owned problem context, requirements, architecture, acceptance criteria, tests, releases, and operating decisions while using AI to amplify implementation.',
          teamResult: 'Public repositories and release artifacts are observable product results; no user-count, productivity, or maintainability metrics are claimed.',
          evidence: 'Public repositories, tests, and releases for multi-cli-work and the Daegu bus app provide public-safe evidence; private knowledge data is excluded.',
          limitation: 'Never expose private knowledge-system source data or claim unverified user or productivity metrics.',
          collaboration: 'AI amplifies implementation; people own context, architecture, acceptance criteria, review, and release decisions.',
          mediaAlt: 'Public repository and release evidence for multi-cli-work and the Daegu bus application.', mediaCaption: 'Only public repositories and releases are referenced; private knowledge data is excluded.',
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
    projects: projects
  };
});
