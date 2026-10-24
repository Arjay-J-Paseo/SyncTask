import { useState } from 'react';
import { IconCheck } from '../components/icons';
import { useWorkspace } from '../context/MockWorkspaceContext';
import { formatBytes } from '../utils/format';
import { INCLUDED_WORKSPACE_STORAGE_BYTES, STORAGE_ADD_ONS } from '../utils/constants';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import './Plans.css';

export default function Plans() {
  const { workspace, files, role } = useWorkspace();
  const [selectedOption, setSelectedOption] = useState(null);
  const usedBytes = files.reduce((sum, file) => sum + (Number(file.size_bytes) || 0), 0);
  const isLeader = ['owner', 'admin', 'leader'].includes(String(role || '').toLowerCase());
  const options = STORAGE_ADD_ONS.map((option, index) => ({
      name: `Extra ${formatBytes(option.extraBytes)}`,
      price: String(option.price),
      sub: 'Proposed demo price per month.',
      features: [`${formatBytes(option.extraBytes)} of extra shared storage`, 'Shared by the workspace', 'No membership or feature tier'],
      highlight: index === 1
  }));

  return (
    <div>
      <div className="plans-head">
        <div className="plans-eyebrow">WORKSPACE STORAGE</div>
        <h1 className="plans-title">Shared storage options</h1>
        {workspace && (
          <p className="plans-sub">
            {workspace.name}: {formatBytes(usedBytes)} used of {formatBytes(INCLUDED_WORKSPACE_STORAGE_BYTES)} included
            {' · '}{formatBytes(Math.max(0, INCLUDED_WORKSPACE_STORAGE_BYTES - usedBytes))} remaining
          </p>
        )}
        <p className="plans-sub">SyncTask features are not separated into paid membership tiers.</p>
      </div>

      <div className="plans-grid">
        {options.map(option => (
          <div key={option.name} className={`plans-card ${option.highlight ? 'highlight' : ''}`}>
            <div className="plans-name">{option.name}</div>
            <div className="plans-sub">{option.sub}</div>
            <div className="plans-amount">
              {option.price === 'Free' ? <span className="plans-price-free">Free</span> : (
                <><span className="plans-currency">&#8369;</span><span className="plans-num">{option.price}</span></>
              )}
            </div>
            <div className="plans-divider" />
            <div className="plans-features">
              {option.features.map(feature => (
                <div key={feature} className="plans-feature">
                  <IconCheck style={{ width: 15, height: 15 }} /><span>{feature}</span>
                </div>
              ))}
            </div>
            {option.price !== 'Free' && (
              <button
                type="button"
                className={`btn btn-block ${option.highlight ? 'btn-accent' : 'btn-secondary'} plans-cta`}
                disabled={!isLeader}
                onClick={() => setSelectedOption(option)}
              >
                {isLeader ? 'View demo option' : 'Ask a workspace leader'}
              </button>
            )}
          </div>
        ))}
      </div>
      <p className="plans-sub" style={{ textAlign: 'center', marginTop: 20 }}>
        {isLeader
          ? 'Only workspace leaders can manage storage options. Add-ons are proposed demo prices; purchasing is not connected.'
          : 'Only workspace owners, admins, or leaders can manage storage options. Contact a leader if the workspace needs more space.'}
      </p>

      <Modal open={!!selectedOption} onClose={() => setSelectedOption(null)} maxWidth={520}>
        <div className="modal-header">Demo storage option</div>
        <div className="modal-body">
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>{selectedOption?.name}</h2>
          <p>Proposed monthly price: &#8369;{selectedOption?.price}</p>
          <p style={{ marginTop: 12 }}><strong>Demo only — no payment is processed and no storage is added.</strong></p>
          <p style={{ marginTop: 12 }}>Storage add-ons are not connected to checkout or workspace capacity yet.</p>
        </div>
        <div className="modal-footer">
          <Button variant="secondary" onClick={() => setSelectedOption(null)}>Close</Button>
        </div>
      </Modal>
    </div>
  );
}
