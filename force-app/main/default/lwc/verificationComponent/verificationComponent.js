import { LightningElement, api } from 'lwc';
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';

export default class VerificationComponent extends LightningElement {
    @api fieldConfigurations;
    @api verificationResults;
    @api allRequiredVerified = false;
    @api atLeastOneOptionalVerified = false;

    requiredFields = [];
    optionalFields = [];
    fieldStates = {};

    connectedCallback() {
        this.initializeFields();
    }

    initializeFields() {
        if (!this.fieldConfigurations) {
            console.error('No fieldConfigurations provided to component');
            return;
        }

        console.log('Received fieldConfigurations:', this.fieldConfigurations);

        try {
            const configs = JSON.parse(this.fieldConfigurations);
            console.log('Parsed configs:', configs);
            
            this.requiredFields = configs
                .filter(field => field.required)
                .map(field => this.createFieldObject(field));
            
            this.optionalFields = configs
                .filter(field => !field.required)
                .map(field => this.createFieldObject(field));

            configs.forEach(field => {
                this.fieldStates[field.name] = 'unverified';
            });

            this.updateVerificationStatus();
        } catch (error) {
            console.error('Error parsing field configurations:', error);
        }
    }

    createFieldObject(field) {
        const state = this.fieldStates[field.name] || 'unverified';
        return {
            name: field.name,
            label: field.label,
            value: field.value,
            buttonClass: {
                check: `verify-button ${state === 'verified' ? 'active' : ''}`,
                reject: `reject-button ${state === 'rejected' ? 'active' : ''}`
            },
            ariaLabel: {
                verify: `Verify ${field.label}`,
                reject: `Reject ${field.label}`
            }
        };
    }

    handleVerify(event) {
        const fieldName = event.target.dataset.field;
        this.fieldStates[fieldName] = 'verified';
        this.refreshFields();
        this.updateVerificationStatus();
        this.dispatchResults();
    }

    handleReject(event) {
        const fieldName = event.target.dataset.field;
        this.fieldStates[fieldName] = 'rejected';
        this.refreshFields();
        this.updateVerificationStatus();
        this.dispatchResults();
    }

    refreshFields() {
        if (this.fieldConfigurations) {
            const configs = JSON.parse(this.fieldConfigurations);
            
            this.requiredFields = configs
                .filter(field => field.required)
                .map(field => this.createFieldObject(field));
            
            this.optionalFields = configs
                .filter(field => !field.required)
                .map(field => this.createFieldObject(field));
        }
    }

    updateVerificationStatus() {
        const requiredFieldNames = this.requiredFields.map(f => f.name);
        this.allRequiredVerified = requiredFieldNames.length > 0 && 
            requiredFieldNames.every(name => this.fieldStates[name] === 'verified');

        const optionalFieldNames = this.optionalFields.map(f => f.name);
        this.atLeastOneOptionalVerified = optionalFieldNames.length > 0 &&
            optionalFieldNames.some(name => this.fieldStates[name] === 'verified');
    }

    dispatchResults() {
        const results = Object.keys(this.fieldStates).map(fieldName => ({
            fieldName: fieldName,
            status: this.fieldStates[fieldName]
        }));

        this.verificationResults = JSON.stringify(results);

        const attributeChangeEvent = new FlowAttributeChangeEvent('verificationResults', this.verificationResults);
        this.dispatchEvent(attributeChangeEvent);

        const requiredChangeEvent = new FlowAttributeChangeEvent('allRequiredVerified', this.allRequiredVerified);
        this.dispatchEvent(requiredChangeEvent);

        const optionalChangeEvent = new FlowAttributeChangeEvent('atLeastOneOptionalVerified', this.atLeastOneOptionalVerified);
        this.dispatchEvent(optionalChangeEvent);
    }

    get hasRequiredFields() {
        return this.requiredFields && this.requiredFields.length > 0;
    }

    get hasOptionalFields() {
        return this.optionalFields && this.optionalFields.length > 0;
    }
}