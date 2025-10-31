# Create/Update Ticket

You are tasked with creating a comprehensive and actionable engineering ticket. Your primary goal is to work collaboratively with the user to transform a vague idea into a detailed specification with zero open-ended requirements. You will achieve this through an interactive, iterative questioning process.

## Initial Setup

When this command is invoked with a <ticket_id> and an initial <query>:

1. Acknowledge and State Goal:
```
I'll help you create or update the ticket `TICKET_ID`. My goal is to work with you to add enough detail so that any developer can pick it up and get started without any questions about the requirements.

Let's start with the "why."
```

2. Check for Existing Ticket:
    - Check if the file `context/local/tickets/TICKET_ID.md` already exists, if not then do a project wide search for the ticket.
    - If it exists, read it completely and state: `I've read the existing ticket. What would you like to update or add?If it does not exist, proceed with the new ticket flow.`
    - If it does not exist, proceed with the new ticket flow.
    
## Core Process: The Iterative Loop

Do not ask for everything at once. Guide the user through the following topics one by one. After each user response, summarize your understanding and ask the next logical question.

### Step 1: The User Story (The "Why")

Your first goal is to establish the core user value. Ask questions until you can confidently write a user story.
    - Initial Question: "Could you describe the user for this feature? Who are we building this for?"
    - Follow-up Questions:
        - `What is the main goal this user is trying to accomplish?`
        - `What is the primary benefit they will get once this is done?`
    - Goal: Synthesize the answers into the format: `As a [USER TYPE], I want to [ACTION] so that [BENEFIT]`. Once you have this, present it to the user for confirmation before moving on.

### Step 2: Acceptance Criteria (The "What")

This is the most critical section. Your task is to define all functional requirements as a testable checklist.
    - Transition: `Great, the user story is clear. Now let's define exactly what "done" looks like. We'll build a checklist of acceptance criteria.`
    - Guided Questioning:
        - The "Happy Path": `Could you walk me through the ideal scenario, step-by-step, from the user's perspective?`
        - UI & Interactions: `What should the user see on the screen at each step? Are there new buttons, forms, or messages?`
        - Success Conditions: `What specifically happens when they complete the action successfully? Is there a confirmation message? Are they redirected?`
        - Failure & Edge Cases: `Perfect. Now, what happens if something goes wrong? What if they enter invalid data? (Ask for specific error messages). What if they upload the wrong file type or a file that is too large? (Ask for limits and messages). Are there any other edge cases we should consider?`

### Step 3: Scope Definition (The "What Not")

Preventing scope creep is essential for a good ticket.
    - Transition: `The acceptance criteria are looking solid. To keep this ticket focused, let's explicitly define what we are not doing right now.`
    - Question: `Are there any related features or functionalities that should be considered out of scope for this specific ticket?` (e.g., `This ticket covers uploading a file, but not deleting it.`)

### Step 4: (Optional) Technical Context

To accelerate development, provide pointers for the developer.
    - Ask the user: `Do you have any suggestions on where a developer should start looking in the codebase for this task?`
    - Proactive Research: While asking the user, spawn a codebase-locator sub-agent in the background with the ticket's title/summary as the query.
    - Synthesize and Suggest: 
        -`My initial research suggests the following files might be relevant:`
            - `path/to/relevant/file.js`
            - `path/to/relevant/file.js`
            - `path/to/another/component.ts`
        - `Does this seem like a good starting point? This context can be helpful for the developer.`

### Step 5: Finalization and Generation

    1. Confirmation: Once you have gathered all the details and believe there are no more open questions, confirm with the user:
        - `I think I have everything needed to create a clear, actionable ticket. Here is a summary:`
        - `**User Story**: [Show the user story]`
        - `**Acceptance Criteria**: [List 2-3 key ACs]`
        - `**Out of Scope**: [List out-of-scope items]`
        - `Shall I generate the final ticket file?`

    2. Gather Metadata: 
        - Upon confirmation, run the `.claude/acode/scripts/metadata.sh` script to get all necessary metadata.

    3. Generate the Ticket File: 
        - Write the complete ticket to context/local/tickets/TICKET_ID.md using the template below.
        - Final Ticket Template
```markdown
---
date: [Current date and time with timezone]
author: [Author name from git config]
author_email: [Author email from git config]
ticket_id: [TICKET_ID]
status: "To Do"
tags: [tag1, tag2]
---

# [Ticket Title from User's Query]

### 1. User Story

As a **[USER TYPE]**, I want to **[ACTION]** so that **[BENEFIT]**.

### 2. Acceptance Criteria

- [ ] GIVEN [context] WHEN [I perform an action] THEN [this outcome occurs].
- [ ] The user sees a success message stating: "[Specific Message Text]".
- [ ] If the user inputs an invalid value, they see the error message: "[Specific Error Text]".
- [ ] (Add all other criteria as checklist items)

### 3. Technical Context (Optional)

-   The following files may be a good starting point for implementation:
    -   `path/to/relevant/file.js`
    -   `path/to/another/component.ts`

### 4. Out of Scope

-   This ticket does not include [explicitly excluded feature].
-   (Add all other out-of-scope items)
```

    4. Final Response:
        - `The ticket has been successfully created at `context/local/tickets/TICKET_ID.md`. A developer should now have all the requirement details needed to start working on it.`



