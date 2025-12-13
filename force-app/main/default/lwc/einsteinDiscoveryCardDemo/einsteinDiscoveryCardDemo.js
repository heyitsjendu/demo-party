import { LightningElement, api } from 'lwc';

export default class EinsteinDiscoveryCardDemo extends LightningElement {
    // Accordion Control
    activeSections = ['general', 'section1'];

    // Allows you to set this in the App Builder
    @api packageId; 

    // --- Demo State Variables ---
    componentTitle = 'Einstein Discovery';
    overallScoreValue = 62;
    overallScoreLabel = 'OUTCOME SCORE';
    colorRangeDefinition = '0-25,25-75,75-100';

    firstSectionLabel = 'LEADING CAUSES';
    firstSectionScore1 = '+';
    firstSectionText1 = 'Highly engaged and responsive';
    firstSectionScore2 = '-';
    firstSectionText2 = 'Limited access to transportation';
    
    secondSectionLabel = 'HOW TO IMPROVE THIS';
    secondSectionScore1 = '+';
    secondSectionText1 = 'Connect with transportation program manager';
    
    // Updates the component as you type
    handleConfigChange(event) {
        const field = event.target.name;
        let value = event.detail.value || event.target.value;

        if (field === 'overallScoreValue') {
            value = parseInt(value, 10);
        }

        this[field] = value;
    }

    // Handles the Install Button Click
    handleInstall() {
        if (this.packageId) {
            // Opens the standard Salesforce package install URL in a new tab
            const url = `https://login.salesforce.com/packaging/installPackage.apexp?p0=${this.packageId}`;
            window.open(url, '_blank');
        } else {
            // Fallback alert if you forgot to set the ID
            alert('Please configure the Package ID in the Experience Builder properties.');
        }
    }
}