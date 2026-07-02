import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Icon } from '../components/Icon';
import { MealPlate } from '../components/MealPlate';
import type { RecipeSummary } from '../types/models';

/**
 * Public landing page at /. Editorial food-magazine treatment with embedded
 * product UI. Converts on the "Start your pantry" CTA which routes to
 * /register.
 */
export function LandingPage() {
  useEffect(() => {
    document.title = '7 Day Kitchen — Use what you\'ve got. Eat what you love. Waste nothing.';
    const meta = document.querySelector('meta[name=description]') || (() => {
      const m = document.createElement('meta');
      m.setAttribute('name', 'description');
      document.head.appendChild(m);
      return m;
    })();
    meta.setAttribute(
      'content',
      "A pantry-first kitchen management app. Your shopping list becomes your pantry. Your pantry decides what's for dinner. 204 illustrated recipes, no AI required, no subscription."
    );
  }, []);

  // the public catalogue powers the dish shelf + mosaic (same cache as /browse)
  const { data: pub } = useQuery({
    queryKey: ['public-recipes'],
    queryFn: () => api.publicRecipes(),
    staleTime: 60 * 60 * 1000,
  });
  const recipes = pub?.recipes ?? [];

  return (
    <div className="lp">
      <Nav />
      <Hero />
      <DishShelf recipes={recipes} />
      <Marquee />
      <LoopSection />
      <DictionarySection />
      <RecipeMosaic recipes={recipes} />
      <ContraSection />
      <ModesSection />
      <AuSection />
      <FooterCta />
    </div>
  );
}

/* ---------------- Nav ---------------- */

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <nav className={`lp-nav ${scrolled ? 'scrolled' : ''}`}>
      <div className="lp-nav-inner">
        <Link to="/" className="lp-brand">
          <svg viewBox="0 0 28 28" width={28} height={28} aria-hidden>
            <rect x="1" y="1" width="26" height="26" rx="7" fill="var(--accent)" />
            <text x="14" y="19" textAnchor="middle" fontFamily="var(--serif)" fontSize={14} fill="var(--cream)">
              7
            </text>
          </svg>
          <div>
            <div className="lp-brand-name">7 Day Kitchen</div>
            <div className="lp-brand-tag">7kc.com</div>
          </div>
        </Link>
        <div className="lp-nav-links">
          <a href="#loop" className="lp-nav-link">How it works</a>
          <Link to="/browse" className="lp-nav-link">Recipes</Link>
          <a href="#manifesto" className="lp-nav-link">Manifesto</a>
          <Link to="/login" className="lp-nav-link">Sign in</Link>
          <Link to="/register" className="btn btn-primary">Start free</Link>
        </div>
      </div>
    </nav>
  );
}

/* ---------------- Hero ---------------- */

function Hero() {
  return (
    <section className="lp-hero">
      <div className="lp-hero-grid">
        <div className="lp-hero-text">
          <div className="lp-eyebrow lp-reveal lp-reveal-1">
            <span className="pill">V1.0</span>
            <span>Est. 2026</span>
            <span className="dot">·</span>
            <span>Made in Australia</span>
            <span className="dot">·</span>
            <span>No AI required</span>
          </div>
          <h1 className="lp-h1 lp-reveal lp-reveal-2">
            Use what you've got<span className="period">.</span>
            <span className="line-2">Eat what you love<span className="period">.</span></span>
            <span className="line-3">Waste nothing<span className="period">.</span></span>
          </h1>
          <p className="lp-lede lp-reveal lp-reveal-3">
            A pantry-first kitchen. Your shopping list becomes your pantry.
            Your pantry decides what's for dinner. Nothing gets forgotten at the
            back of the fridge. Nothing expires unseen.
          </p>
          <div className="lp-cta-row lp-reveal lp-reveal-4">
            <Link to="/register" className="btn btn-primary btn-lg">
              Start your pantry — free
              <span className="arrow-glyph">→</span>
            </Link>
            <Link to="/browse" className="btn btn-ghost btn-lg">
              Browse every recipe
            </Link>
          </div>
          <div className="lp-reassurance lp-reveal lp-reveal-5">
            <span className="lp-claim"><span className="tick">✓</span>Free forever</span> <span className="lp-claim"><span className="tick">✓</span>Works offline</span> <span className="lp-claim"><span className="tick">✓</span>No subscription</span> <span className="lp-claim"><span className="tick">✓</span>No AI required</span>
          </div>
        </div>

        <div className="lp-hero-preview lp-reveal lp-reveal-3">
          <HeroPreview />
        </div>
      </div>
    </section>
  );
}

