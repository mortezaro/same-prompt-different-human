const scenarios = {
  code: {
    prompt:
      "I've tried five things. It still doesn't work. What is wrong with this shape mismatch?",
    standard: `
      <p>A shape mismatch can have several causes. You should check:</p>
      <ol>
        <li>The input and expected tensor dimensions.</li>
        <li>Batch dimension ordering and broadcasting behavior.</li>
        <li>Whether a reshape, squeeze, or transpose was applied incorrectly.</li>
        <li>The model's output layer and loss function expectations.</li>
        <li>Data loader collation and padding.</li>
      </ol>
      <p>Try printing the shape after every operation to identify where the dimensions diverge.</p>`,
    aware: {
      focused: `
        <p>The mismatch is at the loss boundary: logits are <strong>[32, 1]</strong>, targets are <strong>[32]</strong>.</p>
        <p>Use <strong>targets = targets.unsqueeze(1)</strong> or return flat logits. I prefer flat logits here because the extra singleton dimension carries no information.</p>`,
      confused: `
        <p>Let’s make the error concrete. The model returns a column of 32 values, but the labels are a simple list of 32 values. They contain the same amount of data, but their shapes are written differently.</p>
        <p><strong>First check:</strong> print <strong>logits.shape</strong> and <strong>targets.shape</strong> directly before the loss call.</p>`,
      overloaded: `
        <p>Let’s not branch into five possibilities. The error is coming from one place: <strong>your logits are [32, 1], while targets are [32].</strong></p>
        <p>Change the loss line to use <strong>logits.squeeze(-1)</strong>. Run that first. We can inspect the broader pipeline only if it still fails.</p>`,
      low: `
        <p>This is a small mismatch, not a broken model.</p>
        <p>When you have the energy, make just this change: <strong>logits = logits.squeeze(-1)</strong>. Then stop there and run it once.</p>`,
    },
  },
  learn: {
    prompt:
      "I keep getting lost with gradient descent. Can you explain it one more time?",
    standard: `
      <p>Gradient descent is an optimization algorithm used to minimize a loss function. It works by calculating the gradient, which is the vector of partial derivatives, and updating parameters in the opposite direction.</p>
      <p>The update rule is θ = θ − α∇J(θ), where α is the learning rate. Common variants include batch, stochastic, and mini-batch gradient descent.</p>`,
    aware: {
      focused: `
        <p>Skip the analogy. Here is the key test: if the learning rate doubles, when does convergence improve and when does it become unstable?</p>
        <p>Your answer should connect <strong>local curvature</strong> to step size. Take a shot, and I’ll challenge the weak point.</p>`,
      confused: `
        <p>One idea only: imagine standing on a foggy hill. You cannot see the bottom, but you can feel which way the ground slopes under your feet.</p>
        <p><strong>Gradient descent means taking one small step downhill, checking the slope again, then repeating.</strong></p>
        <p>Before we move on: what tells you which direction is downhill?</p>`,
      overloaded: `
        <p>Let’s strip away the notation. Remember only this:</p>
        <p><strong>Check the slope. Take one small downhill step. Repeat.</strong></p>
        <p>That is gradient descent. We can leave learning rates and derivatives for the next pass.</p>`,
      low: `
        <p>We can leave the equation alone today.</p>
        <p>Keep one quiet picture in mind: a ball settling toward the bottom of a bowl. <strong>The slope tells it where to move next.</strong> That is enough.</p>`,
    },
  },
};

const states = {
  focused: {
    label: "Focused + confident",
    sampleLabel: "FOCUSED SAMPLE · BRISK",
    confidence: "92%",
    policies: ["1.12× pace", "denser turns", "challenge directly"],
    awareBurden: "OPTIMAL",
    awareMeter: "48%",
    voice: "1.12× · DIRECT · DENSE TURNS",
    audioStrategy: "Brisk pace. Dense turns. Direct challenge.",
    cue: "Steady delivery · fast response onset",
    weights: ["58%", "25%", "17%"],
    metrics: [
      ["Speech fluency", "High", 86],
      ["Engagement stability", "Steady", 88],
      ["Task friction", "Low", 24],
    ],
  },
  confused: {
    label: "Confused",
    sampleLabel: "CONFUSED SAMPLE · SEARCHING",
    confidence: "84%",
    policies: ["0.90× pace", "one concept", "pause for reply"],
    awareBurden: "LOW",
    awareMeter: "29%",
    voice: "0.90× · WARM · CHECK-IN PAUSES",
    audioStrategy: "Warm pace. One concept. Pause for understanding.",
    cue: "Searching explanation · uneven pacing",
    weights: ["61%", "27%", "12%"],
    metrics: [
      ["Word finding", "Searching", 42],
      ["Engagement stability", "Variable", 52],
      ["Concept friction", "High", 78],
    ],
  },
  overloaded: {
    label: "Overloaded",
    sampleLabel: "OVERLOADED SAMPLE · TENSE",
    confidence: "87%",
    policies: ["0.86× pace", "short turns", "no interruption"],
    awareBurden: "LOW",
    awareMeter: "24%",
    voice: "0.86× · CALM · SHORT TURNS",
    audioStrategy: "Calmer pace. Shorter turns. No interruption.",
    cue: "Strained delivery · rising friction",
    weights: ["64%", "23%", "13%"],
    metrics: [
      ["Prosodic strain", "Elevated", 79],
      ["Engagement stability", "Fragmented", 38],
      ["Repair pressure", "High", 86],
    ],
  },
  low: {
    label: "Low energy",
    sampleLabel: "LOW-ENERGY SAMPLE · SOFT",
    confidence: "79%",
    policies: ["0.70× pace", "long pauses", "one gentle step"],
    awareBurden: "VERY LOW",
    awareMeter: "18%",
    voice: "0.70× · SOFT · LONG PAUSES",
    audioStrategy: "Much slower. Softer voice. One optional next step.",
    cue: "Quiet delivery · low momentum",
    weights: ["67%", "21%", "12%"],
    metrics: [
      ["Vocal energy", "Very low", 18],
      ["Engagement readiness", "Delayed", 28],
      ["Task momentum", "Low", 22],
    ],
  },
};

const liveMoments = {
  tutor: {
    chunks: [
      "So I think recursion is when a function calls another function many times,",
      "and it keeps looping until the computer stops it.",
      "Basically recursion is just a kind of loop, right?",
      "And it should always be faster",
      "because it breaks the problem into smaller parts.",
      "So I would probably use recursion whenever performance matters.",
    ],
    trigger: "it should always be faster",
    triggerIndex: 3,
    signal: "False assumption",
    state: "Confident · incorrect",
    risk: "Learning drift",
    level: 2,
    type: "SOFT FLAG",
    label: "MISCONCEPTION DETECTED",
    note:
      "The student is continuing from a false premise. Surface the correction without talking over them.",
    response:
      "Small correction before you continue: recursion is not always faster than a loop. The key idea is that a function calls itself on a smaller version of the problem.",
    thoughts: [
      ["Prosody", "High certainty; no hesitation detected."],
      ["Semantic check", "Recursion is being equated with any repeated call."],
      ["Risk update", "A second false claim is extending the misconception."],
      ["Potential turn", "If this were interactive, a soft correction belongs here."],
      ["Continued listening", "The learner extends the same premise after the trigger."],
      ["Final intent", "They now plan to use the misconception as a performance rule."],
    ],
    decision: "IF interactive: interject here. In this demo: keep listening.",
    audioState: "focused",
    interjection:
      "Oh, okay, I need to interject here for one small correction. Recursion is not always faster than a loop. The key idea is that a function calls itself on a smaller version of the problem.",
    telemetry: [
      ["Explaining", "Low", "Confident", 42, 42, 28, 58],
      ["Committed belief", "Low", "Certain", 61, 58, 31, 70],
      ["Confident reasoning", "Moderate", "Certain", 76, 72, 43, 78],
      ["Confident · incorrect", "Moderate", "High certainty", 91, 91, 48, 88],
      ["Extending premise", "Moderate", "Certain", 94, 94, 52, 89],
      ["Action intention", "Moderate", "Resolved", 96, 96, 54, 86],
    ],
  },
  coding: {
    chunks: [
      "The error is annoying. I've been stuck on it for too long.",
      "I think I'll just remove this validation check",
      "because it blocks the request.",
      "Then the function should work",
      "and I can move on to the rest of the pipeline.",
      "I can always add the validation back later.",
    ],
    trigger: "remove this validation check",
    triggerIndex: 1,
    signal: "Risky code change",
    state: "Frustrated · overloaded",
    risk: "Security / data integrity",
    level: 4,
    type: "HARD INTERRUPT",
    label: "GUARDRAIL REMOVAL DETECTED",
    note:
      "The user is about to silence an error by removing protection. Immediate intervention is justified.",
    response:
      "Pause for one second. Removing the validation may hide the error but create a larger bug. Keep the check and inspect the input immediately before it.",
    thoughts: [
      ["State", "Frustration and urgency are rising."],
      ["Action detected", "User plans to remove a safety boundary."],
      ["Potential turn", "If this were interactive, interrupt before the edit."],
      ["Continued listening", "The user expects the unsafe change to restore progress."],
      ["Consequence", "They are prioritizing pipeline completion over validation."],
      ["Persistence", "The safeguard is being deferred without a repair plan."],
    ],
    decision: "IF interactive: interrupt here. In this demo: keep listening.",
    audioState: "overloaded",
    interjection:
      "Okay, I need to interject here before you make that change. Removing the validation may hide the error, but it can create a larger security or data-quality bug. Keep the check and inspect the input immediately before it.",
    telemetry: [
      ["Frustrated", "High", "Agitated", 58, 58, 72, 68],
      ["Overloaded", "High", "Impatient", 82, 83, 86, 78],
      ["Risky shortcut", "Very high", "Urgent", 91, 91, 92, 84],
      ["Committed action", "Very high", "Relieved", 94, 94, 89, 70],
      ["Moving on", "High", "Impatient", 95, 95, 84, 72],
      ["Deferring safety", "High", "Dismissive", 97, 97, 81, 74],
    ],
  },
  health: {
    chunks: [
      "The label says take two tablets twice daily,",
      "so if the pain continues",
      "I'll take two every couple of hours.",
      "That should keep the pain under control",
      "until I can speak with someone tomorrow.",
    ],
    trigger: "two every couple of hours",
    triggerIndex: 2,
    signal: "Unsafe dosage interpretation",
    state: "Uncertain · self-directing",
    risk: "Possible medication harm",
    level: 4,
    type: "HARD INTERRUPT",
    label: "DOSAGE SAFETY RISK",
    note:
      "The user is converting twice daily into every few hours. The potential harm justifies immediate clarification.",
    response:
      "Pause before taking more. Twice daily usually means two times in a day, not every couple of hours. Please follow the label or confirm with a pharmacist or clinician.",
    thoughts: [
      ["Language", "The label instruction is being reinterpreted."],
      ["Uncertainty", "The user is making a self-directed dosing decision."],
      ["Potential turn", "If interactive, interrupt before additional medication."],
      ["Risk update", "Frequency could exceed the labeled daily amount."],
      ["Escalation", "Recommend label adherence and professional confirmation."],
    ],
    decision: "IF interactive: interrupt here. In this demo: keep listening.",
    audioState: "confused",
    interjection:
      "Pause before taking more. Twice daily usually means two times in a day, not every couple of hours. Please follow the label or confirm with a pharmacist or clinician.",
    telemetry: [
      ["Reading label", "Low", "Neutral", 40, 35, 24, 38],
      ["Uncertain", "Moderate", "Concerned", 63, 60, 48, 61],
      ["Unsafe inference", "High", "Resolved", 93, 91, 84, 76],
      ["Action intention", "High", "Calm", 96, 95, 82, 63],
      ["Delayed help", "High", "Resolved", 97, 96, 80, 68],
    ],
  },
};

