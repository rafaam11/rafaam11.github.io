(function (root, factory) {
  var value = factory();
  if (typeof module === 'object' && module.exports) module.exports = value;
  root.PortfolioData = value;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  return {
    capabilities: [
      {
        key: 'registration',
        title: '3D Registration & Navigation',
        summary: 'Connect camera, image, tracker, patient, and tool coordinates into guidance that can be tested in the real world.',
        methods: ['Rigid transforms', 'ICP', 'Optical tracking', '3D Slicer'],
        validation: 'Visual overlays, repeatable registration checks, demonstrations, and external acceptance.'
      },
      {
        key: 'perception',
        title: 'Sensor Perception & Safety',
        summary: 'Turn RGB, ToF, stereo, structured-light, and LiDAR signals into observable perception and safety behavior.',
        methods: ['Sensor fusion', '3D vision', 'Detection', 'Segmentation'],
        validation: 'ROI traces, noise visualization, blind-spot checks, and pre-field safety scenarios.'
      },
      {
        key: 'digital-twin',
        title: 'Digital Twin & Validation',
        summary: 'Move expensive or risky physical tests into simulation without losing the interfaces used by the real system.',
        methods: ['Isaac Sim', 'LiteSim', 'ROS2', 'Sim-to-real'],
        validation: 'Shared message paths, scenario replay, coordinate checks, and field-to-simulation comparison.'
      },
      {
        key: 'clinical-xr',
        title: 'Clinical-to-XR Translation',
        summary: 'Translate clinical criteria and surgical workflows into spatial software that experts can review early.',
        methods: ['Unity', 'HoloLens', 'Meta Quest', 'Workflow modeling'],
        validation: 'Rapid prototypes, stakeholder review, adoption, registration, and user research.'
      },
      {
        key: 'ai-tools',
        title: 'AI-Enabled Tool Building',
        summary: 'Define the technical problem and verification boundary, then use agents to remove repetitive implementation work.',
        methods: ['Agent workflows', 'Human review', 'Skills', 'Planning SSOT'],
        validation: 'Visual evidence, pull-request review, explicit acceptance criteria, and human merge responsibility.'
      }
    ],
    impactMetrics: [
      {
        value: '3–4 months → 1–2 weeks',
        label: 'Estimated delivery time for comparable sensor-validation tooling',
        state: 'verified'
      },
      {
        value: 'Weekly → monthly',
        label: 'Approximate field-validation travel after LiteSim adoption',
        state: 'verified'
      },
      {
        value: '4–5 micro-PoCs',
        label: 'HoloLens SDK probes, typically validated in one to two days each',
        state: 'verified'
      }
    ],
    projects: [
      {
        slug: 'surgical-twin',
        title: 'Surgical Twin',
        period: '2023.07 – 2023.11',
        status: 'Completed',
        evidenceState: 'verified',
        primaryCapability: 'registration',
        crossCapabilities: ['clinical-xr'],
        problemSummary: 'Register tracked instruments and medical-image models into a mixed-reality surgical view.',
        ownedRole: 'Owned coordinate transformation, SDK analysis, micro-PoCs, and mixed-reality integration.',
        verifiedEvidence: 'Passed demonstration, inspection, quantitative targets, and final-report inclusion without external SDK integration.',
        tech: ['Unity', 'HoloLens 2', 'MRTK', 'Optical tracking', 'Rigid registration'],
        links: []
      },
      {
        slug: 'rtms-navigation',
        title: 'Patient-specific rTMS Navigation',
        period: '2024.07 – present',
        status: 'Ongoing',
        evidenceState: 'ongoing',
        primaryCapability: 'registration',
        crossCapabilities: [],
        problemSummary: 'Guide stimulation position and orientation against patient-specific brain targets.',
        ownedRole: 'Leads navigation software for target definition, patient registration, and live coil guidance.',
        verifiedEvidence: 'Navigation workflow implemented; clinical protocol and quantitative outcomes remain under validation.',
        tech: ['3D Slicer', 'Image registration', 'Optical tracking', 'Python'],
        links: []
      },
      {
        slug: 'mandibular-fracture',
        title: 'Mandibular Fracture Restoration',
        period: '2021.12 – 2023.02',
        status: 'Completed',
        evidenceState: 'verified',
        primaryCapability: 'registration',
        crossCapabilities: ['clinical-xr'],
        problemSummary: 'Estimate a reproducible jawbone restoration from preoperative CT and dental occlusion.',
        ownedRole: 'Designed the occlusion-constrained optimization and implemented the research system and visualization.',
        verifiedEvidence: 'International presentation, peer-reviewed Q1 publication, and best-paper award.',
        tech: ['Python', 'Open3D', '3D Slicer', 'Optimization', 'ICP'],
        links: [
          { label: 'Publication', href: 'https://link.springer.com/article/10.1007/s10278-024-01014-z' }
        ]
      },
      {
        slug: 'c-arm-navigation',
        title: 'Low-dose C-Arm Navigation',
        period: '2024.07 – 2024.12',
        status: 'Research',
        evidenceState: 'research',
        primaryCapability: 'registration',
        crossCapabilities: [],
        problemSummary: 'Connect low-dose C-Arm imaging with a 3D navigation workflow.',
        ownedRole: 'Contributed a bounded subset of the 3D navigation functionality in a multi-team program.',
        verifiedEvidence: 'Completed the assigned navigation contribution; no independent clinical outcome is claimed.',
        tech: ['3D Slicer', 'C-Arm CT', 'DICOM', 'Surgical navigation'],
        links: []
      },
      {
        slug: 'unmanned-forklift',
        title: 'Unmanned Forklift & LiteSim',
        period: '2024 – present',
        status: 'Ongoing',
        evidenceState: 'ongoing',
        primaryCapability: 'perception',
        crossCapabilities: ['digital-twin'],
        problemSummary: 'Deliver perception, safety, and loading-vision behavior for an in-house unmanned-forklift solution deployed at real production sites.',
        ownedRole: 'Owns safety-policy management, sensor bridging over a Zenoh-based network, truck-loading vision (ToF+RGB with SAM-family PoC), and LiteSim validators.',
        verifiedEvidence: 'Second field contract delivered with our fork-control, obstacle-detection, and vision modules; a full in-house RCS deployment is ongoing at another plant.',
        tech: ['C++23', 'ROS 2', 'Zenoh', 'ToF', 'LiDAR', '3D vision', 'LiteSim'],
        links: []
      },
      {
        slug: 'quadruped-robot',
        title: 'Five-bar Quadruped Robot',
        period: '2020.04 – 2021.01',
        status: 'Completed',
        evidenceState: 'verified',
        primaryCapability: 'perception',
        crossCapabilities: [],
        problemSummary: 'Design and build a quadruped around a compact five-bar linkage mechanism.',
        ownedRole: 'Owned mechanism design, kinematic modeling, fabrication, and control implementation.',
        verifiedEvidence: 'Patent application and engineering-fair award.',
        tech: ['MATLAB', 'SolidWorks', 'OnShape', 'Arduino', 'Kinematics'],
        links: []
      },
      {
        slug: 'radioactive-digital-twin',
        title: 'Remote Cleanup Digital Twin',
        period: '2024.02 – 2025.02',
        status: 'Completed',
        evidenceState: 'completed',
        primaryCapability: 'digital-twin',
        crossCapabilities: [],
        problemSummary: 'Create the initial simulation environment for robot training in a hazardous cleanup scenario.',
        ownedRole: 'Set up the initial Isaac Sim digital-twin environment and transferred it to the next owner.',
        verifiedEvidence: 'Delivered the initial environment and handoff; later program results are not attributed here.',
        tech: ['Isaac Sim', 'ROS2', 'Python', 'Linux'],
        links: []
      },
      {
        slug: 'life-careverse',
        title: 'Life Careverse',
        period: '2023.07 – present',
        status: 'Ongoing',
        evidenceState: 'ongoing',
        primaryCapability: 'clinical-xr',
        crossCapabilities: ['registration'],
        problemSummary: 'Translate clinical consultation and surgical workflows into reviewable XR experiences.',
        ownedRole: 'Translated clinical criteria into software scenarios and built rapid consultation and navigation prototypes.',
        verifiedEvidence: 'Requirements approved, prototype adopted after demonstration, software registered, and patient-consented research begun.',
        tech: ['Unity', 'Meta Quest', 'MRTK', 'Photon PUN2', 'FastAPI'],
        links: []
      },
      {
        slug: 'orthognathic-ar',
        title: 'Orthognathic AR Navigation',
        period: '2023.10 – 2024.12',
        status: 'Research',
        evidenceState: 'research',
        primaryCapability: 'clinical-xr',
        crossCapabilities: ['registration'],
        problemSummary: 'Overlay an orthognathic surgical plan through a tracked HoloLens workflow.',
        ownedRole: 'Owned the HoloLens and Unity navigation portion of a broader planning project.',
        verifiedEvidence: 'Delivered the assigned AR navigation component; team-level AI planning is not attributed here.',
        tech: ['Unity', 'HoloLens 2', 'MRTK', '3D Slicer', 'Optical tracking'],
        links: []
      },
      {
        slug: 'oral-facial-ar',
        title: 'Oral-facial AR Surgery',
        period: '2021.06 – 2023.05',
        status: 'Research',
        evidenceState: 'research',
        primaryCapability: 'clinical-xr',
        crossCapabilities: ['registration'],
        problemSummary: 'Explore AR guidance as part of a multi-organization oral and maxillofacial surgery program.',
        ownedRole: 'Contributed to the early and supporting Unity AR navigation work.',
        verifiedEvidence: 'Completed a bounded supporting contribution; consortium outcomes are not claimed as personal results.',
        tech: ['Unity', 'HoloLens 2', 'MRTK', '3D Slicer'],
        links: []
      },
      {
        slug: 'ar-distance-meter',
        title: 'Marker-based AR Distance Meter',
        period: '2021.03 – 2021.09',
        status: 'Completed',
        evidenceState: 'completed',
        primaryCapability: 'clinical-xr',
        crossCapabilities: [],
        problemSummary: 'Measure the three-dimensional distance between tracked marker positions on Android.',
        ownedRole: 'Designed and implemented the complete geometry prototype as a personal project.',
        verifiedEvidence: 'Working prototype completed; no accuracy, adoption, or continuing-use claim is made.',
        tech: ['Unity', 'Vuforia', 'Android', 'C#', 'Linear algebra'],
        links: []
      },
      {
        slug: 'respiratory-surface-guidance',
        title: 'Surface-guided Respiratory Tracking',
        period: '2026.06 – present',
        status: 'Research',
        evidenceState: 'research',
        primaryCapability: 'registration',
        crossCapabilities: ['perception'],
        problemSummary: 'Track patient breathing with 3D surface imaging and register it to 4DCT for radiotherapy guidance.',
        ownedRole: 'Owns the surface-tracking and 4DCT registration workstream within a large national radiotherapy research program.',
        verifiedEvidence: 'Early-stage research assignment; no clinical or quantitative outcome is claimed yet.',
        tech: ['3D surface imaging', '4DCT', 'Image registration', 'Python'],
        links: []
      },
      {
        slug: 'llm-wiki',
        title: 'LLM Wiki',
        period: '2026.04 – present',
        status: 'Ongoing',
        evidenceState: 'ongoing',
        primaryCapability: 'ai-tools',
        crossCapabilities: [],
        problemSummary: 'Turn accumulated information into reusable knowledge and action instead of another data archive.',
        ownedRole: 'Owns product intent, architecture, decisions, and verification; AI agents perform much of the implementation.',
        verifiedEvidence: 'A solo-plus-AI operational system with real data migration and recurring workflow automation.',
        tech: ['TypeScript', 'Python', 'PostgreSQL', 'LLM agents', 'MCP'],
        links: []
      }
    ]
  };
});
