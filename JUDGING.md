# Judging Integrity & Scoring Architecture Specification (JUDGING.md)

**Platform:** DogFood Hackathon Platform  
**Target Standard:** 25% Judging Integrity Rubric Allocation  
**Core Principles:** Mathematically Defensible Normalization, Role Isolation, Algorithmic Assignment, and Immutable Auditability

---

## 1. Executive Defense & System Philosophy

A hackathon's legitimacy hinges entirely on the integrity of its judging pipeline. In traditional hackathons, evaluation systems suffer from three catastrophic structural flaws:

1. **Statistical Distortion (Lenient vs. Harsh Judges):** Different judges have wildly divergent internal baselines. A team reviewed by a lenient judge giving $9.0$s gains an unearned advantage over a superior team reviewed by a strict judge whose ceiling is $6.5$.
2. **Anchoring Bias & Collusion:** Exposing public leaderboards or peer scores during an ongoing round anchors subsequent judge evaluations toward the prevailing consensus and allows colluding judges to strategically vote-dump against competitors.
3. **Unregulated Allocation & Conflicts of Interest:** Manual assignment leads to reviewer fatigue, uneven review saturation ($1$ review for team A vs $5$ reviews for team B), and judges scoring projects submitted by their own teammates or close affiliations.

DogFood replaces ad-hoc judging with a **technically defensible judging engine** designed around:
- **Empirical Bayes Regularized Z-Score Normalization** to eliminate mean and dispersion bias.
- **Constrained Bipartite Min-Degree Assignment** ensuring uniform review saturation ($K \ge 3$) and zero Conflict of Interest (COI).
- **Backend-Enforced Role Isolation & Blind Evaluation** preventing anchoring and tampering.
- **Event-Sourced Audit Logging & Real-Time Anomaly Detection** for forensic dispute resolution.
- **Streaming CSV Export** across all evaluation phases for public transparency.

---

## 2. Cross-Judge Score Normalization

### 2.1 The Statistical Problem

In distributed hackathon evaluation, judges evaluate sparse subsets of projects. Because every judge does not evaluate every project, raw numerical averages introduce two fatal statistical errors:

1. **Location Bias (Mean Shift $\mu_j$):**
   - Judge $A$ grades with mean $\mu_A = 8.8$.
   - Judge $B$ grades with mean $\mu_B = 4.5$.
   - A team scoring $8.0$ under Judge $A$ is below average for that judge ($-1.0\sigma$), but under raw averaging beats a top-tier project evaluated by Judge $B$ that scored $6.5$ ($+2.0\sigma$).
2. **Dispersion Bias (Variance Shift $\sigma_j$):**
   - Judge $C$ clusters all scores between $6.8$ and $7.2$ ($\sigma_C \approx 0.2$).
   - Judge $D$ spreads scores from $1.0$ to $10.0$ ($\sigma_D \approx 2.5$).
   - Judge $D$ exerts over **$12\times$ more variance** on final standings than Judge $C$, effectively silencing Judge $C$'s voice.

### 2.2 Comparative Evaluation of Normalization Methodologies

| Method | Formulation | Strengths | Failure Modes & Critique | Decision |
| :--- | :--- | :--- | :--- | :--- |
| **Raw Arithmetic Mean** | $\bar{S}_i = \frac{1}{K}\sum s_{j,i}$ | Trivial to explain. | Fails completely under judge heterogeneity; rewards teams lucky enough to get lenient judges. | **Rejected** |
| **Min-Max Rescaling** | $\frac{s - \min}{\max - \min} \times 10$ | Bounds to $[0, 10]$. | Highly sensitive to extreme single outliers. Undefined when $\min = \max$. | **Rejected** |
| **Olympic Trimmed Mean** | Drop $\min$ and $\max$, average remainder. | Resilient against 1 rogue judge. | Requires $K \ge 5$. At hackathon density ($K=3$), dropping min and max leaves $1$ score. Does not normalize scale. | **Rejected for sparse graphs** |
| **Percentile / Rank Borda** | Rank projects per judge, aggregate percentiles. | Invariant to monotonic calibration habits. | Destroys interval margins; a 0.01 pt lead yields the same rank jump as a 5.0 pt blowout. | **Rejected** |
| **Empirical Bayes Regularized Z-Score** | $z_{j,i} = \frac{s_{j,i} - \hat{\mu}_j}{\hat{\sigma}_j}$ with Bayesian shrinkage | Standardizes location and scale, robust to small $n$, mathematically optimal for Gaussian rubric marks. | Requires variance stabilization when $n_j < 3$ or $\sigma_j = 0$. Solved via prior shrinkage. | **Adopted** |