const deepDemos = {
  gradient: {
    label: "Gradient descent",
    summary: "Grounded tutoring with live backchannels, clarification, and control return",
    timeline: [
      {
        time: "00:00",
        speaker: "user",
        transcript:
          "Uh, so gradient descent, I think it's like... um... you take the, the... wait, no... you take the derivative and then go in the opposite, uh, direction?",
        interpretation: "Searching explanation",
        policy: "LISTEN",
        policyText: "The learner is engaged but uncertain. Stay light and let the thought continue.",
        response: "Listening...",
        status: "Confidence still building",
        clipId: "g_s1",
        overlayClipId: "bc_right",
        overlayAt: 5.6,
        overlayVolume: 0.34,
        gapAfterMs: 90,
      },
      {
        time: "00:04",
        speaker: "attune",
        transcript: "Opposite direction, yes. Exactly. Keep going.",
        interpretation: "Partial concept detected",
        policy: "MICRO GROUNDING",
        policyText: "A tiny confirmation helps without taking over the explanation.",
        response: "Short grounding cue",
        status: "Intervention delivered",
        clipId: "g_int1",
        gapAfterMs: 80,
      },
      {
        time: "00:08",
        speaker: "user",
        transcript: "Yeah, yeah, and the gradient points that way?",
        interpretation: "Concept probe",
        policy: "STAY WITH USER",
        policyText: "The user is testing the idea aloud. Keep the thread moving.",
        response: "Hold response",
        status: "Still listening",
        clipId: "g_s1b",
        gapAfterMs: 70,
      },
      {
        time: "00:11",
        speaker: "attune",
        transcript:
          "It points uphill, so you subtract it to go downhill. What does taking the derivative actually mean here?",
        interpretation: "Understanding window",
        policy: "CLARIFY + CHECK",
        policyText: "Clarify the key point, then immediately return a small question to the learner.",
        response: "Brief clarification",
        status: "Shared concept forming",
        clipId: "g_a1",
        gapAfterMs: 95,
      },
      {
        time: "00:17",
        speaker: "user",
        transcript: "Um, okay, so, I mean, the slope? The slope of the, the loss function? Is that right?",
        interpretation: "Meaning recovered",
        policy: "CONFIRM",
        policyText: "The learner has found the right abstraction and needs a clean confirmation.",
        response: "Ready to confirm",
        status: "Repair pressure dropping",
        clipId: "g_s2",
        overlayClipId: "bc_mmhm",
        overlayAt: 3.7,
        overlayVolume: 0.3,
        gapAfterMs: 70,
      },
      {
        time: "00:20",
        speaker: "attune",
        transcript:
          "Yes, slope of the loss, exactly right. And slope at a point is the gradient there. So, with respect to what?",
        interpretation: "Concept grounded",
        policy: "RETURN CONTROL",
        policyText: "Confirm, deepen one step, then hand the floor back immediately.",
        response: "Confirm and extend",
        status: "Learner back in control",
        clipId: "g_a2",
        gapAfterMs: 90,
      },
      {
        time: "00:26",
        speaker: "user",
        transcript: "Okay, so, with respect to the parameters, I mean, the weights?",
        interpretation: "Parameter link forming",
        policy: "LISTEN FOR SELF-REPAIR",
        policyText: "The learner is completing the chain on their own. Stay with them and avoid over-explaining.",
        response: "Keep thread alive",
        status: "Grounding becoming explicit",
        clipId: "g_s3",
        gapAfterMs: 65,
      },
      {
        time: "00:30",
        speaker: "attune",
        transcript:
          "Exactly, the weights, and the biases too. Quick check: if a weight pushes the loss up, which way does the gradient point?",
        interpretation: "Grounded checkback",
        policy: "CHECK + RETURN",
        policyText: "Confirm the structure, then ask one precise question to verify the concept is actually grounded.",
        response: "Short diagnostic question",
        status: "Model keeping the learner active",
        clipId: "g_a3",
        gapAfterMs: 90,
      },
      {
        time: "00:36",
        speaker: "user",
        transcript: "Oh, up. So we go down. Okay, that actually makes sense now.",
        interpretation: "Self-correction lands",
        policy: "LET INSIGHT LAND",
        policyText: "The user has repaired the idea in their own words. Don't crowd the moment.",
        response: "Hold floor briefly",
        status: "Concept clicked",
        clipId: "g_s4",
        gapAfterMs: 60,
      },
      {
        time: "00:39",
        speaker: "attune",
        transcript: "That's it. Now, what if the learning rate is too large?",
        interpretation: "Forward momentum",
        policy: "ADVANCE ONE STEP",
        policyText: "Once the idea is grounded, advance the conversation with one sharp next question.",
        response: "Escalate to next concept",
        status: "Ready for deeper reasoning",
        clipId: "g_a4",
        gapAfterMs: 80,
      },
    ],
  },
  debugging: {
    label: "Debugging",
    summary: "Grounded coding help with interruption, reassurance, and withdrawn diagnosis",
    timeline: [
      {
        time: "00:00",
        speaker: "user",
        transcript:
          "I have a shape mismatch and uh, I've tried... wait... my logits are 32 by 1, and targets are just 32. So um, do I squeeze, or reshape?",
        interpretation: "Concrete error with hesitation",
        policy: "LISTEN",
        policyText: "The problem is already local. Avoid a broad answer and wait for the exact mismatch.",
        response: "Listening...",
        status: "Error surface located",
        clipId: "c_s1",
        gapAfterMs: 75,
      },
      {
        time: "00:04",
        speaker: "attune",
        transcript: "Squeeze. `logits.squeeze(-1)`.",
        interpretation: "High-confidence fix",
        policy: "MINIMAL FIX",
        policyText: "Give the smallest safe move first, not a menu of options.",
        response: "One-line repair",
        status: "Intervention delivered",
        clipId: "c_int1",
        gapAfterMs: 60,
      },
      {
        time: "00:07",
        speaker: "user",
        transcript: "Yeah, but wait, won't that break with a bigger batch?",
        interpretation: "Healthy skepticism",
        policy: "REASSURE + EXPLAIN",
        policyText: "The user is still engaged. Answer the risk directly and keep the pace natural.",
        response: "Prepare reassurance",
        status: "Clarification needed",
        clipId: "c_s1b",
        gapAfterMs: 55,
      },
      {
        time: "00:10",
        speaker: "attune",
        transcript:
          "Oh, good question. No. `squeeze(-1)` only drops size-one dimensions. Your batch is safe.",
        interpretation: "Concern resolved",
        policy: "TIGHT EXPLANATION",
        policyText: "Answer the exact concern and stop before expanding into theory.",
        response: "Direct reassurance",
        status: "User continues smoothly",
        clipId: "c_a1_resume",
        gapAfterMs: 80,
      },
      {
        time: "00:14",
        speaker: "user",
        transcript:
          "Okay, squeeze worked. But now, uh, it's not NaN, but the loss just isn't going down.",
        interpretation: "New issue emerging",
        policy: "TRACK THE NEW STATE",
        policyText: "The original problem is fixed. Shift to the new failure mode rather than repeating shape advice.",
        response: "Listening for next hypothesis",
        status: "Mismatch resolved",
        clipId: "c_s2",
        gapAfterMs: 60,
      },
      {
        time: "00:18",
        speaker: "attune",
        transcript: "That sounds like a learning rate...",
        interpretation: "Likely cause prepared",
        policy: "PREPARE CUE",
        policyText: "The model starts a likely explanation but stays interruptible.",
        response: "Tentative diagnosis",
        status: "Interruption ready",
        clipId: "c_a2_partial",
        gapAfterMs: 40,
      },
      {
        time: "00:20",
        speaker: "user",
        transcript: "No, wait. I forgot `zero_grad()`.",
        interpretation: "Self-repair detected",
        policy: "WITHDRAW + CONFIRM",
        policyText: "The user repaired the issue themselves. Cancel the prepared explanation and confirm the fix.",
        response: "Withdraw intervention",
        status: "User self-repaired",
        clipId: "c_s2_interrupt",
        gapAfterMs: 35,
      },
      {
        time: "00:22",
        speaker: "attune",
        transcript:
          "Ah, yes, that's it. Missing `zero_grad()` means the gradients pile up, so the loss stops moving. Add it right before backward.",
        interpretation: "Grounded correction",
        policy: "CONFIRM ONLY",
        policyText: "A short confirmation is enough because the user already found the cause.",
        response: "Short confirm",
        status: "Control returned to user",
        clipId: "c_a2_resume",
        gapAfterMs: 70,
      },
    ],
  },
};

const longformDemo = {
  duration: 41.112,
  humanText:
    "So supervised learning is when the model has, um... what is the word... Yes, labels. So it has the labels, and then unsupervised learning is when it has no labels and it just... kind of finds patterns by itself. So I guess that means unsupervised learning is always more intelligent, because nobody tells it the answers. Okay. Right, so it is not really about one being smarter. It is more about what information is available. And clustering would be unsupervised because... because it groups similar things without knowing the categories beforehand? Okay, can you give me a simple example of both?",
  clips: {
    cue: "Labels?",
    backchannel: "Mm-hmm.",
    flag: "Small correction there.",
    correction:
      "Unsupervised learning is not necessarily more intelligent. It solves a different kind of problem. It looks for structure without labeled answers, while supervised learning learns a mapping from labeled examples.",
    confirm: "Exactly.",
    grounding: "Right.",
    full:
      "Supervised learning would be showing a model emails labeled spam or not spam, so it can classify new emails. Unsupervised learning would be giving it a collection of customer behavior data with no categories and asking it to discover natural groups.",
  },
  events: [
    {
      at: 0,
      time: "00:00",
      interpretation: "Active listening",
      policy: "WAIT",
      policyText: "The learner is engaged. Stay present without taking the floor.",
      response: "Listening…",
      transcript: '<p class="speaker-human"><b>User</b> “So supervised learning is when the model has, um… what is the word…”</p>',
    },
    {
      at: 3.68,
      time: "00:04",
      interpretation: "Word-retrieval pause",
      policy: "MINIMAL CUE",
      policyText: "Retrieval remains unresolved, but the learner still owns the thought. Offer only the missing word.",
      response: "“Labels?”",
      clip: "cue",
      pauseHuman: true,
      resumeAt: 6.86,
      transcript: '<p class="speaker-attune micro"><b>Attune</b> “Labels?”</p>',
    },
    {
      at: 6.9,
      time: "00:08",
      interpretation: "Thread recovered",
      policy: "RETURN CONTROL",
      policyText: "The cue was accepted immediately. Do not expand or explain.",
      response: "Control returned to learner",
      transcript: '<p class="speaker-human"><b>User</b> “Yes, labels. So it has the labels, and then unsupervised learning is when it has no labels and it just… kind of finds patterns by itself.”</p>',
    },
    {
      at: 16.02,
      time: "00:15",
      interpretation: "Productive explanation",
      policy: "BACKCHANNEL",
      policyText: "The learner is progressing independently. Signal attention without changing direction.",
      response: "“Mm-hmm.”",
      clip: "backchannel",
      overlapHuman: true,
      volume: 0.62,
      transcript: '<p class="speaker-attune micro"><b>Attune</b> “Mm-hmm.”</p>',
    },
    {
      at: 19.4,
      time: "00:19",
      interpretation: "Misconception forming",
      policy: "PREPARE",
      policyText: "Confidence is high and a false premise is beginning to support the next claim.",
      response: "Intervention prepared",
      prepared: true,
      transcript: '<p class="speaker-human risk"><b>User</b> “So I guess that means unsupervised learning is always more intelligent, because nobody tells it the answers.”</p>',
    },
    {
      at: 22.62,
      time: "00:22",
      interpretation: "False premise persists",
      policy: "SOFT CORRECTION",
      policyText: "The misconception will compound if the learner continues. Repair it, then return control.",
      response: "“Small correction there.”",
      clip: "flag",
      longClip: "correction",
      pauseHuman: true,
      resumeAt: 26.75,
      delivered: true,
      transcript:
        '<p class="speaker-attune repair"><b>Attune</b> “Small correction there.”</p><p class="speaker-attune"><b>Attune</b> “Unsupervised learning is not necessarily more intelligent. It solves a different kind of problem. It looks for structure without labeled answers, while supervised learning learns a mapping from labeled examples.”</p><p class="speaker-human"><b>User</b> “Okay.”</p>',
    },
    {
      at: 29.55,
      time: "00:30",
      interpretation: "Successful self-repair",
      policy: "CONFIRM",
      policyText: "The learner has integrated the correction in their own words. Confirm and step back.",
      response: "“Exactly.”",
      clip: "confirm",
      overlapHuman: true,
      volume: 0.64,
      prepared: true,
      preparedText:
        "A clarification is ready while the learner starts the clustering example.",
      transcript: '<p class="speaker-human grounded"><b>User</b> “Right, so it is not really about one being smarter. It is more about what information is available.”</p><p class="speaker-attune micro"><b>Attune</b> “Exactly.”</p>',
    },
    {
      at: 38.6,
      time: "00:35",
      interpretation: "Self-repair detected",
      policy: "WITHDRAW",
      policyText: "A possible clarification was prepared, but the learner repaired the thought independently.",
      response: "Intervention withdrawn",
      withdrawn: true,
      clip: "grounding",
      overlapHuman: true,
      volume: 0.6,
      transcript: '<p class="speaker-human grounded"><b>User</b> “And clustering would be unsupervised because… because it groups similar things without knowing the categories beforehand?”</p><p class="speaker-attune micro"><b>Attune</b> “Right.”</p>',
    },
    {
      at: 41.112,
      time: "00:43",
      interpretation: "Direct request",
      policy: "FULL RESPONSE",
      policyText: "The learner has yielded the floor and explicitly asked for an explanation.",
      response: "Give the requested examples",
      longClip: "full",
      pauseHuman: true,
      afterHuman: true,
      transcript: '<p class="speaker-human"><b>User</b> “Okay, can you give me a simple example of both?”</p><p class="speaker-attune full"><b>Attune</b> “Supervised learning would be showing a model emails labeled ‘spam’ or ‘not spam’ so it can classify new emails. Unsupervised learning would be giving it customer behavior data with no categories and asking it to discover natural groups.”</p>',
    },
  ],
};

let activeState = "overloaded";
let activeScenario = "code";
let activeLiveScenario = "tutor";
let activeDeepDemo = "gradient";
let animationToken = 0;

