/**
 * Fictional sample tenders used to demonstrate the full workflow.
 * All organizations, people and numbers are invented. Each document deliberately contains
 * gaps and inconsistencies (missing budget, referenced-but-missing annexes, conflicting dates)
 * so the AI risk assessment has something real to find.
 */

export type Section = { heading: string; paragraphs: string[]; bullets?: string[]; table?: string[][] };
export type SampleDocument = {
  fileName: string;
  issuer: string;
  title: string;
  reference: string;
  issueDate: string;
  /** Sections; a section with heading starting "PAGEBREAK" forces a new page. */
  sections: Section[];
};

export const smartTraffic: SampleDocument = {
  fileName: "MTUM-RFP-2026-047-Smart-Traffic-Management.pdf",
  issuer: "Ministry of Transport and Urban Mobility",
  title: "Request for Proposal: AI-Enabled Smart Traffic Management Platform",
  reference: "MTUM/ITS/RFP/2026/047",
  issueDate: "10 November 2026",
  sections: [
    {
      heading: "1. Introduction and Background",
      paragraphs: [
        "The Ministry of Transport and Urban Mobility (the \"Ministry\") invites qualified companies to submit proposals for the design, supply, implementation and operation of an AI-enabled Smart Traffic Management Platform (the \"Platform\") covering 120 signalised intersections across the capital governorate.",
        "Congestion on primary corridors has increased by 18% since 2023. The Ministry's Urban Mobility Strategy 2030 targets a 25% reduction in average peak-hour journey times and a 15% reduction in intersection-related collisions through adaptive signal control, real-time incident detection and data-driven planning.",
        "This Request for Proposal (RFP) sets out the scope of work, mandatory requirements, submission instructions and evaluation methodology. Bidders are responsible for reading all sections and annexes carefully.",
      ],
    },
    {
      heading: "2. Key Dates",
      paragraphs: ["The procurement will follow the timetable below. All times are local time (GMT+3)."],
      table: [
        ["Milestone", "Date"],
        ["RFP issue date", "10 November 2026"],
        ["Mandatory site visit (Traffic Control Centre)", "1 December 2026, 09:00"],
        ["Deadline for clarification questions", "8 December 2026, 14:00"],
        ["Ministry responses to clarifications", "15 December 2026"],
        ["Proposal submission deadline", "21 January 2027, 12:00"],
        ["Public opening of technical proposals", "21 January 2027, 13:00"],
        ["Expected contract award", "Q1 2027"],
      ],
    },
    {
      heading: "3. Scope of Work",
      paragraphs: [
        "The selected contractor shall deliver a complete, operational Platform including software, field hardware integration, data infrastructure, training and five (5) years of operation and maintenance support.",
      ],
      bullets: [
        "Adaptive signal control for 120 intersections, with phased rollout: Phase 1 (40 intersections) within 9 months of contract signature, Phase 2 (80 intersections) within 18 months.",
        "Integration with the existing 312 CCTV cameras and 85 inductive loop detectors at the Traffic Control Centre (TCC).",
        "AI-based incident detection (stalled vehicles, collisions, wrong-way driving) with operator alerts in under 30 seconds.",
        "A central operations dashboard and a public open-data API for real-time traffic conditions.",
        "Historical analytics and scenario simulation tools for the Ministry's planning department.",
        "Training of at least 40 Ministry staff, including operators, engineers and administrators.",
      ],
    },
    {
      heading: "PAGEBREAK 4. Technical Requirements",
      paragraphs: ["Proposals must demonstrate compliance with each of the following requirements. Items marked (M) are mandatory; failure to comply with any mandatory item will result in disqualification."],
      bullets: [
        "TR-01 (M) Adaptive signal control algorithms must optimise cycle length, split and offset in real time, with documented performance from at least two comparable city deployments.",
        "TR-02 (M) The Platform must support NTCIP 1202 and an open REST API for integration with third-party systems.",
        "TR-03 (M) Incident detection accuracy of at least 92% with a false-alarm rate below 5%, validated during a 60-day pilot on 10 intersections.",
        "TR-04 (M) Availability of 99.9% for central systems, measured monthly, excluding planned maintenance windows agreed with the Ministry.",
        "TR-05 (M) All traffic and video data must be hosted within the national territory. Use of public cloud regions outside the country is not permitted.",
        "TR-06 (M) Compliance with the National Cybersecurity Framework, including annual third-party penetration testing and ISO/IEC 27001 certification of the bidder.",
        "TR-07 Video analytics should run at the edge where possible to reduce bandwidth to the TCC.",
        "TR-08 The operator interface must be available in Arabic and English.",
        "TR-09 The Platform should provide APIs for future integration with public transport priority systems.",
        "TR-10 (M) Service levels, response times and associated penalties are defined in Annex D (Service Level Agreement).",
      ],
    },
    {
      heading: "5. Deliverables",
      paragraphs: ["The contractor shall provide the following deliverables, each subject to formal acceptance by the Ministry:"],
      table: [
        ["Deliverable", "Due"],
        ["D1 Inception report and detailed project plan", "Contract signature + 6 weeks"],
        ["D2 Solution architecture and integration design", "Contract signature + 3 months"],
        ["D3 Pilot results report (10 intersections, 60 days)", "Contract signature + 6 months"],
        ["D4 Phase 1 go-live (40 intersections)", "Contract signature + 9 months"],
        ["D5 Phase 2 go-live (remaining 80 intersections)", "Contract signature + 18 months"],
        ["D6 Training completion report", "Before Phase 2 go-live"],
        ["D7 Monthly O&M performance reports", "Monthly for 5 years"],
      ],
    },
    {
      heading: "PAGEBREAK 6. Eligibility and Qualification Criteria",
      paragraphs: ["To be eligible, bidders (or the lead member of a consortium) must meet all of the following criteria:"],
      bullets: [
        "Valid commercial registration with an activity related to information technology or intelligent transport systems.",
        "Minimum average annual turnover of BHD 5,000,000 over the last three audited financial years (2023, 2024, 2025).",
        "At least two completed intelligent transport system projects, each covering a minimum of 50 signalised intersections, within the last seven years, supported by client reference letters.",
        "ISO 9001 and ISO/IEC 27001 certifications valid on the submission date.",
        "A local partner or registered branch office in the country. Consortia must nominate a lead member jointly and severally liable for the contract.",
        "Valid tax and social insurance clearance certificates.",
        "Bidders must not be on any government debarment list.",
      ],
    },
    {
      heading: "7. Proposal Submission Requirements",
      paragraphs: [
        "Proposals must be submitted electronically through the National Tender Board e-procurement portal before the submission deadline. Late submissions will not be accepted under any circumstances.",
        "The proposal must consist of two separately sealed electronic envelopes: Envelope A (Technical Proposal) and Envelope B (Financial Proposal). Any pricing information included in Envelope A will lead to disqualification.",
      ],
      bullets: [
        "A bid bond of 2% of the total bid value, issued by a locally licensed bank, valid for 120 days from the submission deadline. The original must be delivered to the Ministry's procurement office before the submission deadline.",
        "Signed Form of Tender (Annex A) and signed Declaration of Conflict of Interest (Annex B).",
        "Technical proposal not exceeding 80 pages (excluding CVs and certificates), in English, PDF format.",
        "CVs for the Project Director, Solution Architect, AI/Data Lead and Cybersecurity Lead, each with at least 10 years of relevant experience.",
        "Financial proposal using the Bill of Quantities template (Annex C), priced in Bahraini Dinars, valid for 180 days.",
        "Proposal validity: 120 days from the submission deadline.",
      ],
    },
    {
      heading: "PAGEBREAK 8. Evaluation Methodology",
      paragraphs: [
        "Proposals passing the mandatory compliance check will be evaluated using a combined quality and cost-based selection method. Only technical proposals scoring at least 70 out of 100 will have their financial proposals opened.",
      ],
      table: [
        ["Criterion", "Weight"],
        ["Technical approach and solution architecture", "30%"],
        ["Relevant experience and references", "20%"],
        ["Project team qualifications", "10%"],
        ["Pilot and implementation plan", "10%"],
        ["Financial proposal", "30%"],
      ],
    },
    {
      heading: "9. Commercial Terms",
      paragraphs: [
        "Payment will be made against accepted milestones: 10% on acceptance of D1, 15% on D2, 15% on D3, 25% on D4, 25% on D5 and 10% after a 12-month defects liability period. Operation and maintenance fees will be paid quarterly in arrears.",
        "A performance bond of 10% of the contract value is required within 14 days of award, valid until the end of the defects liability period.",
        "Liquidated damages for delay of milestones D4 and D5 apply at 0.5% of the contract value per week of delay, capped at 10%. The contractor's total liability shall be unlimited for data breaches attributable to the contractor.",
        "The Ministry has not disclosed an estimated budget for this procurement.",
        "Intellectual property in all custom software, models trained on Ministry data and documentation shall transfer to the Ministry upon payment.",
      ],
    },
    {
      heading: "10. Clarifications and Contact",
      paragraphs: [
        "All clarification questions must be submitted in writing via the e-procurement portal no later than 8 December 2026. Questions received after this deadline will not be answered. Responses will be published to all registered bidders without identifying the source.",
        "Procurement contact: Ms. Layla Al-Mansoori, Head of ITS Procurement, its.procurement@mtum.example.gov.",
        "Note: Annexes A, B and C are attached to this RFP. Annex D (Service Level Agreement) will be issued separately.",
      ],
    },
  ],
};

