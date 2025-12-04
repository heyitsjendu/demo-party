import { LightningElement, api } from 'lwc';
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';

export default class BenefitsVerificationButtons extends LightningElement {
    @api selectedVerificationMethod = '';

    setMethod(val) {
        this.selectedVerificationMethod = val;
        this.dispatchEvent(
            new FlowAttributeChangeEvent('selectedVerificationMethod', val)
        );
    }

    handleManualClick() { this.setMethod('Manual'); }
    handleApiClick() { this.setMethod('API'); }
}