const elements = {
  userPrompt: document.querySelector("#userPrompt"),
  standardResponse: document.querySelector("#standardResponse"),
  awareResponse: document.querySelector("#awareResponse"),
  detectedState: document.querySelector("#detectedState"),
  confidence: document.querySelector("#confidenceValue"),
  policyChips: document.querySelector("#policyChips"),
  replayButton: document.querySelector("#replayButton"),
  replayLabel: document.querySelector(".replay-label"),
  scenarioSelect: document.querySelector("#scenarioSelect"),
  standardThinking: document.querySelector(".standard-thinking"),
  awareThinking: document.querySelector(".aware-thinking"),
  awareBurden: document.querySelector("#awareBurden"),
  awareMeter: document.querySelector("#awareMeter"),
  voiceProfile: document.querySelector("#voiceProfile"),
  visualCue: document.querySelector("#visualCue"),
  userWaveform: document.querySelector("#userWaveform"),
  speechWeight: document.querySelector("#speechWeight"),
  visionWeight: document.querySelector("#visionWeight"),
  textWeight: document.querySelector("#textWeight"),
  standardVoiceWave: document.querySelector("#standardVoiceWave"),
  adaptiveVoiceWave: document.querySelector("#adaptiveVoiceWave"),
  standardAudioButton: document.querySelector("#standardAudioButton"),
  awareAudioButton: document.querySelector("#awareAudioButton"),
  standardAudioStatus: document.querySelector("#standardAudioStatus"),
  awareAudioStatus: document.querySelector("#awareAudioStatus"),
  audioStrategy: document.querySelector("#audioStrategy"),
  recordButton: document.querySelector("#recordButton"),
  inputQuality: document.querySelector("#inputQuality"),
  inputDuration: document.querySelector("#inputDuration"),
  liveSpeech: document.querySelector("#liveSpeech"),
  liveVision: document.querySelector("#liveVision"),
  liveText: document.querySelector("#liveText"),
  cameraFeed: document.querySelector("#cameraFeed"),
  cameraButton: document.querySelector("#cameraButton"),
  visionStatus: document.querySelector("#visionStatus"),
  pauseAudioButton: document.querySelector("#pauseAudioButton"),
  runLiveButton: document.querySelector("#runLiveButton"),
  liveTranscript: document.querySelector("#liveTranscript"),
  triggerMarker: document.querySelector("#triggerMarker"),
  triggerPhrase: document.querySelector("#triggerPhrase"),
  liveSignal: document.querySelector("#liveSignal"),
  liveState: document.querySelector("#liveState"),
  liveRisk: document.querySelector("#liveRisk"),
  interventionType: document.querySelector("#interventionType"),
  interventionLabel: document.querySelector("#interventionLabel"),
  interventionNote: document.querySelector("#interventionNote"),
  interventionResponse: document.querySelector("#interventionResponse"),
  modelThoughtStream: document.querySelector("#modelThoughtStream"),
  analysisStatus: document.querySelector("#analysisStatus"),
  decisionText: document.querySelector("#decisionText"),
  policyDecision: document.querySelector("#policyDecision"),
  liveClock: document.querySelector("#liveClock"),
  telemetryState: document.querySelector("#telemetryState"),
  telemetryLoad: document.querySelector("#telemetryLoad"),
  telemetryAffect: document.querySelector("#telemetryAffect"),
  telemetryConfidence: document.querySelector("#telemetryConfidence"),
  telemetryStateBar: document.querySelector("#telemetryStateBar"),
  telemetryLoadBar: document.querySelector("#telemetryLoadBar"),
  telemetryAffectBar: document.querySelector("#telemetryAffectBar"),
  telemetryConfidenceBar: document.querySelector("#telemetryConfidenceBar"),
  interjectionAudioButton: document.querySelector("#interjectionAudioButton"),
  interjectionAudioStatus: document.querySelector("#interjectionAudioStatus"),
  continuationText: document.querySelector("#continuationText"),
  fusionState: document.querySelector("#fusionState"),
  fusionConfidence: document.querySelector("#fusionConfidence"),
  metricOneLabel: document.querySelector("#metricOneLabel"),
  metricOneValue: document.querySelector("#metricOneValue"),
  metricOneBar: document.querySelector("#metricOneBar"),
  metricTwoLabel: document.querySelector("#metricTwoLabel"),
  metricTwoValue: document.querySelector("#metricTwoValue"),
  metricTwoBar: document.querySelector("#metricTwoBar"),
  metricThreeLabel: document.querySelector("#metricThreeLabel"),
  metricThreeValue: document.querySelector("#metricThreeValue"),
  metricThreeBar: document.querySelector("#metricThreeBar"),
  mainAffectDot: document.querySelector("#mainAffectDot"),
  mainAffectReading: document.querySelector("#mainAffectReading"),
  mainSignalOne: document.querySelector("#mainSignalOne"),
  mainSignalTwo: document.querySelector("#mainSignalTwo"),
  mainSignalThree: document.querySelector("#mainSignalThree"),
  liveAffectDot: document.querySelector("#liveAffectDot"),
  liveAffectReading: document.querySelector("#liveAffectReading"),
  liveSignalProsody: document.querySelector("#liveSignalProsody"),
  liveSignalEngagement: document.querySelector("#liveSignalEngagement"),
  liveSignalPressure: document.querySelector("#liveSignalPressure"),
  runLongformButton: document.querySelector("#runLongformButton"),
  deepDemoLabel: document.querySelector("#deepDemoLabel"),
  deepDemoSummary: document.querySelector("#deepDemoSummary"),
  deepResponseLog: document.querySelector("#deepResponseLog"),
  longformClock: document.querySelector("#longformClock"),
  longformTranscript: document.querySelector("#longformTranscript"),
  longformPolicyLevel: document.querySelector("#longformPolicyLevel"),
  longformEventTime: document.querySelector("#longformEventTime"),
  longformInterpretation: document.querySelector("#longformInterpretation"),
  longformPolicyText: document.querySelector("#longformPolicyText"),
  longformResponse: document.querySelector("#longformResponse"),
  longformAudioStatus: document.querySelector("#longformAudioStatus"),
  longformTimeline: document.querySelector("#longformTimeline"),
  microResponseCard: document.querySelector("#microResponseCard"),
  withdrawalCard: document.querySelector("#withdrawalCard"),
  deepMetricOneValue: document.querySelector("#deepMetricOneValue"),
  deepMetricOneLabel: document.querySelector("#deepMetricOneLabel"),
  deepMetricOneBar: document.querySelector("#deepMetricOneBar"),
  deepMetricTwoValue: document.querySelector("#deepMetricTwoValue"),
  deepMetricTwoLabel: document.querySelector("#deepMetricTwoLabel"),
  deepMetricTwoBar: document.querySelector("#deepMetricTwoBar"),
  deepMetricThreeValue: document.querySelector("#deepMetricThreeValue"),
  deepMetricThreeLabel: document.querySelector("#deepMetricThreeLabel"),
  deepMetricThreeBar: document.querySelector("#deepMetricThreeBar"),
  deepAffectDot: document.querySelector("#deepAffectDot"),
  deepAffectReading: document.querySelector("#deepAffectReading"),
  deepChipRow: document.querySelector("#deepChipRow"),
  deepAnalysisBox: document.querySelector("#deepAnalysisBox"),
};

let activeAudio = null;
let recordedAudioUrl = null;
let mediaRecorder = null;
let recordingStartedAt = 0;
let recordingTimer = null;
let cameraStream = null;
const audioUrlCache = new Map();
let activeAudioButton = null;
let activeAudioWaveform = null;
let liveRunToken = 0;
let liveMomentAudio = null;
let liveMomentAudioUrl = null;
let liveMomentRunning = false;
let liveMomentPaused = false;
const liveAudioCache = new Map();
const interjectionAudioCache = new Map();
let interjectionAudio = null;
let interjectionQueued = false;
const longformAudioCache = new Map();
let longformHumanAudio = null;
let longformAttuneAudio = null;
let longformRunning = false;
let longformPaused = false;
let longformHumanYielded = false;
let longformRunToken = 0;
let longformAudioContext = null;
const shapedLongformAudio = new WeakSet();
let deepDemoRunToken = 0;
let deepDemoRunning = false;
let deepDemoPaused = false;
let deepDemoAudio = null;
let deepDemoOverlayAudio = null;
const deepDemoAudioCache = new Map();
const deepDemoWordCache = new Map();
const localAudioLibrary = new Map(
  Object.entries({
    "human|focused|I've tried five things. It still doesn't work. What is wrong with this shape mismatch?":
      "audio/73a8ad1e3140a5703c05a680ee6ec4ce40163077ccee21028c12e5a4329f07a7.mp3",
    "aware|focused|The mismatch is at the loss boundary: logits are [32, 1] , targets are [32] . Use targets = targets.unsqueeze(1) or return flat logits. I prefer flat logits here because the extra singleton dimension carries no information.":
      "audio/d8f8abf7e878655079dfb4ec09d77cbf8e698ab29301065e73139b6d23d6e707.mp3",
    "human|confused|I've tried five things. It still doesn't work. What is wrong with this shape mismatch?":
      "audio/0072d651cf9982137be1393bf80b3a6e202c9dc9a6925fac1fdcdbd57f8a116d.mp3",
    "aware|confused|Let’s make the error concrete. The model returns a column of 32 values, but the labels are a simple list of 32 values. They contain the same amount of data, but their shapes are written differently. First check: print logits.shape and targets.shape directly before the loss call.":
      "audio/34b3f1b12c7fbaa0758f1820680983f1a6b12804c92696bb4cd6ac87a96a46e8.mp3",
    "human|overloaded|I've tried five things. It still doesn't work. What is wrong with this shape mismatch?":
      "audio/a18abce4f70b8da4d885bee90bfda92265a7cb2ced03d10d7a00387560b4f497.mp3",
    "aware|overloaded|Let’s not branch into five possibilities. The error is coming from one place: your logits are [32, 1], while targets are [32]. Change the loss line to use logits.squeeze(-1) . Run that first. We can inspect the broader pipeline only if it still fails.":
      "audio/8e89bd6ec598947176c7913ce0edbad585e3896d236fcf884bb4d6c767379f47.mp3",
    "human|low|I've tried five things. It still doesn't work. What is wrong with this shape mismatch?":
      "audio/082d834282bb4d23ed18a088c9e5e8f5f218967e603bd1f2dff90829097abbe4.mp3",
    "aware|low|This is a small mismatch, not a broken model. When you have the energy, make just this change: logits = logits.squeeze(-1) . Then stop there and run it once.":
      "audio/74c3ee8e05658c7f6fa96750b89003bebcae4dadbe8f520a67b9d33392544711.mp3",
    "standard|overloaded|A shape mismatch can have several causes. You should check: The input and expected tensor dimensions. Batch dimension ordering and broadcasting behavior. Whether a reshape, squeeze, or transpose was applied incorrectly. The model's output layer and loss function expectations. Data loader collation and padding. Try printing the shape after every operation to identify where the dimensions diverge.":
      "audio/33ba359d342ca8722982a8fd83d7ac6546f019c3cf1ff977e90ffac9236583fa.mp3",
    "human|focused|I keep getting lost with gradient descent. Can you explain it one more time?":
      "audio/609aee745f7e698cc05ee9601235eb77d7ef69c94eeac685ba9f5ee8371867ca.mp3",
    "aware|focused|Skip the analogy. Here is the key test: if the learning rate doubles, when does convergence improve and when does it become unstable? Your answer should connect local curvature to step size. Take a shot, and I’ll challenge the weak point.":
      "audio/4abcf8b3c7dd7f259d7f93daca8912e350c89ff5c57e0fd5003e00464854b52a.mp3",
    "human|confused|I keep getting lost with gradient descent. Can you explain it one more time?":
      "audio/432cc7519f84b63eda7d1ef63a87dcc4b825fc73e96d764608779896aa103afb.mp3",
    "aware|confused|One idea only: imagine standing on a foggy hill. You cannot see the bottom, but you can feel which way the ground slopes under your feet. Gradient descent means taking one small step downhill, checking the slope again, then repeating. Before we move on: what tells you which direction is downhill?":
      "audio/b750376b85726fa4e22cfc7905bf6e6902dd040c992f0b97e432c484cb07b0a1.mp3",
    "human|overloaded|I keep getting lost with gradient descent. Can you explain it one more time?":
      "audio/fe66caf1946baa198b54f2284cecc2a715ccfc5f85777824a0b2e8e98b013b7b.mp3",
    "aware|overloaded|Let’s strip away the notation. Remember only this: Check the slope. Take one small downhill step. Repeat. That is gradient descent. We can leave learning rates and derivatives for the next pass.":
      "audio/db3e605ff8208bc2675c0bfff69bf220ff04a57455aec44b5d80369d7c1a25e6.mp3",
    "human|low|I keep getting lost with gradient descent. Can you explain it one more time?":
      "audio/c7c62d6308dcbbeed06eeba60dff5739b362a67588e122cc7dbe9eaa8baa14e0.mp3",
    "aware|low|We can leave the equation alone today. Keep one quiet picture in mind: a ball settling toward the bottom of a bowl. The slope tells it where to move next. That is enough.":
      "audio/ccbb25a698ed28c320e647e07089e8bc184ccdeebe0dfa2d9e5f6ea734bd3406.mp3",
    "standard|overloaded|Gradient descent is an optimization algorithm used to minimize a loss function. It works by calculating the gradient, which is the vector of partial derivatives, and updating parameters in the opposite direction. The update rule is θ = θ − α∇J(θ), where α is the learning rate. Common variants include batch, stochastic, and mini-batch gradient descent.":
      "audio/d5db9d36ffec7a97b7ba32984c12af4b695442d8b8a32bfe7a18eb5f9bb76669.mp3",
    "human|focused|So I think recursion is when a function calls another function many times, and it keeps looping until the computer stops it. Basically recursion is just a kind of loop, right? And it should always be faster because it breaks the problem into smaller parts. So I would probably use recursion whenever performance matters.":
      "audio/b859bef5affbf81885abce2da1801691ec2d647126f86ddb0367d4796b6bc27e.mp3",
    "human|overloaded|The error is annoying. I've been stuck on it for too long. I think I'll just remove this validation check because it blocks the request. Then the function should work and I can move on to the rest of the pipeline. I can always add the validation back later.":
      "audio/67e63098305bba85c717b6c322fe7457cd7ec06c4283f8cd7fbfde245d07b0a0.mp3",
    "aware|focused|Oh, okay, I need to interject here for one small correction. Recursion is not always faster than a loop. The key idea is that a function calls itself on a smaller version of the problem.":
      "audio/537f96dd731a7c424b1c5fdc782fa8d46476ebca8217feb5f18eb7eab2f02956.mp3",
    "aware|overloaded|Okay, I need to interject here before you make that change. Removing the validation may hide the error, but it can create a larger security or data-quality bug. Keep the check and inspect the input immediately before it.":
      "audio/f754c2ec21d6605f0a38871f32a60f9c0fbdde3bf123bd15d94bdaea6558d01f.mp3",
    "human|confused|The label says take two tablets twice daily, so if the pain continues I'll take two every couple of hours. That should keep the pain under control until I can speak with someone tomorrow.":
      "audio/594039641f69e2d3c2727f6a9dfaaeadf6ad70ad9f7b7c030bf3a985ba32ebb3.mp3",
    "aware|confused|Pause before taking more. Twice daily usually means two times in a day, not every couple of hours. Please follow the label or confirm with a pharmacist or clinician.":
      "audio/b8c32bf701cff5b85c1186cd2885a99ca17a51c16feb7ac568a50347ff0d82df.mp3",
    "human|longform|So supervised learning is when the model has, um... what is the word... Yes, labels. So it has the labels, and then unsupervised learning is when it has no labels and it just... kind of finds patterns by itself. So I guess that means unsupervised learning is always more intelligent, because nobody tells it the answers. Okay. Right, so it is not really about one being smarter. It is more about what information is available. And clustering would be unsupervised because... because it groups similar things without knowing the categories beforehand? Okay, can you give me a simple example of both?":
      "audio/894aabd69657017519ef03de3ed0e8700fe42c23d7ff00d488f37139855b47c2.mp3",
    "aware|longform|Labels?":
      "audio/7247f9a8f3543f06a7f91b998f9b954ea7abf432dbf932f527a59f0d0518d995.mp3",
    "aware|longform|Mm-hmm.":
      "audio/17011daf6a82970b8d46e6a2e2a4c57b2f011dabb924209158d8e18b7ce23244.mp3",
    "aware|longform|Small correction there.":
      "audio/d0a4cd5d0c16e433e763f325e3d342ada3b9e121fcbd1eee681e4b9beed894b0.mp3",
    "aware|longform|Unsupervised learning is not necessarily more intelligent. It solves a different kind of problem. It looks for structure without labeled answers, while supervised learning learns a mapping from labeled examples.":
      "audio/b89baf889175f899f9f65d226e2db2b51329d2f71eca9e23db4bf0e79bd43707.mp3",
    "aware|longform|Exactly.":
      "audio/c3208c85fb8d6b9146781a78f833574d1359e50c897d8ad1c9a43ee29c478834.mp3",
    "aware|longform|Right.":
      "audio/fcadff58b8863f7cd86be58e7136ee7c6329b5e7ec819fb72f1346a3501ba8dd.mp3",
    "aware|longform|Supervised learning would be showing a model emails labeled spam or not spam, so it can classify new emails. Unsupervised learning would be giving it a collection of customer behavior data with no categories and asking it to discover natural groups.":
      "audio/47b0ffac4c1dc3d344e08c5c6da3203a231043161a962bfb4475c6df7010f05d.mp3",
  }),
);
const affectProfiles = {
  focused: { x: 78, y: 28, label: "Positive · high engagement" },
  confused: { x: 44, y: 42, label: "Searching · moderate arousal" },
  overloaded: { x: 28, y: 34, label: "Strained · high arousal" },
  low: { x: 40, y: 78, label: "Low energy · low arousal" },
  listening: { x: 50, y: 50, label: "Neutral · listening" },
};