function HeroPreview() {
  return (
    <>
      <div className="lp-preview-card">
        <div className="lp-preview-head">
          <div>
            <h3>Weekly shop</h3>
            <span className="lp-eyebrow" style={{ fontSize: 10 }}>Sunday · Tue 6pm</span>
          </div>
          <span className="meta">6 items</span>
        </div>
        <div className="lp-preview-progress"><span /></div>

        <div className="lp-section-label">
          <span>Produce</span><span>2</span>
        </div>
        <ul className="lp-item-list">
          <li>
            <span className="tick"></span>
            <span className="lp-section-dot lp-section-dot-produce" />
            <span className="name">Bananas</span>
          </li>
          <li>
            <span className="tick"></span>
            <span className="lp-section-dot lp-section-dot-produce" />
            <span className="name">Red capsicum</span>
          </li>
        </ul>

        <div className="lp-section-label" style={{ marginTop: 14 }}>
          <span>Meat &amp; seafood</span><span>2</span>
        </div>
        <ul className="lp-item-list">
          <li>
            <span className="tick"></span>
            <span className="lp-section-dot lp-section-dot-meat" />
            <span className="name">Chicken thighs</span>
          </li>
          <li>
            <span className="tick"></span>
            <span className="lp-section-dot lp-section-dot-meat" />
            <span className="name">Snags</span>
          </li>
        </ul>

        <div className="lp-section-label" style={{ marginTop: 14 }}>
          <span>Dairy</span><span>2</span>
        </div>
        <ul className="lp-item-list">
          <li>
            <span className="tick"></span>
            <span className="lp-section-dot lp-section-dot-dairy" />
            <span className="name">Milk</span>
          </li>
          <li>
            <span className="tick"></span>
            <span className="lp-section-dot lp-section-dot-dairy" />
            <span className="name">Haloumi</span>
          </li>
        </ul>

        <div className="lp-preview-footnote">
          <span>4 of 6 in trolley</span>
          <span className="chip-sage">→ move to pantry</span>
        </div>
      </div>

      {/* secondary card peeking behind */}
      <div className="lp-preview-card secondary" aria-hidden>
        <div className="lp-preview-head">
          <h3 style={{ fontSize: 17 }}>Pantry</h3>
          <span className="meta">18</span>
        </div>
        <ul className="lp-item-list" style={{ fontSize: 12 }}>
          <li className="bought">
            <span className="tick"></span>
            <span className="lp-section-dot lp-section-dot-produce" />
            <span className="name">Baby spinach</span>
            <span className="meta" style={{ color: 'var(--amber-ink)', fontFamily: 'var(--mono)', fontSize: 10 }}>1d left</span>
          </li>
          <li className="bought">
            <span className="tick"></span>
            <span className="lp-section-dot lp-section-dot-meat" />
            <span className="name">Chicken breast</span>
            <span className="meta" style={{ color: 'var(--amber-ink)', fontFamily: 'var(--mono)', fontSize: 10 }}>2d left</span>
          </li>
          <li className="bought">
            <span className="tick"></span>
            <span className="lp-section-dot lp-section-dot-pantry" />
            <span className="name">Tinned tomatoes</span>
            <span className="meta" style={{ fontFamily: 'var(--mono)', fontSize: 10 }}>2y left</span>
          </li>
        </ul>
      </div>
    </>
  );
}

/* ---------------- Marquee ---------------- */