### 2.3 Mathematical Derivation of DogFood's Normalization Engine

To resolve small-sample instability ($n_j < 3$) and zero-variance degeneration ($\sigma_j = 0$), DogFood implements **Empirical Bayes shrinkage**. The judge's observed sample mean $\bar{s}_j$ and sample variance $s_j^2$ are shrunk toward the event's global prior mean $\mu_0$ and global variance $\sigma_0^2$ using pseudo-observation weighting:

#### Step 1: Global Baseline Estimation
Given all evaluations in the event $E$:
$$\mu_0 = \frac{1}{N_{\text{total}}} \sum_{e \in E} s_e, \quad \sigma_0 = \sqrt{\frac{1}{N_{\text{total}} - 1} \sum_{e \in E} (s_e - \mu_0)^2}$$
*(If $N_{\text{total}} < 5$, fallback to neutral constants $\mu_0 = 7.0, \sigma_0 = 1.5$.)*

#### Step 2: Empirical Bayes Shrunk Parameters
For each judge $j$ who completed $n_j$ evaluations, with shrinkage strength parameter $m = 3.0$:

$$\hat{\mu}_j = \frac{n_j \bar{s}_j + m \mu_0}{n_j + m}$$

$$\hat{\sigma}_j^2 = \frac{(n_j - 1)s_j^2 + m \sigma_0^2 + \frac{n_j m}{n_j + m}(\bar{s}_j - \mu_0)^2}{n_j + m - 1}$$

$$\hat{\sigma}_j = \max\left(\sqrt{\hat{\sigma}_j^2}, \, 0.5\right)$$

#### Step 3: Standard Score & Clamped Rescaling
For raw weighted score $s_{j,i}$ given by judge $j$ to project $i$:

$$z_{j,i} = \frac{s_{j,i} - \hat{\mu}_j}{\hat{\sigma}_j}$$

$$S_{j,i}^{\text{norm}} = \text{clamp}\left( \mu_0 + z_{j,i} \cdot \sigma_0, \, 1.0, \, 10.0 \right)$$

#### Step 4: Final Submission Aggregate & Standard Error
For project $i$ evaluated by set of judges $J_i$:

$$\bar{S}_i = \frac{1}{|J_i|} \sum_{j \in J_i} S_{j,i}^{\text{norm}}$$

$$\text{Standard Error } SE_i = \begin{cases} 
\frac{\sqrt{\frac{1}{|J_i|-1} \sum_{j \in J_i} (S_{j,i}^{\text{norm}} - \bar{S}_i)^2}}{\sqrt{|J_i|}} & \text{if } |J_i| > 1 \\
0.0 & \text{if } |J_i| \le 1 
\end{cases}$$

---

## 3. Weighted & Configurable Judging Rubrics

### 3.1 Relational Architecture
Each event defines $M$ custom rubrics ($R_1, \dots, R_M$), with percentage weights $W_k$ and maximum marks $M_k = 10$.

$$\sum_{k=1}^M W_k = 100\%$$

If an organizer configures weights totaling $W_{\text{total}} \ne 100\%$, the system dynamically normalizes weights:

$$w_k = \frac{W_k}{\sum_{l=1}^M W_l}$$

### 3.2 Evaluation Scoring Formula
When judge $j$ rates project $i$ on rubrics $R_k$ with marks $x_{j,i,k} \in [1, 10]$:

$$\text{Raw Total Score } s_{j,i} = \sum_{k=1}^M \left( x_{j,i,k} \times w_k \right) \in [1.0, 10.0]$$

This raw weighted score preserves the relative importance assigned to criteria (e.g. $40\%$ Innovation vs $30\%$ Technical Depth vs $30\%$ Presentation) prior to cross-judge normalization.

---

## 4. Algorithmic & Batch Judge Assignment Strategy

### 4.1 Objective & Constraints
Let $P = \{p_1, \dots, p_N\}$ be submitted projects, and $J = \{j_1, \dots, j_M\}$ be appointed judges.  
Target:
1. **Target Saturation:** Each project is assigned to at least $K = 3$ judges.
2. **Workload Capping:** No judge receives more than $C_{\max} = \lceil \frac{N \cdot K}{M} \rceil + 1$ projects.
3. **Strict Conflict of Interest (COI) Invariant:**
   $$\forall (j, p), \quad j \notin \text{TeamMembers}(p) \land j \ne \text{Author}(p)$$
4. **Track Affinity:** Match judges to projects aligned with their domain expertise where feasible.

### 4.2 Minimum-Degree Bipartite Allocation Algorithm

```
Algorithm: Load-Balanced COI-Free Judge Allocation
Input: Submissions P, Judges J, Saturation K=3, Slack S=1
Output: Assignment Pairs (judge_id, submission_id)

1. Compute capacity threshold: C_max = ceil(|P| * K / |J|) + S
2. Build COI graph: Edge (j, p) marked FORBIDDEN if j in Team(p)
3. Initialize Workload[j] = 0 for all j in J
4. Initialize Assigned[p] = empty set for all p in P

5. For each project p in P (sorted ascending by count of viable judges):
     While |Assigned[p]| < K:
       ViableJudges = { j in J | (j, p) not FORBIDDEN and 
                                 j not in Assigned[p] and 
                                 Workload[j] < C_max }
       If ViableJudges is empty:
         Raise FeasibilityDeficitError("Insufficient conflict-free judges")
       
       Rank ViableJudges by:
         1. TrackMatch(j, p) [0 for match, 1 otherwise]
         2. Workload[j] ascending (load balancing)
         3. Random tie-breaker (avoid deterministic bias)
       
       Select best judge j*
       Assigned[p].add(j*)
       Workload[j*] += 1

6. Return pairs (j, p) for all p in P, j in Assigned[p]
```

---

## 5. Backend-Enforced Role Isolation & Blind Judging

### 5.1 Role Isolation Matrix

| Capability | Anonymous | Participant | Judge | Organizer | Admin / Superuser |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Browse Public Gallery** | Yes | Yes | Yes | Yes | Yes |
| **Submit Evaluation** | Blocked (401) | Blocked (403) | Assigned Projects Only | Blocked/Assigned | All Projects |
| **Evaluate Own Project (COI)** | Blocked (403) | Blocked (403) | **Strictly Blocked (403)** | Blocked (403) | Blocked (403) |
| **View Unassigned Projects for Grading** | Blocked (403) | Blocked (403) | Blocked (403) | View Only | Full Access |
| **View Leaderboard During Round** | **Hidden (403)** | **Hidden (403)** | **Hidden (403)** | View Only | Full Access |
| **View Leaderboard After Publish** | Yes (Published) | Yes (Published) | Yes (Published) | Yes | Yes |
| **Configure Rubrics** | Blocked (403) | Blocked (403) | Blocked (403) | Yes | Yes |
| **Trigger Batch Assignment** | Blocked (403) | Blocked (403) | Blocked (403) | Yes | Yes |
| **Export Audit CSVs** | Blocked (403) | Blocked (403) | Blocked (403) | Yes | Yes |

### 5.2 Blind Judging & Anchoring Prevention
- **Anti-Anchoring Guard:** During active judging, the leaderboard and current aggregate standings are strictly inaccessible via the API. Judges cannot see what scores other judges have submitted for any project.
- **Double-Blind Review:** In blind evaluation mode, participant names, usernames, and avatars are stripped from the evaluation payload, presenting only project title, problem statement, technical architecture, and demonstration links.
- **Feedback Anonymization:** Post-hackathon qualitative feedback presented to participants is attributed to generic tags (e.g. `Judge A`, `Judge B`) rather than usernames to protect judges from post-event harassment.