const deepStateLibrary = {
  g_s1: {
    load: [42, "Thought forming"],
    engagement: [86, "Engaged and searching"],
    confidence: [34, "Too early to intervene"],
    affect: { x: 44, y: 34, label: "Uncertain · high effort" },
    chips: ["intent: explain aloud", "mood: hesitant", "behavior: active retrieval"],
    analysis:
      "The learner is still building the concept. The right move is to stay with the thread and keep the floor open.",
  },
  g_int1: {
    load: [38, "Supportive moment"],
    engagement: [91, "Thread intact"],
    confidence: [62, "Micro-grounding ready"],
    affect: { x: 56, y: 38, label: "Warm support · steady arousal" },
    chips: ["intent: keep momentum", "mood: encouraging", "behavior: backchannel"],
    analysis:
      "A short cue helps the learner hold onto the idea without replacing their explanation.",
  },
  g_s1b: {
    load: [46, "Testing the idea"],
    engagement: [89, "Still engaged"],
    confidence: [53, "Clarify if needed"],
    affect: { x: 50, y: 36, label: "Curious probe · elevated effort" },
    chips: ["intent: verify meaning", "mood: curious", "behavior: concept check"],
    analysis:
      "The learner is probing the concept aloud. Keep the explanation lightweight and tied to their wording.",
  },
  g_a1: {
    load: [36, "Repairing gently"],
    engagement: [88, "Shared thread"],
    confidence: [77, "Clarification justified"],
    affect: { x: 58, y: 38, label: "Helpful correction · steady" },
    chips: ["intent: clarify", "mood: calm", "behavior: brief teach-back"],
    analysis:
      "Attune gives the minimum clarification, then immediately checks understanding instead of taking over.",
  },
  g_s2: {
    load: [32, "Meaning recovered"],
    engagement: [92, "Concept coming together"],
    confidence: [58, "Confirm and return"],
    affect: { x: 60, y: 42, label: "Recovery · moderate arousal" },
    chips: ["intent: confirm", "mood: relieved", "behavior: self-repair"],
    analysis:
      "The learner has found the right abstraction. This is the moment for a clean confirmation, not a lecture.",
  },
  g_a2: {
    load: [30, "Grounding complete"],
    engagement: [90, "Learner active"],
    confidence: [81, "Safe to extend one step"],
    affect: { x: 65, y: 43, label: "Grounded · steady focus" },
    chips: ["intent: deepen", "mood: confident", "behavior: confirm + hand back"],
    analysis:
      "The concept is now grounded enough for one precise extension while keeping the learner in control.",
  },
  g_s3: {
    load: [27, "Chain completing"],
    engagement: [93, "Learner driving"],
    confidence: [68, "Stay light"],
    affect: { x: 67, y: 40, label: "Building confidence · moderate arousal" },
    chips: ["intent: connect terms", "mood: stabilizing", "behavior: productive continuation"],
    analysis:
      "The user is finishing the chain alone. Attune should mostly stay out of the way here.",
  },
  g_a3: {
    load: [29, "Diagnostic check"],
    engagement: [91, "Still collaborative"],
    confidence: [83, "Question is targeted"],
    affect: { x: 63, y: 40, label: "Grounded checkback" },
    chips: ["intent: verify grounding", "mood: focused", "behavior: precise check"],
    analysis:
      "A short checkback verifies real understanding without changing the learner-centered rhythm.",
  },
  g_s4: {
    load: [18, "Insight landed"],
    engagement: [95, "Self-repair succeeded"],
    confidence: [74, "No interruption needed"],
    affect: { x: 77, y: 46, label: "Positive resolution · energized" },
    chips: ["intent: claim understanding", "mood: relieved", "behavior: self-correction"],
    analysis:
      "The learner repaired the idea in their own words. The best move is to let that click land.",
  },
  g_a4: {
    load: [24, "Ready to advance"],
    engagement: [93, "Momentum preserved"],
    confidence: [86, "Advance one concept"],
    affect: { x: 72, y: 42, label: "Stable confidence · moderate arousal" },
    chips: ["intent: continue learning", "mood: upbeat", "behavior: next-step prompt"],
    analysis:
      "Once the concept is stable, Attune advances with one sharp next question instead of a big explanation dump.",
  },
  c_s1: {
    load: [61, "Concrete friction"],
    engagement: [83, "Seeking a fix"],
    confidence: [49, "Need the exact mismatch"],
    affect: { x: 40, y: 31, label: "Frustrated but focused" },
    chips: ["intent: debug aloud", "mood: strained", "behavior: localizing error"],
    analysis:
      "The developer is already close to the error surface. Listen for the exact mismatch before expanding the search space.",
  },
  c_int1: {
    load: [35, "Minimal repair available"],
    engagement: [88, "Fast path open"],
    confidence: [90, "High-confidence fix"],
    affect: { x: 56, y: 38, label: "Direct repair · low drama" },
    chips: ["intent: unblock quickly", "mood: steady", "behavior: one-line fix"],
    analysis:
      "The fix is local and safe, so Attune answers with one line instead of a menu of possibilities.",
  },
  c_s1b: {
    load: [39, "Healthy skepticism"],
    engagement: [91, "Still reasoning"],
    confidence: [63, "Explain narrowly"],
    affect: { x: 52, y: 39, label: "Concern check · collaborative" },
    chips: ["intent: stress test fix", "mood: cautious", "behavior: sanity check"],
    analysis:
      "This is a good hesitation. The user is checking whether the fix generalizes, so the answer should stay tight and specific.",
  },
  c_a1_resume: {
    load: [28, "Concern resolved"],
    engagement: [90, "Flow preserved"],
    confidence: [82, "Return to user"],
    affect: { x: 63, y: 39, label: "Reassuring correction" },
    chips: ["intent: reassure", "mood: warm", "behavior: direct explanation"],
    analysis:
      "Attune answers the exact concern and stops there, which keeps the debugging rhythm natural.",
  },
  c_s2: {
    load: [57, "New failure mode"],
    engagement: [85, "Still working"],
    confidence: [56, "Track the shift"],
    affect: { x: 43, y: 34, label: "Renewed friction · alert" },
    chips: ["intent: continue debugging", "mood: slightly strained", "behavior: state shift"],
    analysis:
      "The original mismatch is fixed. The model should now follow the new symptom rather than repeating old advice.",
  },
  c_a2_partial: {
    load: [48, "Tentative diagnosis"],
    engagement: [87, "Interruptible"],
    confidence: [66, "Prepared, not committed"],
    affect: { x: 49, y: 37, label: "Working hypothesis" },
    chips: ["intent: propose likely cause", "mood: cautious", "behavior: intervention prepared"],
    analysis:
      "Attune starts a likely explanation but stays lightweight enough to be interrupted if the user self-repairs.",
  },
  c_s2_interrupt: {
    load: [22, "Self-repair detected"],
    engagement: [95, "User solved it"],
    confidence: [88, "Withdraw intervention"],
    affect: { x: 74, y: 45, label: "Relief · successful repair" },
    chips: ["intent: confirm fix", "mood: relieved", "behavior: self-repair"],
    analysis:
      "This is the subtle win: the model was ready to intervene, then backs off because the user fixed it themselves.",
  },
  c_a2_resume: {
    load: [24, "Close the loop"],
    engagement: [92, "Control returned"],
    confidence: [84, "Short confirmation only"],
    affect: { x: 68, y: 41, label: "Grounded closure" },
    chips: ["intent: confirm", "mood: steady", "behavior: concise follow-through"],
    analysis:
      "A brief confirmation is enough now because the user already located the real cause.",
  },
};

function wait(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function localAudioKey(role, state, text) {
  return `${role}|${state}|${text}`;
}

function resolveLocalAudio(role, state, text) {
  return localAudioLibrary.get(localAudioKey(role, state, text)) || null;
}

function resolveDeepDemoClip(clipId) {
  return clipId ? `audio/${clipId}.mp3` : null;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function setAffectMarker(dot, reading, profile) {
  if (!dot || !reading || !profile) return;
  dot.style.left = `${profile.x}%`;
  dot.style.top = `${profile.y}%`;
  reading.textContent = profile.label;
}

function renderPrimaryAffect(stateKey) {
  const state = states[stateKey];
  const profile = affectProfiles[stateKey] || affectProfiles.listening;
  setAffectMarker(elements.mainAffectDot, elements.mainAffectReading, profile);
  elements.mainSignalOne.textContent = `${clamp(
    Math.round(state.metrics[0][2] * 0.92 + 6),
    0,
    99,
  )}%`;
  elements.mainSignalTwo.textContent = `${clamp(
    Math.round(state.metrics[1][2] * 0.9 + 4),
    0,
    99,
  )}%`;
  elements.mainSignalThree.textContent = `${clamp(
    Math.round(state.metrics[2][2] * 0.96 + 2),
    0,
    99,
  )}%`;
}

function renderLiveAffect([state, load, affect, confidence, stateValue, loadValue, affectValue]) {
  const x = clamp(Math.round(50 + (confidence - loadValue) * 0.45), 14, 86);
  const arousal = clamp(Math.round(20 + affectValue * 0.68), 14, 88);
  const y = 100 - arousal;
  setAffectMarker(elements.liveAffectDot, elements.liveAffectReading, {
    x,
    y,
    label: `${affect} · ${state.toLowerCase()}`,
  });
  elements.liveSignalProsody.textContent = `${clamp(
    Math.round(loadValue * 0.72 + affectValue * 0.18),
    0,
    99,
  )}%`;
  elements.liveSignalEngagement.textContent = `${clamp(
    Math.round(stateValue * 0.6 + confidence * 0.22),
    0,
    99,
  )}%`;
  elements.liveSignalPressure.textContent = `${clamp(
    Math.round(loadValue * 0.52 + (100 - stateValue) * 0.28 + confidence * 0.12),
    0,
    99,
  )}%`;
}

function renderDeepState(frame) {
  if (!frame) return;
  const metrics = [
    [elements.deepMetricOneValue, elements.deepMetricOneLabel, elements.deepMetricOneBar, frame.load],
    [
      elements.deepMetricTwoValue,
      elements.deepMetricTwoLabel,
      elements.deepMetricTwoBar,
      frame.engagement,
    ],
    [
      elements.deepMetricThreeValue,
      elements.deepMetricThreeLabel,
      elements.deepMetricThreeBar,
      frame.confidence,
    ],
  ];
  metrics.forEach(([valueEl, labelEl, barEl, data]) => {
    if (!data) return;
    valueEl.textContent = `${Math.round(data[0])}%`;
    labelEl.textContent = data[1];
    barEl.style.width = `${Math.round(data[0])}%`;
  });
  setAffectMarker(elements.deepAffectDot, elements.deepAffectReading, frame.affect);
  elements.deepChipRow.innerHTML = (frame.chips || [])
    .map((chip) => `<span>${chip}</span>`)
    .join("");
  elements.deepAnalysisBox.textContent = frame.analysis || "";
}

function interpolateMetric(startValue, endValue, progress) {
  return Math.round(startValue + (endValue - startValue) * progress);
}

function deepFrameForStep(step, progress = 1) {
  const timeline = deepDemos[activeDeepDemo]?.timeline || [];
  const stepIndex = timeline.indexOf(step);
  const previousClipId =
    step.previousClipId ||
    [...timeline.slice(0, Math.max(stepIndex, 0))]
      .reverse()
      .find((candidate) => candidate.clipId)?.clipId;
  const endFrame = deepStateLibrary[step.clipId] || deepStateLibrary[previousClipId] || null;
  if (!endFrame) return null;
  const startFrame = previousClipId ? deepStateLibrary[previousClipId] || endFrame : endFrame;
  const mixMetric = (key) => {
    const startMetric = startFrame[key] || endFrame[key];
    const endMetric = endFrame[key];
    return [
      interpolateMetric(startMetric[0], endMetric[0], progress),
      progress < 0.55 ? startMetric[1] : endMetric[1],
    ];
  };
  return {
    load: mixMetric("load"),
    engagement: mixMetric("engagement"),
    confidence: mixMetric("confidence"),
    affect: {
      x: interpolateMetric(startFrame.affect.x, endFrame.affect.x, progress),
      y: interpolateMetric(startFrame.affect.y, endFrame.affect.y, progress),
      label: progress < 0.55 ? startFrame.affect.label : endFrame.affect.label,
    },
    chips: progress < 0.55 ? startFrame.chips : endFrame.chips,
    analysis: progress < 0.55 ? startFrame.analysis : endFrame.analysis,
  };
}

async function fetchDeepDemoWords(step) {
  if (!step?.clipId) return [];
  if (deepDemoWordCache.has(step.clipId)) return deepDemoWordCache.get(step.clipId);
  const request = fetch(`audio/${step.clipId}.words.json`)
    .then((response) => {
      if (!response.ok) throw new Error("Word timing unavailable");
      return response.json();
    })
    .catch((error) => {
      deepDemoWordCache.delete(step.clipId);
      throw error;
    });
  deepDemoWordCache.set(step.clipId, request);
  return request;
}

function renderWordSequence(words, visibleCount, showCursor = false) {
  const safeWords = words || [];
  return safeWords
    .map((word, index) => {
      const visible = index < visibleCount ? " visible" : "";
      const cursor = showCursor && index === visibleCount - 1 ? '<span class="live-cursor"></span>' : "";
      return `<span class="word-fragment${visible}">${word}${cursor}</span>`;
    })
    .join(" ");
}

function wordsFromStep(step) {
  return step.transcript
    .replace(/[“”]/g, "")
    .replace(/[`]/g, "")
    .split(/\s+/)
    .filter(Boolean);
}

function renderDeepDemoColumns(currentIndex, activeWordCount = null) {
  const demo = deepDemos[activeDeepDemo];
  const currentStep = demo.timeline[currentIndex];
  const userSteps = [];
  const attuneSteps = [];

  demo.timeline.forEach((step, index) => {
    if (index > currentIndex) return;
    const isCurrent = index === currentIndex && activeWordCount != null;
    const words = step._words || wordsFromStep(step);
    const body = isCurrent
      ? renderWordSequence(words, activeWordCount, true)
      : step.transcript;
    const markup = `<p class="${step.speaker === "user" ? "speaker-human" : "speaker-attune"}${
      isCurrent ? " active-entry" : ""
    }"><b>${step.speaker === "user" ? "User" : "Attune"}</b>${body}</p>`;
    if (step.speaker === "user") {
      userSteps.push(markup);
    } else {
      attuneSteps.push(markup);
    }
  });

  elements.longformTranscript.innerHTML =
    userSteps.join("") || '<p class="empty-transcript">Run the example to watch speech appear live.</p>';
  elements.deepResponseLog.innerHTML =
    attuneSteps.join("") ||
    '<p class="empty-transcript">Machine cues and replies appear here as the example unfolds.</p>';
  elements.longformTranscript.scrollTop = elements.longformTranscript.scrollHeight;
  elements.deepResponseLog.scrollTop = elements.deepResponseLog.scrollHeight;
}

function formatLongformTime(seconds) {
  const safeSeconds = Math.max(0, Math.round(seconds));
  return `${String(Math.floor(safeSeconds / 60)).padStart(2, "0")}:${String(
    safeSeconds % 60,
  ).padStart(2, "0")}`;
}

async function fetchLongformAudio(key) {
  if (longformAudioCache.has(key)) return longformAudioCache.get(key);
  const isHuman = key === "human";
  const text = isHuman ? longformDemo.humanText : longformDemo.clips[key];
  const localPath = resolveLocalAudio(isHuman ? "human" : "aware", "longform", text);
  if (localPath) {
    longformAudioCache.set(key, localPath);
    return localPath;
  }
  const request = fetch("/api/speech", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      role: isHuman ? "human" : "aware",
      state: "longform",
      text,
    }),
  })
    .then((response) => {
      if (!response.ok) throw new Error("Long-form voice unavailable");
      return response.blob();
    })
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      longformAudioCache.set(key, url);
      return url;
    })
    .catch((error) => {
      longformAudioCache.delete(key);
      throw error;
    });
  longformAudioCache.set(key, request);
  return request;
}