function Marquee() {
  const phrases = [
    'Paste a scribbled list',
    'Tick items off as you shop',
    'Bought becomes pantry',
    'Pantry ranks the recipes',
    'Cook, and watch it decrement',
    'Nothing wasted, nothing forgotten',
  ];
  const doubled = [...phrases, ...phrases];
  return (
    <div className="lp-marquee" aria-hidden>
      <div className="lp-marquee-track">
        {doubled.map((p, i) => (
          <span key={i}>
            {p}
            <span className="sep" style={{ display: 'inline-block', marginLeft: 44 }} />
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------------- The loop ---------------- */

function LoopSection() {
  return (
    <section id="loop" className="lp-section" data-numeral="I">
      <div className="lp-wrap">
        <div className="lp-section-head">
          <div>
            <div className="lp-eyebrow">Chapter one <span className="dot">·</span> the loop</div>
            <h2>The kitchen, looped. No app to leave. No pantry to forget.</h2>
          </div>
          <p className="lp-kicker">
            Most meal planners fail because they ignore what's already in your
            kitchen. 7KC closes the loop — from list to pantry to dinner and
            back — so nothing you buy goes unseen.
          </p>
        </div>

        <div className="lp-loop">
          <LoopStep n="01" title="Shop" copy="Paste a list, tick as you go. No retyping, no quantity tracking, no faff.">
            <div className="row good"><span className="dot" style={{ background: 'var(--sage)' }} /><span className="name">Bananas</span><span className="meta">bought</span></div>
            <div className="row"><span className="dot" style={{ background: 'oklch(0.62 0.12 140)' }} /><span className="name">Red capsicum</span><span className="meta">produce</span></div>
            <div className="row"><span className="dot" style={{ background: 'oklch(0.56 0.15 25)' }} /><span className="name">Snags</span><span className="meta">meat</span></div>
            <div className="row"><span className="dot" style={{ background: 'oklch(0.75 0.08 85)' }} /><span className="name">Haloumi</span><span className="meta">dairy</span></div>
          </LoopStep>

          <LoopStep n="02" title="Stock" copy="Bought items land in your pantry with smart expiry dates. One tap, one pantry.">
            <div className="row warn"><span className="dot" style={{ background: 'oklch(0.62 0.12 140)' }} /><span className="name">Baby spinach</span><span className="meta">1d left</span></div>
            <div className="row warn"><span className="dot" style={{ background: 'oklch(0.56 0.15 25)' }} /><span className="name">Chicken breast</span><span className="meta">2d left</span></div>
            <div className="row"><span className="dot" style={{ background: 'oklch(0.62 0.10 60)' }} /><span className="name">Basmati rice</span><span className="meta">1yr</span></div>
            <div className="row"><span className="dot" style={{ background: 'oklch(0.68 0.08 220)' }} /><span className="name">Frozen peas</span><span className="meta">6mo</span></div>
          </LoopStep>

          <LoopStep n="03" title="Cook" copy="Recipes rank themselves by what you already have — and boost what's expiring soon.">
            <div className="row"><span className="dot" style={{ background: '#c2410c' }} /><span className="name">Spag bol</span><span className="bar"><span style={{ width: '88%' }} /></span></div>
            <div className="row"><span className="dot" style={{ background: '#dc2626' }} /><span className="name">Tikka masala</span><span className="bar"><span style={{ width: '72%' }} /></span></div>
            <div className="row"><span className="dot" style={{ background: '#65a30d' }} /><span className="name">Green Thai curry</span><span className="bar"><span style={{ width: '55%' }} /></span></div>
            <div className="row"><span className="dot" style={{ background: '#f59e0b' }} /><span className="name">Haloumi bowl</span><span className="bar"><span style={{ width: '90%' }} /></span></div>
          </LoopStep>

          <LoopStep n="04" title="Repeat" copy="Cooking decrements your pantry. Running low? It's queued for next week's list automatically.">
            <div className="row good"><span className="dot" style={{ background: 'var(--sage)' }} /><span className="name">Milk</span><span className="meta">added</span></div>
            <div className="row good"><span className="dot" style={{ background: 'var(--sage)' }} /><span className="name">Bread</span><span className="meta">low</span></div>
            <div className="row"><span className="dot" style={{ background: 'oklch(0.56 0.15 25)' }} /><span className="name">Beef mince</span><span className="meta">run out</span></div>
            <div className="row"><span className="dot" style={{ background: 'oklch(0.62 0.12 140)' }} /><span className="name">Bananas</span><span className="meta">new</span></div>
          </LoopStep>
        </div>
      </div>
    </section>
  );
}

function LoopStep({ n, title, copy, children }: { n: string; title: string; copy: string; children: React.ReactNode }) {
  return (
    <div className="lp-loop-step">
      <span className="num">{n} / 04</span>
      <h3>{title}</h3>
      <p>{copy}</p>
      <div className="lp-loop-visual">{children}</div>
    </div>
  );
}

/* ---------------- Dictionary ---------------- */

function DictionarySection() {
  return (
    <section className="lp-section" data-numeral="II">
      <div className="lp-wrap">
        <div className="lp-section-head">
          <div>
            <div className="lp-eyebrow">Chapter two <span className="dot">·</span> the dictionary</div>
            <h2>Paste anything. A <em>real</em> parser does the rest — no cloud round-trips.</h2>
          </div>
          <p className="lp-kicker">
            Recipe dumps, shopping scribbles, a text from your housemate. 7KC
            tokenises, strips quantities, and matches 100+ seeded ingredients
            with Australian aliases built in. You see the matches before
            anything is saved.
          </p>
        </div>

        <div className="lp-dict">
          <div className="lp-dict-card">
            <h4>What you paste</h4>
            <div className="lp-dict-input">
{`2 chicken thighs
500g beef mince
bananas, milk, bread
- capsicum (red)
- 2x tinned tomatoes
coriander
snags for the bbq
weetbix
Tim Tams`}
              <span className="cursor">&nbsp;</span>
            </div>
          </div>

          <div className="lp-dict-card">
            <h4>What 7KC makes of it</h4>
            <ul className="lp-dict-preview">
              <ParsedRow raw="2 chicken thighs" to="Chicken thigh" sectionDot="#c2410c" matched />
              <ParsedRow raw="500g beef mince" to="Beef mince" sectionDot="#c2410c" matched />
              <ParsedRow raw="bananas" to="Bananas" sectionDot="oklch(0.62 0.12 140)" matched />
              <ParsedRow raw="milk" to="Milk" sectionDot="oklch(0.75 0.08 85)" matched />
              <ParsedRow raw="bread" to="Bread" sectionDot="oklch(0.62 0.10 60)" matched />
              <ParsedRow raw="capsicum (red)" to="Red capsicum" sectionDot="oklch(0.62 0.12 140)" matched />
              <ParsedRow raw="2x tinned tomatoes" to="Tinned tomatoes" sectionDot="oklch(0.62 0.10 60)" matched />
              <ParsedRow raw="coriander" to="Coriander" sectionDot="oklch(0.62 0.12 140)" matched />
              <ParsedRow raw="snags for the bbq" to="Snags" sectionDot="#c2410c" matched />
              <ParsedRow raw="weetbix" to="Weet-Bix" sectionDot="oklch(0.62 0.10 60)" matched />
              <ParsedRow raw="Tim Tams" to='add as "Tim Tams"' unmatched />
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function ParsedRow({ raw, to, sectionDot, matched, unmatched }: { raw: string; to: string; sectionDot?: string; matched?: boolean; unmatched?: boolean }) {
  return (
    <li className={matched ? 'matched' : 'unmatched'}>
      <span className="tick">{matched ? '✓' : '+'}</span>
      <span className="raw">{raw}</span>
      <span className="arrow">→</span>
      {matched ? (
        <span className="match">
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: sectionDot }} />
          {to}
        </span>
      ) : (
        <span className="unmatched-label">{to}</span>
      )}
    </li>
  );
}

/* ---------------- Dish shelf + recipe mosaic ---------------- */

/** Curated, archetype-diverse sets so the generated art shows its range. */
const SHELF_SLUGS = [
  'margherita-pizza', 'classic-beef-burger', 'pho', 'green-thai-curry', 'greek-salad',
  'sunday-roast-chook', 'chocolate-brownies', 'paella', 'gyoza', 'smashed-avo-toast',
  'fish-chips', 'pavlova', 'shakshuka', 'tandoori-chicken', 'lemon-tart',
  'full-english-fry-up', 'berry-smoothie-bowl', 'bangers-and-mash-onion-gravy',
];
const MOSAIC_SLUGS = SHELF_SLUGS.slice(0, 12);

function pickBySlug(recipes: RecipeSummary[], slugs: string[]): RecipeSummary[] {
  const by = new Map(recipes.map((r) => [r.slug, r]));
  return slugs.map((sl) => by.get(sl)).filter((r): r is RecipeSummary => Boolean(r));
}

/**
 * The dish shelf — a slow, full-bleed parade of real recipe artwork straight
 * from the generator. Ambient proof that every one of the 204 dishes is drawn.
 * Pauses on hover; static under prefers-reduced-motion.
 */
function DishShelf({ recipes }: { recipes: RecipeSummary[] }) {
  const shelf = pickBySlug(recipes, SHELF_SLUGS);
  if (shelf.length < 8) return null;
  return (
    <section className="lp-shelf" aria-label="A parade of illustrated dishes from the recipe library">
      <div className="lp-shelf-track">
        {[...shelf, ...shelf].map((r, i) => (
          <Link
            key={`${r.slug}-${i}`}
            to={`/r/${r.slug}`}
            className="lp-shelf-item"
            tabIndex={i >= shelf.length ? -1 : 0}
            aria-hidden={i >= shelf.length ? true : undefined}
            title={r.title}
          >
            <MealPlate recipe={r} ingredientIds={r.ingredient_ids} size={124} />
          </Link>
        ))}
      </div>
      <div className="lp-shelf-caption mono">
        204 recipes · every dish drawn from its own ingredients · <Link to="/browse">see them all →</Link>
      </div>
    </section>
  );
}

function RecipeMosaic({ recipes }: { recipes: RecipeSummary[] }) {
  const tiles = pickBySlug(recipes, MOSAIC_SLUGS);
  return (
    <section id="recipes" className="lp-section" data-numeral="III">
      <div className="lp-wrap">
        <div className="lp-section-head">
          <div>
            <div className="lp-eyebrow">Chapter three <span className="dot">·</span> the library</div>
            <h2>Two hundred and four recipes. Every plate drawn, not photographed.</h2>
          </div>
          <p className="lp-kicker">
            Spag bol to shakshuka, snag sangas to pavlova. Each illustration is
            generated from the recipe itself — its ingredients pick the toppings,
            its colours set the palette. Rank by what you've got, filter by
            what's expiring, cook, and the pantry updates itself.
          </p>
        </div>

        <div className="lp-mosaic">
          {tiles.map((r) => (
            <Link key={r.slug} className="lp-recipe-tile" to={`/r/${r.slug}`}>
              <div className="lp-recipe-plate" style={{ aspectRatio: '4/3' }}>
                <MealPlate recipe={r} ingredientIds={r.ingredient_ids} size={300} rounded={false} slice />
              </div>
              <div className="lp-recipe-body">
                <div className="meta">
                  <span>{r.prep_time + r.cook_time} min · {r.servings} serves</span>
                </div>
                <h4>{r.title}</h4>
                <div className="tags">{r.tags.slice(0, 3).join(' · ')}</div>
              </div>
            </Link>
          ))}
        </div>

        <div className="lp-mosaic-cta">
          <Link to="/browse" className="btn btn-ghost btn-lg">
            Browse all 204 recipes <span className="arrow-glyph">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Contra section ---------------- */

function ContraSection() {
  return (
    <section id="manifesto" className="lp-section" data-numeral="IV">
      <div className="lp-wrap">
        <div className="lp-section-head">
          <div>
            <div className="lp-eyebrow">Chapter four <span className="dot">·</span> manifesto</div>
            <h2>Three things you won't find here. Deliberately.</h2>
          </div>
          <p className="lp-kicker">
            Meal planners fail by adding features. 7KC fails — if it does — by
            refusing them. These are the cuts we made, and the reasons we made
            them.
          </p>
        </div>

        <div className="lp-contra">
          <div className="lp-contra-item">
            <span className="mono-label">01 · No AI required</span>
            <span className="struck">AI recipe suggestions</span>
            <p className="why">
              Our matcher is a <strong>2 KB dictionary</strong> and a fuzzy lookup. It
              runs in your browser, works offline, and never hallucinates an
              ingredient you don't own. Curation beats inference. (One
              exception: an optional photo-scan your server operator can switch
              on — off by default, never used for recipes or ranking.)
            </p>
          </div>

          <div className="lp-contra-item">
            <span className="mono-label">02 · No units</span>
            <span className="struck">Grams, cups, partial packs</span>
            <p className="why">
              Pantry items are <strong>"have it"</strong> or <strong>"don't"</strong> — with an
              optional "running low" flag. Quantity tracking is the feature
              that kills every meal-planner UX. We left it out on purpose.
            </p>
          </div>

          <div className="lp-contra-item">
            <span className="mono-label">03 · No paywall</span>
            <span className="struck">Subscription to unlock basics</span>
            <p className="why">
              Shopping lists, pantry, 204 illustrated recipes, offline, groups.
              <strong>&nbsp;All free&nbsp;</strong>forever. You can even use the list feature
              without an account. Sign up when you're ready, not when a modal
              demands it.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Solo vs Group ---------------- */

function ModesSection() {
  return (
    <section className="lp-section" data-numeral="V">
      <div className="lp-wrap">
        <div className="lp-section-head">
          <div>
            <div className="lp-eyebrow">Chapter five <span className="dot">·</span> solo &amp; together</div>
            <h2>Solo by default. Group when you want it. Nothing in between.</h2>
          </div>
          <p className="lp-kicker">
            Most kitchen apps force you into a social graph. Ours hides it
            entirely until you invite someone. When you do, everything becomes
            shared — lists, pantry, suggestions — in real time.
          </p>
        </div>

        <div className="lp-modes">
          <div className="lp-mode-card">
            <span className="kicker">Solo mode · default</span>
            <h3>Your private kitchen.</h3>
            <p>
              Lists, pantry, recipes, cook history. No social feed. No
              "who's cooking" nudges. No empty activity tabs. A clean,
              personal app.
            </p>
            <ul>
              <li><span className="dash">—</span> Private shopping lists</li>
              <li><span className="dash">—</span> Private pantry with expiry tracking</li>
              <li><span className="dash">—</span> Custom recipes</li>
              <li><span className="dash">—</span> Zero social UI</li>
            </ul>
          </div>

          <div className="lp-mode-card group">
            <span className="kicker">Group mode · activated on invite</span>
            <h3>One kitchen, up to eight cooks.</h3>
            <p>
              Invite a partner or housemates. Everything becomes shared the
              moment they join — one pantry, one list, one cooked-meals feed.
              Leave the group and you go back to solo.
            </p>
            <ul>
              <li><span className="dash">—</span> Real-time shared lists &amp; pantry</li>
              <li><span className="dash">—</span> Meal suggestions, likes, comments</li>
              <li><span className="dash">—</span> A muted activity feed</li>
              <li><span className="dash">—</span> 2–8 members per kitchen</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- AU aliases ---------------- */

function AuSection() {
  return (
    <section className="lp-au">
      <div className="lp-wrap">
        <div className="lp-eyebrow">Chapter six <span className="dot">·</span> local vocabulary</div>
        <h2>We speak <em>Australian</em>. Your list doesn't translate itself.</h2>
        <p className="lp-kicker" style={{ color: 'oklch(0.72 0.04 60)', maxWidth: '52ch', marginTop: 8 }}>
          Snags, chook, avo, spuds, kumara, mushies. Paste what you'd actually
          write on the fridge, not what an American recipe site thinks you meant.
        </p>

        <div className="lp-au-grid">
          <Alias lhs="snags" rhs="sausages" />
          <Alias lhs="chook" rhs="whole chicken" />
          <Alias lhs="avo" rhs="avocado" />
          <Alias lhs="capsicum" rhs="bell pepper" />
          <Alias lhs="coriander" rhs="cilantro" />
          <Alias lhs="spuds" rhs="potatoes" />
          <Alias lhs="mushies" rhs="mushrooms" />
          <Alias lhs="Weet-Bix" rhs="cereal of note" />
          <Alias lhs="Vegemite" rhs="your birthright" />
          <Alias lhs="kumara" rhs="sweet potato" />
        </div>
      </div>
    </section>
  );
}

function Alias({ lhs, rhs }: { lhs: string; rhs: string }) {
  return (
    <div className="row">
      <span className="lhs">{lhs}</span>
      <span className="eq">⟶</span>
      <span className="rhs">{rhs}</span>
    </div>
  );
}

/* ---------------- Footer CTA ---------------- */

function FooterCta() {
  return (
    <>
      <section className="lp-footer-cta">
        <div className="lp-wrap">
          <h2>
            Use what you've got<span className="period">.</span>
            <br />
            <em>Eat what you love<span className="period">.</span></em>
            <br />
            Waste nothing<span className="period">.</span>
          </h2>
          <p>
            Populate your pantry in a week. Never open the app to a blank
            screen again. Free forever — cook along with us.
          </p>
          <Link to="/register" className="btn btn-primary btn-lg">
            Start your pantry <span className="arrow-glyph">→</span>
          </Link>
          <div className="lp-reassurance" style={{ marginTop: 16 }}>
            <span className="lp-claim"><span className="tick">✓</span>Takes 30 seconds</span> <span className="lp-claim"><span className="tick">✓</span>No credit card</span> <span className="lp-claim"><span className="tick">✓</span>Delete your data any time</span>
          </div>
        </div>
      </section>

      <footer className="lp-foot">
        <div className="lp-foot-inner">
          <div>
            <a href="/">7kc.com</a>
            <a href="#loop">How it works</a>
            <a href="#recipes">Recipes</a>
            <a href="#manifesto">Manifesto</a>
          </div>
          <div>
            Made in Australia · © 2026 · No cookies, no tracking, no bullshit.
          </div>
        </div>
      </footer>
    </>
  );
}
