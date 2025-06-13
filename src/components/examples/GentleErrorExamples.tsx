
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { GentleError, GentleFieldError } from '@/components/ui/gentle-error';
import { GentleFormField } from '@/components/forms/GentleFormField';
import { useGentleErrorHandler } from '@/hooks/useGentleErrorHandler';

export function GentleErrorExamples() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [showSaveError, setShowSaveError] = useState(false);
  const { handleSaveError, handleValidationError, handleNetworkError, handleSuccess } = useGentleErrorHandler();

  const validateEmail = (value: string) => {
    if (!value) {
      setEmailError('Email address is required');
      return false;
    }
    if (!value.includes('@')) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (emailError) {
      validateEmail(value);
    }
  };

  const handleSave = () => {
    // Simulate save error
    setShowSaveError(true);
    handleSaveError(
      'Unable to save your changes right now',
      'Don\'t worry, your work is safe. Please try again in a moment.',
      { 
        onRetry: () => {
          setShowSaveError(false);
          handleSuccess('Changes saved successfully!');
        }
      }
    );
  };

  const handleNetworkTest = () => {
    handleNetworkError(
      'Connection seems slow',
      'We\'re still trying to connect. This might take a moment.',
      {
        onRetry: () => handleSuccess('Connection restored!')
      }
    );
  };

  const handleValidationTest = () => {
    if (!validateEmail(email)) {
      handleValidationError(
        'Please check your email address',
        'We need a valid email to send you updates.'
      );
    } else {
      handleSuccess('Email looks good!');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-4">Gentle Error Examples</h2>
        <p className="text-sm text-muted-foreground mb-6">
          These examples show humane error handling with soft colors, gentle animations, and helpful guidance.
        </p>
      </div>

      {/* Field-level validation */}
      <div className="space-y-4">
        <h3 className="font-medium">Field Validation</h3>
        <GentleFormField
          label="Email Address"
          error={emailError}
          suggestion={emailError ? "Try something like: yourname@example.com" : undefined}
          fieldName="email"
          required
        >
          <Input
            type="email"
            value={email}
            onChange={handleEmailChange}
            onBlur={() => validateEmail(email)}
            placeholder="Enter your email"
            className={emailError ? "gentle-error" : ""}
          />
        </GentleFormField>
      </div>

      {/* Save error example */}
      <div className="space-y-4">
        <h3 className="font-medium">Save Errors</h3>
        {showSaveError && (
          <GentleError
            type="save"
            message="Unable to save your changes right now"
            suggestion="Don't worry, your work is safe. Please try again in a moment."
            onRetry={() => {
              setShowSaveError(false);
              handleSuccess('Changes saved successfully!');
            }}
            onDismiss={() => setShowSaveError(false)}
          />
        )}
        <Button onClick={handleSave} variant="outline" className="w-full">
          Trigger Save Error
        </Button>
      </div>

      {/* Toast examples */}
      <div className="space-y-4">
        <h3 className="font-medium">Toast Notifications</h3>
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={handleNetworkTest} variant="outline" size="sm">
            Network Error
          </Button>
          <Button onClick={handleValidationTest} variant="outline" size="sm">
            Validation Test
          </Button>
        </div>
      </div>

      {/* Direct error components */}
      <div className="space-y-4">
        <h3 className="font-medium">Different Error Types</h3>
        
        <GentleError
          type="validation"
          message="Please fill in all required fields"
          suggestion="The fields marked with * are required to continue."
        />
        
        <GentleError
          type="permission"
          message="Additional permissions needed"
          suggestion="Contact your workspace admin to request edit access."
        />
        
        <GentleError
          type="network"
          message="Slow connection detected"
          suggestion="We're still working in the background. This might take a moment."
        />
      </div>
    </div>
  );
}