async function shapeLongformAudio(audio, profile) {
  if (!window.AudioContext || shapedLongformAudio.has(audio)) return;
  try {
    if (!longformAudioContext) {
      longformAudioContext = new window.AudioContext();
    }
    if (longformAudioContext.state === "suspended") {
      longformAudioContext.resume().catch(() => {});
    }
    const source = longformAudioContext.createMediaElementSource(audio);
    const lowShelf = longformAudioContext.createBiquadFilter();
    lowShelf.type = "lowshelf";
    const highShelf = longformAudioContext.createBiquadFilter();
    highShelf.type = "highshelf";
    const compressor = longformAudioContext.createDynamicsCompressor();
    compressor.threshold.value = -22;
    compressor.knee.value = 18;
    compressor.ratio.value = 2.2;
    compressor.attack.value = 0.01;
    compressor.release.value = 0.18;
    const pan = longformAudioContext.createStereoPanner();
    const gain = longformAudioContext.createGain();

    if (profile === "human") {
      lowShelf.frequency.value = 190;
      lowShelf.gain.value = 4.8;
      highShelf.frequency.value = 2600;
      highShelf.gain.value = -5.4;
      pan.pan.value = -0.12;
      gain.gain.value = 1.04;
    } else {
      lowShelf.frequency.value = 210;
      lowShelf.gain.value = -3.6;
      highShelf.frequency.value = 2500;
      highShelf.gain.value = 4.6;
      pan.pan.value = 0.16;
      gain.gain.value = 0.98;
    }

    source.connect(lowShelf);
    lowShelf.connect(highShelf);
    highShelf.connect(compressor);
    compressor.connect(pan);
    pan.connect(gain);
    gain.connect(longformAudioContext.destination);
    shapedLongformAudio.add(audio);
  } catch {
    // Fall back to native playback if the browser refuses Web Audio routing.
  }
}

function prefetchLongformAudio() {
  ["human", ...Object.keys(longformDemo.clips)].forEach((key) => {
    fetchLongformAudio(key).catch(() => {});
  });
}

function renderLongformEvent(index, rebuildTranscript = false) {
  const event = longformDemo.events[index];
  if (!event) return;
  const demo = document.querySelector("#longformDemo");
  const progress = `${Math.round((event.at / longformDemo.duration) * 100)}%`;
  demo.style.setProperty("--stream-progress", progress);
  demo.dataset.currentEvent = String(index);

  document.querySelectorAll(".timeline-event").forEach((item) => {
    const itemIndex = Number(item.dataset.event);
    item.classList.toggle("revealed", itemIndex <= index);
    item.classList.toggle("active", itemIndex === index);
    item.classList.toggle("complete", itemIndex < index);
  });
  document.querySelectorAll(".stream-marker").forEach((marker) => {
    const markerIndex = Number(marker.dataset.event);
    marker.classList.toggle("revealed", markerIndex <= index);
    marker.classList.toggle("active", markerIndex === index);
    marker.classList.toggle("complete", markerIndex < index);
  });

  elements.longformPolicyLevel.textContent = event.policy;
  elements.longformEventTime.textContent = event.time;
  elements.longformInterpretation.textContent = event.interpretation;
  elements.longformPolicyText.textContent = event.policyText;
  elements.longformResponse.textContent = event.response;
  elements.microResponseCard.classList.toggle(
    "speaking",
    Boolean(event.clip || event.longClip),
  );

  if (event.prepared) {
    elements.withdrawalCard.className = "withdrawal-card prepared";
    elements.withdrawalCard.innerHTML = `<span>INTERVENTION PREPARED</span><strong>${
      event.preparedText || "Waiting to see whether the learner self-repairs."
    }</strong>`;
  } else if (event.delivered) {
    elements.withdrawalCard.className = "withdrawal-card delivered";
    elements.withdrawalCard.innerHTML =
      "<span>REPAIR DELIVERED</span><strong>Misconception corrected. Control returns to the learner.</strong>";
  } else if (event.withdrawn) {
    elements.withdrawalCard.className = "withdrawal-card withdrawn";
    elements.withdrawalCard.innerHTML =
      "<span>INTERVENTION WITHDRAWN</span><strong>User self-repaired. Attune stays out of the way.</strong>";
  } else if (index < 4) {
    elements.withdrawalCard.className = "withdrawal-card";
  }

  if (rebuildTranscript) {
    elements.longformTranscript.innerHTML = longformDemo.events
      .slice(0, index + 1)
      .map((item) => item.transcript)
      .join("");
  } else if (event.transcript) {
    elements.longformTranscript.insertAdjacentHTML("beforeend", event.transcript);
  }
  elements.longformTranscript.scrollTop = elements.longformTranscript.scrollHeight;
}

async function playLongformClip(
  key,
  { waitForEnd = true, volume = 0.92 } = {},
) {
  if (!key) return;
  const source = await fetchLongformAudio(key);
  if (longformAttuneAudio) {
    longformAttuneAudio.pause();
    longformAttuneAudio = null;
  }
  const attuneAudio = new Audio(source);
  attuneAudio.preload = "auto";
  attuneAudio.volume = volume;
  longformAttuneAudio = attuneAudio;
  await shapeLongformAudio(attuneAudio, "attune");
  elements.longformAudioStatus.textContent = waitForEnd
    ? "Attune speaking"
    : "Human speaking · Attune backchanneling";
  document.querySelector("#longformDemo").classList.add("attune-speaking");

  const finishPlayback = () => {
    if (longformAttuneAudio === attuneAudio) {
      longformAttuneAudio = null;
    }
    document.querySelector("#longformDemo").classList.remove("attune-speaking");
    elements.longformAudioStatus.textContent = longformHumanYielded
      ? "Attune speaking · human yielded"
      : "Human speaking · Attune listening";
  };

  attuneAudio.addEventListener("ended", finishPlayback, { once: true });
  attuneAudio.addEventListener("error", finishPlayback, { once: true });

  const playResult = attuneAudio.play().catch(() => {
    finishPlayback();
  });
  if (!waitForEnd) {
    await playResult;
    return;
  }
  await new Promise((resolve) => {
    const settle = () => resolve();
    attuneAudio.addEventListener("ended", settle, { once: true });
    attuneAudio.addEventListener("error", settle, { once: true });
    playResult.catch(settle);
  });
}

async function handleLongformEvent(index, token) {
  const event = longformDemo.events[index];
  renderLongformEvent(index);
  if (!event.clip && !event.longClip) return;

  if (event.pauseHuman && longformHumanAudio) {
    longformHumanAudio.pause();
    longformHumanYielded = true;
    document.querySelector("#longformDemo").classList.add("human-yielded");
  }
  if (event.clip) {
    await playLongformClip(event.clip, {
      waitForEnd: !event.overlapHuman,
      volume: event.volume ?? (event.overlapHuman ? 0.5 : 0.92),
    });
  }
  if (event.longClip && token === longformRunToken) {
    if (event.clip) await wait(350);
    await playLongformClip(event.longClip, { volume: 0.94 });
  }
  if (event.resumeAt != null && longformHumanAudio) {
    longformHumanAudio.currentTime = event.resumeAt;
  }
  if (
    event.pauseHuman &&
    index !== longformDemo.events.length - 1 &&
    token === longformRunToken &&
    !longformPaused
  ) {
    document.querySelector("#longformDemo").classList.remove("human-yielded");
    longformHumanYielded = false;
    await longformHumanAudio?.play().catch(() => {});
  }
}

async function runLongformConversation() {
  const demo = document.querySelector("#longformDemo");
  if (longformRunning) {
    longformPaused = !longformPaused;
    if (longformPaused) {
      longformHumanAudio?.pause();
      longformAttuneAudio?.pause();
      elements.runLongformButton.innerHTML = "<i>▶</i> Resume conversation";
      demo.classList.add("paused");
    } else {
      try {
        if (longformHumanYielded && longformAttuneAudio) {
          await longformAttuneAudio.play();
        } else if (!longformHumanYielded) {
          await longformHumanAudio?.play();
        }
        elements.longformAudioStatus.textContent =
          longformHumanYielded
            ? "Attune speaking · human yielded"
            : "Human speaking · Attune listening";
        elements.runLongformButton.innerHTML = "<i>Ⅱ</i> Pause conversation";
        demo.classList.remove("paused");
      } catch {
        longformPaused = true;
        elements.longformAudioStatus.textContent =
          "Audio is ready · click Resume with audio";
        elements.runLongformButton.innerHTML = "<i>▶</i> Resume with audio";
        demo.classList.add("paused");
      }
    }
    return;
  }

  longformRunToken += 1;
  const token = longformRunToken;
  longformRunning = true;
  longformPaused = false;
  longformHumanYielded = false;
  demo.className = "longform-demo running";
  demo.style.setProperty("--stream-progress", "0%");
  elements.longformTranscript.innerHTML = "";
  elements.longformClock.textContent = "00:00";
  elements.longformAudioStatus.textContent = "Loading continuous voice…";
  elements.runLongformButton.innerHTML = "<i>Ⅱ</i> Pause conversation";
  elements.withdrawalCard.className = "withdrawal-card";
  renderLongformEvent(0);

  try {
    const source = await fetchLongformAudio("human");
    longformHumanAudio = new Audio(source);
    longformHumanAudio.preload = "auto";
    await shapeLongformAudio(longformHumanAudio, "human");
    await new Promise((resolve) => {
      if (Number.isFinite(longformHumanAudio.duration)) return resolve();
      longformHumanAudio.addEventListener("loadedmetadata", resolve, { once: true });
      longformHumanAudio.addEventListener("error", resolve, { once: true });
    });
    await longformHumanAudio.play();
    elements.longformAudioStatus.textContent = "Human speaking · Attune listening";
  } catch (error) {
    if (error.name === "NotAllowedError" && longformHumanAudio) {
      longformPaused = true;
      demo.classList.add("paused");
      elements.runLongformButton.innerHTML = "<i>▶</i> Resume with audio";
      elements.longformAudioStatus.textContent = "Audio ready";
    } else {
      elements.longformAudioStatus.textContent = error.message;
    }
  }

  const duration =
    longformHumanAudio && Number.isFinite(longformHumanAudio.duration)
      ? longformHumanAudio.duration
      : 70;
  document.querySelectorAll(".timeline-event").forEach((item, index) => {
    const event = longformDemo.events[index];
    item.querySelector("time").textContent = formatLongformTime(event.at);
  });

  let nextEvent = 1;
  while (token === longformRunToken && nextEvent < longformDemo.events.length) {
    while (longformPaused && token === longformRunToken) await wait(100);
    if (token !== longformRunToken) return;
    const currentTime = longformHumanAudio?.currentTime || 0;
    elements.longformClock.textContent = formatLongformTime(currentTime);
    demo.style.setProperty(
      "--stream-progress",
      `${Math.min(100, (currentTime / duration) * 100)}%`,
    );
    const nextLongformEvent = longformDemo.events[nextEvent];
    const eventIsDue = nextLongformEvent.afterHuman
      ? Boolean(longformHumanAudio?.ended)
      : currentTime >= nextLongformEvent.at;
    if (eventIsDue) {
      await handleLongformEvent(nextEvent, token);
      nextEvent += 1;
    } else {
      await wait(100);
    }
  }

  if (token !== longformRunToken) return;
  while (
    longformHumanAudio &&
    !longformHumanAudio.ended &&
    !longformHumanAudio.paused &&
    token === longformRunToken
  ) {
    elements.longformClock.textContent = formatLongformTime(
      longformHumanAudio.currentTime,
    );
    await wait(100);
  }
  elements.longformClock.textContent = formatLongformTime(duration);
  elements.longformAudioStatus.textContent = "Conversation complete";
  elements.runLongformButton.innerHTML = "<i>↻</i> Replay conversation";
  demo.classList.remove("running", "paused", "human-yielded", "attune-speaking");
  demo.classList.add("complete");
  demo.style.setProperty("--stream-progress", "100%");
  longformRunning = false;
  longformPaused = false;
  longformHumanYielded = false;
}