export const healthRecords: SampleDocument = {
  fileName: "NHRA-T-2026-112-EHR-Digitization-Services.pdf",
  issuer: "National Health Records Agency",
  title: "Tender for Electronic Health Records Digitization and Indexing Services",
  reference: "NHRA/T/2026/112",
  issueDate: "18 November 2026",
  sections: [
    {
      heading: "1. Purpose",
      paragraphs: [
        "The National Health Records Agency (the \"Agency\") seeks a qualified service provider to digitise, index and migrate approximately 2.4 million paper patient records held across four public hospitals into the National Electronic Health Record (EHR) system.",
        "The objective is to make historical clinical records available to clinicians within the EHR, reduce physical storage costs and comply with the Health Data Protection Regulation 2025.",
      ],
    },
    {
      heading: "2. Scope of Services",
      bullets: [
        "Secure collection, transport and chain-of-custody tracking of paper records from four hospitals to a digitisation facility approved by the Agency.",
        "High-resolution scanning (minimum 300 dpi, colour where clinically relevant) of an estimated 96 million pages.",
        "Indexing of each record against the national patient identifier with at least 99.5% accuracy, verified by statistical sampling.",
        "Optical character recognition and classification of documents into 14 clinical document types.",
        "Migration of images and metadata into the EHR using the Agency's HL7 FHIR R4 interface.",
        "Secure destruction of paper records after Agency sign-off, with destruction certificates.",
      ],
      paragraphs: [],
    },
    {
      heading: "3. Timeline",
      table: [
        ["Milestone", "Date"],
        ["Tender issue", "18 November 2026"],
        ["Clarification questions deadline", "26 November 2026"],
        ["Tender closing date", "9 December 2026, 10:00"],
        ["Service commencement", "1 February 2027"],
        ["Completion of all digitisation", "Within 14 months of commencement"],
      ],
      paragraphs: [],
    },
    {
      heading: "PAGEBREAK 4. Mandatory Requirements",
      paragraphs: ["Bidders must comply with all of the following. Non-compliance with any item leads to rejection of the bid."],
      bullets: [
        "The digitisation facility must be located within the country and certified to ISO/IEC 27001. Offshore processing of any patient data is strictly prohibited.",
        "All staff handling records must pass a background check and sign the Agency's confidentiality undertaking before starting work.",
        "The bidder must hold professional indemnity insurance of at least BHD 2,000,000.",
        "The bidder must have completed at least one healthcare records digitisation project of more than 10 million pages in the last five years.",
        "A tender bond of BHD 25,000 must accompany the bid.",
        "Bids must be submitted in two envelopes (technical and financial) through the e-Tendering system.",
      ],
    },
    {
      heading: "5. Quality and Service Levels",
      bullets: [
        "Scanning throughput of at least 1.6 million pages per week from month 3.",
        "Indexing accuracy of 99.5%; batches below this threshold must be reworked at the provider's cost.",
        "Any suspected data breach must be reported to the Agency within 24 hours.",
        "Penalties for missed service levels will be agreed during contract negotiation.",
      ],
      paragraphs: [],
    },
    {
      heading: "6. Evaluation",
      paragraphs: [
        "The Agency will award the contract to the lowest-priced technically compliant bid. Technical compliance will be assessed on a pass/fail basis against Section 4 and the bidder's methodology for quality assurance and data protection.",
      ],
    },
    {
      heading: "7. Contact",
      paragraphs: [
        "Questions must be sent to tenders@nhra.example.gov quoting the tender reference. The Agency is not obliged to answer questions received after the clarification deadline.",
        "The estimated contract value is not disclosed. Volumes stated in this document are estimates and may vary by up to 20% without change to unit rates.",
      ],
    },
  ],
};

