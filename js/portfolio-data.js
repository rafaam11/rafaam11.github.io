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
      evidenceState: 'prototype',
      lifecycleState: 'ongoing',
      capabilityKeys: ['registration', 'medical-navigation', 'xr-engineering'],
      route: 'projects/surgical-navigation/',
      tech: ['HoloLens 2', 'Optical tracking', '3D Slicer', 'Unity', 'MRTK', 'OpenIGTLink', 'Holographic Remoting'],
      media: {
        lead: {
          id: 'surgical-navigation-hololens-demo-01',
          type: 'video',
          status: 'approved',
          publicPath: 'assets/projects/surgical-navigation/surgical-navigation-hololens-demo-01.mp4',
          preload: 'metadata',
          videoPolicy: {
            maxBytes: 100000000,
            targetDurationSeconds: 159.833333,
            toleranceSeconds: 0.2,
            width: 1280,
            height: 720,
            codec: 'h264',
            requireNoAudio: true,
            requireFastStart: true
          }
        },
        video: {
          id: 'surgical-navigation-hololens-demo-01',
          type: 'video',
          status: 'approved',
          publicPath: 'assets/projects/surgical-navigation/surgical-navigation-hololens-demo-01.mp4',
          preload: 'metadata',
          videoPolicy: {
            maxBytes: 100000000,
            targetDurationSeconds: 159.833333,
            toleranceSeconds: 0.2,
            width: 1280,
            height: 720,
            codec: 'h264',
            requireNoAudio: true,
            requireFastStart: true
          }
        },
        poster: {
          id: 'surgical-navigation-hololens-poster-01',
          type: 'image',
          status: 'approved',
          publicPath: 'assets/projects/surgical-navigation/surgical-navigation-hololens-poster-01.png'
        },
        gallery: []
      },
      pdf: { ko: 'assets/pdfs/surgical-navigation-ko.pdf', en: 'assets/pdfs/surgical-navigation-en.pdf' },
      pdfSequence: {
        middle: ['smcnavi-overview', 'smcnavi-workflows', 'registration-calibration', 'hololens-interface'],
        evidenceId: 'surgical-navigation-hololens-demo-01',
        diagram: { storySectionKey: 'system-architecture' },
        figureIds: [
          'surgical-navigation-smcnavi-features-01',
          'surgical-navigation-smcnavi-ui-01',
          'surgical-navigation-smcnavi-workflows-01',
          'surgical-navigation-gallery-02',
          'surgical-navigation-gallery-03',
          'surgical-navigation-gallery-05'
        ]
      },
      translations: {
        ko: {
          title: 'SMCNavi · HoloLens 수술내비게이션',
          shortTitle: 'SMCNavi · HoloLens',
          eyebrow: '의료 코어 · 연구 프로토타입',
          thesis: '추적·정합·캘리브레이션을 SMCNavi에 통합하고, 그 결과를 HoloLens 공간 인터페이스까지 연결했습니다.',
          summary: 'DIGITRACK이 삼성서울병원과 연구 협력으로 개발한 맞춤형 3D Slicer 수술내비게이션 플랫폼과 별도 HoloLens 공간 인터페이스 확장입니다.',
          problem: '구강악안면 내비게이션은 의료영상, 환자와 기구 좌표, 수술별 도구, 공간 표시가 한 흐름으로 맞아야 하지만 기능이 분절되면 정합 상태와 데이터 흐름을 검토하기 어렵습니다.',
          roleLabel: '3D 의료영상·수술내비게이션 개발자',
          role: '전체 소프트웨어 아키텍처를 설계하고 DICOM·3D 모델 로딩, MPR·3D 시각화, 광학 추적 SDK와 데이터 파이프라인, 영상·환자·마커·기구 좌표 변환, 환자 정합과 피드백, 마커·비표준·장기구 캘리브레이션, 6개 워크플로와 미러링, HoloLens–PC 통신·공간 표시·상호작용, 팬텀 통합 시험과 검증 도구의 주 구현을 맡았습니다.',
          teamResult: 'DIGITRACK과 삼성서울병원 연구팀은 임상 워크플로와 요구사항 맥락, 수용 검토 기준, 통합 시연을 공동으로 검토했습니다.',
          evidence: '두 전체 길이 영상과 승인된 화면·좌표계·기구·팬텀 파생본은 위치, 모델, 영상, 상호작용 데이터가 SMCNavi에서 HoloLens 경로까지 연결된 연구 프로토타입을 보여줍니다.',
          limitation: '장시간 안정성, 성능 최적화, 배포 설정, 패키징은 제품화 수준으로 마무리되지 않았습니다. 이 사례는 생산 배포, 실제 수술 사용, 임상 효능·안전성·정확도를 주장하지 않습니다.',
          collaboration: '의료진의 워크플로·수용 기준과 개발팀의 추적·영상·XR 통합 검토를 분리해 기록합니다.',
          mediaAlt: 'HoloLens 2를 착용한 사용자의 시점과 팬텀 위 홀로그램, 추적 기구, MPR 화면이 이어지는 디지털 트윈 시연 영상.',
          mediaCaption: 'HoloLens 2 디지털 트윈과 추적 기구·영상 표시를 연결한 전체 길이 연구 프로토타입 시연입니다. 비식별 연구 영상이며 임상 결과 근거가 아닙니다.',
          status: '프로토타입 · 진행 중',
          cardProblem: '의료영상·추적·정합·수술별 기능을 SMCNavi와 HoloLens 경로로 연결합니다.',
          cardOwnedRole: '전체 SW 아키텍처와 3D Slicer·추적·정합·캘리브레이션·HoloLens 통합을 주 구현했습니다.',
          cardEvidence: '두 전체 길이 영상과 승인된 UI·좌표계·기구·팬텀 파생본이 연구 프로토타입 근거입니다.',
          problemSummary: '분절된 영상·추적·정합·공간 표시를 하나의 검토 가능한 흐름으로 연결합니다.',
          ownedRole: 'SMCNavi와 HoloLens 확장의 전체 소프트웨어 아키텍처 및 주 구현을 맡았습니다.',
          verifiedEvidence: '전체 길이 SMCNavi·HoloLens 영상과 승인된 기술 파생본이 근거입니다.',
          visualAlt: 'SMCNavi와 HoloLens를 연결한 팬텀 기반 수술내비게이션 연구 프로토타입.',
          visualCaption: 'SMCNavi–HoloLens 전체 길이 연구 프로토타입 시연.'
        },
        en: {
          title: 'SMCNavi · HoloLens Surgical Navigation',
          shortTitle: 'SMCNavi · HoloLens',
          eyebrow: 'Medical Core · Research Prototype',
          thesis: 'Integrated tracking, registration, and calibration in SMCNavi, then carried the result into a HoloLens spatial interface.',
          summary: 'A custom 3D Slicer surgical-navigation platform developed by DIGITRACK with Samsung Medical Center in a research collaboration, plus a separate HoloLens spatial-interface extension.',
          problem: 'Oral and maxillofacial navigation must align medical images, patient and instrument coordinates, procedure-specific tools, and spatial presentation in one flow; fragmented functions make registration state and data flow difficult to inspect.',
          roleLabel: '3D Medical Imaging · Surgical Navigation Developer',
          role: 'Designed the overall software architecture and served as the primary implementer for DICOM and 3D-model loading, MPR and 3D visualisation, the optical-tracker SDK and data pipeline, image/patient/marker/instrument transforms, patient registration and feedback, marker/non-standard/long-instrument calibration, six workflows and mirroring, HoloLens–PC communication and interaction, and phantom integration tests and verification tooling.',
          teamResult: 'The DIGITRACK and Samsung Medical Center research team jointly reviewed the clinical-workflow and requirements context, acceptance criteria, and integration demonstrations.',
          evidence: 'Two full-length videos and approved interface, coordinate-frame, instrument, and phantom derivatives show a working research prototype carrying position, model, image, and interaction data from SMCNavi through the HoloLens path.',
          limitation: 'Long-duration robustness, performance optimisation, deployment setup, and packaging were not completed to productisation level. This case does not claim production deployment, use in real surgery, or clinical efficacy, safety, or accuracy.',
          collaboration: 'Clinical workflow and acceptance criteria remain distinct from the development team\'s tracking, imaging, and XR integration review.',
          mediaAlt: 'Digital-twin demonstration moving between a HoloLens 2 viewpoint, a hologram over a phantom, a tracked instrument, and MPR displays.',
          mediaCaption: 'Full-length research-prototype demonstration connecting the HoloLens 2 digital twin with tracked instruments and image presentation. It uses de-identified research imagery and is not evidence of clinical outcome.',
          status: 'Prototype · Ongoing',
          cardProblem: 'Connect medical images, tracking, registration, and procedure workflows through the SMCNavi and HoloLens path.',
          cardOwnedRole: 'Primarily implemented the full software architecture across 3D Slicer, tracking, registration, calibration, and HoloLens integration.',
          cardEvidence: 'Two full-length videos and approved interface, coordinate, instrument, and phantom derivatives evidence the research prototype.',
          problemSummary: 'Connect fragmented imaging, tracking, registration, and spatial presentation in one inspectable flow.',
          ownedRole: 'Owned the overall software architecture and primary implementation of SMCNavi and the HoloLens extension.',
          verifiedEvidence: 'Full-length SMCNavi and HoloLens videos plus approved technical derivatives provide the evidence.',
          visualAlt: 'Phantom-based surgical-navigation research prototype connecting SMCNavi and HoloLens.',
          visualCaption: 'Full-length SMCNavi–HoloLens research-prototype demonstration.'
        }
      },
      storySections: [
        {
          key: 'smcnavi-overview',
          layout: 'wide',
          translations: {
            ko: { heading: 'SMCNavi 플랫폼 개요', body: 'SMCNavi는 DICOM·3D 모델 로딩, MPR·3D 시각화, 광학 추적, 환자 정합, 기구 캘리브레이션, 수술별 UI를 하나의 맞춤형 3D Slicer 데스크톱 플랫폼에 통합합니다. HoloLens 기능은 SMCNavi와 연결되는 별도 PC 확장으로 구현했습니다.' },
            en: { heading: 'SMCNavi platform overview', body: 'SMCNavi integrates DICOM and 3D-model loading, MPR and 3D visualisation, optical tracking, patient registration, instrument calibration, and procedure-specific UI in one custom 3D Slicer desktop platform. The HoloLens work is a separate PC-side extension connected to SMCNavi.' }
          },
          media: []
        },
        {
          key: 'smcnavi-workflows',
          layout: 'wide',
          translations: {
            ko: {
              heading: '6개 구강악안면 워크플로',
              body: '아래 기능은 소프트웨어로 구현·시연한 워크플로이며 임상 효능을 뜻하지 않습니다.',
              items: ['상악종양 제거술 내비게이션', '하악종양 제거술 내비게이션', '양악수술 내비게이션', '하악운동 트래킹', '골이식 위치설정', '광대·안와 골절 미러링']
            },
            en: {
              heading: 'Six oral and maxillofacial workflows',
              body: 'The following are implemented and demonstrated software workflows; they are not evidence of clinical efficacy.',
              items: ['Maxillary tumour-removal navigation', 'Mandibular tumour-removal navigation', 'Bimaxillary-surgery navigation', 'Mandibular-motion tracking', 'Bone-graft placement', 'Zygomatic-orbital fracture mirroring']
            }
          },
          media: [
            {
              id: 'surgical-navigation-smcnavi-features-01',
              type: 'video',
              status: 'approved',
              publicPath: 'assets/projects/surgical-navigation/surgical-navigation-smcnavi-features-01.mp4',
              preload: 'metadata',
              videoPolicy: {
                maxBytes: 100000000,
                targetDurationSeconds: 90.266667,
                toleranceSeconds: 0.2,
                width: 960,
                height: 720,
                codec: 'h264',
                requireNoAudio: true,
                requireFastStart: true
              },
              poster: {
                id: 'surgical-navigation-smcnavi-poster-01',
                type: 'image',
                status: 'approved',
                publicPath: 'assets/projects/surgical-navigation/surgical-navigation-smcnavi-poster-01.png'
              },
              translations: {
                ko: {
                  caption: 'SMCNavi에서 6개 구강악안면 워크플로가 전환·시연되는 전체 기능 소개 영상입니다. 비식별 연구 영상이며 임상 결과 근거가 아닙니다.',
                  alt: 'SMCNavi 화면에서 종양 제거, 양악수술, 하악운동, 골이식, 골절 미러링 워크플로가 차례로 시연되는 영상.'
                },
                en: {
                  caption: 'Full feature video moving through six oral and maxillofacial workflows in SMCNavi. It uses de-identified research imagery and is not evidence of clinical outcome.',
                  alt: 'Video moving through SMCNavi workflows for tumour removal, bimaxillary surgery, mandibular motion, bone-graft placement, and fracture mirroring.'
                }
              }
            },
            {
              id: 'surgical-navigation-smcnavi-ui-01',
              type: 'image',
              status: 'approved',
              publicPath: 'assets/projects/surgical-navigation/surgical-navigation-smcnavi-ui-01.png',
              translations: {
                ko: { caption: 'SMCNavi 통합 UI와 HoloLens–PC 연결 화면. 비식별 연구 영상 파생본이며 임상 결과 근거가 아닙니다.', alt: '수술 유형 선택 UI, 팬텀에서 추적 기구를 사용하는 장면, HoloLens와 모니터 연결 화면을 묶은 그림.' },
                en: { caption: 'Integrated SMCNavi UI and HoloLens–PC connection view. This derivative uses de-identified research imagery and is not evidence of clinical outcome.', alt: 'Composite showing the procedure-selection UI, tracked instrument use on a phantom, HoloLens, and a connected monitor.' }
              }
            },
            {
              id: 'surgical-navigation-smcnavi-workflows-01',
              type: 'image',
              status: 'approved',
              publicPath: 'assets/projects/surgical-navigation/surgical-navigation-smcnavi-workflows-01.png',
              translations: {
                ko: { caption: '6개 구강악안면 소프트웨어 워크플로. 비식별 연구 영상 파생본이며 임상 효능을 뜻하지 않습니다.', alt: '상악·하악 종양 제거, 양악수술, 하악운동, 골이식 위치설정, 광대·안와 골절 미러링 화면을 2×3으로 배치한 그림.' },
                en: { caption: 'Six oral and maxillofacial software workflows. This derivative uses de-identified research imagery and does not establish clinical efficacy.', alt: 'Two-by-three composite of maxillary and mandibular tumour removal, bimaxillary surgery, mandibular motion, bone-graft placement, and zygomatic-orbital fracture mirroring.' }
              }
            }
          ]
        },
        {
          key: 'system-architecture',
          layout: 'wide',
          translations: {
            ko: { heading: 'SMCNavi–HoloLens 시스템 구조', body: '광학 추적 관측은 SMCNavi의 변환·정합·캘리브레이션과 수술 워크플로로 들어갑니다. 승인된 변환·영상·모델 데이터는 OpenIGTLink로 PC 확장에 연결되고, 렌더링과 상호작용은 Holographic Remoting을 통해 HoloLens 2와 오갑니다.' },
            en: { heading: 'SMCNavi–HoloLens system architecture', body: 'Optical-tracker observations enter SMCNavi\'s transforms, registration, calibration, and procedure workflows. Approved transform, image, and model data connect to the PC extension through OpenIGTLink; rendering and interaction travel between the extension and HoloLens 2 through Holographic Remoting.' }
          },
          media: [],
          diagram: {
            kind: 'system-flow',
            boundary: 'prototype',
            translations: {
              ko: { title: '추적 관측에서 HoloLens 상호작용까지', caption: '설명용 시스템 관계 다이어그램이며 사진·실험·임상 결과 근거가 아닙니다.', boundaryLabel: 'SMCNavi–HoloLens 경로 · 연구 프로토타입' },
              en: { title: 'From tracking observations to HoloLens interaction', caption: 'Explanatory system-relationship diagram; it is not photographic, experimental, or clinical-outcome evidence.', boundaryLabel: 'SMCNavi–HoloLens path · Research prototype' }
            },
            nodes: [
              { key: 'tracker', translations: { ko: { label: '광학 추적 장치', detail: '도구·마커 관측' }, en: { label: 'Optical tracker', detail: 'Tool and marker observations' } } },
              { key: 'smcnavi', translations: { ko: { label: 'SMCNavi', detail: '3D Slicer · 영상·모델 · 변환·정합·캘리브레이션 · 6개 워크플로' }, en: { label: 'SMCNavi', detail: '3D Slicer · images and models · transforms, registration, calibration · six workflows' } } },
              { key: 'openigtlink', translations: { ko: { label: 'OpenIGTLink', detail: '변환 및 승인된 영상·모델 데이터' }, en: { label: 'OpenIGTLink', detail: 'Transforms and approved image/model data' } } },
              { key: 'pc-extension', translations: { ko: { label: 'HoloLens PC 확장', detail: 'Unity · MRTK · 렌더링' }, en: { label: 'HoloLens PC extension', detail: 'Unity · MRTK · rendering' } } },
              { key: 'remoting', translations: { ko: { label: 'Holographic Remoting', detail: 'PC 렌더 스트림 · 입력 반환' }, en: { label: 'Holographic Remoting', detail: 'PC render stream · input return' } } },
              { key: 'hololens', translations: { ko: { label: 'HoloLens 2', detail: '공간 표시 · 상호작용' }, en: { label: 'HoloLens 2', detail: 'Spatial presentation · interaction' } } }
            ],
            edges: [
              { from: 'tracker', to: 'smcnavi', direction: 'forward', translations: { ko: { label: '도구·마커 관측' }, en: { label: 'Tool and marker observations' } } },
              { from: 'smcnavi', to: 'openigtlink', direction: 'bidirectional', translations: { ko: { label: '변환·영상·모델' }, en: { label: 'Transforms, images, models' } } },
              { from: 'openigtlink', to: 'pc-extension', direction: 'bidirectional', translations: { ko: { label: '연결 데이터' }, en: { label: 'Connected data' } } },
              { from: 'pc-extension', to: 'remoting', direction: 'bidirectional', translations: { ko: { label: '렌더링·입력' }, en: { label: 'Rendering and input' } } },
              { from: 'remoting', to: 'hololens', direction: 'bidirectional', translations: { ko: { label: '홀로그램·상호작용' }, en: { label: 'Holograms and interaction' } } }
            ]
          }
        },
        {
          key: 'registration-calibration',
          layout: 'grid',
          translations: {
            ko: {
              heading: '추적·정합·캘리브레이션',
              body: '환자·기구와 영상 모델 사이의 변환 경로를 명시적으로 구성하고 각 단계의 입력과 피드백을 검토할 수 있게 했습니다.',
              items: ['광학 추적 SDK 연결과 실시간 도구·마커 데이터 파이프라인', '영상·환자·마커·기구 좌표계 사이의 변환 체인', '환자 정합과 정합 상태 피드백', '환자·기구 마커 캘리브레이션', '비표준 기구와 장기구 캘리브레이션']
            },
            en: {
              heading: 'Tracking, registration, and calibration',
              body: 'Built explicit transform paths between the patient, instruments, and image models so the inputs and feedback at each stage could be inspected.',
              items: ['Optical-tracker SDK integration and the live tool/marker data pipeline', 'Transform chain across image, patient, marker, and instrument frames', 'Patient registration and registration-state feedback', 'Patient and instrument marker calibration', 'Non-standard and long-instrument calibration']
            }
          },
          media: [
            {
              id: 'surgical-navigation-gallery-02',
              type: 'image',
              status: 'approved',
              publicPath: 'assets/projects/surgical-navigation/surgical-navigation-gallery-02.png',
              translations: {
                ko: { caption: '좌표계 관계 — 광학 추적 장치 기준의 환자 마커·프로브 마커 변환.', alt: '광학 추적 장치 기준으로 환자 마커와 프로브 마커 좌표 변환을 설명하는 개념도.' },
                en: { caption: 'Coordinate frames: patient-marker and probe-marker transforms relative to the optical tracker.', alt: 'Concept diagram of patient-marker and probe-marker transforms relative to the optical tracker.' }
              }
            },
            {
              id: 'surgical-navigation-gallery-03',
              type: 'image',
              status: 'approved',
              publicPath: 'assets/projects/surgical-navigation/surgical-navigation-gallery-03.png',
              translations: {
                ko: { caption: '비표준·장기구 캘리브레이션에 사용한 패시브 마커 어댑터 장착 기구.', alt: '반사 마커 네 개가 달린 어댑터를 장착한 길이가 긴 수술 기구 사진.' },
                en: { caption: 'Instrument with a passive-marker adapter used for non-standard and long-instrument calibration.', alt: 'Long surgical instrument fitted with an adapter carrying four reflective markers.' }
              }
            },
            {
              id: 'surgical-navigation-bench-01',
              type: 'image',
              status: 'approved',
              publicPath: 'assets/projects/surgical-navigation/surgical-navigation-bench-01.png',
              translations: {
                ko: { caption: '광학 추적 장치, SMCNavi, 두개골 팬텀을 연결한 공개 안전 벤치 프레임.', alt: '광학 추적 장치, 모니터, 두개골 팬텀, 추적 기구가 함께 보이는 벤치 시연 프레임.' },
                en: { caption: 'Public-safe bench frame connecting the optical tracker, SMCNavi, and a skull phantom.', alt: 'Bench demonstration frame showing an optical tracker, monitor, skull phantom, and tracked instrument.' }
              }
            }
          ]
        },
        {
          key: 'hololens-interface',
          layout: 'grid',
          translations: {
            ko: {
              heading: 'HoloLens 공간 인터페이스',
              body: 'SMCNavi가 소유한 정합·워크플로 상태를 별도 PC 확장에서 렌더링하고 HoloLens 2의 공간 표시와 상호작용으로 연결했습니다.',
              items: ['OpenIGTLink를 통한 변환과 승인된 영상·모델 데이터 교환', 'Unity·MRTK 기반 PC 렌더링과 공간 배치', 'Holographic Remoting을 통한 HoloLens 2 표시', 'HoloLens 상호작용 입력의 PC 확장 반환', '광학 추적·SMCNavi·HoloLens 팬텀 통합 시험']
            },
            en: {
              heading: 'HoloLens spatial interface',
              body: 'Rendered SMCNavi-owned registration and workflow state in a separate PC extension and connected it to HoloLens 2 spatial presentation and interaction.',
              items: ['Transform and approved image/model exchange through OpenIGTLink', 'PC rendering and spatial placement with Unity and MRTK', 'HoloLens 2 presentation through Holographic Remoting', 'Return of HoloLens interaction input to the PC extension', 'Phantom integration tests across optical tracking, SMCNavi, and HoloLens']
            }
          },
          media: [
            {
              id: 'surgical-navigation-gallery-05',
              type: 'image',
              status: 'approved',
              publicPath: 'assets/projects/surgical-navigation/surgical-navigation-gallery-05.png',
              translations: {
                ko: { caption: 'HoloLens 공간 표시와 손·시선 상호작용 토글.', alt: 'HoloLens에서 두개골 홀로그램과 손 추적·시선 추적 토글 패널을 함께 보여주는 화면.' },
                en: { caption: 'HoloLens spatial presentation with hand- and eye-interaction toggles.', alt: 'HoloLens view showing a skull hologram with hand-tracking and eye-tracking toggle controls.' }
              }
            },
            {
              id: 'surgical-navigation-gallery-06',
              type: 'image',
              status: 'approved',
              publicPath: 'assets/projects/surgical-navigation/surgical-navigation-gallery-06.png',
              translations: {
                ko: { caption: 'HoloLens, 광학 추적, 두개골 팬텀을 함께 연결한 통합 시연.', alt: 'HoloLens를 착용한 사용자가 광학 추적 장치 앞에서 팬텀에 기구를 맞추는 장면.' },
                en: { caption: 'Integration demonstration connecting HoloLens, optical tracking, and a skull phantom.', alt: 'User wearing HoloLens aligning an instrument on a phantom in front of the optical tracker.' }
              }
            }
          ]
        }
      ],
      blocks: [],
      links: []
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
      relatedProjectSlugs: ['digital-occlusion-workflow'],
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
      slug: 'digital-occlusion-workflow',
      tier: 'medical-core',
      period: '2026.03 – present',
      evidenceState: 'ongoing',
      lifecycleState: 'research',
      capabilityKeys: ['medical-navigation', 'registration'],
      route: 'projects/digital-occlusion-workflow/',
      tech: ['3D Slicer', 'C++', 'Qt', 'Python', 'VTK', 'PyBullet', 'SOFA'],
      media: {
        lead: {
          id: 'digital-occlusion-workflow-demo-01',
          type: 'video',
          status: 'approved',
          publicPath: 'assets/projects/digital-occlusion-workflow/digital-occlusion-workflow-demo-01.mp4',
          preload: 'none',
          videoPolicy: {
            maxBytes: 20971520,
            targetDurationSeconds: 31,
            toleranceSeconds: 0.2,
            width: 960,
            height: 460,
            frameRate: 24,
            codec: 'h264',
            pixelFormat: 'yuv420p',
            requireNoAudio: true,
            requireFastStart: true
          }
        },
        video: {
          id: 'digital-occlusion-workflow-demo-01',
          type: 'video',
          status: 'approved',
          publicPath: 'assets/projects/digital-occlusion-workflow/digital-occlusion-workflow-demo-01.mp4',
          preload: 'none'
        },
        poster: {
          id: 'digital-occlusion-workflow-poster-01',
          type: 'image',
          status: 'approved',
          publicPath: 'assets/projects/digital-occlusion-workflow/digital-occlusion-workflow-poster-01.png'
        },
        gallery: []
      },
      pdf: {
        ko: 'assets/pdfs/digital-occlusion-workflow-ko.pdf',
        en: 'assets/pdfs/digital-occlusion-workflow-en.pdf'
      },
      pdfSequence: {
        middle: ['integrated-workflow', 'user-centered-decisions', 'system-architecture', 'verification-boundary'],
        evidenceId: 'digital-occlusion-workflow-demo-01',
        diagrams: [
          { storySectionKey: 'integrated-workflow' },
          { storySectionKey: 'system-architecture' }
        ],
        figureIds: [
          'digital-occlusion-workflow-landmark-01',
          'digital-occlusion-workflow-occlusion-01',
          'digital-occlusion-workflow-evaluation-01'
        ]
      },
      relatedProjectSlugs: ['mandibular-fracture'],
      storySections: [
        {
          key: 'redesign-background',
          layout: 'wide',
          placement: 'before-standard',
          translations: {
            ko: {
              heading: '왜 다시 설계했는가',
              body: '2023.04–2023.12 유지보수·검증을 담당했던 이전 애플리케이션에서는 특징점 추출이 별도 도구로 분리되어 모델 확대·축소와 이동, 참고 사진 대조가 불편했습니다. 교합은 필요한 여러 시점을 함께 보기 어려웠고 저장·불러오기가 작업 흐름과 분리되어 있었습니다. 악안면 특징점을 활용하지 못했고 결과를 읽는 평가 화면도 충분히 설계되지 않았습니다. 임상 지식과 일부 협업 알고리즘은 이어받되, 2026.03부터 애플리케이션 구조와 워크플로우를 다시 설계했습니다. 키보드 단축키의 불편은 재설계 배경이지만 현재 버전에서 개선했다고 주장하지 않습니다.'
            },
            en: {
              heading: 'Why the workflow was redesigned',
              body: 'In the earlier application that I maintained and validated from 2023.04 to 2023.12, landmark extraction was separated into another tool, making zoom, pan, and reference-image comparison awkward. Occlusion lacked the views needed for simultaneous comparison, while save/load sat outside the working flow. Maxillofacial landmarks were not used and the evaluation screen was under-designed. Clinical knowledge and some collaborative algorithms carry forward, but the application structure and workflow have been redesigned since 2026.03. Awkward keyboard shortcuts remain background context; this case does not claim that shortcut design was improved.'
            }
          }
        },
        {
          key: 'integrated-workflow',
          layout: 'wide',
          placement: 'before-standard',
          translations: {
            ko: {
              heading: '한 앱으로 연결한 7단계 워크플로우',
              body: '데이터 준비부터 평가와 내보내기까지 프로젝트 상태가 한 흐름 안에서 이어집니다.',
              items: [
                '8개 3D 모델 준비',
                '치아 특징점 30개(상악 15개·하악 15개)와 악안면 특징점 30개 입력·가시화',
                '특징점 기반 해부학적 좌표계 구성',
                '자동 교합, 6-DOF 미세 조정, 피봇 회전',
                '접촉 상태와 거리 가시화',
                'RMSE·Gap·FRE 평가',
                '프로젝트 저장과 결과 내보내기'
              ]
            },
            en: {
              heading: 'A seven-stage workflow in one application',
              body: 'Project state remains connected from data preparation through evaluation and export.',
              items: [
                'Prepare eight 3D models',
                'Enter and visualize 30 dental landmarks (15 upper and 15 lower) plus 30 maxillofacial landmarks',
                'Construct anatomical frames from the landmarks',
                'Run automatic occlusion, 6-DOF fine adjustment, and pivot rotation',
                'Visualize contact state and distance',
                'Evaluate RMSE, Gap, and FRE',
                'Save the project and export results'
              ]
            }
          },
          diagram: {
            kind: 'system-flow',
            boundary: 'research-validation',
            translations: {
              ko: { title: '데이터 준비에서 평가까지', caption: '현재 구현된 7단계 디지털 교합 작업 흐름입니다.', boundaryLabel: '현재 구현 · 연구진 검증 중' },
              en: { title: 'Data preparation through evaluation', caption: 'The seven-stage digital-occlusion workflow implemented in the current build.', boundaryLabel: 'Implemented scope · Under researcher validation' }
            },
            nodes: [
              { key: 'prep', translations: { ko: { label: '모델 준비', detail: '8개 3D 모델' }, en: { label: 'Model preparation', detail: 'Eight 3D models' } } },
              { key: 'landmarks', translations: { ko: { label: '특징점', detail: '치아 30개 · 악안면 30개' }, en: { label: 'Landmarks', detail: '30 dental · 30 maxillofacial' } } },
              { key: 'frame', translations: { ko: { label: '해부학 좌표계', detail: '특징점 기반 기준 구성' }, en: { label: 'Anatomical frame', detail: 'Landmark-based reference' } } },
              { key: 'occlusion', translations: { ko: { label: '교합·미세 조정', detail: '자동 교합 · 6-DOF · 피봇 회전' }, en: { label: 'Occlusion and adjustment', detail: 'Automatic occlusion · 6-DOF · pivot rotation' } } },
              { key: 'contact', translations: { ko: { label: '접촉 분석', detail: '접촉 상태 · 거리 가시화' }, en: { label: 'Contact analysis', detail: 'Contact state · distance view' } } },
              { key: 'evaluation', translations: { ko: { label: '평가', detail: 'RMSE · Gap · FRE' }, en: { label: 'Evaluation', detail: 'RMSE · Gap · FRE' } } },
              { key: 'export', translations: { ko: { label: '저장·내보내기', detail: '프로젝트 · 평가 결과' }, en: { label: 'Save and export', detail: 'Project · evaluation results' } } }
            ],
            edges: [
              { from: 'prep', to: 'landmarks', direction: 'forward', translations: { ko: { label: '준비된 모델' }, en: { label: 'Prepared models' } } },
              { from: 'landmarks', to: 'frame', direction: 'forward', translations: { ko: { label: '입력 특징점' }, en: { label: 'Entered landmarks' } } },
              { from: 'frame', to: 'occlusion', direction: 'forward', translations: { ko: { label: '해부학 기준' }, en: { label: 'Anatomical reference' } } },
              { from: 'occlusion', to: 'contact', direction: 'forward', translations: { ko: { label: '조정 자세' }, en: { label: 'Adjusted pose' } } },
              { from: 'contact', to: 'evaluation', direction: 'forward', translations: { ko: { label: '접촉·거리 결과' }, en: { label: 'Contact and distance results' } } },
              { from: 'evaluation', to: 'export', direction: 'forward', translations: { ko: { label: '평가 결과' }, en: { label: 'Evaluation results' } } }
            ]
          }
        },
        {
          key: 'user-centered-decisions',
          layout: 'grid',
          placement: 'before-standard',
          translations: {
            ko: {
              heading: '연구진이 직접 쓰는 화면으로',
              body: '기능 수를 늘리는 것보다 연구진이 반복 작업을 끊김 없이 수행하고 결과를 비교할 수 있게 하는 데 우선순위를 두었습니다.',
              items: [
                '확대·축소 가능한 특징점 입력 화면 옆에 참고 이미지 배치',
                '교합 상태를 동시에 비교하는 다중 시점 화면',
                '프로젝트 저장·불러오기 흐름 통합과 단순화',
                '교합 과정을 확인하는 시뮬레이션 재생바',
                '미세 조정을 위한 피봇 회전 핸들',
                '모델 투명도와 특징점 가시성 제어'
              ]
            },
            en: {
              heading: 'Designed for direct researcher use',
              body: 'The priority was not feature count, but helping researchers repeat the workflow without interruption and compare its results.',
              items: [
                'A reference image beside the zoomable landmark-entry view',
                'Multiple simultaneous views of the occlusal state',
                'A unified and simplified project save/load flow',
                'A playback bar for reviewing the occlusion process',
                'Pivot rotation handles for fine adjustment',
                'Model-opacity and landmark-visibility controls'
              ]
            }
          },
          media: [
            {
              id: 'digital-occlusion-workflow-landmark-01',
              type: 'image',
              status: 'approved',
              publicPath: 'assets/projects/digital-occlusion-workflow/digital-occlusion-workflow-landmark-01.png',
              translations: {
                ko: { caption: '참고 이미지와 확대·축소 가능한 3D 뷰를 한 화면에서 확인하며 특징점을 입력합니다. 합성 테스트 데이터 화면입니다.', alt: '왼쪽 참고 이미지와 특징점 목록, 오른쪽 3D 턱 모델과 치아 특징점이 함께 보이는 화면.' },
                en: { caption: 'Researchers enter landmarks while viewing a reference image beside a zoomable 3D view. The screen uses synthetic test data.', alt: 'Screen with a reference image and landmark list on the left and a 3D jaw model with dental landmarks on the right.' }
              }
            },
            {
              id: 'digital-occlusion-workflow-occlusion-01',
              type: 'image',
              status: 'approved',
              publicPath: 'assets/projects/digital-occlusion-workflow/digital-occlusion-workflow-occlusion-01.png',
              translations: {
                ko: { caption: '교합 상태와 접촉 거리 맵을 여러 시점에서 동시에 비교하는 작업 화면입니다. 합성 테스트 데이터 화면입니다.', alt: '주 시점과 세 보조 시점에서 붉은 접촉 거리 맵이 표시된 하악 모델을 비교하는 교합 화면.' },
                en: { caption: 'The occlusion workspace compares the occlusal state and contact-distance map across several views. The screen uses synthetic test data.', alt: 'Occlusion screen comparing a mandibular model with a red contact-distance map in one main and three secondary views.' }
              }
            },
            {
              id: 'digital-occlusion-workflow-evaluation-01',
              type: 'image',
              status: 'approved',
              publicPath: 'assets/projects/digital-occlusion-workflow/digital-occlusion-workflow-evaluation-01.png',
              translations: {
                ko: { caption: 'RMSE·Gap·FRE 계산과 결과 내보내기를 한 흐름으로 묶은 평가 화면입니다. 표시값은 UI 예시이며 성능 결과가 아닙니다.', alt: '왼쪽 평가 항목과 결과 표, 오른쪽 접촉 거리 맵이 함께 보이는 RMSE·Gap·FRE 평가 화면.' },
                en: { caption: 'The evaluation screen combines RMSE, Gap, and FRE calculation with result export. Displayed values illustrate the UI, not performance outcomes.', alt: 'RMSE, Gap, and FRE evaluation screen with evaluation controls and result tables on the left and a contact-distance map on the right.' }
              }
            }
          ]
        },
        {
          key: 'system-architecture',
          layout: 'wide',
          placement: 'before-standard',
          translations: {
            ko: { heading: 'Custom App 아키텍처와 소유권', body: '3D Slicer Custom App의 C++/Qt 셸, Python 워크플로우 모듈, 공통 상태·라이브러리를 한 구조로 설계했습니다. 협업 알고리즘과 엔진은 개인 구현으로 재귀속하지 않고, 이를 상태 흐름·UI·가시화·평가로 통합한 범위를 구분합니다.' },
            en: { heading: 'Custom App architecture and ownership', body: 'The 3D Slicer Custom App is structured around a C++/Qt shell, Python workflow modules, and shared state and libraries. Collaborative algorithms and engines are not reassigned as individual implementations; the individually owned integration into state flow, UI, visualization, and evaluation remains explicit.' }
          },
          diagram: {
            kind: 'system-flow',
            boundary: 'ownership-boundary',
            translations: {
              ko: { title: 'Custom App 통합 구조', caption: '협업 알고리즘·엔진과 개인이 소유한 아키텍처·통합 범위를 분리한 구조입니다.', boundaryLabel: '개인 소유와 팀 결과 분리' },
              en: { title: 'Custom App integration structure', caption: 'Architecture separating collaborative algorithms and engines from individually owned architecture and integration.', boundaryLabel: 'Individual ownership separated from team results' }
            },
            nodes: [
              { key: 'shell', translations: { ko: { label: 'C++ / Qt 셸', detail: '개인: 전체 아키텍처' }, en: { label: 'C++ / Qt shell', detail: 'Individual: complete architecture' } } },
              { key: 'workflow', translations: { ko: { label: 'Python 워크플로우', detail: '개인: workflow · UI/UX' }, en: { label: 'Python workflow', detail: 'Individual: workflow · UI/UX' } } },
              { key: 'shared-state', translations: { ko: { label: '공통 상태·라이브러리', detail: '개인: 상태·데이터 흐름' }, en: { label: 'Shared state and library', detail: 'Individual: state and data flow' } } },
              { key: 'landmarks', translations: { ko: { label: '특징점·해부학 좌표', detail: '협업 알고리즘 · 개인 통합' }, en: { label: 'Landmarks and anatomical frames', detail: 'Collaborative algorithms · individual integration' } } },
              { key: 'engines', translations: { ko: { label: '교합 엔진', detail: 'Geometric · PyBullet · SOFA 협업 엔진 · 개인 통합' }, en: { label: 'Occlusion engines', detail: 'Collaborative Geometric · PyBullet · SOFA engines · individual integration' } } },
              { key: 'evaluation-export', translations: { ko: { label: '평가·가시화·내보내기', detail: '지표 공동 정의 · 개인 계산·구현' }, en: { label: 'Evaluation, visualization, and export', detail: 'Metrics jointly defined · calculation and implementation individually owned' } } }
            ],
            edges: [
              { from: 'shell', to: 'workflow', direction: 'bidirectional', translations: { ko: { label: 'UI 명령·화면 상태' }, en: { label: 'UI commands and view state' } } },
              { from: 'workflow', to: 'shared-state', direction: 'bidirectional', translations: { ko: { label: '프로젝트 상태' }, en: { label: 'Project state' } } },
              { from: 'shared-state', to: 'landmarks', direction: 'bidirectional', translations: { ko: { label: '특징점·좌표 데이터' }, en: { label: 'Landmark and frame data' } } },
              { from: 'shared-state', to: 'engines', direction: 'bidirectional', translations: { ko: { label: '자세·접촉 상태' }, en: { label: 'Pose and contact state' } } },
              { from: 'shared-state', to: 'evaluation-export', direction: 'forward', translations: { ko: { label: '평가 입력·결과' }, en: { label: 'Evaluation input and results' } } }
            ]
          }
        },
        {
          key: 'verification-boundary',
          layout: 'wide',
          placement: 'before-standard',
          translations: {
            ko: {
              heading: '현재 검증 상태와 한계',
              body: '기능 동작과 임상 활용 가능성을 같은 주장으로 섞지 않습니다.',
              items: [
                '구현됨: 8개 모델 준비, 치아·악안면 특징점, 해부학 좌표계, 자동 교합·6-DOF·접촉 분석, 평가·내보내기',
                '검증 중: 연구진이 개발·시연 빌드를 직접 사용하며 워크플로우 사용성과 교합 결과를 검토',
                '주장하지 않음: 병원 설치, 실제 수술 사용, 의료기기 상태, 임상 효능·정확도·안전성, 화면 예시값의 성능 해석'
              ]
            },
            en: {
              heading: 'Current validation state and limitations',
              body: 'Functional operation and clinical applicability remain separate claims.',
              items: [
                'Implemented: eight-model preparation, dental and maxillofacial landmarks, anatomical frames, automatic occlusion, 6-DOF and contact analysis, evaluation, and export',
                'Under review: researchers directly use development and demonstration builds to review workflow usability and occlusion output',
                'Not claimed: hospital installation, use in real surgery, medical-device status, clinical efficacy, accuracy or safety, or performance interpretation of displayed example values'
              ]
            }
          }
        },
        {
          key: 'long-term-direction',
          layout: 'wide',
          placement: 'after-standard',
          translations: {
            ko: { heading: '디지털 교합에서 전체 수술계획으로', body: '다음 연구 방향은 정상 교합 기반 하악 운동을 연결하고, 장기적으로 디지털 교합·계측·하악 운동을 포함하는 전체 구강악안면 수술계획 소프트웨어로 확장하는 것입니다. 이는 구현 완료가 아닌 삼성서울병원과 DIGITRACK의 장기 R&D 방향입니다.' },
            en: { heading: 'From digital occlusion to complete surgical planning', body: 'The next research direction connects normal-occlusion-based mandibular motion and, over the longer term, expands toward complete oral and maxillofacial surgical-planning software spanning digital occlusion, measurement, and mandibular motion. This is the long-term Samsung Medical Center and DIGITRACK R&D direction, not completed functionality.' }
          }
        }
      ],
      blocks: [],
      links: [],
      translations: {
        ko: {
          title: '구강악안면 디지털 교합 워크플로우',
          shortTitle: '디지털 교합 워크플로우',
          eyebrow: '의료 코어 · 임상 워크플로우 통합',
          thesis: '분리된 특징점·교합·평가 기능을 연구진이 한 앱에서 직접 다룰 수 있는 사용자 친화적 end-to-end 워크플로우로 재설계했습니다.',
          summary: '8개 3D 모델 준비, 치아·악안면 특징점, 해부학적 좌표계, 자동 교합·6-DOF 조정·접촉 분석, RMSE·Gap·FRE 평가와 내보내기를 하나의 Custom App으로 연결했습니다.',
          problem: '이전 흐름은 특징점 앱이 분리되어 참고 이미지 대조와 확대·이동이 불편했고, 교합의 다중 시점, 저장·불러오기, 악안면 특징점, 평가 화면이 충분히 통합되지 않았습니다.',
          role: '기술 리드·메인 개발자로 C++/Qt 셸, Python 모듈, 공통 라이브러리의 전체 Custom App 아키텍처를 설계하고 end-to-end UI/UX, 알고리즘·엔진 통합, 평가·내보내기, CMake/SuperBuild·테스트·패키징을 주도했습니다.',
          teamResult: '삼성서울병원 연구진은 임상 워크플로우·특징점·평가 지표를 함께 정의하고 개발 빌드를 직접 검토합니다. DIGITRACK 협업 팀은 특징점 알고리즘과 교합 엔진 구현·연구를 지원했습니다.',
          evidence: '특징점 입력, 다중 시점 교합, 접촉 가시화, RMSE·Gap·FRE 평가와 내보내기가 동작하는 개발 빌드 영상·화면과 연구진 직접 사용 피드백이 근거입니다.',
          limitation: '현재는 개발·시연 빌드의 연구진 검증 단계입니다. 병원 설치, 실제 수술 사용, 의료기기 상태, 임상 효능·정확도·안전성을 주장하지 않으며 화면 값도 성능 결과로 인용하지 않습니다.',
          collaboration: '삼성서울병원과 DIGITRACK의 장기 R&D로 디지털 교합에서 정상 교합 기반 하악 운동과 전체 구강악안면 수술계획으로 확장하는 방향을 검토하고 있습니다.',
          mediaAlt: '합성 테스트 데이터에서 특징점 입력, 다중 시점 교합, 평가 화면이 이어지는 개발 빌드 시연.',
          mediaCaption: '합성 테스트 데이터로 특징점 입력, 다중 시점 교합, 평가 흐름을 시연한 개발 빌드입니다.',
          periodLabel: '2026.03 – 현재',
          roleLabel: '기술 리드 · 메인 개발자',
          status: '진행 중 · 연구진 검증',
          statusLabel: '진행 중 · 연구진 검증',
          ownedRole: '전체 Custom App 아키텍처, 워크플로우·UI/UX, 협업 알고리즘·엔진 통합, 평가·내보내기 파이프라인'
        },
        en: {
          title: 'Maxillofacial Digital Occlusion Workflow',
          shortTitle: 'Digital Occlusion Workflow',
          eyebrow: 'Medical Core · Clinical Workflow Integration',
          thesis: 'Redesigned separate landmarking, occlusion, and evaluation tools into a user-friendly end-to-end workflow that researchers can operate in one application.',
          summary: 'Connected eight-model preparation, dental and maxillofacial landmarks, anatomical frames, automatic occlusion, 6-DOF adjustment, contact analysis, RMSE/Gap/FRE evaluation, and export in one Custom App.',
          problem: 'The earlier flow separated landmarking into another application, made reference comparison and view navigation awkward, lacked multi-view occlusion, fragmented save/load, omitted maxillofacial landmarks, and had no sufficiently integrated result screen.',
          role: 'As technical lead and primary developer, designed the complete Custom App architecture across the C++/Qt shell, Python modules, and shared library, and led the end-to-end UI/UX, algorithm and engine integration, evaluation/export, CMake/SuperBuild, testing, and packaging.',
          teamResult: 'Samsung Medical Center researchers jointly define the clinical workflow, landmarks, and evaluation metrics and directly review development builds. The DIGITRACK team supports the landmark algorithms and occlusion-engine implementation and research.',
          evidence: 'A working development build demonstrates landmarking, multi-view occlusion, contact visualization, RMSE/Gap/FRE evaluation, and export, with direct researcher use and feedback.',
          limitation: 'The software is under researcher validation as a development and demonstration build. This case does not claim hospital installation, use in real surgery, medical-device status, or clinical efficacy, accuracy, or safety; displayed values are not performance outcomes.',
          collaboration: 'The long-term Samsung Medical Center and DIGITRACK R&D direction expands from digital occlusion toward normal-occlusion-based mandibular motion and complete oral and maxillofacial surgical planning.',
          mediaAlt: 'Development-build demonstration moving from landmarking through multi-view occlusion to evaluation on synthetic test data.',
          mediaCaption: 'Development-build demonstration of landmarking, multi-view occlusion, and evaluation using synthetic test data.',
          periodLabel: '2026.03 – present',
          roleLabel: 'Technical Lead · Primary Developer',
          status: 'Ongoing · Researcher Validation',
          statusLabel: 'Ongoing · Researcher Validation',
          ownedRole: 'Complete Custom App architecture, workflow and UI/UX, collaborative algorithm and engine integration, and evaluation/export pipeline'
        }
      }
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
          { id: 'life-careverse-gallery-01', type: 'image', status: 'approved', publicPath: 'assets/projects/life-careverse/life-careverse-gallery-01.png', translations: { ko: { caption: 'VR 상담실 배치 설계 — 의사1(Master)·환자·의사2 3석과 2D 계측 패널, 3D 모델 영역', alt: '원형 테이블을 둘러싼 의자 3개, 벽면의 공유 스크린과 조작 패널이 배치된 VR 상담실 조감도' }, en: { caption: 'VR consultation room layout: three seats for clinician 1 (master), the patient, and clinician 2, plus the 2D measurement panel and 3D model area', alt: 'Overhead view of the VR consultation room with three chairs around a round table, a wall-mounted shared screen, and a control panel' } } },
          { id: 'life-careverse-gallery-02', type: 'image', status: 'approved', publicPath: 'assets/projects/life-careverse/life-careverse-gallery-02.png', translations: { ko: { caption: '계측 패널이 세 시점에 동일하게 표시된 순간 — 왼쪽 의사1(Master), 가운데 환자, 오른쪽 의사2', alt: '세 참가자 시점을 나란히 놓은 화면으로, 각 화면의 공유 스크린이 같은 계측표와 치열궁 도해를 보여준다' }, en: { caption: 'The measurement panel shown identically from all three viewpoints: clinician 1 (master), the patient, clinician 2', alt: 'Three participant viewpoints side by side, each shared screen showing the same measurement table and dental-arch diagram' } } },
          { id: 'life-careverse-gallery-03', type: 'image', status: 'approved', publicPath: 'assets/projects/life-careverse/life-careverse-gallery-03.png', translations: { ko: { caption: '상악 분절을 떼어낸 상태가 세 시점에 함께 반영된 장면 — 오른쪽 화면에 아바타 두 명이 함께 보인다', alt: '두개골에서 보라색 상악 분절이 분리된 3D 모델과, 같은 상태를 보고 있는 아바타 두 명' }, en: { caption: 'A detached maxillary segment reflected across all three viewpoints at once, with two avatars visible in the right-hand view', alt: 'A 3D model with the purple maxillary segment separated from the skull, and two avatars viewing the same state' } } },
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
            ko: { title: '3인 세션 공유 상태', nodes: ['PUN2 공유 상태', '의사1 (Master)', '환자', '의사2'] },
            en: { title: 'Three-user shared state', nodes: ['PUN2 shared state', 'Clinician 1 (Master)', 'Patient', 'Clinician 2'] }
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
          teamResult: '소프트웨어 저작권 등록과 환자 데모·설문조사, 외부 병원 실증 계획은 연구팀 공동 결과입니다. 데모와 설문조사는 진행 중이고 외부 실증은 아직 예정 단계이므로, 확정된 것과 계획인 것을 구분해 적습니다.',
          evidence: '세 참가자 시점을 동시에 녹화한 상담 세션 클립이 근거입니다. 왼쪽 의사1(Master), 가운데 환자, 오른쪽 의사2 화면이 한 프레임에 들어 있어, 한 사람의 조작이 나머지 두 화면에 같은 자세와 같은 계측값으로 나타나는지를 그대로 대조할 수 있습니다.',
          limitation: '클립은 동기화와 공간 배치가 동작함을 보여줄 뿐, 상담 품질이나 치료 결과가 나아졌다고 주장하지 않습니다.',
          collaboration: '구강악안면외과 의료진이 상담 시나리오와 화면 구성을 검토했고, 연구팀과 함께 착용 세션을 진행했습니다.',
          mediaAlt: '왼쪽부터 의사1(Master)·환자·의사2 시점을 나란히 놓은 3분할 화면. 세 화면 모두 같은 3D 두개골·악골 모델을 같은 자세로 표시한다.', mediaCaption: '3인 VR 상담 세션을 참가자별 시점으로 동시에 녹화한 24초 클립입니다. 왼쪽이 의사1(Master), 가운데가 환자, 오른쪽이 의사2 시점이며, 한 사람이 모델을 움직이면 세 화면에 같이 반영됩니다.',
          status: '진행 중', cardProblem: '의료진과 환자가 같은 3D 수술계획을 같은 상태로 봅니다.', cardOwnedRole: '3인 VR 상담 Unity 클라이언트 전체를 구현했습니다.', cardEvidence: '세 시점을 동시에 녹화한 상담 세션 클립이 근거입니다.', problemSummary: '3인이 같은 VR 공간에서 같은 수술계획을 보게 만듭니다.', ownedRole: 'Photon 동기화부터 DICOM 로딩, 플랫폼 이식까지 클라이언트를 구현했습니다.', verifiedEvidence: '세 시점이 같은 모델 자세와 계측값을 보여주는 상담 세션 클립이 근거입니다.', visualAlt: '3인 VR 상담 세션의 3분할 동시 시점.', visualCaption: '3인 VR 상담 세션 동시 시점 클립.'
        },
        en: {
          title: 'OMFS VR — Multi-user surgical consultation', shortTitle: 'OMFS VR', eyebrow: 'Medical Core · Multi-user VR',
          thesis: 'Build an application where clinicians and a patient join the same VR consultation room and look at one shared 3D jaw model and surgical plan together.',
          summary: 'Built a three-user VR consultation session in Unity with Photon PUN2 and Voice, where roles are assigned by join order and all three viewpoints share the same state of a CT-derived 3D jaw model and its measurement panel.',
          problem: 'Orthognathic consultation has to explain 2D measurements and 3D skeletal change at once, and gathering around a single monitor gave no way to confirm that clinician and patient were looking at the same thing.',
          role: 'Owned the Unity client end to end: Photon rooms and role assignment, synchronization of model pose, segments, and page state, voice chat with speaker indication, DICOM volume loading, and backend integration, then carried out the port off a vendor-specific SDK onto OpenXR and Android XR.',
          teamResult: 'Software copyright registration, the patient demonstration and survey, and the planned external-hospital validation are joint research-team results. The demonstration and survey are under way; the external validation is still only planned.',
          evidence: 'A consultation-session clip recorded simultaneously from all three participant viewpoints is the evidence. Clinician 1 (master), the patient, and clinician 2 sit in one frame, so a viewer can check directly whether one person moving the model leaves the other two views showing the same pose and the same measurements.',
          limitation: 'The clip shows that synchronization and spatial layout work; it claims no improvement in consultation quality or treatment outcome.',
          collaboration: 'Oral and maxillofacial surgeons reviewed the consultation scenario and screen layout, and ran the headset sessions with the research team.',
          mediaAlt: 'A three-panel view showing, left to right, the viewpoints of clinician 1 (master), the patient, and clinician 2, each displaying the same 3D skull and jaw model in the same pose.', mediaCaption: 'A 24-second clip of a three-user VR consultation session recorded from each participant viewpoint at once: clinician 1 (master) on the left, the patient in the middle, clinician 2 on the right; moving the model in one view updates all three.',
          status: 'Ongoing', cardProblem: 'Let clinicians and a patient see the same 3D surgical plan in the same state.', cardOwnedRole: 'Implemented the whole Unity client for the three-user VR consultation.', cardEvidence: 'A consultation-session clip recorded from three viewpoints at once is the evidence.', problemSummary: 'Put three people in one VR space looking at the same surgical plan.', ownedRole: 'Implemented the client from Photon synchronization to DICOM loading and the platform port.', verifiedEvidence: 'A consultation clip in which all three viewpoints show the same model pose and measurements is the evidence.', visualAlt: 'Three simultaneous viewpoints of a three-user VR consultation session.', visualCaption: 'Simultaneous three-viewpoint clip of a VR consultation session.'
        }
      },
      blocks: [
        { key: 'shared-state', type: 'system', translations: { ko: { heading: '공유 상태', body: '접속 순서로 의사·환자·의사 세 역할을 배정하고, 모델 자세와 분절 상태, 페이지 번호, 발화자 표시를 세 참가자에게 같이 반영했습니다.' }, en: { heading: 'Shared state', body: 'Assigned the clinician, patient, and clinician roles by join order, and reflected model pose, segment state, page number, and speaker indication to all three participants together.' } } },
        { key: 'xr-application', type: 'text', translations: { ko: { heading: '상담 공간과 클라이언트 범위', body: '의사1(Master)·환자·의사2가 앉는 세 자리와 2D 계측 패널, 3D 모델 영역의 위치를 상담 동선에 맞춰 배치 설계했습니다. 로그인에서 로비를 거쳐 상담룸으로 들어가는 흐름을 만들고, 백엔드에서 받은 환자 케이스를 고르면 해당 CT 볼륨을 3D와 단면으로 불러오도록 했습니다. 이후 입력·카메라 구성을 특정 제조사 SDK에서 OpenXR·Android XR 표준으로 옮겨 같은 빌드가 여러 헤드셋에서 돌아가게 정리했습니다.' }, en: { heading: 'Consultation space and client scope', body: 'Laid out the room around the consultation itself: three seats for clinician 1 (master), the patient, and clinician 2, a 2D measurement panel, and the 3D model area. Built the login to lobby to consultation-room flow, so that selecting a patient case served by the backend loads that CT volume as both a 3D model and cross-sections, then moved the input and camera rig off a single vendor SDK onto the OpenXR and Android XR standards so one build runs on more than one headset.' } } },
        { key: 'multiuser-demo', type: 'evidence', translations: { ko: { heading: '멀티유저 시연', body: '세 참가자의 시점을 동시에 녹화해, 한쪽의 조작이 나머지 두 화면에 같은 상태로 나타나는지를 근거로 삼습니다.' }, en: { heading: 'Multi-user demonstration', body: 'Recording all three viewpoints at once makes the evidence checkable: one participant manipulates, and the other two views show the same state.' } } },
        { key: 'adoption-boundary', type: 'limitation', translations: { ko: { heading: '채택 경계', body: '환자 데모와 설문조사는 진행 중이고 외부 병원 실증은 예정 단계입니다. 연구팀의 등록·데모·실증 계획을 개인 성과나 임상 효과로 확대하지 않습니다.' }, en: { heading: 'Adoption boundary', body: 'The patient demonstration and survey are under way and the external-hospital validation is still planned. Do not turn the research team registration, demonstrations, or validation plans into individual or clinical-outcome claims.' } } }
      ]
    }),
    project({
      slug: 'rtms-navigation', tier: 'medical-core', period: '2024.07 – present', evidenceState: 'verified', lifecycleState: 'ongoing',
      capabilityKeys: ['medical-navigation', 'registration'], route: 'projects/rtms-navigation/',
      tech: ['3D Slicer', 'VTK', 'PyQt5', 'Python', 'PyTorch', 'Optical tracking', 'TCP/IP binary protocol', 'License gating'],
      media: {
        lead: { id: 'rtms-navigation-clip-01', type: 'video', status: 'approved', publicPath: 'assets/projects/rtms-navigation/rtms-navigation-clip-01.mp4' },
        video: { id: 'rtms-navigation-clip-01', type: 'video', status: 'approved', publicPath: 'assets/projects/rtms-navigation/rtms-navigation-clip-01.mp4' },
        poster: { id: 'rtms-navigation-poster-01', type: 'image', status: 'approved', publicPath: 'assets/projects/rtms-navigation/rtms-navigation-poster-01.png' },
        gallery: [
          { id: 'rtms-navigation-lead-01', type: 'image', status: 'approved', publicPath: 'assets/projects/rtms-navigation/rtms-navigation-lead-01.png', translations: { ko: { caption: 'NeuroPilot 내비게이션 모듈 — 추적 장치·환자 마커·코일 마커 상태와 표적까지의 거리·기울기 안내', alt: '추적 장치와 환자·코일 마커 상태, 표적 거리·기울기 안내, 조준 가이드가 표시된 NeuroPilot 내비게이션 화면 (프로젝트 경로는 가림)' }, en: { caption: 'NeuroPilot navigation module: tracker, patient-marker and coil-marker status with distance and tilt guidance to the target', alt: 'NeuroPilot navigation screen showing tracker and marker status, distance and tilt guidance to the target, and the aiming guide (project path hidden)' } } },
          { id: 'rtms-navigation-gallery-01', type: 'image', status: 'approved', publicPath: 'assets/projects/rtms-navigation/rtms-navigation-gallery-01.png', translations: { ko: { caption: 'NeuroPilot 표적 설정 화면 — 대뇌 피질 표면 모델 위의 자극 표적 라벨', alt: '반투명 대뇌 표면 모델 위에 LEFT_DLPFC 등 자극 표적 구가 표시된 NeuroPilot 3D 뷰' }, en: { caption: 'NeuroPilot target view: stimulation targets labelled on the cortical surface model', alt: 'NeuroPilot 3D view with stimulation-target spheres such as LEFT_DLPFC on a translucent cortical surface model' } } },
          { id: 'rtms-navigation-gallery-02', type: 'image', status: 'approved', publicPath: 'assets/projects/rtms-navigation/rtms-navigation-gallery-02.png', translations: { ko: { caption: 'AI 뇌 영역분할 — 두개골을 제거한 뇌 3D 모델과 축상·관상·시상 단면의 조직 분할', alt: '두개골을 제거한 뇌 표면 3D 렌더링과, 조직별로 밝기를 나눈 축상·관상·시상 MRI 단면이 함께 표시된 NeuroPilot AI 화면' }, en: { caption: 'AI brain segmentation: a skull-stripped 3D brain model with tissue segmentation on the axial, coronal, and sagittal slices', alt: 'NeuroPilot AI screen showing a skull-stripped 3D brain surface beside axial, coronal, and sagittal MRI slices with tissue-level segmentation' } } },
          { id: 'rtms-navigation-gallery-03', type: 'image', status: 'approved', publicPath: 'assets/projects/rtms-navigation/rtms-navigation-gallery-03.png', translations: { ko: { caption: '뇌 영역 파셀레이션 — 표준 영역 체계로 색을 나눈 분할 결과를 단면 영상에 겹쳐 표시', alt: '축상·관상·시상 단면 영상 위에 뇌 영역이 색상별로 구분되어 겹쳐진 화면과, 머리 표면 3D 재구성 모델' }, en: { caption: 'Cortical parcellation: region-coded segmentation overlaid on the slice views, with the reconstructed head surface', alt: 'Colour-coded brain regions overlaid on axial, coronal, and sagittal slice views, alongside a 3D reconstruction of the head surface' } } },
        ]
      },
      pdf: { ko: 'assets/pdfs/rtms-navigation-ko.pdf', en: 'assets/pdfs/rtms-navigation-en.pdf' },
      pdfSequence: {
        middle: ['navigation-ui-workflow', 'coordinate-registration-chain', 'device-system-integration', 'clinical-product-boundary'],
        evidenceId: 'rtms-navigation-clip-01',
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
          mediaAlt: '로봇 암과 치료 의자, 코일, 내비게이션 화면이 배치된 전시 부스에서 TMS 로봇 시스템이 동작하는 장면.', mediaCaption: '전시 부스의 TMS 코일 내비게이션 로봇 시스템 시연입니다 — 로봇 암, 치료 의자, 코일, 내비게이션 화면이 한자리에 놓인 구성.',
          status: '검증됨 · 진행 중', cardProblem: '서로 다른 좌표계의 장치를 하나의 제품 흐름으로 묶습니다.', cardOwnedRole: '화면 흐름·정합 엔진·장치 연동·제품 구조를 리드했습니다.', cardEvidence: '라이선스 게이팅 배포 빌드와 회귀 테스트 스위트.', problemSummary: '트래커·태블릿·로봇을 하나의 내비게이션 제품으로 묶습니다.', ownedRole: '화면 흐름, 정합 엔진, 장치 연동, 제품 구조를 리드했습니다.', verifiedEvidence: '라이선스 게이팅 배포 빌드와 이슈별 회귀 테스트가 근거이며 임상 결과는 주장하지 않습니다.', visualAlt: '전시 부스의 TMS 코일 내비게이션 로봇 시스템.', visualCaption: '전시 부스의 TMS 코일 내비게이션 로봇 시스템 시연입니다.'
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
          mediaAlt: 'TMS robot system running on an exhibition stand with a robot arm, treatment chair, coil, and navigation displays.', mediaCaption: 'Demonstration of the TMS coil-navigation robot system on an exhibition stand: robot arm, treatment chair, coil, and navigation displays in one setup.',
          status: 'Verified · Ongoing', cardProblem: 'Tie devices in different coordinate frames into one product flow.', cardOwnedRole: 'Led the workflow, registration engine, device integration, and product structure.', cardEvidence: 'A license-gated build and a regression-test suite.', problemSummary: 'Tie the tracker, tablet, and robot into one navigation product.', ownedRole: 'Led the workflow, registration engine, device integration, and product structure.', verifiedEvidence: 'The license-gated deployment build and issue-tracked regression tests are the evidence; no clinical outcome is claimed.', visualAlt: 'TMS coil-navigation robot system on an exhibition stand.', visualCaption: 'TMS coil-navigation robot system demonstrated on an exhibition stand.'
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
          { id: 'respiratory-surface-guidance-gallery-01', type: 'image', status: 'approved', publicPath: 'assets/projects/respiratory-surface-guidance/respiratory-surface-guidance-gallery-01.png', translations: { ko: { caption: '치료 세션에서 표면유도가 맡는 자리 — 전날 레퍼런스 표면, 당일 셋업 오차 확인, 치료 중 실시간 감시', alt: '전날·당일·치료 중 세 단계로 나눈 표면유도 워크플로우 도해' }, en: { caption: 'Where surface guidance sits in a session: reference surface the day before, setup check on the day, live monitoring during treatment', alt: 'Diagram of the surface-guidance workflow in three stages: day before, treatment day, during treatment' } } },
          { id: 'respiratory-surface-guidance-gallery-02', type: 'image', status: 'approved', publicPath: 'assets/projects/respiratory-surface-guidance/respiratory-surface-guidance-gallery-02.png', translations: { ko: { caption: '검증에 사용한 상용 3D 센서 5종 — ToF 3종, 구조광 1종, 액티브 스테레오 1종', alt: '책상 위에 나란히 놓인 상용 3D 깊이 센서 다섯 대' }, en: { caption: 'The five commercial 3D sensors put through validation: three ToF, one structured-light, one active-stereo', alt: 'Five commercial 3D depth sensors lined up on a desk' } } },
          { id: 'respiratory-surface-guidance-gallery-03', type: 'image', status: 'approved', publicPath: 'assets/projects/respiratory-surface-guidance/respiratory-surface-guidance-gallery-03.png', translations: { ko: { caption: '센서 5종의 거리별 정밀도 σ·실측 fps·유효 픽셀 비율(본인 측정)', alt: '상용 3D 센서 5종의 거리별 정밀도 σ, 실측 fps, 유효 픽셀 비율 실측표' }, en: { caption: 'Measured precision σ, delivered fps, and fill rate for the five sensors by distance (author-measured)', alt: 'Table of measured precision, frame rate, and fill rate for five commercial 3D sensors by distance' } } },
          { id: 'respiratory-surface-guidance-gallery-04', type: 'image', status: 'approved', publicPath: 'assets/projects/respiratory-surface-guidance/respiratory-surface-guidance-gallery-04.png', translations: { ko: { caption: '실측에서 나온 운용 조건 네 가지 — 근거리 노출, 워밍업, 재현성, 노출 단위 불일치', alt: '센서 검증에서 확인한 운용 조건 네 가지를 정리한 도해' }, en: { caption: 'Four operating conditions the measurements produced: near-field exposure, warm-up, repeatability, mismatched exposure units', alt: 'Figure summarising four operating conditions found during sensor validation' } } },
          { id: 'respiratory-surface-guidance-gallery-05', type: 'image', status: 'approved', publicPath: 'assets/projects/respiratory-surface-guidance/respiratory-surface-guidance-gallery-05.png', translations: { ko: { caption: '원거리 트랙 — 여러 시점의 점군을 병합해 표면을 만들고 계획 CT에 정합합니다', alt: '천장 센서, 부분 점군 병합, 표면 재구성, CT 정합 네 단계를 보여주는 도해' }, en: { caption: 'Far-field track: merge point clouds from several viewpoints, reconstruct the surface, register it to the planning CT', alt: 'Diagram of four steps: ceiling sensors, partial point-cloud merge, surface reconstruction, CT registration' } } },
          { id: 'respiratory-surface-guidance-gallery-06', type: 'image', status: 'approved', publicPath: 'assets/projects/respiratory-surface-guidance/respiratory-surface-guidance-gallery-06.png', translations: { ko: { caption: '근거리 트랙 — 흉·복부 ROI 깊이를 호흡 파형으로 바꾸고 게이팅 윈도우를 판정합니다', alt: '깊이 카메라, 흉부·복부 ROI, 정규화된 호흡 파형과 게이팅 윈도우를 보여주는 도해' }, en: { caption: 'Near-field track: chest and abdomen ROI depth becomes a respiratory waveform, and the gating window is judged on it', alt: 'Diagram of a depth camera, chest and abdomen ROIs, a normalised respiratory waveform, and the gating window' } } }
        ]
      },
      pdf: { ko: 'assets/pdfs/respiratory-surface-guidance-ko.pdf', en: 'assets/pdfs/respiratory-surface-guidance-en.pdf' },
      pdfSequence: {
        middle: ['two-track-optics', 'dtdepthscan', 'validation-protocol', 'measured-findings'],
        evidenceId: 'respiratory-surface-guidance-lead-01',
        diagram: {
          kind: 'surface-gating-chain',
          translations: {
            ko: { title: '두 광학 트랙이 하나의 출력으로 모인다', nodes: ['3D 광학 센서', '원거리 — 표면 재구성·CT 정합', '근거리 — ROI 깊이·호흡 파형', '셋업 오차·게이팅 트리거'] },
            en: { title: 'Two optical tracks converging on one output', nodes: ['3D optical sensors', 'Far field: surface reconstruction and CT registration', 'Near field: ROI depth and respiratory waveform', 'Setup offset and gating trigger'] }
          }
        }
      },
      translations: {
        ko: {
          title: '표면유도 호흡추적 (SGRT)', shortTitle: '표면유도 호흡추적', eyebrow: '의료 코어 · 방사선치료 연구',
          thesis: '환자 체표면을 광학 3D로 읽어 셋업 정합과 호흡 게이팅 신호를 만드는 표면유도 방사선치료(SGRT)의 광학 파트를 국산 센서 스택으로 구성합니다.',
          summary: 'K-LINAC 대과제(주관 한국전기연구원, 세부주관 ETRI)의 디지트랙 위탁 연구로, 원거리 표면 재구성과 근거리 실시간 호흡 추적을 상용 3D 센서로 구현하는 초기 단계 연구입니다. 상용 시스템은 센서·알고리즘 선택 근거를 공개하지 않아, 국산 스택은 그 근거부터 직접 만들어야 합니다.',
          problem: '치료 중 환자의 위치와 호흡을 추가 촬영이나 피부 마킹 없이 알아야 합니다. 어떤 센서가 어느 거리에서 얼마나 정확한지부터 직접 재야 했습니다.',
          role: '센서 검증 실험을 총괄하고, 그 실험을 하려고 자체 검증 도구 DtDepthScan(Qt·VTK·OpenCV)을 먼저 만들었습니다 — Raw 연속 녹화와 취득 시각 기록, ROI 깊이 시계열, σ·실측 fps·유효 픽셀 비율 자동 산출, 외부 교차 검증용 PLY·CSV 내보내기. 이어서 ROI 깊이에서 호흡 파형과 게이팅 신호를 뽑는 추적 알고리즘 설계·구현, 센서 인터페이스와 전송 프로토콜 정의, 과제 실무를 담당합니다.',
          teamResult: '컨소시엄이 4DCT 재구성, 영상유도 체계, 임상 자문을 나눠 맡습니다. 과제 전체 성과를 개인 성과로 쓰지 않습니다.',
          evidence: '실리콘 인체 팬텀을 0.5~3.0 m 다섯 구간에서 상용 3D 센서 5종으로 총 55회, 회당 500프레임 측정해 정밀도 σ·실측 fps·유효 픽셀 비율을 냈습니다. 반복 재현성은 ±0.05 mm였고 σ는 약 50프레임에서 수렴했습니다. 이 실측표와 DtDepthScan 화면이 본인 측정 근거입니다.',
          limitation: '1차년도 센서 검증 결과이며 임상 성능이나 과제 목표 달성을 주장하지 않고 과제 목표치·연구비·타 기관 지표는 싣지 않습니다.',
          collaboration: '임상 기관은 서울성모병원 방사선종양학과이고, 4DCT 재구성·영상유도 체계·통합 제어 담당 기관과 인터페이스를 맞춥니다.',
          mediaAlt: 'DtDepthScan 측정 화면 — 팬텀 점군 위에 지정한 ROI 상자와 시간 노이즈 σ 판독값.', mediaCaption: '자체 검증 도구 DtDepthScan으로 실리콘 인체 팬텀을 재는 화면입니다. 점군 위 ROI에서 평균 깊이와 시간 노이즈 σ를 실시간으로 산출합니다. 장비 시리얼과 주소는 가렸습니다.',
          status: '진행 중 · 연구', cardProblem: '추가 촬영 없이 환자 표면과 호흡을 읽는 광학 파트를 국산 센서로 구성합니다.', cardOwnedRole: '센서 검증 실험·검증 도구·호흡 추적 알고리즘·인터페이스를 담당합니다.', cardEvidence: '센서 5종 거리별 정밀도 실측표; 임상 성능은 주장하지 않습니다.', problemSummary: '광학 표면 기반 셋업 정합과 호흡 게이팅 신호를 국산 센서로 만듭니다.', ownedRole: '센서 검증·검증 도구·호흡 추적 알고리즘·프로토콜을 담당합니다.', verifiedEvidence: '본인이 측정한 센서 정밀도·fps·Fill rate 표가 근거입니다.', visualAlt: '센서 정밀도 실측표.', visualCaption: '센서 5종 거리별 정밀도 실측표.'
        },
        en: {
          title: 'Surface-guided Respiratory Tracking (SGRT)', shortTitle: 'Surface-guided Respiratory Tracking', eyebrow: 'Medical Core · Radiotherapy Research',
          thesis: 'Build the optical part of surface-guided radiotherapy — patient-surface setup registration and respiratory gating — on a domestic 3D sensor stack.',
          summary: 'An early-stage research assignment contracted to DIGITRACK within the K-LINAC programme (led by KERI, imaging sub-project led by ETRI): far-field surface reconstruction and near-field real-time breathing tracking with commercial 3D sensors. Commercial systems do not publish the reasoning behind their sensor and algorithm choices, so a domestic stack has to build that evidence itself.',
          problem: 'Patient position and breathing must be known during treatment without extra imaging or skin marks.',
          role: 'Lead the sensor validation campaign, which first required building the in-house tool DtDepthScan (Qt, VTK, OpenCV): raw continuous recording with acquisition timestamps, ROI depth time series, automatic σ, delivered fps and fill rate, and PLY/CSV export for cross-checking elsewhere. Then design and implement the breathing-tracking algorithm from ROI depth to respiratory waveform and gating signal, define the sensor interface and transport protocol, and run day-to-day project work.',
          teamResult: 'Consortium partners own 4DCT reconstruction, the image-guidance framework, and clinical advice. Programme-level results are not attributed to me.',
          evidence: 'A silicone body phantom measured at five distances from 0.5 to 3.0 m with five commercial 3D sensors, 55 runs of 500 frames each, gave precision σ, delivered fps, and fill rate; repeats agreed to within ±0.05 mm. That table and the DtDepthScan captures are my own measurements.',
          limitation: 'First-year sensor validation only; no clinical performance or programme-target achievement is claimed, and programme targets, budgets, and metrics of other institutions are not published here.',
          collaboration: 'The clinical partner is the radiation oncology department of Seoul St. Mary\'s Hospital; interfaces are agreed with 4DCT reconstruction, image guidance, and integrated-control partners.',
          mediaAlt: 'DtDepthScan measurement screen with an ROI box on the phantom point cloud and the temporal-noise σ readout.', mediaCaption: 'The in-house validation tool DtDepthScan measuring a silicone body phantom: mean depth and temporal noise σ are computed live from the ROI on the point cloud. Device serial and address are masked.',
          status: 'Ongoing · Research', cardProblem: 'Read patient surface and breathing without extra imaging, on domestic sensors.', cardOwnedRole: 'Own sensor validation, the validation tool, the breathing-tracking algorithm, and interfaces.', cardEvidence: 'Five-sensor precision table by distance; no clinical claim.', problemSummary: 'Surface-based setup registration and gating signals on domestic sensors.', ownedRole: 'Own sensor validation, tooling, tracking algorithm, and protocol.', verifiedEvidence: 'Self-measured precision, fps, and fill-rate table.', visualAlt: 'Sensor precision measurement table.', visualCaption: 'Five-sensor precision table by distance.'
        }
      },
      blocks: [
        { key: 'two-track-optics', type: 'system', translations: { ko: { heading: '두 트랙으로 나눈 광학', body: '원거리 센서는 점군을 병합해 표면을 만들고 계획 CT에 정합하며, 근거리 센서는 흉·복부 ROI 깊이를 호흡 파형과 게이팅 신호로 바꿉니다.' }, en: { heading: 'Two optical tracks', body: 'Far-field sensors merge point clouds into a surface and register it to the planning CT; near-field sensors turn chest and abdomen ROI depth into a respiratory waveform and gating signal.' } } },
        { key: 'dtdepthscan', type: 'text', translations: { ko: { heading: '검증 도구를 먼저 만들었다', body: '카메라 계층을 추상화해 어떤 센서든 같은 절차를 돌립니다. 취득 시각을 남긴 Raw 연속 녹화로 실측 fps를 재고, ROI 깊이 시계열에서 σ와 유효 픽셀 비율을 자동 산출하며, PLY·CSV로 내보내 교차 검증합니다.' }, en: { heading: 'The tool came first', body: 'Abstracting the camera layer lets any sensor run the same procedure. Timestamped raw recording gives delivered fps, ROI depth time series yield σ and fill rate automatically, and PLY and CSV export allow cross-checking elsewhere.' } } },
        { key: 'validation-protocol', type: 'list', translations: { ko: { heading: '다섯 대를 같은 절차로 재다', items: ['실리콘 인체 팬텀 고정, 0.5~3.0 m 다섯 거리', '센서 5종·조건 스윕 포함 총 55회', '회당 500프레임 연속 취득', '재현성 ±0.05 mm, σ 50프레임 수렴'] }, en: { heading: 'One procedure, five sensors', items: ['Silicone body phantom, five distances 0.5-3.0 m', 'Five sensors and condition sweeps, 55 runs', '500 frames per run', 'Repeatability ±0.05 mm, σ settles by 50 frames'] } } },
        { key: 'measured-findings', type: 'evidence', translations: { ko: { heading: '숫자보다 조건이 남았다', body: '더 오래 쓸 결과는 운용 조건이었습니다. 0.5 m에서 기본 노출은 IR 포화로 측정이 안 되고, 콜드스타트 σ는 열평형 대비 최대 1.7배 나빠집니다. 둘 다 실시간 모듈의 설계 입력이 됐습니다.' }, en: { heading: 'The conditions outlived the numbers', body: 'The operating conditions will outlast the σ table. At 0.5 m the default exposure saturates the IR return and no depth is produced, and from a cold start σ is up to 1.7 times worse than at thermal steady state. Both became design inputs for the real-time module.' } } },
        { key: 'research-boundary', type: 'limitation', translations: { ko: { heading: '연구 경계', body: '1차년도 센서·알고리즘 기초 설계 단계이며 임상 성능이나 과제 목표 달성을 주장하지 않습니다.' }, en: { heading: 'Research boundary', body: 'First-year sensor and algorithm groundwork; no clinical performance or programme-target achievement is claimed.' } } }
      ]
    }),
    project({
      slug: 'skadi-tracking-software', tier: 'platform', period: '2023.02 – present', evidenceState: 'ongoing', lifecycleState: 'ongoing',
      capabilityKeys: ['medical-navigation', 'registration'], route: 'projects/skadi-tracking-software/', caseLayout: 'product-console',
      tech: ['SKADI', 'C++', 'Python API', '3D Slicer', 'Optical tracking'],
      media: {
        lead: {
          id: 'skadi-desktop-marker-files-01', type: 'image', status: 'approved', publicPath: 'assets/projects/skadi-tracking-software/skadi-desktop-marker-files-01.png',
          translations: {
            ko: { caption: '데스크톱 앱의 마커 정의와 파일 작업 화면', alt: '마커 형상을 정의하고 파일을 불러오거나 저장하는 SKADI 데스크톱 앱 화면' },
            en: { caption: 'Marker definition and file work in the desktop app', alt: 'SKADI desktop-app screen for defining marker geometry and opening or saving files' }
          }
        },
        gallery: [
          { id: 'skadi-desktop-tracker-6dof-01', type: 'image', status: 'approved', publicPath: 'assets/projects/skadi-tracking-software/skadi-desktop-tracker-6dof-01.png', translations: { ko: { caption: '트래커 연결 상태와 실시간 6DoF 확인 화면', alt: '장치 식별값과 좌표 수치를 가린 상태에서 트래커 연결과 실시간 6DoF 보기를 보여주는 SKADI 데스크톱 앱' }, en: { caption: 'Tracker status and real-time 6DoF view', alt: 'SKADI desktop app showing tracker connection and a real-time 6DoF view with device identifiers and coordinate values hidden' } } },
          { id: 'skadi-medical-tray-01', type: 'image', status: 'approved', publicPath: 'assets/projects/skadi-tracking-software/skadi-medical-tray-01.png', translations: { ko: { caption: '의료 통합에서 사용하는 비식별 트레이', alt: '얼굴과 식별 정보를 제외하고 마커가 부착된 의료 통합용 트레이만 보여주는 화면' }, en: { caption: 'De-identified tray used in the medical integration', alt: 'Medical-integration view showing only a marker-equipped tray, with faces and identifying information excluded' } } },
          { id: 'skadi-medical-ct-workspace-01', type: 'image', status: 'approved', publicPath: 'assets/projects/skadi-tracking-software/skadi-medical-ct-workspace-01.png', translations: { ko: { caption: '의료 통합의 비식별 CT 작업 화면', alt: '식별 정보와 좌표 수치를 가린 3D Slicer 기반 CT 작업 화면' }, en: { caption: 'De-identified CT workspace in the medical integration', alt: '3D Slicer based CT workspace with identifying information and coordinate values hidden' } } },
          { id: 'skadi-industrial-robot-field-01', type: 'image', status: 'approved', publicPath: 'assets/projects/skadi-tracking-software/skadi-industrial-robot-field-01.png', translations: { ko: { caption: '산업 확장의 로봇 추적 현장', alt: '사람과 식별 표식을 제외한 로봇 추적 시험 현장' }, en: { caption: 'Robot-tracking field setup for the industrial extension', alt: 'Robot-tracking test setup with people and identifying marks excluded' } } }
        ]
      },
      productHistory: {
        translations: {
          ko: { body: '공개 자료의 Viewer는 이 제품의 이전 명칭이고 MarkerEditor는 같은 데스크톱 앱 안의 마커 정의·파일 작업 화면입니다.' },
          en: { body: 'In public material, Viewer is the former name of this product, and MarkerEditor is the marker-definition and file-work surface within the same desktop app.' }
        }
      },
      consoleModules: [
        {
          key: 'desktop-app', evidenceIds: ['skadi-desktop-marker-files-01', 'skadi-desktop-tracker-6dof-01'],
          translations: {
            ko: { title: 'SKADI 데스크톱 앱', summary: '마커 정의·파일 작업과 트래커 연결·6DoF 상태 확인을 하나의 제품 흐름에서 다룹니다.', ownedRole: 'MarkerEditor의 마커 좌표 입력 검증을 구현하고 데스크톱 앱의 유지보수·배포와 사용 문서를 맡았습니다.', teamBoundary: '광학 추적 장치와 마커·기구 하드웨어 설계는 팀의 결과입니다.' },
            en: { title: 'SKADI desktop app', summary: 'One product flow covers marker definition and file work, tracker connection, and 6DoF status inspection.', ownedRole: 'I implemented MarkerEditor marker-coordinate input validation and own desktop-app maintenance, releases, and user documentation.', teamBoundary: 'The optical tracker and marker or instrument hardware are team results.' }
          }
        },
        {
          key: 'api', evidenceIds: ['skadi-desktop-tracker-6dof-01'],
          translations: {
            ko: { title: 'SKADI API', summary: '응용은 DtSkadi.dll의 OpenEx()로 연결을 시작하고, 성공과 오류 결과를 분리해 준비 상태 또는 처리된 오류로 전이합니다.', ownedRole: 'DtSkadi.dll 통합과 OpenEx() 오류 분기를 정리해 실패 뒤 잘못된 상태로 진행하지 않도록 했고, 공개 API 문서와 통합 지원을 맡았습니다.', teamBoundary: 'API를 사용하는 최종 의료·산업 응용과 제품 성능은 팀·협력자의 결과입니다.' },
            en: { title: 'SKADI API', summary: 'An application starts the connection through OpenEx() in DtSkadi.dll, then branches to either a ready state or a handled error.', ownedRole: 'I structured the DtSkadi.dll integration and OpenEx() error branch so failure stops before an invalid state, and I own public API documentation and integration support.', teamBoundary: 'Final medical or industrial applications and product performance belong to the team and partners.' }
          }
        }
      ],
      apiFlow: {
        nodes: ['Application', 'DtSkadi.dll', 'OpenEx()'], outcomes: ['Ready', 'Error handled'],
        changeNoteHref: 'https://digitrack.notion.site/Ver-7-1-2026-02-20-3071183735e080219c11ed0d51ea5b4f?pvs=25',
        translations: {
          ko: { title: '응용 연결 흐름', summary: '단일 진입점의 성공·오류 결과를 명시적으로 나눕니다.', changeNoteLabel: '공개 API 변경 기록' },
          en: { title: 'Application connection flow', summary: 'The single entry point makes the success and error outcomes explicit.', changeNoteLabel: 'Public API change note' }
        }
      },
      applicationTracks: [
        {
          key: 'medical', kind: 'primary', evidenceIds: ['skadi-medical-tray-01', 'skadi-medical-ct-workspace-01'],
          translations: {
            ko: { title: '의료 통합', summary: '같은 데스크톱 앱과 API를 비식별 트레이 및 3D Slicer CT 작업 화면에 연결해 수술내비게이션 통합 경계를 확인했습니다.', ownedRole: '추적 API와 데스크톱 앱의 연결, 공개 문서와 Slicer 통합 지원을 맡았습니다.', teamBoundary: '임상 워크플로와 최종 수술내비게이션 응용은 팀·협력자의 결과이며 임상 효과를 개인 성과로 주장하지 않습니다.' },
            en: { title: 'Medical integration', summary: 'The same desktop app and API connect to a de-identified tray and 3D Slicer CT workspace to check the surgical-navigation integration boundary.', ownedRole: 'I own the tracking API and desktop-app connection, public documentation, and Slicer integration support.', teamBoundary: 'The clinical workflow and final surgical-navigation application are team and partner results; no clinical effect is claimed as my result.' }
          }
        },
        {
          key: 'industrial', kind: 'extension', evidenceIds: ['skadi-industrial-robot-field-01'],
          translations: {
            ko: { title: '산업 확장', summary: '같은 6DoF 추적 계층을 로봇 말단과 목표 마커의 좌표 관계에 적용해 정밀 도킹 응용의 통합을 지원했습니다.', ownedRole: '추적 API와 좌표 통합 지원을 맡았습니다.', teamBoundary: '로봇 제어와 최종 도킹 동작은 팀·고객의 응용 결과이며 제품 성능이나 고객 성과를 개인 성과로 주장하지 않습니다.' },
            en: { title: 'Industrial extension', summary: 'The same 6DoF tracking layer was applied to the coordinate relationship between robot-end and target markers to support precision-docking integration.', ownedRole: 'I own tracking-API and coordinate-integration support.', teamBoundary: 'Robot control and the final docking behavior are team and customer application results; product performance or customer outcomes are not claimed as mine.' }
          }
        }
      ],
      publicResources: [
        { type: 'documentation', href: 'https://digitrack.notion.site/SKADI-Viewer-6a6710e4f7ba4d0b970376d07539e4c7', translations: { ko: { title: 'SKADI Viewer 문서', description: '장치 연결, 마커 편집, 실시간 추적과 Viewer 사용 흐름을 설명합니다.' }, en: { title: 'SKADI Viewer documentation', description: 'Explains device connection, marker editing, real-time tracking, and the Viewer workflow.' } } },
        { type: 'product', href: 'https://digitrack.co.kr/business/products/3d-position-sensor/3', translations: { ko: { title: 'SKADI Viewer 제품 페이지', description: 'Viewer 제품군의 공개 소개와 적용 범위를 확인할 수 있습니다.' }, en: { title: 'SKADI Viewer product page', description: 'Public overview and application scope for the Viewer product family.' } } },
        { type: 'documentation', href: 'https://digitrack.notion.site/SKADI-API-36c9be89b97b4dd58026021f95b06744', translations: { ko: { title: 'SKADI API 문서', description: '추적 응용이 사용하는 공개 API 진입점과 통합 흐름을 설명합니다.' }, en: { title: 'SKADI API documentation', description: 'Explains the public API entry point and integration flow used by tracking applications.' } } },
        { type: 'product', href: 'https://digitrack.co.kr/business/products/3d-position-sensor/4', translations: { ko: { title: 'SKADI API 제품 페이지', description: 'SKADI API의 공개 제품 개요와 응용 경계를 확인할 수 있습니다.' }, en: { title: 'SKADI API product page', description: 'Public product overview and application boundary for the SKADI API.' } } }
      ],
      links: [
        { href: 'https://digitrack.notion.site/Ver-7-1-2026-02-20-3071183735e080219c11ed0d51ea5b4f?pvs=25', translations: { ko: { label: '공개 API 변경 기록' }, en: { label: 'Public API change note' } } }
      ],
      pdf: { ko: 'assets/pdfs/skadi-tracking-software-ko.pdf', en: 'assets/pdfs/skadi-tracking-software-en.pdf' },
      pdfSequence: {
        middle: ['desktop-app', 'api-stability', 'medical-integration', 'industrial-extension'],
        evidenceId: 'skadi-desktop-marker-files-01',
        diagram: {
          kind: 'tracking-sdk-stack',
          translations: {
            ko: { title: 'SKADI API 연결 흐름', nodes: ['Application', 'DtSkadi.dll', 'OpenEx()', 'Ready / Error handled'] },
            en: { title: 'SKADI API connection flow', nodes: ['Application', 'DtSkadi.dll', 'OpenEx()', 'Ready / Error handled'] }
          }
        }
      },
      translations: {
        ko: {
          title: 'SKADI 데스크톱 앱·API', shortTitle: 'SKADI 데스크톱 앱·API', eyebrow: '플랫폼 소프트웨어 · 광학 위치추적',
          thesis: '하나의 SKADI 데스크톱 앱에서 API를 거쳐 의료 통합과 산업 확장으로 이어지는 제품 구조를 설명합니다.',
          summary: '마커 정의·파일 작업과 실시간 6DoF 상태를 한 데스크톱 앱에서 다루고, DtSkadi.dll API를 의료 수술내비게이션과 로봇 추적 응용에 연결합니다.',
          problem: '광학 트래커를 응용에 연결하려면 마커 정의, 장치 상태, API 열기 실패와 추적 좌표 전달을 예측 가능한 제품 인터페이스로 다뤄야 합니다.',
          role: 'DtSkadi.dll을 응용에 통합하고 OpenEx()의 오류 분기를 정리해 열기 실패 뒤 잘못된 상태로 진행하며 발생하던 크래시를 방지했습니다. MarkerEditor 입력 검증을 구현하고, 데스크톱 앱과 API의 유지보수·배포, 공개 문서와 통합 지원을 맡았습니다.',
          teamResult: '장치 하드웨어와 광학·기구 설계, 의료·산업 최종 응용, 로봇 제어, 영업과 고객 성과는 팀·협력자의 결과입니다. 제품 성능·임상 효과·판매 성과를 개인 성과로 주장하지 않습니다.',
          evidence: '마커 정의·파일 작업, 트래커 상태·6DoF, 비식별 의료 트레이, CT 작업 화면, 로봇 추적 현장까지 승인된 실제 화면 다섯 종을 공개합니다.',
          limitation: '공개 자료는 제품 인터페이스와 통합 경계만 다룹니다. 얼굴, 장치 ID, 좌표값, 로고, 버전, 라이선스 경로와 성능 평가는 제외했습니다.',
          collaboration: '광학·하드웨어 설계자, 수술내비게이션 개발자, 연구기관 사용자와 로봇 응용 팀의 인터페이스를 맞춥니다.',
          mediaAlt: '마커 형상을 정의하고 파일을 불러오거나 저장하는 SKADI 데스크톱 앱 화면.', mediaCaption: '데스크톱 앱의 마커 정의와 파일 작업 화면입니다.',
          status: '진행 중', cardProblem: '데스크톱 앱에서 API를 거쳐 의료·산업 응용까지 하나의 추적 제품 흐름으로 연결합니다.', cardOwnedRole: '데스크톱 앱·API 안정성, 공개 문서와 통합 지원을 담당합니다.', cardEvidence: '앱 2종, 의료 2종, 산업 1종의 승인된 실제 화면.', problemSummary: '데스크톱 앱과 API를 의료·산업 응용에 연결합니다.', ownedRole: '데스크톱 앱·API 유지보수와 통합 지원을 맡습니다.', verifiedEvidence: '승인된 실제 화면 다섯 종이 근거입니다.', visualAlt: 'SKADI 데스크톱 앱과 API의 제품 흐름.', visualCaption: '데스크톱 앱 → API → 의료 통합 → 산업 확장.'
        },
        en: {
          title: 'SKADI Desktop App & API', shortTitle: 'SKADI Desktop App & API', eyebrow: 'Platform Software · Optical Tracking',
          thesis: 'One SKADI desktop app leads through the API to medical integration and an industrial extension.',
          summary: 'The desktop app handles marker definition, file work, and real-time 6DoF status, while the DtSkadi.dll API connects to surgical-navigation and robot-tracking applications.',
          problem: 'Connecting an optical tracker to applications requires predictable product interfaces for marker definition, device state, API-open failures, and delivery of tracked transforms.',
          role: 'Integrated DtSkadi.dll into applications, separated OpenEx() error branches so an open failure no longer continued into an invalid state and crash, and implemented MarkerEditor input validation. I maintain and release the desktop app and API, public documentation, and integration support.',
          teamResult: 'Device hardware, optical and mechanical design, final medical and industrial applications, robot control, sales, and customer outcomes belong to the team and partners. Product performance, clinical effects, and sales outcomes are not claimed as my results.',
          evidence: 'Five approved real screens cover marker definition and file work, tracker status and 6DoF, a de-identified medical tray, the CT workspace, and the robot-tracking field setup.',
          limitation: 'The public material covers only product interfaces and integration boundaries. Faces, device IDs, coordinate values, logos, versions, licence paths, and performance assessments are excluded.',
          collaboration: 'Interfaces are agreed with optical and hardware designers, surgical-navigation developers, research users, and robot-application teams.',
          mediaAlt: 'SKADI desktop-app screen for defining marker geometry and opening or saving files.', mediaCaption: 'Marker definition and file work in the desktop app.',
          status: 'Ongoing', cardProblem: 'Connect the desktop app through the API to medical and industrial tracking applications.', cardOwnedRole: 'Own desktop-app and API stability, public documentation, and integration support.', cardEvidence: 'Two app, two medical, and one industrial approved real screens.', problemSummary: 'Connect the desktop app and API to medical and industrial applications.', ownedRole: 'Own desktop-app and API maintenance and integration support.', verifiedEvidence: 'Five approved real screens.', visualAlt: 'SKADI desktop-app and API product flow.', visualCaption: 'Desktop app → API → medical integration → industrial extension.'
        }
      },
      blocks: [
        { key: 'desktop-app', type: 'system', translations: { ko: { heading: '데스크톱 앱', body: '마커 정의·파일 작업과 트래커 연결·6DoF 상태 확인을 한 제품 안에서 다룹니다.' }, en: { heading: 'Desktop app', body: 'One product handles marker definition and file work, tracker connection, and 6DoF status inspection.' } } },
        { key: 'api-stability', type: 'evidence', translations: { ko: { heading: 'OpenEx() 안정성', body: 'DtSkadi.dll 통합에서 OpenEx() 성공·오류 결과를 분리하고 실패 뒤 잘못된 상태로 진행하지 않게 해 크래시를 방지했습니다.' }, en: { heading: 'OpenEx() stability', body: 'In the DtSkadi.dll integration, OpenEx() success and error results are separated so failure stops before an invalid state and crash.' } } },
        { key: 'medical-integration', type: 'text', translations: { ko: { heading: '의료 통합', body: '비식별 트레이와 CT 작업 화면까지 추적 소프트웨어의 통합 경계를 확인했습니다.' }, en: { heading: 'Medical integration', body: 'The tracking-software integration boundary was checked through the de-identified tray and CT workspace.' } } },
        { key: 'industrial-extension', type: 'limitation', translations: { ko: { heading: '산업 확장 경계', body: '추적 API와 좌표 통합 지원은 내 역할이고, 로봇 제어와 최종 도킹 동작은 팀·고객의 응용 결과입니다.' }, en: { heading: 'Industrial-extension boundary', body: 'I own tracking-API and coordinate-integration support; robot control and final docking behavior are team and customer application results.' } } }
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
