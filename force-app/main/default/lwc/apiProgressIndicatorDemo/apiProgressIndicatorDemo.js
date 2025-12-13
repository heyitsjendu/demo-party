import { LightningElement, api } from 'lwc';

export default class ApiProgressIndicatorDemo extends LightningElement {
    @api packageId;
    activeSections = ['steps', 'appearance', 'behavior'];

    // --- State Variables (Defaults) ---
    step1Label = 'Connecting to External System';
    step2Label = 'Locating Patient';
    step3Label = 'Querying Appointment Records';
    step4Label = 'Returning Results';
    step5Label = 'Updating Salesforce';
    
    stepDuration = 2000;
    completionMessage = 'In-Network. Pre-authorization required.';
    
    buttonColor = '#007c7c';
    buttonTextColor = '#ffffff';
    manualButtonLabel = 'Verify Benefits Manually';
    apiButtonLabel = 'Verify Benefits via API';
    
    hideManualButton = false;
    hideApiButton = false;
    showAsCard = false;
    cardTitle = 'Verification Progress';

    // Newly added fields
    autoStart = false;
    updateRecordOnComplete = false;
    fieldApiName = '';
    fieldValue = '';

    // Generic Handler for all inputs
    handleConfigChange(event) {
        const field = event.target.name;
        let value = event.detail.value;

        // Handle Toggles/Checkboxes
        if (event.target.type === 'checkbox' || event.target.type === 'toggle') {
            value = event.target.checked;
        }
        
        // Handle Numbers
        if (event.target.type === 'number') {
            value = parseInt(value, 10);
        }

        this[field] = value;
    }

    // Calls the @api resetProgress() method on the child component
    handleResetDemo() {
        const child = this.template.querySelector('[data-id="childComponent"]');
        if (child) {
            child.resetProgress();
        }
    }

    // Download Link Handler
    handleInstall() {
        if (this.packageId) {
            const url = `https://login.salesforce.com/packaging/installPackage.apexp?p0=${this.packageId}`;
            window.open(url, '_blank');
        } else {
            alert('Please configure the Package ID in the Experience Builder properties.');
        }
    }
}