export const smartMeters: SampleDocument = {
  fileName: "EWA-RFQ-2026-309-Smart-Meter-Supply.pdf",
  issuer: "Electricity and Water Utilities Authority",
  title: "Request for Quotation: Supply and Installation of 25,000 Smart Electricity Meters",
  reference: "EWUA/RFQ/2026/309",
  issueDate: "20 November 2026",
  sections: [
    {
      heading: "1. Overview",
      paragraphs: [
        "The Electricity and Water Utilities Authority (the \"Authority\") requests quotations for the supply, installation and commissioning of 25,000 single-phase smart electricity meters in residential areas of the Northern Governorate, including integration with the Authority's existing Head-End System (HES).",
        "This is a fast-track procurement under the Authority's Grid Modernisation Programme. Estimated contract value: BHD 3.1 million.",
      ],
    },
    {
      heading: "2. Technical Specifications",
      bullets: [
        "Meters must comply with IEC 62052-11 and IEC 62053-21, accuracy class 1.",
        "Communication via NB-IoT with fallback to RF mesh; the Authority's HES uses the DLMS/COSEM protocol.",
        "Remote connect/disconnect relay rated at 60 A minimum.",
        "Tamper detection (cover opening, magnetic interference) with immediate event reporting.",
        "Minimum 15-year design life and 5-year warranty.",
        "Type-test certificates from an accredited laboratory must be submitted with the quotation.",
      ],
      paragraphs: [],
    },
    {
      heading: "3. Delivery and Installation",
      paragraphs: [
        "Delivery of the first 5,000 meters is required within 8 weeks of purchase order; full installation of all 25,000 meters within 9 months. Installation teams must hold valid electrical work licences issued by the Authority.",
        "Liquidated damages of 1% of the order value per week of delay apply, capped at 15%.",
      ],
    },
    {
      heading: "4. Submission",
      bullets: [
        "Quotations must be submitted by 3 December 2026 at 12:00 via the Authority's supplier portal.",
        "Include a completed price schedule, compliance statement against Section 2, type-test certificates, delivery schedule and two references for smart meter rollouts of at least 10,000 units.",
        "Quotations must be valid for 90 days.",
        "A sample meter must be delivered to the Authority's testing laboratory by 1 December 2026 for interoperability testing with the HES.",
      ],
      paragraphs: [],
    },
    {
      heading: "5. Award Basis",
      paragraphs: [
        "The Authority will award to the lowest-priced quotation that passes interoperability testing and technical compliance. The Authority reserves the right to split the award between two suppliers.",
        "Payment terms: 30% on delivery, 60% on installation and commissioning, 10% after the 12-month warranty retention period.",
      ],
    },
  ],
};

export const SAMPLE_DOCUMENTS = [smartTraffic, healthRecords, smartMeters];
