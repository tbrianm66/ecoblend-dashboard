/**
 * Phase 3A — Part 1: Populate all 20 MVP playbooks with structured content
 * Each playbook gets: purpose, whenToUse, stepByStepGuidance, requiredInputs,
 * requiredOutputs, evidenceRequired, linkedTemplates, linkedScoringFrameworks,
 * linkedRiskCategories, completionChecklist
 * Status = Published, version = 1.0, accessLevel = Internal Team, owner = Platform Admin
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const PLAYBOOKS = [
  {
    id: 1,
    title: "Getting Started with ECOBLEND OS",
    category: "Platform User Guide",
    purpose: "Introduce new platform users to ECOBLEND OS capabilities, navigation structure, and core workflows. This playbook ensures every team member understands how the Venture Creation Intelligence Platform operates before engaging with venture-specific modules.",
    whenToUse: "Run this playbook when a new team member, founder, advisor, or partner is granted platform access for the first time. Also use when onboarding a new SPV team or when refreshing existing users on platform updates.",
    stepByStepGuidance: `1. PLATFORM ORIENTATION (Day 1)
- Log in to ECOBLEND OS and complete your user profile
- Review the Command Centre dashboard to understand portfolio-level KPIs
- Navigate each sidebar module group to understand the 16-module structure
- Identify which modules are relevant to your role

2. UNDERSTAND THE VENTURE LIFECYCLE
- Review the 5 venture stages: Idea → Validation → MVP → Market Entry → Scale
- Understand how VRL (Venture Readiness Level) tracks progress across stages
- Learn the 7-dimension scoring framework: VRL, TRL, BRL, MRL, SRL, PRL, IRL

3. LEARN THE SCORING SYSTEM
- Open Readiness Scoring to see how composite scores are calculated
- Review the VRL formula: weighted combination of TRL, BRL, MRL, SRL, PRL
- Understand Evidence Confidence Scoring and how it gates investment decisions

4. EXPLORE YOUR VENTURE
- Navigate to Venture Status and select your assigned venture
- Review the Venture Detail page showing all readiness dimensions
- Check the milestone tracker and upcoming stage-gate requirements

5. ENGAGE WITH PLAYBOOKS
- Open Admin → Playbook Library to browse available guidance
- Note how contextual playbooks appear inside each module
- Bookmark playbooks relevant to your current workflow stage

6. COMPLETE ONBOARDING CHECKLIST
- Confirm profile is complete with role and venture assignment
- Verify you can access all modules relevant to your role
- Submit a test evidence item to confirm workflow understanding`,
    requiredInputs: "User account credentials, role assignment, venture assignment (if applicable), team structure document",
    requiredOutputs: "Completed user profile, platform orientation confirmation, role-specific module access verification, onboarding completion record",
    evidenceRequired: "Completed user profile record, platform access log, onboarding confirmation timestamp",
    linkedTemplates: "User Onboarding Checklist, Role Assignment Matrix, Platform Navigation Guide",
    linkedScoringFrameworks: "N/A — this is an orientation playbook",
    linkedRiskCategories: "People, Governance",
    completionChecklist: `[ ] User profile completed with role and venture assignment
[ ] Command Centre dashboard reviewed
[ ] All 16 modules navigated and understood
[ ] Venture lifecycle stages understood
[ ] Scoring framework overview completed
[ ] Assigned venture reviewed (if applicable)
[ ] Playbook Library browsed
[ ] Test evidence item submitted
[ ] Onboarding completion record created`
  },
  {
    id: 2,
    title: "New Venture Intake Playbook",
    category: "Venture Intake",
    purpose: "Guide the structured intake of a new venture opportunity into the ECOBLEND OS pipeline. This playbook ensures every venture enters the system with a validated problem statement, initial hypothesis, founder profile, and preliminary Business Model Canvas — creating the foundation for all downstream scoring and validation.",
    whenToUse: "Use when a new venture idea is submitted by a founder, partner, or internal team. This is the first playbook triggered in the venture lifecycle and must be completed before any scoring or validation work begins.",
    stepByStepGuidance: `1. CAPTURE VENTURE INTENT
- Record the venture name, founding team, and SPV brand assignment
- Document the core problem being addressed and target customer segment
- Classify the venture type: Internal, Founder-Led, Partner-Led, R&D Project, SPV, or Investment Opportunity
- Assign initial venture stage: Idea

2. DOCUMENT THE PROBLEM STATEMENT
- Use the H4 Lean hypothesis format: "We believe that [customer] experiences [problem] when [context]"
- Define the measurable validation criterion: "We will know this is true when [metric] with n ≥ [sample]"
- Record the problem severity score (1-10) and frequency score (1-10)
- Link to any existing research or evidence supporting the problem

3. COMPLETE FOUNDER SUITABILITY ASSESSMENT
- Score the founder across 7 dimensions: Domain Knowledge, Execution Capability, Leadership, Network Relevance, Stage Readiness, Risk Profile, Commitment
- Each dimension scored 1-10 with written justification
- Gate: Overall score must be ≥ 6.0 to proceed

4. PRELIMINARY BUSINESS MODEL CANVAS
- Complete all 9 BMC blocks at hypothesis level
- Identify the 3 riskiest assumptions for immediate testing
- Document initial revenue model hypothesis

5. ASSIGN VENTURE TO PIPELINE
- Create the venture record in Opportunity Pipeline
- Assign a Venture Lead and initial team
- Set the first milestone: Problem Statement Validation
- Schedule the Intake Approval stage-gate review

6. SUBMIT FOR INTAKE APPROVAL
- Compile the intake package: problem statement + hypothesis + founder assessment + BMC
- Submit to Studio Director for Intake Approval gate
- Record the decision in the Governance audit trail`,
    requiredInputs: "Venture idea description, founder CV/profile, target market hypothesis, initial revenue model concept, team composition",
    requiredOutputs: "Venture record in Opportunity Pipeline, problem statement record, founder suitability assessment, preliminary BMC, intake approval request",
    evidenceRequired: "Signed founder agreement, problem statement with H4 hypothesis, suitability assessment scores with justification, BMC draft, market size estimate",
    linkedTemplates: "Venture Intake Form, H4 Lean Hypothesis Template, Founder Suitability Scorecard, Business Model Canvas Template",
    linkedScoringFrameworks: "VRL (initial baseline), BRL (preliminary), FRL (Founder Readiness Level)",
    linkedRiskCategories: "Venture, People, Business Model, Market",
    completionChecklist: `[ ] Venture intent captured with name, team, and SPV assignment
[ ] Problem statement documented in H4 Lean format
[ ] Founder suitability assessment completed (score ≥ 6.0)
[ ] Preliminary Business Model Canvas completed
[ ] Venture record created in Opportunity Pipeline
[ ] Venture Lead and team assigned
[ ] First milestone set
[ ] Intake Approval submitted to Studio Director
[ ] Decision recorded in Governance audit trail`
  },
  {
    id: 3,
    title: "Problem Statement Playbook",
    category: "Venture Intake",
    purpose: "Define, validate, and evidence a venture's core problem statement using the H4 Lean methodology. A well-structured problem statement is the foundation of all downstream validation — without it, customer discovery, market validation, and scoring are unreliable.",
    whenToUse: "Use immediately after venture intake when the problem hypothesis needs formal structuring. Also use when an existing problem statement fails evidence confidence review or when pivoting to a new problem space.",
    stepByStepGuidance: `1. DEFINE THE PROBLEM HYPOTHESIS
- Use the H4 format: "We believe that [specific customer segment] experiences [specific problem] when [specific context/trigger]"
- Ensure the problem is observable, measurable, and specific — not abstract
- Rate problem severity (1-10) and frequency (1-10)
- Calculate Problem Significance Score = (Severity × Frequency) / 10

2. IDENTIFY ASSUMPTIONS
- List all assumptions embedded in the problem statement
- Rank assumptions by risk: which, if wrong, would invalidate the venture?
- Select the top 3 riskiest assumptions for immediate testing
- Document the "kill criterion" — what evidence would disprove the problem?

3. GATHER INITIAL EVIDENCE
- Conduct desk research: industry reports, academic papers, competitor analysis
- Link relevant research papers from the Academic Research module
- Document at least 3 independent evidence sources supporting the problem
- Rate each evidence source for reliability (1-5)

4. VALIDATE WITH STAKEHOLDERS
- Present the problem statement to at least 5 potential customers
- Record whether they recognise the problem without prompting
- Document their language — do they describe it the same way?
- Calculate recognition rate: % of stakeholders who confirm the problem

5. SCORE EVIDENCE CONFIDENCE
- Apply the Evidence Confidence framework to all gathered evidence
- Minimum threshold: Evidence Confidence Score ≥ 3.0 to proceed
- If below threshold, return to Step 3 and gather additional evidence

6. RECORD AND SUBMIT
- Create the Problem Statement record in Venture Intake module
- Link all evidence items to the problem statement
- Submit for peer review by another Venture Lead or Technical Lead
- Update the VRL baseline score with problem validation results`,
    requiredInputs: "Venture idea description, target customer segment definition, initial market research, competitor landscape overview",
    requiredOutputs: "Formal problem statement record, assumption register, evidence items linked to problem, stakeholder validation results, evidence confidence score",
    evidenceRequired: "H4 hypothesis document, minimum 3 independent evidence sources, stakeholder interview records (n ≥ 5), evidence confidence score ≥ 3.0",
    linkedTemplates: "H4 Lean Hypothesis Template, Assumption Register Template, Evidence Confidence Scorecard",
    linkedScoringFrameworks: "VRL, Evidence Confidence Score",
    linkedRiskCategories: "Venture, Market",
    completionChecklist: `[ ] Problem hypothesis written in H4 Lean format
[ ] Problem severity and frequency scored
[ ] Top 3 riskiest assumptions identified
[ ] Kill criterion documented
[ ] Minimum 3 independent evidence sources gathered
[ ] Each evidence source rated for reliability
[ ] Stakeholder validation with n ≥ 5 completed
[ ] Recognition rate calculated
[ ] Evidence Confidence Score ≥ 3.0 achieved
[ ] Problem Statement record created in platform
[ ] All evidence items linked
[ ] Submitted for peer review`
  },
  {
    id: 4,
    title: "Customer Discovery Interview Playbook",
    category: "Market Validation",
    purpose: "Conduct structured customer discovery interviews that generate validated evidence for the venture's problem statement, value proposition, and willingness-to-pay hypotheses. Interviews must produce platform-recordable evidence items, not just qualitative notes.",
    whenToUse: "Use during the Validation stage after the problem statement has been defined. Required before Market Validation can be scored. Also use when pivoting to validate a revised problem or value proposition.",
    stepByStepGuidance: `1. PREPARE INTERVIEW PROTOCOL
- Define the interview objective: what specific hypothesis are you testing?
- Write 8-12 open-ended questions following the Mom Test principles
- Never ask "Would you use this?" — ask about past behaviour and current pain
- Prepare a structured recording template with fields for each question
- Define your target sample: minimum n = 15 for statistical relevance

2. RECRUIT PARTICIPANTS
- Identify participants matching your target customer segment
- Ensure diversity: different company sizes, roles, geographies
- Offer appropriate incentives if needed
- Schedule 30-45 minute sessions
- Aim for 15-25 interviews total

3. CONDUCT INTERVIEWS
- Record each interview (with consent) for later analysis
- Use the structured template to capture responses consistently
- Listen for emotional language — frustration, workarounds, complaints
- Probe for willingness-to-pay signals: "How much does this problem cost you?"
- Note any unexpected insights or pivots

4. ANALYSE AND CODE RESPONSES
- Code each response against your hypothesis categories
- Calculate problem recognition rate: % confirming the problem
- Calculate severity agreement rate: % rating severity ≥ 7/10
- Identify the top 3 recurring themes
- Flag any contradictory evidence

5. CREATE EVIDENCE RECORDS
- Create an Interview Record for each completed interview in the platform
- Link each record to the venture's problem statement
- Aggregate findings into an Evidence Summary
- Calculate the overall Evidence Confidence Score for customer discovery

6. UPDATE VENTURE SCORING
- Update the VRL score with customer discovery evidence
- Update the BRL score if business model assumptions were tested
- Record the decision: proceed, pivot, or gather more evidence
- Submit findings to the Venture Lead for review`,
    requiredInputs: "Validated problem statement, target customer segment definition, interview protocol template, participant recruitment list",
    requiredOutputs: "Minimum 15 interview records, coded response analysis, problem recognition rate, severity agreement rate, evidence summary, updated VRL/BRL scores",
    evidenceRequired: "Interview recordings (with consent), completed interview templates (n ≥ 15), coded response matrix, statistical summary, evidence confidence score",
    linkedTemplates: "Customer Discovery Interview Template, Mom Test Question Guide, Interview Coding Matrix, Evidence Summary Template",
    linkedScoringFrameworks: "VRL, BRL, Evidence Confidence Score",
    linkedRiskCategories: "Market, Venture, Business Model",
    completionChecklist: `[ ] Interview protocol prepared with 8-12 open-ended questions
[ ] Target sample defined (n ≥ 15)
[ ] Participants recruited matching target segment
[ ] Minimum 15 interviews conducted and recorded
[ ] All responses coded against hypothesis categories
[ ] Problem recognition rate calculated
[ ] Severity agreement rate calculated
[ ] Top 3 recurring themes identified
[ ] Interview Records created in platform for each interview
[ ] Evidence Summary compiled
[ ] Evidence Confidence Score calculated
[ ] VRL and BRL scores updated
[ ] Findings submitted for Venture Lead review`
  },
  {
    id: 5,
    title: "Market Validation Playbook",
    category: "Market Validation",
    purpose: "Validate the venture's target market through structured analysis of market size (TAM/SAM/SOM), competitive landscape, demand signals, and willingness-to-pay. This playbook produces the evidence required to score VRL market dimensions and gate investment decisions.",
    whenToUse: "Use after customer discovery interviews confirm the problem exists. Required before the Market Validation Gate and before investment readiness scoring can begin.",
    stepByStepGuidance: `1. DEFINE MARKET BOUNDARIES
- Identify the Total Addressable Market (TAM) using top-down industry data
- Calculate the Serviceable Addressable Market (SAM) based on your segment
- Estimate the Serviceable Obtainable Market (SOM) for years 1-3
- Document all data sources and calculation methodology
- Create the Market Size record in Discovery & Market module

2. ANALYSE COMPETITIVE LANDSCAPE
- Identify all direct competitors (same problem, same solution approach)
- Identify indirect competitors (same problem, different approach)
- Map competitors on a positioning matrix: price vs. differentiation
- Identify your competitive advantage and defensibility
- Document competitive intelligence in the platform

3. VALIDATE DEMAND SIGNALS
- Analyse search volume trends for problem-related keywords
- Review industry reports for growth projections
- Document any pre-orders, letters of intent, or partnership expressions
- Calculate the Demand Validation Score based on signal strength

4. TEST WILLINGNESS-TO-PAY
- Design a pricing experiment: Van Westendorp, Gabor-Granger, or conjoint
- Test with minimum n = 30 from target segment
- Identify the optimal price point and acceptable price range
- Calculate expected revenue per customer and customer lifetime value
- Record results in the Financial Model module

5. SYNTHESISE MARKET EVIDENCE
- Compile all market evidence into a Market Validation Summary
- Score each evidence dimension for confidence (1-5)
- Calculate the overall Market Evidence Confidence Score
- Identify any gaps requiring additional research

6. SUBMIT FOR MARKET VALIDATION GATE
- Package market evidence for stage-gate review
- Present TAM/SAM/SOM, competitive analysis, demand signals, and WTP results
- Submit to Studio Director for Market Validation Gate approval
- Record the gate decision in Governance`,
    requiredInputs: "Customer discovery results, industry reports, competitor data, pricing experiment design, target segment definition",
    requiredOutputs: "TAM/SAM/SOM calculations, competitive landscape analysis, demand validation score, willingness-to-pay results, market validation summary, gate approval request",
    evidenceRequired: "Market size calculations with source citations, competitive positioning matrix, demand signal data (search trends, LOIs), pricing experiment results (n ≥ 30), market evidence confidence score",
    linkedTemplates: "Market Sizing Template, Competitive Analysis Matrix, Pricing Experiment Template, Market Validation Summary",
    linkedScoringFrameworks: "VRL, BRL, Evidence Confidence Score",
    linkedRiskCategories: "Market, Business Model, Financial",
    completionChecklist: `[ ] TAM/SAM/SOM calculated with documented methodology
[ ] All data sources cited and linked
[ ] Direct and indirect competitors identified
[ ] Competitive positioning matrix completed
[ ] Demand signals analysed and scored
[ ] Willingness-to-pay tested (n ≥ 30)
[ ] Optimal price point identified
[ ] Market Validation Summary compiled
[ ] Market Evidence Confidence Score calculated
[ ] Market Validation Gate submission prepared
[ ] Gate decision recorded in Governance`
  },
  {
    id: 6,
    title: "Value Proposition Playbook",
    category: "Business Model",
    purpose: "Design, test, and validate the venture's value proposition using the Value Proposition Canvas methodology. The output directly feeds the BRL (Business Readiness Level) scoring and provides the foundation for the Business Model Canvas.",
    whenToUse: "Use after customer discovery confirms the problem and before completing the full Business Model Canvas. Also use when pivoting the value proposition based on market feedback.",
    stepByStepGuidance: `1. MAP THE CUSTOMER PROFILE
- Document the customer's Jobs-to-be-Done (functional, social, emotional)
- Identify the top 5 Pains ranked by severity
- Identify the top 5 Gains ranked by importance
- Validate rankings against customer discovery interview data

2. DESIGN THE VALUE MAP
- List your Products & Services that address the customer jobs
- Define Pain Relievers: how each product/service reduces specific pains
- Define Gain Creators: how each product/service creates specific gains
- Ensure every top pain and gain has a corresponding reliever/creator

3. ASSESS FIT
- Map each Pain Reliever to its corresponding Customer Pain
- Map each Gain Creator to its corresponding Customer Gain
- Identify gaps: any top pains/gains without a solution?
- Rate the Problem-Solution Fit strength (1-10)

4. TEST THE VALUE PROPOSITION
- Create a one-sentence value proposition statement
- Test with target customers: does it resonate without explanation?
- A/B test different framings if possible
- Calculate resonance rate: % of customers who say "that's exactly what I need"

5. DOCUMENT AND SCORE
- Create the Value Proposition record in the platform
- Link to customer discovery evidence
- Update the BRL score with value proposition validation results
- Identify remaining risks in the value proposition

6. FEED INTO BUSINESS MODEL CANVAS
- Transfer validated value proposition to BMC Value Proposition block
- Identify implications for Customer Segments, Channels, and Revenue Streams
- Flag any BMC blocks that need revision based on VP testing`,
    requiredInputs: "Customer discovery interview results, problem statement, target segment definition, initial product/service concept",
    requiredOutputs: "Value Proposition Canvas (customer profile + value map), fit assessment, value proposition statement, resonance test results, BRL score update",
    evidenceRequired: "Completed Value Proposition Canvas, customer validation data, resonance test results (n ≥ 10), problem-solution fit score",
    linkedTemplates: "Value Proposition Canvas Template, Jobs-to-be-Done Template, VP Testing Protocol",
    linkedScoringFrameworks: "BRL, VRL, Evidence Confidence Score",
    linkedRiskCategories: "Market, Business Model, Venture",
    completionChecklist: `[ ] Customer Profile completed (jobs, pains, gains)
[ ] Value Map completed (products, pain relievers, gain creators)
[ ] Problem-Solution Fit assessed and scored
[ ] One-sentence value proposition statement created
[ ] Resonance tested with target customers (n ≥ 10)
[ ] Value Proposition record created in platform
[ ] BRL score updated
[ ] Implications for BMC documented`
  },
  {
    id: 7,
    title: "Business Model Canvas Playbook",
    category: "Business Model",
    purpose: "Complete and validate a full Business Model Canvas for the venture, transforming hypotheses into evidence-backed business model components. The BMC is a required input for BRL scoring, investment readiness, and stage-gate approvals.",
    whenToUse: "Use after the value proposition has been validated. The BMC should be completed before the Technical Validation Gate and is required for investment readiness scoring.",
    stepByStepGuidance: `1. COMPLETE ALL 9 BMC BLOCKS
- Customer Segments: Define primary and secondary segments with evidence
- Value Propositions: Transfer from validated Value Proposition Canvas
- Channels: Map customer acquisition, delivery, and support channels
- Customer Relationships: Define relationship type per segment
- Revenue Streams: Detail pricing model, revenue per customer, payment mechanisms
- Key Resources: List critical assets (IP, people, technology, partnerships)
- Key Activities: Define core activities required to deliver value
- Key Partnerships: Identify strategic partners and their roles
- Cost Structure: Map fixed costs, variable costs, and unit economics

2. IDENTIFY AND RANK ASSUMPTIONS
- For each BMC block, list the key assumptions
- Rank each assumption by risk level (High/Medium/Low)
- Identify the 5 riskiest assumptions across the entire canvas
- Define test criteria for each risky assumption

3. TEST CRITICAL ASSUMPTIONS
- Design experiments to test the top 5 assumptions
- Execute tests with minimum viable effort
- Record results as evidence items in the platform
- Update BMC blocks based on test results

4. CALCULATE UNIT ECONOMICS
- Customer Acquisition Cost (CAC)
- Customer Lifetime Value (CLV)
- CLV:CAC ratio (target ≥ 3:1)
- Gross margin per unit
- Break-even analysis

5. SCORE AND RECORD
- Create the Business Model record in the platform
- Update BRL score with validated BMC components
- Link all evidence items to the BMC record
- Flag any blocks still at hypothesis level

6. PREPARE FOR STAGE-GATE
- Compile BMC into the stage-gate review package
- Highlight validated vs. unvalidated blocks
- Present unit economics and financial projections
- Submit for Technical Validation Gate or Investment Readiness Gate`,
    requiredInputs: "Validated value proposition, customer discovery results, market validation data, competitive analysis, initial financial assumptions",
    requiredOutputs: "Completed Business Model Canvas, assumption register, test results for top 5 assumptions, unit economics calculation, BRL score update, stage-gate submission",
    evidenceRequired: "Completed BMC with all 9 blocks, evidence items for each validated block, unit economics calculations, assumption test results",
    linkedTemplates: "Business Model Canvas Template, Assumption Testing Template, Unit Economics Calculator",
    linkedScoringFrameworks: "BRL, VRL, Evidence Confidence Score",
    linkedRiskCategories: "Business Model, Financial, Market, Venture",
    completionChecklist: `[ ] All 9 BMC blocks completed
[ ] Key assumptions identified and ranked for each block
[ ] Top 5 riskiest assumptions tested
[ ] Test results recorded as evidence items
[ ] Unit economics calculated (CAC, CLV, CLV:CAC, margins)
[ ] Business Model record created in platform
[ ] BRL score updated
[ ] Evidence items linked to BMC
[ ] Stage-gate review package prepared`
  },
  {
    id: 8,
    title: "R&D Project Setup Playbook",
    category: "R&D / Technical Validation",
    purpose: "Establish a structured R&D project within ECOBLEND OS, defining the technical hypothesis, research methodology, resource requirements, and success criteria. This playbook creates the foundation for TRL (Technology Readiness Level) scoring and the 4-stage R&D lifecycle.",
    whenToUse: "Use when a venture requires technical development or research validation. Triggered after venture intake when the venture type is R&D Project or when an existing venture needs a new technical workstream.",
    stepByStepGuidance: `1. DEFINE THE TECHNICAL HYPOTHESIS
- State the core technical question: "Can we build [X] that achieves [Y]?"
- Define measurable success criteria with specific thresholds
- Identify the current TRL level (1-9) based on existing evidence
- Set the target TRL level for this R&D phase

2. DESIGN THE RESEARCH METHODOLOGY
- Select the appropriate R&D approach: experimental, simulation, prototyping
- Define the 4-stage lifecycle plan: Concept → Simulation → Prototype → Integration
- Estimate timeline and resource requirements for each stage
- Identify required equipment, materials, and facilities

3. ASSEMBLE THE R&D TEAM
- Assign a Technical Lead responsible for the project
- Identify required specialists (materials, software, testing, etc.)
- Engage academic partners if applicable (link via University Partnerships)
- Define roles, responsibilities, and reporting structure

4. SET UP PROJECT INFRASTRUCTURE
- Create the R&D Project record in the R&D Hub module
- Define milestones for each lifecycle stage
- Set up the experiment log for tracking tests and results
- Configure risk categories specific to technical development

5. ESTABLISH EVIDENCE REQUIREMENTS
- Define what evidence is needed at each TRL gate
- Set minimum evidence confidence thresholds per stage
- Create evidence collection templates for experiments
- Link to relevant academic literature and prior art

6. SUBMIT FOR APPROVAL
- Compile the R&D Project Brief: hypothesis, methodology, team, budget, timeline
- Submit to Studio Director and Technical Lead for approval
- Record the approval decision in Governance
- Activate the first R&D stage: Concept`,
    requiredInputs: "Venture record, technical problem description, initial TRL assessment, team availability, budget allocation, facility/equipment inventory",
    requiredOutputs: "R&D Project record, technical hypothesis document, research methodology plan, team assignment, milestone schedule, experiment log setup, approval record",
    evidenceRequired: "Technical hypothesis with measurable criteria, methodology document, team roster with qualifications, budget estimate, facility requirements, TRL baseline assessment",
    linkedTemplates: "R&D Project Brief Template, Technical Hypothesis Template, Experiment Log Template, TRL Assessment Checklist",
    linkedScoringFrameworks: "TRL, MRL, PRL (Product Readiness = TRL × MRL)",
    linkedRiskCategories: "Technical, IP / Legal, People, Financial",
    completionChecklist: `[ ] Technical hypothesis defined with measurable success criteria
[ ] Current TRL level assessed
[ ] Target TRL level set
[ ] Research methodology designed
[ ] 4-stage lifecycle plan created
[ ] R&D team assembled and roles assigned
[ ] R&D Project record created in platform
[ ] Milestones defined for each stage
[ ] Experiment log configured
[ ] Evidence requirements established per TRL gate
[ ] R&D Project Brief compiled
[ ] Approval submitted and recorded`
  },
  {
    id: 9,
    title: "Concept to Simulation Playbook",
    category: "R&D / Technical Validation",
    purpose: "Guide the transition from R&D Concept stage to Simulation stage, ensuring the technical concept is validated through computational modelling, simulation, or analytical methods before committing to physical prototyping resources.",
    whenToUse: "Use when an R&D project has completed the Concept stage and needs to validate technical feasibility through simulation before building a physical prototype. Corresponds to TRL 2-4 progression.",
    stepByStepGuidance: `1. REVIEW CONCEPT STAGE OUTPUTS
- Confirm all Concept stage milestones are complete
- Review the technical hypothesis and success criteria
- Verify that the concept design is documented and peer-reviewed
- Check that prior art and literature review is complete

2. DESIGN SIMULATION APPROACH
- Select simulation methodology: FEA, CFD, circuit simulation, agent-based, etc.
- Define simulation parameters and boundary conditions
- Identify required software tools and computational resources
- Set validation criteria: what simulation results confirm feasibility?

3. BUILD AND RUN SIMULATIONS
- Create the simulation model based on concept design
- Run baseline simulations with nominal parameters
- Conduct sensitivity analysis: vary key parameters ±20%
- Document all simulation configurations and results

4. ANALYSE RESULTS
- Compare simulation results against success criteria
- Identify any failure modes or unexpected behaviours
- Calculate confidence intervals for key performance metrics
- Determine whether results support proceeding to prototyping

5. RECORD EVIDENCE
- Create Experiment Records for each simulation run
- Upload simulation data files and visualisations
- Update the TRL score based on simulation evidence
- Link results to the R&D Project record

6. STAGE-GATE DECISION
- Compile simulation results into a stage transition report
- Present to Technical Lead and Studio Director
- Decision: Proceed to Prototyping / Iterate Simulation / Pivot / Terminate
- Record decision in Governance and update venture status`,
    requiredInputs: "Completed concept design, technical hypothesis, simulation software access, computational resources, peer review of concept",
    requiredOutputs: "Simulation model, simulation results with analysis, sensitivity analysis, TRL score update, stage transition report, governance decision record",
    evidenceRequired: "Simulation configuration files, results data, sensitivity analysis charts, peer review of simulation methodology, TRL assessment update",
    linkedTemplates: "Simulation Plan Template, Experiment Record Template, Stage Transition Report Template",
    linkedScoringFrameworks: "TRL, PRL, Evidence Confidence Score",
    linkedRiskCategories: "Technical, Financial",
    completionChecklist: `[ ] Concept stage outputs reviewed and confirmed
[ ] Simulation methodology selected and documented
[ ] Simulation model built
[ ] Baseline simulations completed
[ ] Sensitivity analysis conducted
[ ] Results compared against success criteria
[ ] Experiment Records created in platform
[ ] TRL score updated
[ ] Stage transition report compiled
[ ] Stage-gate decision recorded in Governance`
  },
  {
    id: 10,
    title: "Prototype Testing Playbook",
    category: "R&D / Technical Validation",
    purpose: "Guide structured prototype testing to validate technical performance against defined success criteria. This playbook ensures prototype tests generate evidence that advances TRL scoring and supports investment readiness decisions.",
    whenToUse: "Use when an R&D project has passed the Simulation stage and a physical or functional prototype is ready for testing. Corresponds to TRL 4-6 progression.",
    stepByStepGuidance: `1. DEFINE TEST PROTOCOL
- List all performance criteria the prototype must meet
- Define pass/fail thresholds for each criterion
- Design the test methodology: lab testing, field testing, user testing
- Identify required test equipment and facilities
- Set sample sizes for statistical significance

2. PREPARE THE PROTOTYPE
- Verify the prototype matches the design specification
- Document any deviations from the simulation model
- Conduct pre-test inspection and calibration
- Prepare test fixtures and instrumentation

3. EXECUTE TESTS
- Run tests according to the defined protocol
- Record all measurements with timestamps and conditions
- Document any anomalies, failures, or unexpected results
- Capture photographic/video evidence of testing

4. ANALYSE TEST DATA
- Compare results against pass/fail thresholds
- Calculate performance metrics and confidence intervals
- Identify root causes for any failures
- Determine whether the prototype meets minimum viable performance

5. ITERATE OR ADVANCE
- If tests pass: prepare for Integration stage
- If tests partially pass: identify modifications and re-test
- If tests fail: root cause analysis and design revision
- Document lessons learned for future iterations

6. UPDATE PLATFORM RECORDS
- Create Experiment Records for each test series
- Upload test data, photos, and analysis reports
- Update TRL score based on prototype evidence
- Submit stage transition report for Governance review`,
    requiredInputs: "Validated simulation results, prototype build, test protocol, test equipment, safety assessment",
    requiredOutputs: "Test results with statistical analysis, pass/fail determination, TRL score update, iteration plan or stage transition report, governance decision",
    evidenceRequired: "Test protocol document, raw test data, analysis report with confidence intervals, photographic/video evidence, TRL assessment update",
    linkedTemplates: "Test Protocol Template, Experiment Record Template, Root Cause Analysis Template, Stage Transition Report",
    linkedScoringFrameworks: "TRL, MRL, PRL, Evidence Confidence Score",
    linkedRiskCategories: "Technical, Supply Chain, IP / Legal",
    completionChecklist: `[ ] Test protocol defined with pass/fail thresholds
[ ] Prototype verified against design specification
[ ] All planned tests executed
[ ] Measurements recorded with conditions
[ ] Results analysed against thresholds
[ ] Root cause analysis completed for any failures
[ ] Experiment Records created in platform
[ ] TRL score updated
[ ] Stage transition report or iteration plan prepared
[ ] Governance review submitted`
  },
  {
    id: 11,
    title: "Risk Assessment Playbook",
    category: "Risk Intelligence",
    purpose: "Conduct a comprehensive risk assessment for a venture using the FMEA (Failure Mode and Effects Analysis) methodology. This playbook produces a scored risk register that feeds the Risk Intelligence module and gates stage-gate approvals.",
    whenToUse: "Use at every stage-gate transition and whenever a significant change occurs in the venture's assumptions, team, market, or technology. Required before any investment readiness assessment.",
    stepByStepGuidance: `1. IDENTIFY RISK CATEGORIES
- Review all 10 risk categories: Venture, Market, Technical, Business Model, Financial, People, IP/Legal, Supply Chain, Sustainability, Governance
- For each category, brainstorm potential failure modes
- Use the venture's current stage to focus on stage-relevant risks
- Engage the full venture team in risk identification

2. SCORE EACH RISK (FMEA)
- Severity (S): Impact if the risk materialises (1-10)
- Probability (P): Likelihood of occurrence (1-10)
- Detectability (D): Ability to detect before impact (1-10)
- Calculate RPN = S × P × D for each risk
- Classify: Critical (RPN ≥ 200), High (≥ 120), Medium (≥ 60), Low (< 60)

3. PRIORITISE AND MAP
- Rank all risks by RPN score
- Create the risk heatmap (Severity vs. Probability)
- Identify the top 10 risks requiring immediate mitigation
- Flag any "show-stopper" risks (RPN ≥ 200)

4. ASSIGN OWNERSHIP
- Assign a risk owner for each identified risk
- Set review dates and escalation triggers
- Define the monitoring approach for each risk
- Link risks to relevant venture milestones

5. RECORD IN PLATFORM
- Create Risk entries in the Risk Intelligence module
- Link each risk to its venture and relevant scoring dimension
- Upload supporting evidence for risk ratings
- Generate the Risk Register summary

6. FEED INTO SCORING
- Update the VRL score with risk assessment results
- Calculate the Risk Index for the venture
- Flag any risks that block stage-gate progression
- Submit risk assessment for Governance review`,
    requiredInputs: "Venture record, current stage assessment, team roster, market/technical/financial assumptions, previous risk assessments (if any)",
    requiredOutputs: "Completed risk register with FMEA scores, risk heatmap, top 10 risk list, risk ownership assignments, VRL risk score update, governance submission",
    evidenceRequired: "Risk register with RPN scores for all identified risks, risk heatmap visualisation, mitigation plan for critical/high risks, risk owner assignments",
    linkedTemplates: "FMEA Risk Register Template, Risk Heatmap Template, Risk Ownership Matrix",
    linkedScoringFrameworks: "VRL, Risk Index, Evidence Confidence Score",
    linkedRiskCategories: "All 10 categories: Venture, Market, Technical, Business Model, Financial, People, IP/Legal, Supply Chain, Sustainability, Governance",
    completionChecklist: `[ ] All 10 risk categories reviewed
[ ] Failure modes identified for each relevant category
[ ] FMEA scoring completed (Severity, Probability, Detectability)
[ ] RPN calculated and risks classified
[ ] Risk heatmap created
[ ] Top 10 risks identified
[ ] Risk owners assigned
[ ] Review dates and escalation triggers set
[ ] Risk entries created in platform
[ ] VRL risk score updated
[ ] Risk assessment submitted for Governance review`
  },
  {
    id: 12,
    title: "Mitigation Planning Playbook",
    category: "Risk Intelligence",
    purpose: "Develop and implement risk mitigation strategies for all Critical and High risks identified in the Risk Assessment. Each mitigation plan must be actionable, time-bound, and produce measurable evidence of risk reduction.",
    whenToUse: "Use immediately after a Risk Assessment identifies Critical (RPN ≥ 200) or High (RPN ≥ 120) risks. Also use when a previously mitigated risk re-escalates or when new risks emerge during stage transitions.",
    stepByStepGuidance: `1. REVIEW CRITICAL AND HIGH RISKS
- Pull all risks with RPN ≥ 120 from the Risk Register
- Confirm risk scores are current and accurate
- Identify any interdependencies between risks
- Prioritise by RPN and strategic impact

2. SELECT MITIGATION STRATEGY
- For each risk, choose: Avoid, Reduce, Transfer, or Accept
- Avoid: eliminate the risk source entirely
- Reduce: lower Severity, Probability, or improve Detectability
- Transfer: insurance, partnerships, or contractual allocation
- Accept: document rationale and set monitoring triggers

3. DESIGN MITIGATION ACTIONS
- Define specific, measurable actions for each risk
- Set deadlines and milestones for each action
- Estimate cost and resource requirements
- Identify the expected RPN reduction after mitigation

4. IMPLEMENT AND TRACK
- Execute mitigation actions according to the plan
- Record progress in the Risk Intelligence module
- Collect evidence of mitigation effectiveness
- Update risk scores as mitigations take effect

5. RE-SCORE AND VALIDATE
- After mitigation, re-assess Severity, Probability, and Detectability
- Calculate the new RPN — target: reduce all Critical to High or below
- Document the evidence supporting the score reduction
- If target not met, escalate or design additional mitigations

6. UPDATE PLATFORM AND GOVERNANCE
- Update Risk entries with new scores and mitigation evidence
- Update the VRL risk component
- Report mitigation progress to Governance
- Schedule next risk review date`,
    requiredInputs: "Completed risk register with FMEA scores, risk ownership assignments, budget for mitigation activities, team capacity",
    requiredOutputs: "Mitigation plan for each Critical/High risk, action tracker with deadlines, re-scored risk register, evidence of risk reduction, governance report",
    evidenceRequired: "Mitigation action plans with timelines, evidence of completed actions, re-scored RPN values with justification, cost of mitigation",
    linkedTemplates: "Mitigation Plan Template, Risk Action Tracker, Risk Re-scoring Checklist",
    linkedScoringFrameworks: "VRL, Risk Index",
    linkedRiskCategories: "All categories with Critical or High risks",
    completionChecklist: `[ ] All Critical and High risks reviewed
[ ] Mitigation strategy selected for each risk
[ ] Specific actions defined with deadlines
[ ] Cost and resource requirements estimated
[ ] Mitigation actions implemented
[ ] Progress tracked in platform
[ ] Risks re-scored after mitigation
[ ] All Critical risks reduced to High or below
[ ] Evidence of risk reduction documented
[ ] VRL risk score updated
[ ] Governance report submitted`
  },
  {
    id: 13,
    title: "VRL Scoring Playbook",
    category: "Readiness Scoring",
    purpose: "Guide the accurate assessment and scoring of a venture's Venture Readiness Level (VRL) — the composite score that determines stage-gate progression, investment eligibility, and portfolio prioritisation within ECOBLEND OS.",
    whenToUse: "Use at every stage-gate review, quarterly portfolio reviews, and whenever a significant evidence update occurs. VRL scoring is mandatory before any investment decision or stage transition.",
    stepByStepGuidance: `1. UNDERSTAND THE VRL FORMULA
- VRL = weighted composite of: TRL, BRL, MRL, SRL, PRL, IRL, Risk Index
- Default weights: TRL 20%, BRL 20%, MRL 15%, SRL 10%, PRL 15%, IRL 10%, Risk 10%
- Weights may be adjusted by Studio Director based on venture type
- Score range: 0.0 to 10.0

2. GATHER COMPONENT SCORES
- TRL: Current Technology Readiness Level (1-9, normalised to 0-10)
- BRL: Business Readiness Level from BMC validation
- MRL: Manufacturing/Market Readiness Level
- SRL: Sustainability Readiness Level from ESG assessment
- PRL: Product Readiness Level = composite of TRL × MRL
- IRL: Impact Readiness Level from social impact assessment
- Risk Index: Inverse of normalised risk score

3. VERIFY EVIDENCE CONFIDENCE
- For each component, check the Evidence Confidence Score
- Minimum threshold: Evidence Confidence ≥ 3.0 for each component
- If any component is below threshold, flag for additional evidence gathering
- Record confidence levels alongside scores

4. CALCULATE COMPOSITE VRL
- Apply weights to each normalised component score
- Calculate the weighted average
- Apply any stage-specific adjustments
- Record the composite VRL score

5. INTERPRET THE RESULT
- VRL ≥ 6.0 with Confidence ≥ 3.5 and 0 Critical Risks → PROCEED
- VRL ≥ 4.0 with Confidence ≥ 3.0 and ≤ 2 Critical Risks → PAUSE
- VRL < 4.0 → PIVOT or TERMINATE
- Document the interpretation and recommendation

6. RECORD AND SUBMIT
- Create the VRL Score record in Readiness Scoring module
- Link all component evidence
- Submit for stage-gate review
- Update the venture's stage if a transition is warranted`,
    requiredInputs: "Component scores (TRL, BRL, MRL, SRL, PRL, IRL), risk register, evidence confidence scores for each component, current venture stage",
    requiredOutputs: "Composite VRL score, component breakdown, evidence confidence summary, proceed/pause/pivot/terminate recommendation, stage-gate submission",
    evidenceRequired: "Documented scores for all 7 components with evidence links, evidence confidence scores ≥ 3.0, risk register summary, scoring methodology documentation",
    linkedTemplates: "VRL Scoring Worksheet, Component Evidence Checklist, Stage-Gate Decision Template",
    linkedScoringFrameworks: "VRL, TRL, BRL, MRL, SRL, PRL, IRL, Risk Index, Evidence Confidence Score",
    linkedRiskCategories: "All — risk is a VRL component",
    completionChecklist: `[ ] VRL formula and weights confirmed
[ ] All 7 component scores gathered
[ ] Evidence Confidence ≥ 3.0 verified for each component
[ ] Composite VRL calculated
[ ] Result interpreted (Proceed/Pause/Pivot/Terminate)
[ ] VRL Score record created in platform
[ ] All component evidence linked
[ ] Stage-gate submission prepared
[ ] Venture stage updated if transition warranted`
  },
  {
    id: 14,
    title: "TRL Scoring Playbook",
    category: "Readiness Scoring",
    purpose: "Assess and score the venture's Technology Readiness Level (TRL) using the standard 9-level framework adapted for ECOBLEND OS. TRL is a critical input to both VRL and PRL composite scores.",
    whenToUse: "Use whenever R&D milestones are completed, after prototype testing, or at any stage-gate review requiring technical readiness assessment.",
    stepByStepGuidance: `1. REVIEW TRL DEFINITIONS
- TRL 1: Basic principles observed
- TRL 2: Technology concept formulated
- TRL 3: Experimental proof of concept
- TRL 4: Technology validated in lab
- TRL 5: Technology validated in relevant environment
- TRL 6: Technology demonstrated in relevant environment
- TRL 7: System prototype demonstrated in operational environment
- TRL 8: System complete and qualified
- TRL 9: Actual system proven in operational environment

2. ASSESS CURRENT EVIDENCE
- Review all R&D experiment records and test results
- Map evidence to TRL level definitions
- Identify the highest TRL level fully supported by evidence
- Note any partial evidence for the next TRL level

3. SCORE WITH EVIDENCE LINKS
- Assign the TRL level based on strongest evidence
- Calculate the sub-level percentage (0-100% within current TRL)
- Link specific evidence items to each TRL criterion
- Document any gaps between current and target TRL

4. CALCULATE PRL COMPOSITE
- PRL = (0.5 × TRL_normalised) + (0.5 × MRL_normalised)
- If no MRL assessment exists, PRL defaults to TRL
- Record PRL alongside TRL

5. UPDATE PLATFORM
- Create or update the TRL Score record
- Link all supporting evidence
- Update the R&D Hub project status
- Feed TRL into the VRL composite calculation`,
    requiredInputs: "R&D experiment records, test results, simulation data, prototype evidence, previous TRL assessment",
    requiredOutputs: "TRL score with sub-level percentage, evidence mapping, PRL composite score, VRL component update",
    evidenceRequired: "Experiment records matching TRL criteria, test data with statistical analysis, peer review of TRL assessment",
    linkedTemplates: "TRL Assessment Checklist, TRL Evidence Mapping Template",
    linkedScoringFrameworks: "TRL, PRL, VRL, Evidence Confidence Score",
    linkedRiskCategories: "Technical, IP / Legal",
    completionChecklist: `[ ] TRL definitions reviewed
[ ] All R&D evidence reviewed and mapped
[ ] TRL level assigned with evidence links
[ ] Sub-level percentage calculated
[ ] PRL composite calculated
[ ] TRL Score record created/updated
[ ] VRL component updated
[ ] R&D Hub status updated`
  },
  {
    id: 15,
    title: "BRL Scoring Playbook",
    category: "Readiness Scoring",
    purpose: "Assess and score the venture's Business Readiness Level (BRL) based on the validation status of its Business Model Canvas, market evidence, financial projections, and go-to-market readiness.",
    whenToUse: "Use after completing the Business Model Canvas, market validation, or financial modelling. Required at every stage-gate review and before investment readiness assessment.",
    stepByStepGuidance: `1. ASSESS BMC VALIDATION STATUS
- Review each of the 9 BMC blocks
- Score each block: Hypothesis (1-3), Tested (4-6), Validated (7-9), Proven (10)
- Calculate the average BMC validation score
- Identify blocks still at hypothesis level

2. EVALUATE MARKET EVIDENCE
- Review TAM/SAM/SOM calculations and evidence quality
- Assess competitive positioning strength
- Evaluate demand signal evidence
- Score market readiness (1-10)

3. ASSESS FINANCIAL READINESS
- Review unit economics: CAC, CLV, CLV:CAC ratio
- Evaluate revenue model validation
- Check financial projections against evidence
- Score financial readiness (1-10)

4. EVALUATE GO-TO-MARKET READINESS
- Assess channel strategy validation
- Review customer acquisition plan
- Evaluate brand and positioning readiness
- Score GTM readiness (1-10)

5. CALCULATE COMPOSITE BRL
- BRL = weighted average of BMC validation, market, financial, and GTM scores
- Apply evidence confidence weighting
- Record the composite BRL score

6. UPDATE PLATFORM
- Create or update the BRL Score record
- Link all supporting evidence
- Feed BRL into the VRL composite calculation
- Flag any critical gaps for remediation`,
    requiredInputs: "Completed BMC, market validation results, financial model, go-to-market plan, customer evidence",
    requiredOutputs: "BRL score with component breakdown, evidence mapping, gap analysis, VRL component update",
    evidenceRequired: "BMC with validation status per block, market size evidence, unit economics data, GTM plan with evidence",
    linkedTemplates: "BRL Assessment Worksheet, BMC Validation Tracker",
    linkedScoringFrameworks: "BRL, VRL, Evidence Confidence Score",
    linkedRiskCategories: "Business Model, Market, Financial",
    completionChecklist: `[ ] All 9 BMC blocks scored for validation status
[ ] Market evidence evaluated and scored
[ ] Financial readiness assessed
[ ] Go-to-market readiness evaluated
[ ] Composite BRL calculated
[ ] BRL Score record created/updated
[ ] Evidence linked
[ ] VRL component updated
[ ] Critical gaps flagged`
  },
  {
    id: 16,
    title: "Evidence Confidence Playbook",
    category: "Readiness Scoring",
    purpose: "Assess the quality, reliability, and sufficiency of evidence supporting a venture's readiness scores. Evidence Confidence gates investment decisions — low confidence scores block progression regardless of readiness scores.",
    whenToUse: "Use alongside every readiness scoring exercise. Required before any stage-gate approval or investment decision. Also use when evidence quality is challenged during review.",
    stepByStepGuidance: `1. INVENTORY ALL EVIDENCE
- List every evidence item linked to the venture
- Categorise by type: primary research, secondary research, test data, financial data, expert opinion
- Note the date and source of each item
- Flag any evidence older than 6 months

2. SCORE EACH EVIDENCE ITEM
- Reliability (1-5): How trustworthy is the source?
- Relevance (1-5): How directly does it support the claim?
- Recency (1-5): How current is the evidence?
- Sample Size (1-5): Is the sample statistically meaningful?
- Independence (1-5): Is the evidence from an independent source?

3. CALCULATE CONFIDENCE SCORES
- Per-item score = average of 5 dimensions
- Per-dimension score = average of all items supporting that readiness dimension
- Overall Evidence Confidence = weighted average across all dimensions
- Minimum threshold: 3.0 to proceed, 3.5 for investment readiness

4. IDENTIFY GAPS
- Flag any readiness dimension with confidence < 3.0
- Identify what additional evidence would raise confidence
- Prioritise evidence gathering by impact on VRL score
- Estimate effort required to close each gap

5. CREATE EVIDENCE PLAN
- For each gap, define the evidence gathering approach
- Set deadlines and assign responsibility
- Estimate cost of evidence gathering
- Link to relevant playbooks (e.g., Customer Discovery, Prototype Testing)

6. RECORD AND GATE
- Create the Evidence Confidence record in the platform
- Link to all scored evidence items
- If overall confidence < 3.0: block stage-gate progression
- If confidence ≥ 3.0: approve for scoring and gate review`,
    requiredInputs: "All evidence items linked to the venture, readiness scores, evidence sources and dates",
    requiredOutputs: "Evidence inventory, per-item confidence scores, per-dimension confidence scores, overall confidence score, gap analysis, evidence gathering plan",
    evidenceRequired: "Scored evidence inventory, confidence calculations, gap analysis document",
    linkedTemplates: "Evidence Confidence Scorecard, Evidence Inventory Template, Evidence Gap Analysis Template",
    linkedScoringFrameworks: "Evidence Confidence Score, VRL, all component scores",
    linkedRiskCategories: "Venture, Governance",
    completionChecklist: `[ ] All evidence items inventoried
[ ] Each item scored across 5 dimensions
[ ] Per-dimension confidence calculated
[ ] Overall Evidence Confidence Score calculated
[ ] Gaps identified (any dimension < 3.0)
[ ] Evidence gathering plan created for gaps
[ ] Evidence Confidence record created in platform
[ ] Gate decision applied (block if < 3.0, approve if ≥ 3.0)`
  },
  {
    id: 17,
    title: "Pitch Deck Preparation Playbook",
    category: "Investment Readiness",
    purpose: "Prepare a compelling, evidence-backed pitch deck that meets investor expectations and is grounded in validated data from the ECOBLEND OS scoring and evidence system. The pitch deck is a required component of the Investment Pack.",
    whenToUse: "Use when the venture has achieved VRL ≥ 4.0 and Evidence Confidence ≥ 3.0, indicating sufficient validation to approach investors. Required before generating the Investment Pack.",
    stepByStepGuidance: `1. VERIFY INVESTMENT READINESS PREREQUISITES
- Confirm VRL ≥ 4.0
- Confirm Evidence Confidence ≥ 3.0
- Confirm no Critical risks (RPN ≥ 200) unmitigated
- Review the Investment Readiness gate requirements

2. STRUCTURE THE PITCH DECK (12 slides)
- Slide 1: Title + one-line value proposition
- Slide 2: Problem — validated with customer evidence
- Slide 3: Solution — how your product solves the problem
- Slide 4: Market Size — TAM/SAM/SOM with sources
- Slide 5: Business Model — validated revenue model
- Slide 6: Traction — evidence of progress and validation
- Slide 7: Technology — TRL status and R&D roadmap
- Slide 8: Team — founder profiles and key hires
- Slide 9: Competition — positioning matrix
- Slide 10: Financials — unit economics and projections
- Slide 11: Ask — funding amount, use of funds, milestones
- Slide 12: Appendix — additional evidence and data

3. POPULATE WITH PLATFORM DATA
- Pull validated evidence from each relevant module
- Use actual scores (VRL, TRL, BRL) — not aspirational numbers
- Reference specific evidence items and confidence scores
- Include risk summary with mitigation status

4. REVIEW AND REFINE
- Internal review by Venture Lead and Studio Director
- Check all claims are evidence-backed
- Verify financial projections are consistent with the Financial Model
- Ensure the narrative is compelling and coherent

5. CREATE PLATFORM RECORDS
- Create the Pitch Deck record in Investment Pack module
- Link to all referenced evidence items
- Set status: Draft → Under Review → Approved
- Generate the Investment Pack when all components are ready

6. PREPARE FOR PRESENTATION
- Rehearse the pitch with timing (aim for 15 minutes)
- Prepare for Q&A based on risk register and evidence gaps
- Create a leave-behind summary document`,
    requiredInputs: "VRL score ≥ 4.0, Evidence Confidence ≥ 3.0, validated BMC, market data, financial model, team profiles, R&D status, risk register",
    requiredOutputs: "12-slide pitch deck, pitch deck record in platform, investment pack component, presentation rehearsal notes",
    evidenceRequired: "All claims in the pitch deck must link to platform evidence items. VRL, TRL, BRL scores with confidence levels. Financial projections with assumptions documented.",
    linkedTemplates: "Pitch Deck Template (12 slides), Investment Pack Checklist, Q&A Preparation Guide",
    linkedScoringFrameworks: "VRL, TRL, BRL, Evidence Confidence Score",
    linkedRiskCategories: "Financial, Market, Venture, Governance",
    completionChecklist: `[ ] Investment readiness prerequisites verified
[ ] All 12 pitch deck slides completed
[ ] All claims backed by platform evidence
[ ] Actual scores used (not aspirational)
[ ] Internal review completed
[ ] Financial projections verified
[ ] Pitch Deck record created in platform
[ ] Investment Pack component linked
[ ] Presentation rehearsed
[ ] Q&A preparation completed`
  },
  {
    id: 18,
    title: "Investor Data Room Playbook",
    category: "Investment Readiness",
    purpose: "Assemble and organise a comprehensive Investor Data Room within ECOBLEND OS that provides potential investors with structured access to all venture evidence, financials, legal documents, and readiness scores.",
    whenToUse: "Use after the pitch deck is approved and before investor meetings. The Data Room must be complete before the Investment Readiness Gate can be passed.",
    stepByStepGuidance: `1. DEFINE DATA ROOM STRUCTURE
- Section 1: Executive Summary and Pitch Deck
- Section 2: Market Evidence (TAM/SAM/SOM, competitive analysis, customer research)
- Section 3: Product & Technology (TRL evidence, R&D results, IP status)
- Section 4: Business Model (BMC, unit economics, revenue model)
- Section 5: Financial Projections (3-year model, assumptions, scenarios)
- Section 6: Team (profiles, org chart, advisory board)
- Section 7: Legal & IP (patents, trademarks, agreements, compliance)
- Section 8: Risk Assessment (risk register, mitigation plans)
- Section 9: Readiness Scores (VRL, TRL, BRL with evidence links)
- Section 10: Governance (stage-gate decisions, board minutes)

2. GATHER AND ORGANISE DOCUMENTS
- Pull evidence from each platform module
- Ensure all documents are current (< 3 months old)
- Redact any sensitive information not appropriate for investors
- Organise into the defined section structure

3. SET ACCESS CONTROLS
- Define which sections each investor tier can access
- Set document-level permissions where needed
- Configure time-limited access for specific investor groups
- Enable download tracking and audit logging

4. QUALITY CHECK
- Verify all documents are complete and professional
- Check for consistency across sections
- Ensure financial figures match across all documents
- Confirm all readiness scores are current

5. CREATE PLATFORM RECORDS
- Create the Data Room record in Investment Pack module
- Link all documents to their source evidence items
- Set status: Assembling → Review → Ready → Shared
- Generate access links for approved investors

6. MONITOR AND UPDATE
- Track which documents investors access
- Note any questions or requests for additional information
- Update documents as new evidence becomes available
- Report investor engagement to Governance`,
    requiredInputs: "Approved pitch deck, all venture evidence items, financial model, legal documents, team profiles, risk register, readiness scores",
    requiredOutputs: "Structured data room with 10 sections, access controls configured, investor access links, engagement tracking setup",
    evidenceRequired: "All documents in the data room must be current (< 3 months), evidence-backed, and internally consistent",
    linkedTemplates: "Data Room Structure Template, Document Checklist, Access Control Matrix",
    linkedScoringFrameworks: "VRL, TRL, BRL, Evidence Confidence Score",
    linkedRiskCategories: "Financial, Governance, IP / Legal",
    completionChecklist: `[ ] Data room structure defined (10 sections)
[ ] All documents gathered and organised
[ ] Documents verified as current (< 3 months)
[ ] Access controls configured
[ ] Quality check completed
[ ] Financial consistency verified
[ ] Data Room record created in platform
[ ] Access links generated
[ ] Engagement tracking enabled
[ ] Governance notified`
  },
  {
    id: 19,
    title: "Execution Roadmap Playbook",
    category: "Execution Planning",
    purpose: "Create a structured execution roadmap that translates validated venture hypotheses into time-bound milestones, resource allocations, and deliverables. The roadmap is the operational backbone that connects readiness scoring to actual venture progress.",
    whenToUse: "Use after the venture passes the MVP Approval Gate and enters the execution phase. Also use when revising the roadmap after a pivot or stage transition.",
    stepByStepGuidance: `1. DEFINE EXECUTION PHASES
- Phase 1: MVP Build (3-6 months) — core product development
- Phase 2: Market Entry (3-6 months) — launch and initial traction
- Phase 3: Scale (6-12 months) — growth and optimisation
- Adjust timelines based on venture type and complexity

2. SET MILESTONES PER PHASE
- Define 5-8 milestones per phase
- Each milestone must be measurable and time-bound
- Link milestones to readiness score targets
- Identify dependencies between milestones

3. ALLOCATE RESOURCES
- Map team members to milestones
- Estimate budget per milestone
- Identify external resources needed (contractors, equipment, facilities)
- Create the resource allocation matrix

4. DEFINE SUCCESS METRICS
- For each milestone, define the KPI that proves completion
- Set target values and acceptable ranges
- Link KPIs to platform scoring dimensions
- Define escalation triggers if milestones are missed

5. BUILD THE TIMELINE
- Create a Gantt-style timeline with all milestones
- Mark stage-gate review points
- Identify the critical path
- Add buffer time for high-risk milestones

6. RECORD AND TRACK
- Create the Execution Roadmap record in the platform
- Set up milestone tracking with automated alerts
- Configure stage-gate checkpoints
- Submit the roadmap for Governance approval`,
    requiredInputs: "Validated BMC, approved investment terms, team roster, budget allocation, readiness scores, risk register",
    requiredOutputs: "Execution roadmap with phased milestones, resource allocation matrix, timeline, success metrics, governance approval",
    evidenceRequired: "Milestone definitions with KPIs, resource allocation documentation, timeline with dependencies, governance approval record",
    linkedTemplates: "Execution Roadmap Template, Milestone Tracker, Resource Allocation Matrix, Gantt Chart Template",
    linkedScoringFrameworks: "VRL (milestone targets), all component scores",
    linkedRiskCategories: "Venture, Financial, People, Governance",
    completionChecklist: `[ ] Execution phases defined with timelines
[ ] 5-8 milestones set per phase
[ ] Milestones linked to readiness score targets
[ ] Resources allocated per milestone
[ ] Success metrics defined with KPIs
[ ] Timeline created with critical path
[ ] Stage-gate checkpoints marked
[ ] Execution Roadmap record created in platform
[ ] Milestone tracking configured
[ ] Governance approval obtained`
  },
  {
    id: 20,
    title: "Stage-Gate Approval Playbook",
    category: "Governance",
    purpose: "Guide the formal stage-gate approval process that governs venture progression through the ECOBLEND OS lifecycle. Stage-gates are the quality control mechanism ensuring ventures only advance when evidence supports readiness.",
    whenToUse: "Use at every stage transition: Idea → Validation, Validation → MVP, MVP → Market Entry, Market Entry → Scale. Also use for special gates: Investment Readiness Gate, Board Approval, Technical Validation Gate.",
    stepByStepGuidance: `1. IDENTIFY THE GATE
- Determine which stage-gate is being requested
- Review the gate-specific requirements from the Governance framework
- Confirm the venture's current stage and proposed next stage
- Verify the requestor has authority to initiate the gate review

2. COMPILE THE GATE PACKAGE
- Gather all required evidence for this specific gate
- Include current readiness scores (VRL, TRL, BRL, etc.)
- Include the risk register with mitigation status
- Include Evidence Confidence scores for all dimensions
- Add the financial summary and resource requirements

3. VERIFY GATE CRITERIA
- Check minimum VRL threshold for this gate
- Verify Evidence Confidence meets minimum (≥ 3.0, or ≥ 3.5 for investment gates)
- Confirm no unmitigated Critical risks
- Check all prerequisite playbooks are completed
- Verify all required approvals from previous gates are in place

4. PRESENT TO REVIEW PANEL
- Schedule the gate review with the appropriate panel
- Intake Gate: Studio Director + Venture Lead
- Technical Gate: Technical Lead + Studio Director
- Investment Gate: Studio Director + Finance Lead + Board representative
- Present the gate package with clear recommendation

5. RECORD THE DECISION
- Document the panel's decision: Approve / Conditional / Reject
- If Conditional: list specific conditions and deadlines
- If Rejected: document reasons and recommended actions
- Record all decisions in the Governance audit trail

6. EXECUTE THE TRANSITION
- If Approved: update the venture stage in the platform
- Trigger next-stage playbooks and milestones
- Notify all stakeholders of the stage transition
- Update the Command Centre dashboard
- Schedule the next stage-gate review`,
    requiredInputs: "Current readiness scores, risk register, evidence confidence scores, financial summary, previous gate decisions, gate-specific requirements",
    requiredOutputs: "Gate review package, panel decision record, stage transition (if approved), updated venture status, governance audit trail entry, stakeholder notifications",
    evidenceRequired: "Complete gate package with all required scores and evidence, panel attendance record, signed decision document, conditions list (if conditional)",
    linkedTemplates: "Stage-Gate Review Package Template, Gate Decision Record Template, Stakeholder Notification Template",
    linkedScoringFrameworks: "VRL, TRL, BRL, MRL, SRL, PRL, IRL, Risk Index, Evidence Confidence Score",
    linkedRiskCategories: "Governance, Venture, all relevant categories",
    completionChecklist: `[ ] Gate identified and requirements reviewed
[ ] Gate package compiled with all evidence
[ ] VRL threshold verified
[ ] Evidence Confidence threshold verified
[ ] No unmitigated Critical risks confirmed
[ ] Prerequisite playbooks completed
[ ] Review panel scheduled
[ ] Gate package presented
[ ] Decision recorded (Approve/Conditional/Reject)
[ ] Conditions documented (if applicable)
[ ] Venture stage updated (if approved)
[ ] Stakeholders notified
[ ] Next gate review scheduled
[ ] Governance audit trail updated`
  }
];

async function run() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  for (const pb of PLAYBOOKS) {
    await conn.query(
      `UPDATE playbook_library SET
        category = ?,
        purpose = ?,
        whenToUse = ?,
        stepByStepGuidance = ?,
        requiredInputs = ?,
        requiredOutputs = ?,
        evidenceRequired = ?,
        linkedTemplates = ?,
        linkedScoringFrameworks = ?,
        linkedRiskCategories = ?,
        completionChecklist = ?,
        status = 'Published',
        version = '1.0',
        accessLevel = 'Internal Team',
        owner = 'Platform Admin',
        reviewDate = DATE_ADD(NOW(), INTERVAL 6 MONTH)
      WHERE id = ?`,
      [
        pb.category,
        pb.purpose,
        pb.whenToUse,
        pb.stepByStepGuidance,
        pb.requiredInputs,
        pb.requiredOutputs,
        pb.evidenceRequired,
        pb.linkedTemplates,
        pb.linkedScoringFrameworks,
        pb.linkedRiskCategories,
        pb.completionChecklist,
        pb.id
      ]
    );
    console.log(`✅ Updated playbook ${pb.id}: ${pb.title}`);
  }

  // Verify
  const [rows] = await conn.query('SELECT id, title, LENGTH(stepByStepGuidance) as len, status, version, accessLevel, owner FROM playbook_library ORDER BY id');
  console.log('\n=== VERIFICATION ===');
  rows.forEach(r => console.log(`  [${r.id}] ${r.title} | len=${r.len} | status=${r.status} | v=${r.version} | access=${r.accessLevel} | owner=${r.owner}`));

  await conn.end();
  console.log('\n✅ All 20 playbooks populated successfully');
}

run().catch(console.error);
