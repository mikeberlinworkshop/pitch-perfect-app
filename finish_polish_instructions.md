# PROMPT FOR AI ASSISTANT

**User:** I need you to finish the "Polish" phase of my project. I have a startup pitch simulator app and a marketing site.

**Project Status:**
- **Completed:** Core app functionality (deck upload, pitch simulation, scoring, 4 personas), Marketing site structure.
- **In Progress:** Visual redesign (Amber/Navy theme), Logo implementation, Marketing copy updates.
- **Next Steps:** End-to-end testing, Deployment to Netlify.

**Project Structure:**
- `/pitch-perfect/`: Main app (HTML/JS/CSS). Uses ES modules.
- `/pitch-perfect-site/`: Marketing site (HTML/CSS).

**Your Goal:**
Apply a visual redesign (Amber/Navy theme), add a new logo, and punch up the marketing copy to be "founder-voiced".

---

## STEP 1: Understand the Files

Before editing, please read these 4 files to understand the current state:
1. `pitch-perfect/styles.css` (App styles)
2. `pitch-perfect/index.html` (App shell)
3. `pitch-perfect-site/styles.css` (Marketing site styles)
4. `pitch-perfect-site/index.html` (Marketing site content)

---

## STEP 2: Apply Visual Redesign (Amber & Navy)

Replace the `:root` variables in **BOTH** `pitch-perfect/styles.css` and `pitch-perfect-site/styles.css` with this new warm, premium palette.

**New CSS Variables:**
```css
:root {
    /* Base Backgrounds */
    --bg-primary: #0f172a;    /* Deep Navy */
    --bg-secondary: #1e293b;  /* Lighter Navy */
    --bg-card: #1e293b;
    --bg-card-hover: #334155;
    --bg-glass: rgba(15, 23, 42, 0.8);
    
    /* Borders */
    --border: rgba(245, 158, 11, 0.1);       /* Subtle Amber Tint */
    --border-hover: rgba(245, 158, 11, 0.25);
    
    /* Typography */
    --text-primary: #f8fafc;
    --text-secondary: #94a3b8;
    --text-muted: #64748b;
    
    /* Brand Colors (Amber/Gold) */
    --accent: #f59e0b;        /* Amber-500 */
    --accent-hover: #d97706;  /* Amber-600 */
    --accent-glow: rgba(245, 158, 11, 0.2);
    
    /* Status Colors */
    --success: #10b981;
    --warning: #f59e0b;
    --danger: #ef4444;
    
    /* System */
    --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
    --radius-sm: 6px;
    --radius: 12px;
    --radius-lg: 16px;
    --shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
}
```

---

## STEP 3: Implement New Logo

Replace the text-based "PP" logo code in **BOTH** `pitch-perfect/index.html` and `pitch-perfect-site/index.html` with this SVG.

**Verified SVG Logo Code:**
```html
<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="8" fill="url(#paint0_linear)"/>
    <path d="M16 8C11.5817 8 8 11.5817 8 16C8 20.4183 11.5817 24 16 24C20.4183 24 24 20.4183 24 16C24 11.5817 20.4183 8 16 8ZM16 22C12.6863 22 10 19.3137 10 16C10 12.6863 12.6863 10 16 10C19.3137 10 22 12.6863 22 16C22 19.3137 19.3137 22 16 22Z" fill="white" fill-opacity="0.2"/>
    <path d="M16 13C14.3431 13 13 14.3431 13 16C13 17.6569 14.3431 19 16 19C17.6569 19 19 17.6569 19 16C19 14.3431 17.6569 13 16 13Z" fill="white"/>
    <path d="M21.5 10.5L24 8M24 8H21M24 8V11" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <defs>
        <linearGradient id="paint0_linear" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop stop-color="#F59E0B"/>
            <stop offset="1" stop-color="#D97706"/>
        </linearGradient>
    </defs>
</svg>
```

---

## STEP 4: Punch Up Marketing Copy

In `pitch-perfect-site/index.html`, replace the generic copy with this "Founder Voice" version.

**1. Hero Section:**
```html
<section class="hero">
    <div class="hero-content">
        <div class="hero-badge">
            <span class="badge-dot"></span>
            Stop pitching to your mirror.
        </div>
        <h1>
            Get roasted by VCs<br>
            <span class="gradient-text">before you ask for money.</span>
        </h1>
        <p class="hero-sub">
            Your pitch deck has holes. Find them here, privately, before a Partner at Sequoia finds them publicly.
        </p>
        <!-- Keep existing buttons/actions -->
    </div>
</section>
```

**2. Wow Moment Caption:**
```html
<p class="wow-caption">
    This AI doesn't nod politely. It interrupts you exactly when your logic breaks.
</p>
```

**3. Features Grid (Update Titles/Descriptions):**
*   **Dynamic Interruptions** → **"It Interrupts You"** ("Just like a real meeting. If you hand-wave a number, it stops you cold.")
*   **Voice + Text** → **"Practice Out Loud"** ("Don't just read bullets. Pitch with your actual voice and get feedback on your delivery/presence.")
*   **Suggested Answers** → **"The Answer Key"** ("Stumped? See exactly how a top-tier founder would answer that tough question.")

---

## STEP 5: Add New Persona to Marketing Page

The App already has the "Industry Expert" persona in the code, but the marketing site needs to show it. Adding a 4th card to the grid might break the layout of 3.

**Task:**  
In `pitch-perfect-site/index.html`, update the `.persona-cards` grid to support 4 items (use `grid-template-columns: repeat(auto-fit, minmax(250px, 1fr))` in CSS if needed, or just add the card).

**Add this 4th Persona Card HTML:**
```html
<div class="persona-card-mkt" style="--persona-color: #059669">
    <div class="persona-icon">🏭</div>
    <h3>The Industry Expert</h3>
    <p class="persona-style">Domain-Specialist Investor</p>
    <p>"The regulatory landscape here is tricky. How are you handling compliance?" Deep vertical expertise (Ag/Climate/Fintech).</p>
</div>
```

---

## Deployment (Next Steps)
After these changes are applied, the project is ready for deployment.
1. Commit changes.
2. Push to git.
3. Hosting: Netlify (for app functions) + Standard hosting for marketing site.
