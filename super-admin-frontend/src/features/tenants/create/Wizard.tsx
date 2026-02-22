import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useCreateTenant } from './useCreateTenant';
import { WIZARD_STEPS } from './constants';
import StepBasicInfo from './StepBasicInfo';
import StepAddressSettings from './StepAddressSettings';
import StepBusiness from './StepBusiness';
import StepFeaturesQuotas from './StepFeaturesQuotas';
import ReviewBar from './ReviewBar';
import { TenantCreationSuccessModal } from '@/components/screens/TenantCreationSuccessModal';

export default function Wizard() {
  const {
    form,
    currentStep,
    isFirstStep,
    isLastStep,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    subdomainAvailability,
    isSubmitting,
    submitForm,
    isSuccessModalOpen,
    successData,
    closeSuccessModal
  } = useCreateTenant();

  // Calculate progress percentage
  const progressPercentage = ((currentStep + 1) / WIZARD_STEPS.length) * 100;

  // Render current step component
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <StepBasicInfo form={form} subdomainAvailability={subdomainAvailability} />;
      case 1:
        return <StepAddressSettings form={form} />;
      case 2:
        return <StepBusiness form={form} />;
      case 3:
        return <StepFeaturesQuotas form={form} />;
      default:
        return null;
    }
  };

  // Handle next step
  const handleNext = () => {
    if (isLastStep) {
      submitForm();
    } else {
      goToNextStep();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Progress Header */}
            <Card className="mb-6">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-4">
                  <CardTitle className="text-lg">
                    Step {currentStep + 1} of {WIZARD_STEPS.length}: {WIZARD_STEPS[currentStep]?.label}
                  </CardTitle>
                  <span className="text-sm text-gray-500">
                    {Math.round(progressPercentage)}% Complete
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
                
                {/* Step Navigation (compact: only titles, improved disabled look) */}
                <div className="flex items-center justify-between mt-4 gap-2">
                  {WIZARD_STEPS.map((step, index) => (
                    <button
                      key={step.id}
                      onClick={() => goToStep(index)}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                        index === currentStep
                          ? 'bg-blue-50 text-blue-700 ring-blue-200'
                          : index < currentStep
                          ? 'bg-green-50 text-green-700 hover:bg-green-100 ring-green-200'
                          : 'bg-gray-50 text-gray-500'
                      } ${index > currentStep ? 'opacity-70' : 'hover:shadow'}
                      `}
                      disabled={index > currentStep}
                      aria-current={index === currentStep ? 'step' : undefined}
                    >
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                        index === currentStep
                          ? 'bg-blue-600 text-white'
                          : index < currentStep
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}>
                        {index + 1}
                      </span>
                      <div className="ml-1">
                        <div className="font-medium">{step.label}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardHeader>
            </Card>

            {/* Step Content */}
            <Card>
              <CardHeader>
                <CardTitle>{WIZARD_STEPS[currentStep]?.label}</CardTitle>
                <p className="text-sm text-gray-600">
                  {WIZARD_STEPS[currentStep]?.description}
                </p>
              </CardHeader>
              <CardContent>
                {renderStepContent()}
              </CardContent>
            </Card>

            {/* Navigation Footer */}
            <div className="flex items-center justify-between mt-6">
              <Button
                variant="outline"
                onClick={goToPreviousStep}
                disabled={isFirstStep || isSubmitting}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </Button>

              <div className="flex items-center gap-4">
                {currentStep > 0 && (
                  <span className="text-sm text-gray-500">
                    You can go back to make changes
                  </span>
                )}
              </div>

              <Button
                onClick={handleNext}
                // disabled={!canProceed || isSubmitting}
                className="flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : isLastStep ? (
                  'Create Tenant'
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Review Sidebar */}
          <div className="lg:col-span-1">
            <ReviewBar form={form} currentStep={currentStep} />
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {successData && (
        <TenantCreationSuccessModal
          isOpen={isSuccessModalOpen}
          onClose={closeSuccessModal}
          data={successData}
        />
      )}
    </div>
  );
}