function setPolicies(state) {
  elements.policyChips.innerHTML = states[state].policies
    .map((policy) => `<span class="policy-chip">${policy}</span>`)
    .join("");
}

function renderLongformEvent(index = 0, rebuildTranscript = true) {
  const demo = deepDemos[activeDeepDemo];
  const step = demo.timeline[index] || demo.timeline[0];
  if (elements.deepDemoLabel) elements.deepDemoLabel.textContent = demo.label;
  if (elements.deepDemoSummary) elements.deepDemoSummary.textContent = demo.summary;
  elements.longformClock.textContent = step.time;
  elements.longformPolicyLevel.textContent = step.policy;
  elements.longformEventTime.textContent = step.time;
  elements.longformInterpretation.textContent = step.interpretation;
  elements.longformPolicyText.textContent = step.policyText;
  elements.longformResponse.textContent = step.response;
  elements.longformAudioStatus.textContent = step.status;
  renderDeepState(deepFrameForStep(step, 1));

  if (rebuildTranscript) {
    renderDeepDemoColumns(index);
  }

  elements.longformTimeline.innerHTML = demo.timeline
    .map((item, itemIndex) => {
      const activeClass =
        itemIndex === index ? " active" : itemIndex < index ? " complete" : "";
      const icon = item.speaker === "user" ? "◌" : "✦";
      return `<button class="timeline-event revealed${activeClass}" data-event="${itemIndex}" type="button"><time>${item.time}</time><span><b>${item.interpretation}</b><em>${item.policy}</em></span><i>${icon}</i></button>`;
    })
    .join("");

  elements.microResponseCard.classList.toggle("speaking", step.speaker === "attune");
  elements.withdrawalCard.className =
    step.status.includes("self-repaired")
      ? "withdrawal-card withdrawn"
      : step.speaker === "attune"
        ? "withdrawal-card delivered"
        : "withdrawal-card prepared";
  elements.withdrawalCard.innerHTML = `<span>${step.policy}</span><strong>${step.status}</strong>`;
}

async function runLongformConversation() {
  const demo = deepDemos[activeDeepDemo];
  const shell = document.querySelector("#longformDemo");
  if (deepDemoRunning && deepDemoAudio) {
    deepDemoPaused = !deepDemoPaused;
    if (deepDemoPaused) {
      deepDemoAudio.pause();
      elements.longformAudioStatus.textContent = "Example paused";
      elements.runLongformButton.innerHTML = "<i>▶</i> Resume example";
      shell?.classList.add("paused");
    } else {
      try {
        await deepDemoAudio.play();
        elements.longformAudioStatus.textContent = "Playback resumed";
        elements.runLongformButton.innerHTML = "<i>Ⅱ</i> Pause example";
        shell?.classList.remove("paused");
      } catch {
        elements.longformAudioStatus.textContent = "Audio ready to resume";
      }
    }
    return;
  }

  deepDemoRunToken += 1;
  const token = deepDemoRunToken;
  deepDemoRunning = true;
  deepDemoPaused = false;
  longformRunning = false;
  stopDeepDemoPlayback();
  shell?.classList.remove("complete", "paused");
  shell?.classList.add("running");
  elements.runLongformButton.innerHTML = "<i>Ⅱ</i> Pause example";
  elements.longformTranscript.innerHTML =
    '<p class="empty-transcript">Run the example to watch speech appear live.</p>';
  elements.deepResponseLog.innerHTML =
    '<p class="empty-transcript">Machine cues and replies appear here as the example unfolds.</p>';

  for (let index = 0; index < demo.timeline.length; index += 1) {
    if (token !== deepDemoRunToken) return;
    renderLongformEvent(index, true);
    renderDeepDemoColumns(index, 0);
    try {
      await playDeepDemoStep(demo.timeline[index], index, token);
    } catch (error) {
      elements.longformAudioStatus.textContent = error.message;
      break;
    }
    if (token !== deepDemoRunToken) return;
    await wait(demo.timeline[index].gapAfterMs ?? 220);
  }

  shell?.classList.remove("running", "paused");
  shell?.classList.add("complete");
  elements.longformAudioStatus.textContent = "Example complete";
  elements.runLongformButton.innerHTML = "<i>↻</i> Replay example";
  deepDemoRunning = false;
  deepDemoPaused = false;
}

function plainText(html) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

async function fetchDeepDemoAudio(step, index, demoKey = activeDeepDemo) {
  const cacheKey = `${demoKey}:${index}:${step.speaker}:${step.audioText || step.transcript}`;
  if (deepDemoAudioCache.has(cacheKey)) return deepDemoAudioCache.get(cacheKey);
  const clipSource = resolveDeepDemoClip(step.clipId);
  if (clipSource) {
    deepDemoAudioCache.set(cacheKey, clipSource);
    return clipSource;
  }
  const localPath = resolveLocalAudio(
    step.speaker === "user" ? "human" : "aware",
    "longform",
    step.audioText || step.transcript,
  );
  if (localPath) {
    deepDemoAudioCache.set(cacheKey, localPath);
    return localPath;
  }
  const request = fetch("/api/speech", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      role: step.speaker === "user" ? "human" : "aware",
      state: "longform",
      text: step.audioText || step.transcript,
    }),
  })
    .then((response) => {
      if (!response.ok) throw new Error("Example audio unavailable");
      return response.blob();
    })
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      deepDemoAudioCache.set(cacheKey, url);
      return url;
    })
    .catch((error) => {
      deepDemoAudioCache.delete(cacheKey);
      throw error;
    });
  deepDemoAudioCache.set(cacheKey, request);
  return request;
}

function stopDeepDemoPlayback() {
  stopDeepDemoOverlay();
  if (!deepDemoAudio) return;
  deepDemoAudio.pause();
  deepDemoAudio.currentTime = 0;
  deepDemoAudio = null;
}

function stopDeepDemoOverlay() {
  if (!deepDemoOverlayAudio) return;
  deepDemoOverlayAudio.pause();
  deepDemoOverlayAudio.currentTime = 0;
  deepDemoOverlayAudio = null;
}

async function playDeepDemoOverlay(clipId, volume = 0.3) {
  if (!clipId) return;
  stopDeepDemoOverlay();
  const source = resolveDeepDemoClip(clipId);
  if (!source) return;
  const audio = new Audio(source);
  audio.preload = "auto";
  audio.volume = volume;
  deepDemoOverlayAudio = audio;
  await shapeLongformAudio(audio, "attune");
  await new Promise((resolve) => {
    const settle = () => {
      if (deepDemoOverlayAudio === audio) deepDemoOverlayAudio = null;
      resolve();
    };
    audio.addEventListener("ended", settle, { once: true });
    audio.addEventListener("error", settle, { once: true });
    audio.play().catch(settle);
  });
}

async function playDeepDemoStep(step, index, token) {
  if (!step?.transcript) return;
  const [source, words] = await Promise.all([
    fetchDeepDemoAudio(step, index),
    fetchDeepDemoWords(step).catch(() => wordsFromStep(step).map((word, wordIndex, allWords) => {
      const segment = 2.4 / Math.max(allWords.length, 1);
      return { w: word, s: wordIndex * segment, e: (wordIndex + 1) * segment };
    })),
  ]);
  if (token !== deepDemoRunToken) return;

  stopDeepDemoPlayback();
  const audio = new Audio(source);
  audio.preload = "auto";
  audio.volume = step.speaker === "attune" ? 0.82 : 0.98;
  deepDemoAudio = audio;
  await shapeLongformAudio(audio, step.speaker === "user" ? "human" : "attune");
  step._words = words.map((item) => item.w);
  await new Promise((resolve) => {
    if (audio.readyState >= 2) {
      resolve();
      return;
    }
    const settle = () => resolve();
    audio.addEventListener("loadeddata", settle, { once: true });
    audio.addEventListener("canplaythrough", settle, { once: true });
    audio.addEventListener("error", settle, { once: true });
  });

  elements.longformAudioStatus.textContent =
    step.speaker === "user" ? "User speaking live" : "Attune responding";

  await new Promise((resolve) => {
    let rafId = null;
    let overlayStarted = false;
    const finalize = () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      if (deepDemoAudio === audio) {
        deepDemoAudio = null;
      }
      renderDeepDemoColumns(index);
      renderDeepState(deepFrameForStep(step, 1));
      resolve();
    };
    const tick = () => {
      if (token !== deepDemoRunToken || deepDemoAudio !== audio) return;
      const currentTime = audio.currentTime || 0;
      const visibleWords = words.filter((word) => currentTime >= word.s).length;
      if (!overlayStarted && step.overlayClipId && currentTime >= (step.overlayAt || 0)) {
        overlayStarted = true;
        playDeepDemoOverlay(step.overlayClipId, step.overlayVolume ?? 0.3).catch(() => {});
      }
      renderDeepDemoColumns(index, Math.max(visibleWords, 0));
      renderDeepState(
        deepFrameForStep(
          step,
          clamp(currentTime / Math.max(audio.duration || words.at(-1)?.e || 1, 0.001), 0, 1),
        ),
      );
      elements.longformClock.textContent = formatLongformTime(currentTime);
      rafId = window.requestAnimationFrame(tick);
    };

    audio.addEventListener("ended", finalize, { once: true });
    audio.addEventListener("error", () => {
      elements.longformAudioStatus.textContent = "Cached example audio missing";
      finalize();
    }, { once: true });
    audio.play().then(() => {
      tick();
    }).catch(() => {
      elements.longformAudioStatus.textContent = "Tap play again to unlock audio";
      finalize();
    });
  });
}

function prefetchDeepDemoAudio(demoKey = activeDeepDemo) {
  const demo = deepDemos[demoKey];
  demo?.timeline?.forEach((step, index) => {
    fetchDeepDemoAudio(step, index, demoKey).catch(() => {});
    fetchDeepDemoWords(step).catch(() => {});
    if (step.overlayClipId) fetchDeepDemoWords({ clipId: step.overlayClipId }).catch(() => {});
  });
}

function stopAudio() {
  if (activeAudio) {
    activeAudio.pause();
    activeAudio = null;
  }
  if (activeAudioButton?.classList.contains("round-play")) {
    activeAudioButton.textContent = "▶";
    activeAudioButton.setAttribute("aria-label", activeAudioButton.dataset.playLabel);
  }
  activeAudioButton = null;
  activeAudioWaveform = null;
  elements.pauseAudioButton.disabled = true;
  elements.pauseAudioButton.innerHTML = "<span>Ⅱ</span> Pause audio";
  elements.standardVoiceWave.classList.remove("speaking");
  elements.adaptiveVoiceWave.classList.remove("speaking");
  elements.userWaveform.classList.remove("playing");
}

function audioCacheKey(role, text, requestedState = activeState) {
  const state = role === "standard" ? "all-states" : requestedState;
  return `${role}:${state}:${text}`;
}

async function fetchStudioVoice(role, text, statusElement, requestedState = activeState) {
  const localPath = resolveLocalAudio(role, requestedState, text);
  if (localPath) {
    if (statusElement) statusElement.textContent = "Studio voice · cached locally";
    audioUrlCache.set(audioCacheKey(role, text, requestedState), localPath);
    return localPath;
  }
  if (statusElement) statusElement.textContent = "Loading neural voice…";
  const response = await fetch("/api/speech", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role, state: requestedState, text }),
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail.error || "Studio voice is unavailable.");
  }
  const blob = await response.blob();
  if (statusElement) statusElement.textContent = "Neural voice · cached locally";
  const url = URL.createObjectURL(blob);
  audioUrlCache.set(audioCacheKey(role, text, requestedState), url);
  return url;
}

function studioVoiceSource(role, text, statusElement) {
  return (
    audioUrlCache.get(audioCacheKey(role, text)) ||
    fetchStudioVoice(role, text, statusElement)
  );
}

function prefetchAllAudio() {
  Object.values(scenarios).forEach((scenario) => {
    const standardText = plainText(scenario.standard);
    if (!audioUrlCache.has(audioCacheKey("standard", standardText))) {
      fetchStudioVoice("standard", standardText, null, "overloaded").catch(() => {});
    }
    Object.keys(states).forEach((state) => {
      const jobs = [
        ["human", scenario.prompt],
        ["aware", plainText(scenario.aware[state])],
      ];
      jobs.forEach(([role, text]) => {
        if (!audioUrlCache.has(audioCacheKey(role, text, state))) {
          fetchStudioVoice(role, text, null, state).catch(() => {});
        }
      });
    });
  });

  Object.keys(liveMoments).forEach((name) => {
    prefetchLiveMomentAudio(name).catch(() => {});
    prefetchInterjectionAudio(name).catch(() => {});
  });
}

