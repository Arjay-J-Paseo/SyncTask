import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconCheck } from '../components/icons';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/MockWorkspaceContext';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import './Plans.css';

const PLAN_SELECTION_KEY = 'synctask:selectedPlan';
const PLAN_STAGE_KEY = 'synctask:demoSubscriptionStage';

function readPlanState() {
  try {
    const selectedPlan = sessionStorage.getItem(PLAN_SELECTION_KEY) || '';
    const storedStage = sessionStorage.getItem(PLAN_STAGE_KEY);
    return {
      selectedPlan,
      stage: storedStage || (selectedPlan ? 'checkout' : 'plans')
    };
  } catch {
    return { selectedPlan: '', stage: 'plans' };
  }
}

export default function Plans() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  const [planState, setPlanState] = useState(readPlanState);
  const { selectedPlan, stage } = planState;
  const [checkoutOpen, setCheckoutOpen] = useState(() =>
    planState.stage === 'checkout' || planState.stage === 'activated'
  );

  const plans = [
    {
      name: 'Free',
      price: 'Free',
      sub: 'For small teams just getting started.',
      features: ['Up to 5 members', 'Basic task management', 'Contribution tracking', 'Community support'],
      cta: 'Get started free',
      highlight: false
    },
    {
      name: 'Plus',
      price: '109',
      priceSuffix: '/ month',
      sub: 'For growing teams that need more power.',
      features: ['Up to 50 members', 'Advanced analytics', 'Custom project workflows', 'Priority support'],
      cta: 'Subscribe',
      highlight: true
    },
    {
      name: 'Pro',
      price: '199',
      priceSuffix: '/ month',
      sub: 'For large teams shipping at scale.',
      features: ['Up to 150 members', 'Custom integrations', 'Advanced reporting', 'Dedicated support'],
      cta: 'Subscribe',
      highlight: false
    }
  ];

  const selectedPlanDetails = plans.find(plan => plan.name === selectedPlan);
  const demoActivated = stage === 'activated';

  function savePlanState(planName, nextStage) {
    setPlanState({ selectedPlan: planName, stage: nextStage });
    try {
      sessionStorage.setItem(PLAN_SELECTION_KEY, planName);
      sessionStorage.setItem(PLAN_STAGE_KEY, nextStage);
    } catch {
      // Keep the simulated plan state in React if browser storage is unavailable.
    }
  }

  function selectPlan(planName) {
    if (selectedPlan === planName && demoActivated) {
      setCheckoutOpen(true);
      return;
    }
    savePlanState(planName, 'checkout');
    setCheckoutOpen(true);
  }

  function cancelDemoCheckout() {
    if (!demoActivated && selectedPlan) savePlanState(selectedPlan, 'plans');
    setCheckoutOpen(false);
  }

  function confirmDemoSubscription() {
    if (!selectedPlanDetails) return;
    savePlanState(selectedPlan, 'activated');
  }

  function continueToWorkspace() {
    if (!selectedPlanDetails || !demoActivated) return;
    if (!user) {
      navigate('/signup');
      return;
    }

    if (workspace) {
      try {
        sessionStorage.removeItem(PLAN_SELECTION_KEY);
        sessionStorage.removeItem(PLAN_STAGE_KEY);
      } catch {
        // The selection is only a frontend preference.
      }
      navigate('/dashboard');
      return;
    }

    navigate('/welcome');
  }

  function formatPrice(plan) {
    return plan.price === 'Free'
      ? 'Free'
      : `$${plan.price}${plan.priceSuffix ? ` ${plan.priceSuffix}` : ''}`;
  }

  return (
    <div>
      <div className="plans-head">
        <div className="plans-eyebrow">CHOOSE THE PLAN THAT SUITS FOR YOU</div>
        <h1 className="plans-title">Upgrade your Plan</h1>
      </div>

      <div className="plans-grid">
        {plans.map(plan => (
          <div key={plan.name} className={`plans-card ${plan.highlight ? 'highlight' : ''}`}>
            <div className="plans-name">{plan.name}</div>
            <div className="plans-sub">{plan.sub}</div>

            <div className="plans-amount">
              {plan.price === 'Free' ? (
                <span className="plans-price-free">Free</span>
              ) : (
                <>
                  <span className="plans-currency">$</span>
                  <span className="plans-num">{plan.price}</span>
                  <span className="plans-suffix">{plan.priceSuffix}</span>
                </>
              )}
            </div>

            <div className="plans-divider" />

            <div className="plans-features">
              {plan.features.map((f, i) => (
                <div key={i} className="plans-feature">
                  <IconCheck style={{ width: 15, height: 15 }} />
                  <span>{f}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              className={`btn btn-block ${plan.highlight ? 'btn-accent' : 'btn-secondary'} plans-cta`}
              onClick={() => selectPlan(plan.name)}
              aria-pressed={selectedPlan === plan.name}
            >
              {selectedPlan === plan.name ? 'Selected' : `Select ${plan.name}`}
            </button>
          </div>
        ))}
      </div>

      <Modal open={checkoutOpen && !!selectedPlanDetails} onClose={cancelDemoCheckout} maxWidth={520}>
        <div className="modal-header">Demo Subscription</div>
        <div className="modal-body">
          {demoActivated ? (
            <>
              <h2 style={{ fontSize: 20, marginBottom: 8 }}>Demo subscription activated</h2>
              <p>This is a simulated subscription for demonstration purposes.</p>
              <p style={{ marginTop: 14 }}>
                <strong>{selectedPlanDetails?.name}</strong> · {selectedPlanDetails && formatPrice(selectedPlanDetails)}
              </p>
            </>
          ) : (
            <>
              <p><strong>Simulation only — no real payment will be processed.</strong></p>
              <p style={{ marginTop: 14 }}>
                Selected plan: <strong>{selectedPlanDetails?.name}</strong>
              </p>
              <p>Price: {selectedPlanDetails && formatPrice(selectedPlanDetails)}</p>
              <ul style={{ margin: '14px 0 0', paddingLeft: 22 }}>
                {selectedPlanDetails?.features.map(feature => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </>
          )}
        </div>
        <div className="modal-footer">
          {demoActivated ? (
            <Button variant="accent" onClick={continueToWorkspace}>
              Continue to Workspace
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={cancelDemoCheckout}>Cancel</Button>
              <Button variant="accent" onClick={confirmDemoSubscription}>
                Confirm Demo Subscription
              </Button>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
