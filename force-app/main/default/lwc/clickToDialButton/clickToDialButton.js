import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';

// Import fields for Contact
import CONTACT_NAME from '@salesforce/schema/Contact.Name';
import CONTACT_PHONE from '@salesforce/schema/Contact.Phone';
import CONTACT_MOBILE from '@salesforce/schema/Contact.MobilePhone';

// Import fields for Lead
import LEAD_NAME from '@salesforce/schema/Lead.Name';
import LEAD_PHONE from '@salesforce/schema/Lead.Phone';
import LEAD_MOBILE from '@salesforce/schema/Lead.MobilePhone';

export default class ClickToDialButton extends LightningElement {
    @api recordId;
    @api objectApiName;
    
    contactData;
    error;

    get fields() {
        if (this.objectApiName === 'Contact') {
            return [CONTACT_NAME, CONTACT_PHONE, CONTACT_MOBILE];
        } else if (this.objectApiName === 'Lead') {
            return [LEAD_NAME, LEAD_PHONE, LEAD_MOBILE];
        }
        return [];
    }

    @wire(getRecord, { recordId: '$recordId', fields: '$fields' })
    wiredRecord({ error, data }) {
        if (data) {
            this.contactData = data;
            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.contactData = undefined;
        }
    }

    get name() {
        if (!this.contactData) return '';
        return this.contactData.fields.Name.value;
    }

    get primaryPhone() {
        if (!this.contactData) return '';
        const phone = this.contactData.fields.Phone?.value;
        const mobile = this.contactData.fields.MobilePhone?.value;
        return phone || mobile || '';
    }

    get mobilePhone() {
        if (!this.contactData) return '';
        return this.contactData.fields.MobilePhone?.value || '';
    }

    get hasPhone() {
        return this.primaryPhone !== '';
    }

    get hasMobile() {
        return this.mobilePhone !== '';
    }

    handleDialPrimary() {
        this.dispatchDialerEvent(this.primaryPhone);
    }

    handleDialMobile() {
        this.dispatchDialerEvent(this.mobilePhone);
    }

    dispatchDialerEvent(phoneNumber) {
        // Dispatch custom event that the dialer utility will listen for
        const dialEvent = new CustomEvent('initiatedial', {
            detail: {
                recordId: this.recordId,
                name: this.name,
                phone: phoneNumber,
                recordType: this.objectApiName
            },
            bubbles: true,
            composed: true
        });
        
        window.dispatchEvent(dialEvent);

        // Alternative: Try to access utility bar component directly
        // This requires the utility bar component to be accessible
        try {
            const dialerUtility = document.querySelector('c-dialer-utility');
            if (dialerUtility) {
                dialerUtility.initiateCall(
                    this.recordId,
                    this.name,
                    phoneNumber,
                    this.objectApiName
                );
            }
        } catch (e) {
            console.log('Could not access dialer utility directly', e);
        }
    }
}