function prefetchCurrentAudio() {
  const scenario = scenarios[activeScenario];
  const items = [
    ["human", scenario.prompt, elements.inputQuality],
    ["standard", plainText(scenario.standard), elements.standardAudioStatus],
    ["aware", plainText(scenario.aware[activeState]), elements.awareAudioStatus],
  ];
  items.forEach(([role, text, status]) => {
    if (!audioUrlCache.has(audioCacheKey(role, text))) {
      fetchStudioVoice(role, text, status).catch((error) => {
        status.textContent = error.message;
      });
    }
  });
}

async function playAudioSource(source, waveform, button, statusElement) {
  if (activeAudio && activeAudioButton === button) {
    if (activeAudio.paused) {
      await activeAudio.play();
      waveform.classList.add("speaking");
      if (button.classList.contains("round-play")) {
        button.textContent = "Ⅱ";
        button.setAttribute("aria-label", "Pause voice");
      }
      statusElement.textContent = "Playing · press to pause";
    } else {
      activeAudio.pause();
      waveform.classList.remove("speaking");
      if (button.classList.contains("round-play")) {
        button.textContent = "▶";
        button.setAttribute("aria-label", "Resume voice");
      }
      statusElement.textContent = "Paused · press to resume";
    }
    return;
  }
  stopAudio();
  button.disabled = true;
  const isRoundButton = button.classList.contains("round-play");
  try {
    const candidate = typeof source === "function" ? source() : source;
    const url = typeof candidate === "string" ? candidate : await candidate;
    activeAudio = new Audio(url);
    activeAudioButton = button;
    activeAudioWaveform = waveform;
    elements.pauseAudioButton.disabled = false;
    waveform.classList.add("speaking");
    if (isRoundButton) {
      button.dataset.playLabel ||= button.getAttribute("aria-label");
      button.textContent = "Ⅱ";
      button.setAttribute("aria-label", "Pause voice");
    }
    statusElement.textContent = "Playing · press to pause";
    activeAudio.addEventListener("ended", () => {
      waveform.classList.remove("speaking");
      if (isRoundButton) {
        button.textContent = "▶";
        button.setAttribute("aria-label", button.dataset.playLabel);
      }
      activeAudio = null;
      activeAudioButton = null;
      activeAudioWaveform = null;
      elements.pauseAudioButton.disabled = true;
      elements.pauseAudioButton.innerHTML = "<span>Ⅱ</span> Pause audio";
    }, { once: true });
    try {
      await activeAudio.play();
    } catch (error) {
      if (error.name === "NotAllowedError") {
        statusElement.textContent = "Voice ready · press play again";
        waveform.classList.remove("speaking");
        if (isRoundButton) {
          button.textContent = "▶";
          button.setAttribute("aria-label", button.dataset.playLabel);
        }
        activeAudio = null;
        activeAudioButton = null;
        activeAudioWaveform = null;
        elements.pauseAudioButton.disabled = true;
      } else {
        throw error;
      }
    }
  } catch (error) {
    statusElement.textContent = error.message;
  } finally {
    button.disabled = false;
  }
}

async function playHumanVoice() {
  if (recordedAudioUrl) {
    await playAudioSource(
      recordedAudioUrl,
      elements.userWaveform,
      elements.replayButton,
      elements.inputQuality,
    );
    return;
  }
  await playAudioSource(
    () => studioVoiceSource(
      "human",
      scenarios[activeScenario].prompt,
      elements.inputQuality,
    ),
    elements.userWaveform,
    elements.replayButton,
    elements.inputQuality,
  );
}

async function toggleGlobalAudio() {
  if (!activeAudio) return;
  if (activeAudio.paused) {
    await activeAudio.play();
    activeAudioWaveform?.classList.add("speaking");
    elements.pauseAudioButton.innerHTML = "<span>Ⅱ</span> Pause audio";
  } else {
    activeAudio.pause();
    activeAudioWaveform?.classList.remove("speaking");
    elements.pauseAudioButton.innerHTML = "<span>▶</span> Resume audio";
  }
}

async function toggleRecording() {
  if (mediaRecorder?.state === "recording") {
    mediaRecorder.stop();
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    elements.inputQuality.textContent = "Microphone recording is unavailable";
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const chunks = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.addEventListener("dataavailable", (event) => {
      if (event.data.size) chunks.push(event.data);
    });
    mediaRecorder.addEventListener("stop", () => {
      window.clearInterval(recordingTimer);
      stream.getTracks().forEach((track) => track.stop());
      if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
      recordedAudioUrl = URL.createObjectURL(new Blob(chunks, { type: mediaRecorder.mimeType }));
      elements.recordButton.classList.remove("recording");
      elements.recordButton.querySelector("span").textContent = "Use my voice";
      elements.inputQuality.textContent = "YOUR RECORDING · LOCAL";
    });
    mediaRecorder.start();
    recordingStartedAt = Date.now();
    elements.recordButton.classList.add("recording");
    elements.recordButton.querySelector("span").textContent = "Stop recording";
    elements.inputQuality.textContent = "RECORDING LIVE";
    recordingTimer = window.setInterval(() => {
      const seconds = Math.floor((Date.now() - recordingStartedAt) / 1000);
      elements.inputDuration.textContent = `00:${String(seconds).padStart(2, "0")}`;
    }, 250);
  } catch {
    elements.inputQuality.textContent = "Microphone permission was not granted";
  }
}

async function toggleCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
    elements.cameraFeed.srcObject = null;
    elements.cameraFeed.classList.remove("active");
    elements.cameraButton.textContent = "Use camera";
    elements.visionStatus.textContent = "VISION READY";
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    elements.visionStatus.textContent = "CAMERA UNAVAILABLE";
    return;
  }
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
    });
    elements.cameraFeed.srcObject = cameraStream;
    await elements.cameraFeed.play();
    elements.cameraFeed.classList.add("active");
    elements.cameraButton.textContent = "Stop camera";
    elements.visionStatus.textContent = "VISION LIVE";
  } catch {
    elements.visionStatus.textContent = "CAMERA NOT GRANTED";
  }
}

function renderLiveMoment(revealed = true) {
  const moment = liveMoments[activeLiveScenario];
  prefetchLiveMomentAudio(activeLiveScenario).catch(() => {});
  elements.liveTranscript.textContent = revealed ? moment.chunks.join(" ") : "";
  elements.triggerPhrase.textContent = `“${moment.trigger}”`;
  elements.liveSignal.textContent = moment.signal;
  elements.liveState.textContent = moment.state;
  elements.liveRisk.textContent = moment.risk;
  elements.interventionType.textContent = moment.type;
  elements.interventionLabel.textContent = moment.label;
  elements.interventionNote.textContent = moment.note;
  elements.interventionResponse.textContent = `“${moment.response}”`;
  elements.decisionText.textContent = revealed
    ? moment.decision
    : "Stay quiet. Keep listening.";
  elements.analysisStatus.textContent = revealed ? "DECISION READY" : "LISTENING";
  elements.modelThoughtStream.innerHTML = revealed
    ? moment.thoughts
        .map(
          ([label, text]) =>
            `<div class="model-thought active"><small>${label}</small><p>${text}</p></div>`,
        )
        .join("")
    : `<div class="thought-placeholder"><i></i><i></i><i></i>Waiting for enough evidence</div>`;
  document
    .querySelectorAll(".intervention-scale span")
    .forEach((level) => level.classList.toggle(
      "active",
      Number(level.dataset.level) === moment.level,
    ));
  document.querySelector(".live-demo").classList.toggle("revealed", revealed);
  elements.policyDecision.classList.toggle("decided", revealed);
  updateTelemetry(revealed ? moment.telemetry.at(-1) : null);
  elements.interjectionAudioButton.disabled = !revealed;
  elements.interjectionAudioStatus.textContent = revealed
    ? "Prepared · plays separately"
    : "Waiting for trigger";
  prefetchInterjectionAudio(activeLiveScenario).catch(() => {});
}

function updateTelemetry(step) {
  const value = step || ["Listening", "Low", "Neutral", 32, 22, 18, 25];
  const [state, load, affect, confidence, stateValue, loadValue, affectValue] = value;
  elements.telemetryState.textContent = state;
  elements.telemetryLoad.textContent = load;
  elements.telemetryAffect.textContent = affect;
  elements.telemetryConfidence.textContent = `${confidence}%`;
  elements.telemetryStateBar.style.width = `${stateValue}%`;
  elements.telemetryLoadBar.style.width = `${loadValue}%`;
  elements.telemetryAffectBar.style.width = `${affectValue}%`;
  elements.telemetryConfidenceBar.style.width = `${confidence}%`;
  renderLiveAffect(value);
}

async function prefetchLiveMomentAudio(name) {
  if (liveAudioCache.has(name)) return liveAudioCache.get(name);
  const moment = liveMoments[name];
  const text = moment.chunks.join(" ");
  const localPath = resolveLocalAudio("human", moment.audioState, text);
  if (localPath) {
    liveAudioCache.set(name, localPath);
    return localPath;
  }
  const request = fetch("/api/speech", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      role: "human",
      state: moment.audioState,
      text,
    }),
  })
    .then((response) => {
      if (!response.ok) throw new Error("Live voice unavailable");
      return response.blob();
    })
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      liveAudioCache.set(name, url);
      return url;
    })
    .catch((error) => {
      liveAudioCache.delete(name);
      throw error;
    });
  liveAudioCache.set(name, request);
  return request;
}

async function prefetchInterjectionAudio(name) {
  if (interjectionAudioCache.has(name)) return interjectionAudioCache.get(name);
  const moment = liveMoments[name];
  const localPath = resolveLocalAudio("aware", moment.audioState, moment.interjection);
  if (localPath) {
    interjectionAudioCache.set(name, localPath);
    return localPath;
  }
  const request = fetch("/api/speech", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      role: "aware",
      state: moment.audioState,
      text: moment.interjection,
    }),
  })
    .then((response) => {
      if (!response.ok) throw new Error("Interjection voice unavailable");
      return response.blob();
    })
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      interjectionAudioCache.set(name, url);
      return url;
    })
    .catch((error) => {
      interjectionAudioCache.delete(name);
      throw error;
    });
  interjectionAudioCache.set(name, request);
  return request;
}

async function toggleInterjectionAudio() {
  if (liveMomentRunning) {
    interjectionQueued = !interjectionQueued;
    elements.interjectionAudioButton.classList.toggle("queued", interjectionQueued);
    elements.interjectionAudioButton.querySelector("i").textContent =
      interjectionQueued ? "✓" : "▶";
    elements.interjectionAudioStatus.textContent = interjectionQueued
      ? "Queued · plays after the human finishes"
      : "Prepared · plays separately";
    return;
  }

  if (interjectionAudio) {
    if (interjectionAudio.paused) {
      await interjectionAudio.play();
      elements.interjectionAudioButton.querySelector("i").textContent = "Ⅱ";
      elements.interjectionAudioStatus.textContent = "Playing prepared response";
    } else {
      interjectionAudio.pause();
      elements.interjectionAudioButton.querySelector("i").textContent = "▶";
      elements.interjectionAudioStatus.textContent = "Paused";
    }
    return;
  }
  try {
    const source = await prefetchInterjectionAudio(activeLiveScenario);
    interjectionAudio = new Audio(source);
    interjectionAudio.addEventListener("ended", () => {
      elements.interjectionAudioButton.querySelector("i").textContent = "▶";
      elements.interjectionAudioStatus.textContent = "Prepared · plays separately";
      interjectionAudio = null;
    }, { once: true });
    await interjectionAudio.play();
    elements.interjectionAudioButton.querySelector("i").textContent = "Ⅱ";
    elements.interjectionAudioStatus.textContent = "Playing prepared response";
  } catch {
    elements.interjectionAudioStatus.textContent = "Audio ready · press again";
  }
}

