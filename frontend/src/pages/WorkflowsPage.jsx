import { useState } from 'react';
import { agentAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function WorkflowsPage() {
  const [running, setRunning] = useState(null);
  const [result, setResult] = useState(null);
  const toast = useToast();

  const workflows = [
    {
      id: 'plan_day',
      icon: '📋',
      title: 'Plan My Day',
      description: 'Analyzes your tasks and events to create an optimized daily plan',
      color: '#6366f1',
      steps: ['Fetch today\'s events', 'Get pending tasks', 'Analyze task priorities', 'Generate schedule']
    },
    {
      id: 'weekly_summary',
      icon: '📊',
      title: 'Weekly Summary',
      description: 'Aggregates tasks completed, events attended, and notes created this week',
      color: '#22c55e',
      steps: ['Fetch week events', 'Get completed tasks', 'Calculate statistics', 'Generate report']
    },
    {
      id: 'create_project',
      icon: '🚀',
      title: 'Create Project',
      description: 'Creates a full project setup with tasks, timeline, notes, and kickoff meeting',
      color: '#f59e0b',
      steps: ['Create project note', 'Generate task list', 'Set milestones', 'Schedule kickoff']
    }
  ];

  const runWorkflow = async (workflowId) => {
    setRunning(workflowId);
    setResult(null);
    try {
      const res = await agentAPI.runWorkflow(workflowId);
      setResult(res.data);
      toast.success('Workflow completed successfully!');
    } catch (err) {
      toast.error('Workflow failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setRunning(null);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">⚡ Workflows</h1>
          <p className="page-subtitle">Multi-step automated workflows powered by AI agents</p>
        </div>
      </div>

      <div className="page-body">
        <div className="grid-3">
          {workflows.map((wf) => (
            <div key={wf.id} className="card animate-fadeIn"
              style={{ borderTop: `3px solid ${wf.color}`, cursor: 'pointer' }}
              onClick={() => !running && runWorkflow(wf.id)}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>{wf.icon}</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>{wf.title}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
                {wf.description}
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                {wf.steps.map((step, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <div style={{
                      width: '20px', height: '20px', borderRadius: '50%',
                      background: `${wf.color}20`, color: wf.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.65rem', fontWeight: 700, flexShrink: 0
                    }}>{i + 1}</div>
                    {step}
                  </div>
                ))}
              </div>

              <button className="btn btn-primary" style={{ width: '100%' }}
                disabled={running === wf.id}>
                {running === wf.id ? (
                  <><span className="spinner"></span> Running...</>
                ) : (
                  <>▶ Run Workflow</>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Workflow Result */}
        {result && (
          <div className="card animate-slideUp" style={{ marginTop: '24px' }}>
            <div className="card-header">
              <h3 className="card-title">✅ Workflow Result</h3>
              <span className="badge badge-success">Completed</span>
            </div>
            <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '16px' }}>
              {result.message}
            </div>
            
            {result.steps && (
              <>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                  Execution Steps ({result.steps.length})
                </h4>
                <div className="workflow-steps">
                  {result.steps.map((step, i) => (
                    <div key={i} className="workflow-step">
                      <div className="step-number">{step.step}</div>
                      <span className="step-agent">{step.agent}</span>
                      <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{step.action}</span>
                      <span className="badge badge-success">✓</span>
                      {step.result?.duration && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-accent)' }}>{step.result.duration}ms</span>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
