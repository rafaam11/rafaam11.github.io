(function (root, factory) {
  var value = factory();
  if (typeof module === 'object' && module.exports) module.exports = value;
  root.PortfolioData = value;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  return {
    capabilities: [
      {
        key: 'registration',
        methods: ['Rigid transforms', 'ICP', 'Optical tracking', '3D Slicer'],
        translations: {
          ko: {
            title: '3D 정합 및 내비게이션 (3D Registration & Navigation)',
            summary: '카메라, 영상, 트래커, 환자, 도구 좌표계를 실제 환경에서 검증할 수 있는 가이던스로 연결합니다.',
            validation: '시각 오버레이, 반복 가능한 정합 검사, 시연, 외부 수용 확인으로 검증합니다.'
          },
          en: {
            title: '3D Registration & Navigation',
            summary: 'Connect camera, image, tracker, patient, and tool coordinates into guidance that can be tested in the real world.',
            validation: 'Visual overlays, repeatable registration checks, demonstrations, and external acceptance.'
          }
        }
      },
      {
        key: 'perception',
        methods: ['Sensor fusion', '3D vision', 'Detection', 'Segmentation'],
        translations: {
          ko: {
            title: '센서 인지 및 안전 (Sensor Perception & Safety)',
            summary: 'RGB, ToF, 스테레오, 구조광, LiDAR 신호를 관찰 가능한 인지 및 안전 동작으로 전환합니다.',
            validation: 'ROI 추적, 노이즈 시각화, 사각지대 점검, 현장 투입 전 안전 시나리오로 검증합니다.'
          },
          en: {
            title: 'Sensor Perception & Safety',
            summary: 'Turn RGB, ToF, stereo, structured-light, and LiDAR signals into observable perception and safety behavior.',
            validation: 'ROI traces, noise visualization, blind-spot checks, and pre-field safety scenarios.'
          }
        }
      },
      {
        key: 'digital-twin',
        methods: ['Isaac Sim', 'LiteSim', 'ROS2', 'Sim-to-real'],
        translations: {
          ko: {
            title: '디지털 트윈 및 검증 (Digital Twin & Validation)',
            summary: '실제 시스템이 사용하는 인터페이스를 유지하면서 비용이 크거나 위험한 물리 테스트를 시뮬레이션으로 옮깁니다.',
            validation: '공유 메시지 경로, 시나리오 재생, 좌표계 점검, 현장과 시뮬레이션 비교로 검증합니다.'
          },
          en: {
            title: 'Digital Twin & Validation',
            summary: 'Move expensive or risky physical tests into simulation without losing the interfaces used by the real system.',
            validation: 'Shared message paths, scenario replay, coordinate checks, and field-to-simulation comparison.'
          }
        }
      },
      {
        key: 'clinical-xr',
        methods: ['Unity', 'HoloLens', 'Meta Quest', 'Workflow modeling'],
        translations: {
          ko: {
            title: '임상 워크플로의 XR 전환 (Clinical-to-XR Translation)',
            summary: '임상 기준과 수술 워크플로를 전문가가 조기에 검토할 수 있는 공간 소프트웨어로 번역합니다.',
            validation: '빠른 프로토타입, 이해관계자 검토, 채택, 소프트웨어 등록, 사용자 연구로 검증합니다.'
          },
          en: {
            title: 'Clinical-to-XR Translation',
            summary: 'Translate clinical criteria and surgical workflows into spatial software that experts can review early.',
            validation: 'Rapid prototypes, stakeholder review, adoption, registration, and user research.'
          }
        }
      },
      {
        key: 'ai-tools',
        methods: ['Agent workflows', 'Human review', 'Skills', 'Planning SSOT'],
        translations: {
          ko: {
            title: 'AI 기반 도구 구축 (AI-Enabled Tool Building)',
            summary: '기술 문제와 검증 경계를 사람이 정의하고, 반복적인 구현 작업은 에이전트로 줄입니다.',
            validation: '시각적 근거, pull request 검토, 명시적 수용 기준, 사람의 merge 책임으로 검증합니다.'
          },
          en: {
            title: 'AI-Enabled Tool Building',
            summary: 'Define the technical problem and verification boundary, then use agents to remove repetitive implementation work.',
            validation: 'Visual evidence, pull-request review, explicit acceptance criteria, and human merge responsibility.'
          }
        }
      }
    ],
    impactMetrics: [
      {
        state: 'verified',
        translations: {
          ko: { value: '3–4개월 → 1–2주', label: '유사 센서 검증 도구의 예상 개발 기간' },
          en: { value: '3–4 months → 1–2 weeks', label: 'Estimated delivery time for comparable sensor-validation tooling' }
        }
      },
      {
        state: 'verified',
        translations: {
          ko: { value: '주 1회 → 월 1회', label: 'LiteSim 도입 후 대략적인 현장 검증 출장 빈도' },
          en: { value: 'Weekly → monthly', label: 'Approximate field-validation travel after LiteSim adoption' }
        }
      },
      {
        state: 'verified',
        translations: {
          ko: { value: '4–5개 micro-PoC', label: '각각 보통 1–2일 안에 검증한 HoloLens SDK 탐색' },
          en: { value: '4–5 micro-PoCs', label: 'HoloLens SDK probes, typically validated in one to two days each' }
        }
      }
    ],
    projects: [
      {
        slug: 'surgical-twin',
        period: '2023.07 – 2023.11',
        evidenceState: 'verified',
        primaryCapability: 'registration',
        crossCapabilities: ['clinical-xr'],
        tech: ['Unity', 'HoloLens 2', 'MRTK', 'Optical tracking', 'Rigid registration'],
        links: [],
        translations: {
          ko: {
            title: '수술 디지털 트윈 (Surgical Twin)',
            status: '완료',
            problemSummary: '추적 수술도구와 의료영상 모델을 혼합현실 수술 화면에 정합합니다.',
            ownedRole: '좌표 변환, SDK 분석, micro-PoC, 혼합현실 통합을 담당했습니다.',
            verifiedEvidence: '외부 SDK 통합 지원 없이 시연, 점검, 정량 목표, 최종보고서 반영을 통과했습니다.'
          },
          en: {
            title: 'Surgical Twin',
            status: 'Completed',
            problemSummary: 'Register tracked instruments and medical-image models into a mixed-reality surgical view.',
            ownedRole: 'Owned coordinate transformation, SDK analysis, micro-PoCs, and mixed-reality integration.',
            verifiedEvidence: 'Passed demonstration, inspection, quantitative targets, and final-report inclusion without external SDK integration.'
          }
        }
      },
      {
        slug: 'rtms-navigation',
        period: '2024.07 – present',
        evidenceState: 'ongoing',
        primaryCapability: 'registration',
        crossCapabilities: [],
        tech: ['3D Slicer', 'Image registration', 'Optical tracking', 'Python'],
        links: [],
        translations: {
          ko: {
            title: '환자 맞춤형 rTMS 내비게이션 (Patient-specific rTMS Navigation)',
            status: '진행 중',
            problemSummary: '환자별 뇌 표적을 기준으로 자극 위치와 방향을 안내합니다.',
            ownedRole: '표적 정의, 환자 정합, 실시간 코일 가이던스를 포함한 내비게이션 소프트웨어를 리드합니다.',
            verifiedEvidence: '내비게이션 워크플로를 구현했으며 임상 프로토콜과 정량 결과는 계속 검증 중입니다.'
          },
          en: {
            title: 'Patient-specific rTMS Navigation',
            status: 'Ongoing',
            problemSummary: 'Guide stimulation position and orientation against patient-specific brain targets.',
            ownedRole: 'Leads navigation software for target definition, patient registration, and live coil guidance.',
            verifiedEvidence: 'Navigation workflow implemented; clinical protocol and quantitative outcomes remain under validation.'
          }
        }
      },
      {
        slug: 'mandibular-fracture',
        period: '2021.12 – 2023.02',
        evidenceState: 'verified',
        primaryCapability: 'registration',
        crossCapabilities: ['clinical-xr'],
        tech: ['Python', 'Open3D', '3D Slicer', 'Optimization', 'ICP'],
        links: [
          {
            href: 'https://link.springer.com/article/10.1007/s10278-024-01014-z',
            translations: { ko: { label: '논문' }, en: { label: 'Publication' } }
          }
        ],
        translations: {
          ko: {
            title: '하악골 골절 복원 (Mandibular Fracture Restoration)',
            status: '완료',
            problemSummary: '수술 전 CT와 치아 교합을 이용해 재현 가능한 하악골 복원 위치를 추정합니다.',
            ownedRole: '교합 제약 최적화를 설계하고 연구 시스템과 시각화를 구현했습니다.',
            verifiedEvidence: '국제 발표, Q1 동료심사 논문, 우수논문상을 확보했습니다.'
          },
          en: {
            title: 'Mandibular Fracture Restoration',
            status: 'Completed',
            problemSummary: 'Estimate a reproducible jawbone restoration from preoperative CT and dental occlusion.',
            ownedRole: 'Designed the occlusion-constrained optimization and implemented the research system and visualization.',
            verifiedEvidence: 'International presentation, peer-reviewed Q1 publication, and best-paper award.'
          }
        }
      },
      {
        slug: 'c-arm-navigation',
        period: '2024.07 – 2024.12',
        evidenceState: 'research',
        primaryCapability: 'registration',
        crossCapabilities: [],
        tech: ['3D Slicer', 'C-Arm CT', 'DICOM', 'Surgical navigation'],
        links: [],
        translations: {
          ko: {
            title: '저선량 C-Arm 내비게이션 (Low-dose C-Arm Navigation)',
            status: '연구',
            problemSummary: '저선량 C-Arm 영상과 3D 내비게이션 워크플로를 연결합니다.',
            ownedRole: '여러 팀이 참여한 프로그램에서 3D 내비게이션 기능의 제한된 일부를 담당했습니다.',
            verifiedEvidence: '할당된 내비게이션 기여를 완료했으며 독립적인 임상 성과는 주장하지 않습니다.'
          },
          en: {
            title: 'Low-dose C-Arm Navigation',
            status: 'Research',
            problemSummary: 'Connect low-dose C-Arm imaging with a 3D navigation workflow.',
            ownedRole: 'Contributed a bounded subset of the 3D navigation functionality in a multi-team program.',
            verifiedEvidence: 'Completed the assigned navigation contribution; no independent clinical outcome is claimed.'
          }
        }
      },
      {
        slug: 'unmanned-forklift',
        period: '2024 – present',
        evidenceState: 'ongoing',
        primaryCapability: 'perception',
        crossCapabilities: ['digital-twin'],
        tech: ['C++23', 'ROS 2', 'Zenoh', 'ToF', 'LiDAR', '3D vision', 'LiteSim'],
        links: [],
        translations: {
          ko: {
            title: '무인지게차 및 LiteSim (Unmanned Forklift & LiteSim)',
            status: '진행 중',
            problemSummary: '실제 생산 현장에 투입되는 자체 무인지게차 솔루션의 인지, 안전, 상차 비전 동작을 개발합니다.',
            ownedRole: '안전 정책 관리, Zenoh 기반 네트워크의 센서 브리지, ToF+RGB와 SAM 계열 PoC를 이용한 트럭 상차 비전, LiteSim validator를 담당합니다.',
            verifiedEvidence: '자체 포크 제어, 장애물 감지, 비전 모듈이 포함된 두 번째 현장 계약을 납품했으며 다른 공장에서 완전 자체 RCS 배포를 진행 중입니다.'
          },
          en: {
            title: 'Unmanned Forklift & LiteSim',
            status: 'Ongoing',
            problemSummary: 'Deliver perception, safety, and loading-vision behavior for an in-house unmanned-forklift solution deployed at real production sites.',
            ownedRole: 'Owns safety-policy management, sensor bridging over a Zenoh-based network, truck-loading vision (ToF+RGB with SAM-family PoC), and LiteSim validators.',
            verifiedEvidence: 'Second field contract delivered with our fork-control, obstacle-detection, and vision modules; a full in-house RCS deployment is ongoing at another plant.'
          }
        }
      },
      {
        slug: 'quadruped-robot',
        period: '2020.04 – 2021.01',
        evidenceState: 'verified',
        primaryCapability: 'perception',
        crossCapabilities: [],
        tech: ['MATLAB', 'SolidWorks', 'OnShape', 'Arduino', 'Kinematics'],
        links: [],
        translations: {
          ko: {
            title: '5절 링크 4족 보행 로봇 (Five-bar Quadruped Robot)',
            status: '완료',
            problemSummary: '소형 5절 링크 메커니즘을 중심으로 4족 보행 로봇을 설계하고 제작합니다.',
            ownedRole: '메커니즘 설계, 기구학 모델링, 제작, 제어 구현을 담당했습니다.',
            verifiedEvidence: '특허 출원과 공학 페어 수상으로 이어졌습니다.'
          },
          en: {
            title: 'Five-bar Quadruped Robot',
            status: 'Completed',
            problemSummary: 'Design and build a quadruped around a compact five-bar linkage mechanism.',
            ownedRole: 'Owned mechanism design, kinematic modeling, fabrication, and control implementation.',
            verifiedEvidence: 'Patent application and engineering-fair award.'
          }
        }
      },
      {
        slug: 'radioactive-digital-twin',
        period: '2024.02 – 2025.02',
        evidenceState: 'completed',
        primaryCapability: 'digital-twin',
        crossCapabilities: [],
        tech: ['Isaac Sim', 'ROS2', 'Python', 'Linux'],
        links: [],
        translations: {
          ko: {
            title: '원격 제염 디지털 트윈 (Remote Cleanup Digital Twin)',
            status: '완료',
            problemSummary: '위험 환경 제염 시나리오에서 로봇 학습을 위한 초기 시뮬레이션 환경을 구축합니다.',
            ownedRole: '초기 Isaac Sim 디지털 트윈 환경을 구성하고 다음 담당자에게 인계했습니다.',
            verifiedEvidence: '초기 환경과 인계를 완료했으며 이후 프로그램 결과는 개인 성과로 귀속하지 않습니다.'
          },
          en: {
            title: 'Remote Cleanup Digital Twin',
            status: 'Completed',
            problemSummary: 'Create the initial simulation environment for robot training in a hazardous cleanup scenario.',
            ownedRole: 'Set up the initial Isaac Sim digital-twin environment and transferred it to the next owner.',
            verifiedEvidence: 'Delivered the initial environment and handoff; later program results are not attributed here.'
          }
        }
      },
      {
        slug: 'life-careverse',
        period: '2023.07 – present',
        evidenceState: 'ongoing',
        primaryCapability: 'clinical-xr',
        crossCapabilities: ['registration'],
        tech: ['Unity', 'Meta Quest', 'MRTK', 'Photon PUN2', 'FastAPI'],
        links: [],
        translations: {
          ko: {
            title: '라이프 케어버스 (Life Careverse)',
            status: '진행 중',
            problemSummary: '임상 상담과 수술 워크플로를 검토 가능한 XR 경험으로 전환합니다.',
            ownedRole: '임상 기준을 소프트웨어 시나리오로 번역하고 빠른 상담·내비게이션 프로토타입을 개발했습니다.',
            verifiedEvidence: '요구사항 승인, 시연 후 프로토타입 채택, 소프트웨어 등록, 환자 동의 기반 연구 착수를 확인했습니다.'
          },
          en: {
            title: 'Life Careverse',
            status: 'Ongoing',
            problemSummary: 'Translate clinical consultation and surgical workflows into reviewable XR experiences.',
            ownedRole: 'Translated clinical criteria into software scenarios and built rapid consultation and navigation prototypes.',
            verifiedEvidence: 'Requirements approved, prototype adopted after demonstration, software registered, and patient-consented research begun.'
          }
        }
      },
      {
        slug: 'orthognathic-ar',
        period: '2023.10 – 2024.12',
        evidenceState: 'research',
        primaryCapability: 'clinical-xr',
        crossCapabilities: ['registration'],
        tech: ['Unity', 'HoloLens 2', 'MRTK', '3D Slicer', 'Optical tracking'],
        links: [],
        translations: {
          ko: {
            title: '양악수술 AR 내비게이션 (Orthognathic AR Navigation)',
            status: '연구',
            problemSummary: '추적되는 HoloLens 워크플로를 통해 양악수술 계획을 오버레이합니다.',
            ownedRole: '더 큰 수술 계획 프로젝트에서 HoloLens와 Unity 내비게이션 부분을 담당했습니다.',
            verifiedEvidence: '할당된 AR 내비게이션 컴포넌트를 납품했으며 팀 단위 AI 수술 계획은 개인 성과로 귀속하지 않습니다.'
          },
          en: {
            title: 'Orthognathic AR Navigation',
            status: 'Research',
            problemSummary: 'Overlay an orthognathic surgical plan through a tracked HoloLens workflow.',
            ownedRole: 'Owned the HoloLens and Unity navigation portion of a broader planning project.',
            verifiedEvidence: 'Delivered the assigned AR navigation component; team-level AI planning is not attributed here.'
          }
        }
      },
      {
        slug: 'oral-facial-ar',
        period: '2021.06 – 2023.05',
        evidenceState: 'research',
        primaryCapability: 'clinical-xr',
        crossCapabilities: ['registration'],
        tech: ['Unity', 'HoloLens 2', 'MRTK', '3D Slicer'],
        links: [],
        translations: {
          ko: {
            title: '구강안면 AR 수술 (Oral-facial AR Surgery)',
            status: '연구',
            problemSummary: '여러 기관이 참여한 구강악안면 수술 프로그램의 일부로 AR 가이던스를 탐색합니다.',
            ownedRole: '초기 및 지원 범위의 Unity AR 내비게이션 작업에 기여했습니다.',
            verifiedEvidence: '제한된 지원 기여를 완료했으며 컨소시엄 성과를 개인 결과로 주장하지 않습니다.'
          },
          en: {
            title: 'Oral-facial AR Surgery',
            status: 'Research',
            problemSummary: 'Explore AR guidance as part of a multi-organization oral and maxillofacial surgery program.',
            ownedRole: 'Contributed to the early and supporting Unity AR navigation work.',
            verifiedEvidence: 'Completed a bounded supporting contribution; consortium outcomes are not claimed as personal results.'
          }
        }
      },
      {
        slug: 'ar-distance-meter',
        period: '2021.03 – 2021.09',
        evidenceState: 'completed',
        primaryCapability: 'clinical-xr',
        crossCapabilities: [],
        tech: ['Unity', 'Vuforia', 'Android', 'C#', 'Linear algebra'],
        links: [],
        translations: {
          ko: {
            title: '마커 기반 AR 거리 측정기 (Marker-based AR Distance Meter)',
            status: '완료',
            problemSummary: 'Android에서 추적 마커 위치 사이의 3차원 거리를 측정합니다.',
            ownedRole: '개인 프로젝트로 전체 기하 프로토타입을 설계하고 구현했습니다.',
            verifiedEvidence: '동작하는 프로토타입을 완성했으며 정확도, 채택, 지속 사용 성과는 주장하지 않습니다.'
          },
          en: {
            title: 'Marker-based AR Distance Meter',
            status: 'Completed',
            problemSummary: 'Measure the three-dimensional distance between tracked marker positions on Android.',
            ownedRole: 'Designed and implemented the complete geometry prototype as a personal project.',
            verifiedEvidence: 'Working prototype completed; no accuracy, adoption, or continuing-use claim is made.'
          }
        }
      },
      {
        slug: 'respiratory-surface-guidance',
        period: '2026.06 – present',
        evidenceState: 'research',
        primaryCapability: 'registration',
        crossCapabilities: ['perception'],
        tech: ['3D surface imaging', '4DCT', 'Image registration', 'Python'],
        links: [],
        translations: {
          ko: {
            title: '표면 유도 호흡 추적 (Surface-guided Respiratory Tracking)',
            status: '연구',
            problemSummary: '3D 표면 영상으로 환자 호흡을 추적하고 방사선치료 가이던스를 위해 4DCT와 정합합니다.',
            ownedRole: '대형 국가 방사선치료 연구 프로그램에서 표면 추적과 4DCT 정합 워크스트림을 담당합니다.',
            verifiedEvidence: '초기 연구 과제이며 아직 임상 또는 정량 결과를 주장하지 않습니다.'
          },
          en: {
            title: 'Surface-guided Respiratory Tracking',
            status: 'Research',
            problemSummary: 'Track patient breathing with 3D surface imaging and register it to 4DCT for radiotherapy guidance.',
            ownedRole: 'Owns the surface-tracking and 4DCT registration workstream within a large national radiotherapy research program.',
            verifiedEvidence: 'Early-stage research assignment; no clinical or quantitative outcome is claimed yet.'
          }
        }
      },
      {
        slug: 'llm-wiki',
        period: '2026.04 – present',
        evidenceState: 'ongoing',
        primaryCapability: 'ai-tools',
        crossCapabilities: [],
        tech: ['TypeScript', 'Python', 'PostgreSQL', 'LLM agents', 'MCP'],
        links: [],
        translations: {
          ko: {
            title: 'LLM 위키 (LLM Wiki)',
            status: '진행 중',
            problemSummary: '축적된 정보를 또 하나의 데이터 저장소가 아니라 재사용 가능한 지식과 실행으로 전환합니다.',
            ownedRole: '제품 의도, 아키텍처, 의사결정, 검증을 담당하며 AI 에이전트가 구현의 상당 부분을 수행합니다.',
            verifiedEvidence: '실제 데이터 마이그레이션과 반복 워크플로 자동화를 운영하는 개인+AI 시스템입니다.'
          },
          en: {
            title: 'LLM Wiki',
            status: 'Ongoing',
            problemSummary: 'Turn accumulated information into reusable knowledge and action instead of another data archive.',
            ownedRole: 'Owns product intent, architecture, decisions, and verification; AI agents perform much of the implementation.',
            verifiedEvidence: 'A solo-plus-AI operational system with real data migration and recurring workflow automation.'
          }
        }
      }
    ]
  };
});