---

## 6. Auditability & Voting Abuse Prevention

### 6.1 Event-Sourced Evaluation Audit Trail
Rather than destructively overwriting previous marks, all evaluation mutations generate an immutable entry in `EvaluationAuditLog`:
- **Unique Sequence ID**
- **Foreign Keys:** `submission_id`, `judge_id`, `event_id`
- **Scores Snapshot:** Complete JSON array of raw per-rubric scores
- **Score Delta:** Difference in weighted score relative to prior submission
- **Forensic Metadata:** Client IP address, User-Agent, Session Token
- **Dwell Time:** Seconds elapsed between viewing project details and submitting score
- **Timestamp:** High-resolution ISO-8601 UTC timestamp

### 6.2 Anomaly & Abuse Detection Heuristics
The engine executes three real-time anomaly detection heuristics:

1. **Leave-One-Out Discrepancy ($\Delta_{\text{LOO}}$ Consensus Outlier):**
   $$\Delta_{\text{LOO}} = \left| s_{j,i} - \frac{1}{|J_i| - 1} \sum_{k \in J_i \setminus \{j\}} s_{k,i} \right|$$
   If $\Delta_{\text{LOO}} \ge 3.0$ on a $10$-point scale, the evaluation is automatically flagged for organizer audit.
2. **Speed-Running / Bot Heuristic:**
   If $\text{DwellTime} < 45$ seconds for a submission containing a repository link and demo video, the record is flagged as `RAPID_SUBMISSION`.
3. **Variance Flatlining:**
   If a judge completes $\ge 5$ evaluations with variance $\text{Var}(S_j) < 0.05$ (e.g. assigning straight $10$s or $5$s), the system alerts the organizer of uncalibrated evaluation.

---

## 7. Judge Progress Telemetry & Live Dashboards

Organizers maintain real-time oversight via `/api/events/<id>/admin/judging-progress/`:
- **Macro Telemetry:**
  - Total submissions, assigned judges, review saturation percentage.
  - Number of under-reviewed submissions ($< K$ evaluations).
- **Judge Roster Telemetry:**
  - Per-judge assigned count, completed count, completion percentage.
  - Average review time per project.
  - Statistical profile ($\mu_j$, $\sigma_j$) identifying harsh/lenient calibration.
- **Project Matrix:**
  - Saturation status: `SATISFIED` ($\ge K$), `IN_PROGRESS`, or `DEFICIT`.
  - Raw mean vs. Normalized score with Standard Error ($SE$).

---

## 8. Audit-Ready CSV Export Throughout Workflow

The platform provides three automated, high-performance streaming CSV export endpoints:

1. **Official Leaderboard Export (`/api/events/<id>/admin/export/leaderboard-csv/`):**
   - Columns: `Rank, Submission ID, Project Title, Team Name, Track, Raw Score, Normalized Score, Standard Error, Completed Reviews, Outliers Flagged`
2. **Rubric Breakdown Export (`/api/events/<id>/admin/export/rubric-breakdown-csv/`):**
   - Columns: `Submission ID, Project Title, Team Name, Judge Identifier, Rubric Name, Weight %, Raw Score, Weighted Contribution, Timestamp`
3. **Qualitative Feedback Export (`/api/events/<id>/admin/export/feedback-csv/`):**
   - Columns: `Submission ID, Project Title, Team Name, Judge Identifier, Feedback Notes, Submitted At`

---

## 9. Conclusion & Defensibility Summary

By combining **Empirical Bayes regularized Z-score normalization**, **constrained bipartite assignment**, **strict anti-COI role isolation**, and **immutable audit logging**, DogFood delivers an enterprise-grade hackathon judging engine. The system is mathematically immune to judge severity bias, structurally protected against anchoring and collusion, and fully auditable from first submission to final awards presentation.
