import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { StepIndicator } from '../../components/ui';
import { useOnboardStore } from '../../store/onboardStore';

const STEPS = ['Upload Resume', 'Pick a Job', 'Skill Gap', 'Roadmap'];

const STEP_ROUTES = ['/onboard', '/onboard/job', '/onboard/gap', '/onboard/roadmap'];

function getStepIndex(pathname) {
  const exact = STEP_ROUTES.findIndex((r) => r === pathname);
  return exact >= 0 ? exact : 0;
}

export default function OnboardFlow() {
  const location = useLocation();
  const navigate = useNavigate();
  const { resumeId } = useOnboardStore();

  const currentStep = getStepIndex(location.pathname);

  // Guard: if user lands partway without completing prior steps, redirect to start
  useEffect(() => {
    if (currentStep > 0 && !resumeId) {
      navigate('/onboard', { replace: true });
    }
  }, [currentStep, resumeId, navigate]);

  return (
    <div className="min-h-screen bg-slate-950 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <StepIndicator steps={STEPS} current={currentStep} />
        </div>
        <Outlet />
      </div>
    </div>
  );
}
