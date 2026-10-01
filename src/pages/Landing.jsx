import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LogoImage } from '../components/icons';
import './Landing.css';

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialogPlan, setDialogPlan] = useState(null);
  const [insightsOpen, setInsightsOpen] = useState(false);

  useEffect(() => {
    const els = document.querySelectorAll('.lv2-reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('lv2-reveal-in');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  function openDialog(plan) {
    setDialogPlan(plan);
  }

  function closeDialog() {
    setDialogPlan(null);
  }

  function closeMobileMenu() {
    setMenuOpen(false);
  }

  function scrollToTop() {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }

  return (
    <div className="landing-v2">
      <header className="header wrap">
        <Link className="logo" to="/" aria-label="SyncTask home">
          <LogoImage size={32} />
          <span>SyncTask</span>
        </Link>

        <button
          className="menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="navigation"
          onClick={() => setMenuOpen(v => !v)}
        >
          Menu
        </button>

        <nav id="navigation" className={menuOpen ? 'open' : ''} aria-label="Main navigation">
          <a href="#features" onClick={closeMobileMenu}>Features</a>
          <a href="#analytics" onClick={closeMobileMenu}>Analytics</a>
          <a href="#pricing" onClick={closeMobileMenu}>Pricing</a>
          <Link className="button outline" to="/login" onClick={closeMobileMenu}>Log in</Link>
          <Link className="button" to="/signup" onClick={closeMobileMenu}>Sign up</Link>
        </nav>
      </header>

      <main id="main">
        <section className="hero lavender">
          <div className="wrap hero-grid">
            <div className="hero-text">
              <p className="eyebrow">A little structure. A lot of progress.</p>
              <h1>Great projects.<br />Shared progress.</h1>
              <p className="intro">
                Bring your tasks, team, and tools together. Know what's moving — and what needs a little attention.
              </p>
              <div className="actions">
                <button className="button" onClick={() => openDialog('Starter')}>
                  Get started free
                </button>
                <a className="button white" href="#features">
                  Explore features <span aria-hidden="true">↗</span>
                </a>
              </div>
              <p className="fine-print">No credit card. No complicated setup.</p>
            </div>

            <article className="project-card hero-card" aria-label="Example project dashboard">
              <p className="eyebrow">Your team, in sync</p>
              <h2>Website launch</h2>
              <p className="muted small">A clear view of the finish line.</p>

              <div className="stats">
                <div>
                  <strong>24</strong>
                  <span>Tasks</span>
                </div>
                <div>
                  <strong>7</strong>
                  <span>In progress</span>
                </div>
                <div>
                  <strong>56%</strong>
                  <span>Complete</span>
                </div>
              </div>

              <h3 className="small">This week</h3>
              <ul className="task-list">
                <li>Polish the landing page <span>In progress</span></li>
                <li>Review mobile layouts <span>Review</span></li>
                <li>Share launch checklist <span>Done</span></li>
              </ul>
            </article>
          </div>
        </section>

        <section className="features wrap lv2-reveal" id="features">
          <p className="eyebrow">Your toolkit for a better workday</p>
          <h2>Everything your team needs to move forward.</h2>

          <div className="feature-grid">
            <article>
              <div className="accent-line"></div>
              <h3>Keep work in one place</h3>
              <p>Organize tasks, share files, and give everyone a clear view of what's happening.</p>
            </article>
            <article>
              <div className="accent-line"></div>
              <h3>Make contributions visible</h3>
              <p>See progress at a glance and celebrate every step forward.</p>
            </article>
            <article>
              <div className="accent-line"></div>
              <h3>Turn updates into action</h3>
              <p>Stay aligned, avoid surprises, and follow up on the things that really matter.</p>
            </article>
          </div>
        </section>

        <section className="lavender lv2-reveal" id="analytics">
          <div className="wrap analytics-grid">
            <div>
              <p className="eyebrow">Better insights</p>
              <h2>Less guessing.<br />More progress.</h2>
              <p className="intro">
                Turn everyday work into clear insights. See where your team's time goes.
              </p>
              <button
                className="button white"
                aria-expanded={insightsOpen}
                aria-controls="insights"
                onClick={() => setInsightsOpen(v => !v)}
              >
                {insightsOpen ? 'Hide detailed stats ↑' : 'Explore detailed stats ↗'}
              </button>
              {insightsOpen && (
                <p id="insights" className="insights">
                  Your team completed 146 tasks this week. Thursday led the way with 30 tasks completed.
                </p>
              )}
            </div>

            <figure className="chart-card">
              <figcaption>
                <h3>Tasks completed</h3>
                <p className="muted small">This week</p>
              </figcaption>

              <div
                className="chart"
                role="img"
                aria-label="Tasks completed: Monday 12, Tuesday 20, Wednesday 15, Thursday 30, Friday 25, Saturday 18, Sunday 26."
              >
                <div style={{ '--value': '40%' }}><span>12</span><i></i><small>Mon</small></div>
                <div style={{ '--value': '67%' }}><span>20</span><i></i><small>Tue</small></div>
                <div style={{ '--value': '50%' }}><span>15</span><i></i><small>Wed</small></div>
                <div className="highlight" style={{ '--value': '100%' }}><span>30</span><i></i><small>Thu</small></div>
                <div style={{ '--value': '83%' }}><span>25</span><i></i><small>Fri</small></div>
                <div style={{ '--value': '60%' }}><span>18</span><i></i><small>Sat</small></div>
                <div style={{ '--value': '87%' }}><span>26</span><i></i><small>Sun</small></div>
              </div>
            </figure>
          </div>
        </section>

        <section className="pricing wrap lv2-reveal" id="pricing">
          <p className="eyebrow">For every kind of team</p>
          <h2>Start small. Grow together.</h2>

          <div className="pricing-grid">
            <article className="plan">
              <h3>Starter</h3>
              <p>For everyday plans.</p>
              <div className="price">Free</div>
              <ul>
                <li>Up to 10 members</li>
                <li>5 active projects</li>
                <li>10 GB storage</li>
                <li>Basic task management</li>
                <li>Community support</li>
              </ul>
              <button className="button outline" onClick={() => openDialog('Starter')}>
                Get started free
              </button>
            </article>

            <article className="plan featured">
              <h3>Plus</h3>
              <p>For growing teams.</p>
              <div className="price">₱109<span> / month</span></div>
              <ul>
                <li>Up to 50 members</li>
                <li>20 active projects</li>
                <li>50 GB storage</li>
                <li>Advanced analytics</li>
                <li>Custom project workflows</li>
              </ul>
              <button className="button" onClick={() => openDialog('Plus')}>Choose Plus</button>
            </article>

            <article className="plan">
              <h3>Pro</h3>
              <p>For bigger goals.</p>
              <div className="price">₱199<span> / month</span></div>
              <ul>
                <li>Up to 100 members</li>
                <li>100 active projects</li>
                <li>100 GB storage</li>
                <li>Custom integrations</li>
                <li>Account-wide insights</li>
              </ul>
              <button className="button outline" onClick={() => openDialog('Pro')}>
                Explore Pro
              </button>
            </article>
          </div>
        </section>

        <section className="cta lv2-reveal">
          <div className="wrap">
            <h2>Your next great project starts here.</h2>
            <p>Give your team a shared place to make it happen.</p>
            <button className="button" onClick={() => openDialog('Starter')}>
              Get started free
            </button>
          </div>
        </section>
      </main>

      <footer className="wrap">
        <Link className="logo" to="/" aria-label="SyncTask home">
          <LogoImage size={32} />
          <span>SyncTask</span>
        </Link>
        <p>Great projects. Better teamwork.</p>
        <button
          type="button"
          className="button outline"
          onClick={scrollToTop}
        >
          Back to top ↑
        </button>
      </footer>

      {dialogPlan && (
        <div className="plan-dialog-backdrop" onClick={closeDialog}>
          <div className="plan-dialog" onClick={(e) => e.stopPropagation()}>
            <button className="close" aria-label="Close dialog" onClick={closeDialog}>×</button>
            <p className="eyebrow">Let's get organized</p>
            <h2>Your {dialogPlan} plan</h2>
            <p>Your selected plan is ready to connect to a signup or checkout service.</p>
            <button className="button close-dialog" onClick={closeDialog}>Continue exploring</button>
          </div>
        </div>
      )}
    </div>
  );
}