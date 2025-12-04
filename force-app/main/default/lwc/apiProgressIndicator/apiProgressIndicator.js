import { LightningElement, api } from 'lwc';
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';
import { updateRecord, getRecordNotifyChange } from 'lightning/uiRecordApi';
import { RefreshEvent } from 'lightning/refresh';

export default class ApiProgressIndicator extends LightningElement {
    @api step1Label = 'Connecting to External System';
    @api step2Label = 'Locating Patient';
    @api step3Label = 'Querying Appointment Records';
    @api step4Label = 'Returning Results';
    @api step5Label = 'Updating Salesforce';
    @api stepDuration = 2000;
    @api autoStart = false;
    @api buttonColor = '#007c7c';
    @api buttonTextColor = '#ffffff';
    @api hideManualButton = false;
    @api hideApiButton = false;
    @api manualButtonLabel = 'Verify Benefits Manually';
    @api apiButtonLabel = 'Verify Benefits via API';
    @api recordId;
    @api fieldApiName = '';
    @api fieldValue = '';
    @api updateRecordOnComplete = false;
    @api showAsCard = false;
    @api cardTitle = 'Verification Progress';

    @api isProgressComplete = false;
    @api completionMessage = 'In-Network. Pre-authorization required.';
    @api completionTimestamp = '';
    @api verificationMethod = '';
    
    currentStep = 0;
    steps = [];
    timeouts = [];
    isInProgress = false;
    hasStarted = false;
    buttonClicked = false;

    get buttonStyle() {
        return `background-color: ${this.buttonColor}; color: ${this.buttonTextColor};`;
    }

    connectedCallback() {
        this.initializeSteps();
        if (this.autoStart) {
            this.startProgress();
        }
    }

    disconnectedCallback() {
        this.timeouts.forEach(timeout => clearTimeout(timeout));
    }

    handleManualClick() {
        this.verificationMethod = 'manual';
        this.buttonClicked = true;
        
        const attributeChangeEvent = new FlowAttributeChangeEvent('verificationMethod', 'manual');
        this.dispatchEvent(attributeChangeEvent);
    }

    handleApiClick() {
        this.verificationMethod = 'API';
        this.buttonClicked = true;
        
        const attributeChangeEvent = new FlowAttributeChangeEvent('verificationMethod', 'API');
        this.dispatchEvent(attributeChangeEvent);
        
        this.startProgress();
    }

    initializeSteps() {
        // Create all steps
        const allSteps = [
            {
                id: 'step1',
                label: this.step1Label,
                isActive: false,
                isComplete: false,
                isLast: false
            },
            {
                id: 'step2',
                label: this.step2Label,
                isActive: false,
                isComplete: false,
                isLast: false
            },
            {
                id: 'step3',
                label: this.step3Label,
                isActive: false,
                isComplete: false,
                isLast: false
            },
            {
                id: 'step4',
                label: this.step4Label,
                isActive: false,
                isComplete: false,
                isLast: false
            },
            {
                id: 'step5',
                label: this.step5Label,
                isActive: false,
                isComplete: false,
                isLast: false
            }
        ];

        // Filter out steps labeled "REMOVE"
        this.steps = allSteps.filter(step => step.label.toUpperCase() !== 'REMOVE');

        // Mark the last visible step
        if (this.steps.length > 0) {
            this.steps[this.steps.length - 1].isLast = true;
        }

        this.updateStepClasses();
    }

    @api
    startProgress() {
        this.currentStep = 0;
        this.isInProgress = true;
        this.isProgressComplete = false;
        this.hasStarted = true;
        this.steps.forEach(step => {
            step.isActive = false;
            step.isComplete = false;
        });
        this.activateNextStep();
    }

    @api
    resetProgress() {
        this.timeouts.forEach(timeout => clearTimeout(timeout));
        this.timeouts = [];
        this.currentStep = 0;
        this.isInProgress = false;
        this.hasStarted = false;
        this.buttonClicked = false;
        this.isProgressComplete = false;
        this.completionMessage = '';
        this.completionTimestamp = '';
        this.verificationMethod = '';
        this.initializeSteps();
    }

    activateNextStep() {
        if (this.currentStep < this.steps.length) {
            this.steps[this.currentStep].isActive = true;
            this.updateStepClasses();

            const timeout = setTimeout(() => {
                this.completeCurrentStep();
            }, this.stepDuration);
            
            this.timeouts.push(timeout);
        }
    }

    completeCurrentStep() {
        if (this.currentStep < this.steps.length) {
            this.steps[this.currentStep].isComplete = true;
            this.steps[this.currentStep].isActive = false;
            this.updateStepClasses();

            this.currentStep++;
            
            if (this.currentStep < this.steps.length) {
                this.activateNextStep();
            } else {
                this.isInProgress = false;
                this.isProgressComplete = true;
                this.completionTimestamp = new Date().toISOString();

                // Update record if configured
                if (this.updateRecordOnComplete && this.recordId && this.fieldApiName && this.fieldValue !== '') {
                    this.updateRecordField();
                }

                this.dispatchEvent(new CustomEvent('progresscomplete'));
            }
        }
    }

    updateStepClasses() {
        this.steps = this.steps.map(step => ({
            ...step,
            circleClass: this.getCircleClass(step),
            labelClass: this.getLabelClass(step),
            lineClass: this.getLineClass(step)
        }));
    }

    getCircleClass(step) {
        let classes = 'circle';
        if (step.isComplete) {
            classes += ' complete';
        } else if (step.isActive) {
            classes += ' active';
        } else {
            classes += ' inactive';
        }
        return classes;
    }

    getLabelClass(step) {
        let classes = 'step-label';
        if (step.isComplete || step.isActive) {
            classes += ' active-label';
        }
        return classes;
    }

    getLineClass(step) {
        let classes = 'connecting-line';
        if (step.isComplete) {
            classes += ' complete-line';
        }
        return classes;
    }

    updateRecordField() {
        const fields = {};
        fields['Id'] = this.recordId;

        // Parse the field value to handle different data types
        let parsedValue = this.fieldValue;

        // Try to parse as boolean
        if (this.fieldValue.toLowerCase() === 'true') {
            parsedValue = true;
        } else if (this.fieldValue.toLowerCase() === 'false') {
            parsedValue = false;
        }
        // Try to parse as number
        else if (!isNaN(this.fieldValue) && this.fieldValue.trim() !== '') {
            parsedValue = Number(this.fieldValue);
        }
        // Otherwise use as string

        fields[this.fieldApiName] = parsedValue;

        const recordInput = { fields };

        updateRecord(recordInput)
            .then(() => {
                console.log('Record updated successfully');
                // Notify LDS that the record has changed
                getRecordNotifyChange([{recordId: this.recordId}]);
                // Refresh the view to show the updated field
                setTimeout(() => {
                    this.dispatchEvent(new RefreshEvent());
                }, 300);
            })
            .catch(error => {
                console.error('Error updating record:', error);
            });
    }
}