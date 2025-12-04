import { LightningElement, api } from 'lwc';

export default class ContactFormEditor extends LightningElement {
    @api value = {};

    get firstName() { return this.value.firstName || ''; }
    get lastName() { return this.value.lastName || ''; }
    get email() { return this.value.email || ''; }
    get phone() { return this.value.phone || ''; }
    get contactDate() { return this.value.contactDate || ''; }

    handleFirstNameChange(event) {
        this.updateValue('firstName', event.target.value);
    }
    
    handleLastNameChange(event) {
        this.updateValue('lastName', event.target.value);
    }
    
    handleEmailChange(event) {
        this.updateValue('email', event.target.value);
    }
    
    handlePhoneChange(event) {
        this.updateValue('phone', event.target.value);
    }
    

    handleContactDateChange(event) {
        this.updateValue('contactDate', event.target.value);
    }

    updateValue(field, newValue) {
        const updatedValue = { ...this.value, [field]: newValue };
        this.dispatchEvent(new CustomEvent('valuechange', {
            detail: { value: updatedValue }
        }));
    }
}