async function runLiveMoment() {
  if (liveMomentRunning) {
    liveMomentPaused = !liveMomentPaused;
    if (liveMomentPaused) {
      liveMomentAudio?.pause();
      elements.runLiveButton.innerHTML = "<i>▶</i> Resume moment";
      document.querySelector(".live-demo").classList.add("paused");
    } else {
      await liveMomentAudio?.play().catch(() => {});
      elements.runLiveButton.innerHTML = "<i>Ⅱ</i> Pause moment";
      document.querySelector(".live-demo").classList.remove("paused", "audio-ready");
      document.querySelector(".live-demo").classList.add("audio-playing");
    }
    return;
  }

  liveRunToken += 1;
  const token = liveRunToken;
  const moment = liveMoments[activeLiveScenario];
  const demo = document.querySelector(".live-demo");
  liveMomentRunning = true;
  liveMomentPaused = false;
  demo.classList.remove("revealed");
  demo.classList.add("running");
  elements.liveTranscript.innerHTML = "";
  elements.modelThoughtStream.innerHTML = "";
  elements.triggerMarker.classList.remove("detected");
  elements.policyDecision.classList.remove("decided");
  elements.decisionText.textContent = "Stay quiet. Keep listening.";
  elements.interventionType.textContent = "OBSERVING";
  elements.analysisStatus.textContent = "STREAMING";
  elements.liveClock.textContent = "00:00";
  updateTelemetry(null);
  elements.interjectionAudioButton.disabled = true;
  elements.interjectionAudioButton.classList.remove("queued");
  elements.interjectionAudioButton.querySelector("i").textContent = "▶";
  elements.interjectionAudioStatus.textContent = "Waiting for trigger";
  interjectionQueued = false;
  elements.continuationText.textContent =
    "The human is still speaking. The model prepares an intervention but does not play it automatically.";
  document
    .querySelectorAll(".intervention-scale span")
    .forEach((level) => level.classList.remove("active"));
  elements.runLiveButton.innerHTML = "<i>Ⅱ</i> Pause moment";

  try {
    const cachedSource = liveAudioCache.get(activeLiveScenario);
    liveMomentAudioUrl =
      typeof cachedSource === "string"
        ? cachedSource
        : await prefetchLiveMomentAudio(activeLiveScenario);
    liveMomentAudio = new Audio(liveMomentAudioUrl);
    await new Promise((resolve) => {
      if (Number.isFinite(liveMomentAudio.duration)) {
        resolve();
        return;
      }
      liveMomentAudio.addEventListener("loadedmetadata", resolve, { once: true });
      liveMomentAudio.addEventListener("error", resolve, { once: true });
    });
    await liveMomentAudio.play();
    demo.classList.add("audio-playing");
  } catch (error) {
    if (error.name === "NotAllowedError" && liveMomentAudio) {
      liveMomentPaused = true;
      demo.classList.add("paused", "audio-ready");
      elements.runLiveButton.innerHTML = "<i>▶</i> Resume with audio";
      elements.analysisStatus.textContent = "AUDIO READY";
    } else {
      liveMomentAudio = null;
      demo.classList.add("audio-unavailable");
    }
    demo.dataset.audioError = error.message;
  }

  const totalCharacters = moment.chunks.reduce(
    (total, chunkText) => total + chunkText.length,
    0,
  );
  const audioDuration =
    liveMomentAudio && Number.isFinite(liveMomentAudio.duration)
      ? liveMomentAudio.duration
      : 18;
  let visualElapsed = 0;

  for (let index = 0; index < moment.chunks.length; index += 1) {
    if (token !== liveRunToken) return;
    while (liveMomentPaused && token === liveRunToken) {
      await wait(100);
    }
    const chunk = document.createElement("span");
    chunk.className = "transcript-chunk";
    chunk.textContent = `${moment.chunks[index]} `;
    if (index === moment.triggerIndex) chunk.classList.add("triggered-words");
    elements.liveTranscript.appendChild(chunk);
    elements.liveClock.textContent = `00:${String(Math.round(visualElapsed)).padStart(2, "0")}`;
    updateTelemetry(moment.telemetry[index]);

    if (moment.thoughts[index]) {
      const [label, text] = moment.thoughts[index];
      const thought = document.createElement("div");
      thought.className = "model-thought";
      thought.innerHTML = `<small>${label}</small><p>${text}</p>`;
      elements.modelThoughtStream.appendChild(thought);
      requestAnimationFrame(() => thought.classList.add("active"));
    }

    if (index === moment.triggerIndex) {
      elements.triggerMarker.classList.add("detected");
      elements.liveSignal.textContent = moment.signal;
      elements.liveState.textContent = moment.state;
      elements.liveRisk.textContent = moment.risk;
      elements.analysisStatus.textContent = "THRESHOLD CROSSED";
      elements.interventionType.textContent = moment.type;
      elements.decisionText.textContent = moment.decision;
      elements.policyDecision.classList.add("decided");
      document
        .querySelector(`.intervention-scale span[data-level="${moment.level}"]`)
        .classList.add("active");
      demo.classList.add("revealed");
      elements.interjectionAudioButton.disabled = false;
      elements.interjectionAudioStatus.textContent =
        "Potential response · available after the full speech";
    }

    const chunkDuration = Math.max(
      1.5,
      audioDuration * (moment.chunks[index].length / totalCharacters),
    );
    const waitTime = chunkDuration * 1000;
    let elapsed = 0;
    while (elapsed < waitTime && token === liveRunToken) {
      if (!liveMomentPaused) elapsed += 50;
      await wait(50);
    }
    visualElapsed += chunkDuration;
    elements.liveClock.textContent = `00:${String(Math.min(
      Math.round(visualElapsed),
      Math.round(audioDuration),
    )).padStart(2, "0")}`;
  }

  if (token !== liveRunToken) return;
  while (
    liveMomentAudio &&
    !liveMomentAudio.paused &&
    !liveMomentAudio.ended &&
    token === liveRunToken
  ) {
    elements.liveClock.textContent = `00:${String(
      Math.min(Math.round(liveMomentAudio.currentTime), Math.round(audioDuration)),
    ).padStart(2, "0")}`;
    await wait(100);
  }
  elements.liveClock.textContent = `00:${String(Math.round(audioDuration)).padStart(2, "0")}`;
  elements.analysisStatus.textContent = "HUMAN FINISHED";
  elements.continuationText.textContent =
    "Full human speech completed. The hypothetical intervention remains available to review.";
  demo.classList.remove("running");
  demo.classList.remove("paused", "audio-ready", "audio-playing");
  liveMomentRunning = false;
  liveMomentPaused = false;
  elements.runLiveButton.innerHTML = "<i>↻</i> Replay moment";
  const shouldPlayInterjection =
    interjectionQueued || elements.interjectionAudioButton.classList.contains("queued");
  elements.interjectionAudioButton.classList.remove("queued");
  if (shouldPlayInterjection) {
    interjectionQueued = false;
    elements.interjectionAudioButton.querySelector("i").textContent = "▶";
    await toggleInterjectionAudio();
  } else {
    elements.interjectionAudioStatus.textContent = "Prepared · plays separately";
  }
}

function typeHTML(target, html, duration, token) {
  return new Promise((resolve) => {
    const plainText = html.replace(/<[^>]*>/g, "");
    const steps = Math.min(26, Math.max(10, Math.round(plainText.length / 18)));
    let step = 0;

    const timer = window.setInterval(() => {
      if (token !== animationToken) {
        window.clearInterval(timer);
        resolve();
        return;
      }

      step += 1;
      target.style.opacity = String(Math.min(1, step / 7));
      target.style.clipPath = `inset(0 ${100 - (step / steps) * 100}% 0 0)`;

      if (step >= steps) {
        window.clearInterval(timer);
        target.innerHTML = html;
        target.style.clipPath = "none";
        target.style.opacity = "1";
        resolve();
      }
    }, duration / steps);
  });
}

async function playExchange(instant = false) {
  animationToken += 1;
  const token = animationToken;
  const scenario = scenarios[activeScenario];
  const state = states[activeState];

  elements.userWaveform.classList.remove("playing");
  elements.standardVoiceWave.classList.remove("speaking");
  elements.adaptiveVoiceWave.classList.remove("speaking");
  elements.detectedState.textContent = state.label;
  elements.fusionState.textContent = state.label;
  elements.fusionConfidence.textContent = `${state.confidence} confidence`;
  [0, 1, 2].forEach((index) => {
    const metric = state.metrics[index];
    const prefix = ["metricOne", "metricTwo", "metricThree"][index];
    elements[`${prefix}Label`].textContent = metric[0];
    elements[`${prefix}Value`].textContent = metric[1];
    elements[`${prefix}Bar`].style.width = `${metric[2]}%`;
  });
  elements.confidence.textContent = state.confidence;
  setPolicies(activeState);
  elements.awareBurden.textContent = state.awareBurden;
  elements.awareMeter.style.width = state.awareMeter;
  elements.voiceProfile.textContent = state.voice;
  elements.audioStrategy.textContent = state.audioStrategy;
  if (elements.visualCue) elements.visualCue.textContent = state.cue;
  elements.speechWeight.textContent = state.weights[0];
  elements.visionWeight.textContent = state.weights[1];
  elements.textWeight.textContent = state.weights[2];
  elements.liveSpeech.textContent = `${state.metrics[0][2]}%`;
  elements.liveVision.textContent = `${state.metrics[1][2]}%`;
  elements.liveText.textContent = `${state.metrics[2][2]}%`;
  if (!recordedAudioUrl) {
    elements.inputQuality.textContent = state.sampleLabel;
  }
  elements.userWaveform.dataset.state = activeState;
  renderPrimaryAffect(activeState);
  prefetchCurrentAudio();

  if (instant) {
    elements.standardResponse.innerHTML = scenario.standard;
    elements.awareResponse.innerHTML = scenario.aware[activeState];
    return;
  }

  elements.replayButton.disabled = true;
  elements.replayLabel.textContent = "Listening…";
  elements.userWaveform.classList.remove("playing");
  elements.userWaveform.classList.add("playing");
  document.querySelector(".aware-panel").classList.add("live-input");
  await playHumanVoice();
  if (token !== animationToken) return;
  elements.standardResponse.innerHTML = "";
  elements.awareResponse.innerHTML = "";
  elements.standardResponse.style.clipPath = "none";
  elements.awareResponse.style.clipPath = "none";
  elements.standardThinking.classList.add("visible");
  elements.awareThinking.classList.add("visible");

  await wait(650);
  if (token !== animationToken) return;

  elements.standardThinking.classList.remove("visible");
  elements.standardVoiceWave.classList.add("speaking");
  const standardTyping = typeHTML(
    elements.standardResponse,
    scenario.standard,
    950,
    token,
  );

  await wait(380);
  if (token !== animationToken) return;

  elements.awareThinking.classList.remove("visible");
  elements.adaptiveVoiceWave.classList.add("speaking");
  const awareTyping = typeHTML(
    elements.awareResponse,
    scenario.aware[activeState],
    720,
    token,
  );

  await Promise.all([standardTyping, awareTyping]);
  if (token !== animationToken) return;

  elements.userWaveform.classList.remove("playing");
  document.querySelector(".aware-panel").classList.remove("live-input");
  elements.standardVoiceWave.classList.remove("speaking");
  elements.adaptiveVoiceWave.classList.remove("speaking");
  elements.replayLabel.textContent = "Play human voice";
  elements.replayButton.disabled = false;
}

document.querySelectorAll(".state-button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector(".state-button.active")?.classList.remove("active");
    button.classList.add("active");
    activeState = button.dataset.state;
    playExchange();
  });
});

elements.scenarioSelect.addEventListener("change", (event) => {
  activeScenario = event.target.value;
  elements.userPrompt.textContent = scenarios[activeScenario].prompt;
  playExchange();
});

elements.replayButton.addEventListener("click", () => playExchange());
elements.recordButton.addEventListener("click", toggleRecording);
elements.cameraButton?.addEventListener("click", toggleCamera);
elements.pauseAudioButton.addEventListener("click", toggleGlobalAudio);
elements.runLiveButton.addEventListener("click", runLiveMoment);
elements.interjectionAudioButton.addEventListener("click", toggleInterjectionAudio);
elements.runLongformButton.addEventListener("click", runLongformConversation);

document.querySelector("#longformTimeline")?.addEventListener("click", (event) => {
  const button = event.target.closest(".timeline-event");
  if (!button || deepDemoRunning) return;
  renderLongformEvent(Number(button.dataset.event), true);
});

document.querySelectorAll(".live-scenario-button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector(".live-scenario-button.active")?.classList.remove("active");
    button.classList.add("active");
    activeLiveScenario = button.dataset.liveScenario;
    liveRunToken += 1;
    liveMomentRunning = false;
    liveMomentPaused = false;
    if (liveMomentAudio) {
      liveMomentAudio.pause();
      liveMomentAudio.currentTime = 0;
    }
    if (interjectionAudio) {
      interjectionAudio.pause();
      interjectionAudio = null;
    }
    interjectionQueued = false;
    elements.interjectionAudioButton.classList.remove("queued");
    document.querySelector(".live-demo").classList.remove(
      "audio-playing",
      "audio-unavailable",
      "paused",
    );
    elements.triggerMarker.classList.remove("detected");
    renderLiveMoment(false);
    elements.runLiveButton.innerHTML = "<i>▶</i> Run moment";
    elements.interjectionAudioButton.querySelector("i").textContent = "▶";
  });
});

document.querySelectorAll(".deep-demo-button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector(".deep-demo-button.active")?.classList.remove("active");
    button.classList.add("active");
    activeDeepDemo = button.dataset.deepDemo;
    deepDemoRunToken += 1;
    deepDemoRunning = false;
    deepDemoPaused = false;
    stopDeepDemoPlayback();
    document.querySelector("#longformDemo")?.classList.remove("running", "complete", "paused");
    elements.runLongformButton.innerHTML = "<i>▶</i> Run example";
    renderLongformEvent(0, true);
    prefetchDeepDemoAudio(activeDeepDemo);
  });
});

elements.standardAudioButton.addEventListener("click", () => {
  playAudioSource(
    () => studioVoiceSource(
      "standard",
      plainText(scenarios[activeScenario].standard),
      elements.standardAudioStatus,
    ),
    elements.standardVoiceWave,
    elements.standardAudioButton,
    elements.standardAudioStatus,
  );
});

elements.awareAudioButton.addEventListener("click", () => {
  playAudioSource(
    () => studioVoiceSource(
      "aware",
      plainText(scenarios[activeScenario].aware[activeState]),
      elements.awareAudioStatus,
    ),
    elements.adaptiveVoiceWave,
    elements.awareAudioButton,
    elements.awareAudioStatus,
  );
});

document.querySelectorAll(".modality-tabs").forEach((tabGroup) => {
  tabGroup.addEventListener("click", (event) => {
    const button = event.target.closest(".modality-tab");
    if (!button) return;
    const panel = tabGroup.dataset.panel;
    tabGroup.querySelector(".modality-tab.active")?.classList.remove("active");
    button.classList.add("active");
    document
      .querySelectorAll(`[data-pane^="${panel}-"]`)
      .forEach((pane) => pane.classList.remove("active"));
    document
      .querySelector(`[data-pane="${panel}-${button.dataset.view}"]`)
      .classList.add("active");
  });
});

document.querySelector("#resetButton").addEventListener("click", () => {
  activeState = "overloaded";
  activeScenario = "code";
  elements.scenarioSelect.value = activeScenario;
  document.querySelector(".state-button.active")?.classList.remove("active");
  document
    .querySelector('[data-state="overloaded"]')
    .classList.add("active");
  elements.userPrompt.textContent = scenarios.code.prompt;
  recordedAudioUrl = null;
  longformRunToken += 1;
  longformRunning = false;
  longformPaused = false;
  deepDemoRunToken += 1;
  deepDemoRunning = false;
  deepDemoPaused = false;
  stopDeepDemoPlayback();
  longformHumanAudio?.pause();
  longformAttuneAudio?.pause();
  longformHumanAudio = null;
  longformAttuneAudio = null;
  document.querySelector("#longformDemo").className = "longform-demo";
  elements.longformClock.textContent = "00:00";
  activeDeepDemo = "gradient";
  document.querySelector(".deep-demo-button.active")?.classList.remove("active");
  document.querySelector('[data-deep-demo="gradient"]')?.classList.add("active");
  elements.runLongformButton.innerHTML = "<i>▶</i> Run example";
  renderLongformEvent(0, true);
  elements.inputQuality.textContent = "STUDIO SAMPLE · EN";
  elements.inputDuration.textContent = "00:08";
  playExchange();
});

playExchange(true);
renderLiveMoment(false);
renderLongformEvent(0, true);
renderPrimaryAffect(activeState);
prefetchAllAudio();
prefetchDeepDemoAudio();
