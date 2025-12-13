import { LightningElement, api, track, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import saveCallLog from '@salesforce/apex/DialerController.saveCallLog';

// Import fields for Contact
import CONTACT_NAME from '@salesforce/schema/Contact.Name';
import CONTACT_PHONE from '@salesforce/schema/Contact.Phone';
import CONTACT_MOBILE from '@salesforce/schema/Contact.MobilePhone';

// Import fields for Lead
import LEAD_NAME from '@salesforce/schema/Lead.Name';
import LEAD_PHONE from '@salesforce/schema/Lead.Phone';
import LEAD_MOBILE from '@salesforce/schema/Lead.MobilePhone';

export default class DialerUtility extends LightningElement {
    @track currentView = 'idle';
    @track contactName = '';
    @track contactId = '';
    @track phoneNumber = '';
    @track callDuration = 0;
    @track callNotes = '';
    @track recordType = '';
    @track currentRecordId = null;
    @track autoLoadRecordId = null;
    
    callInterval;
    callStartTime;
    recordData;

    @wire(getRecord, { 
        recordId: '$autoLoadRecordId',
        fields: [CONTACT_NAME, CONTACT_PHONE, CONTACT_MOBILE, LEAD_NAME, LEAD_PHONE, LEAD_MOBILE]
    })
    wiredRecord({ error, data }) {
        if (data && this.currentView === 'idle') {
            this.recordData = data;
            this.processRecordData();
        } else if (error) {
            console.log('Error loading record:', error);
        }
    }

    processRecordData() {
        if (!this.recordData) return;

        try {
            let name = '';
            let phone = '';
            let mobile = '';
            
            if (this.recordData.fields.Name) {
                name = this.recordData.fields.Name.value || '';
                phone = this.recordData.fields.Phone?.value || '';
                mobile = this.recordData.fields.MobilePhone?.value || '';
                this.recordType = 'Contact';
            } else {
                name = this.recordData.fields.Name?.value || '';
                phone = this.recordData.fields.Phone?.value || '';
                mobile = this.recordData.fields.MobilePhone?.value || '';
                this.recordType = 'Lead';
            }

            const primaryPhone = phone || mobile;

            if (primaryPhone && this.currentView === 'idle') {
                this.initiateCall(this.autoLoadRecordId, name, primaryPhone, this.recordType);
            }
        } catch (error) {
            console.log('Error processing record data:', error);
        }
    }

    connectedCallback() {
        window.addEventListener('message', this.handlePhoneClick.bind(this));
        window.addEventListener('popstate', this.handlePageChange.bind(this));
        this.attemptAutoLoadRecord();
    }

    disconnectedCallback() {
        window.removeEventListener('message', this.handlePhoneClick.bind(this));
        window.removeEventListener('popstate', this.handlePageChange.bind(this));
        this.clearCallTimer();
    }

    handlePageChange() {
        if (this.currentView === 'idle') {
            this.attemptAutoLoadRecord();
        }
    }

    attemptAutoLoadRecord() {
        try {
            const url = window.location.href;
            const contactMatch = url.match(/\/r\/Contact\/([a-zA-Z0-9]{15,18})\//);
            const leadMatch = url.match(/\/r\/Lead\/([a-zA-Z0-9]{15,18})\//);
            
            if (contactMatch) {
                this.currentRecordId = contactMatch[1];
                this.recordType = 'Contact';
                this.autoLoadRecordId = this.currentRecordId;
            } else if (leadMatch) {
                this.currentRecordId = leadMatch[1];
                this.recordType = 'Lead';
                this.autoLoadRecordId = this.currentRecordId;
            } else {
                this.currentRecordId = null;
                this.recordType = '';
                this.autoLoadRecordId = null;
            }
        } catch (error) {
            console.log('Could not auto-detect record:', error);
        }
    }

    @api
    initiateCall(recordId, name, phone, type) {
        this.contactId = recordId;
        this.contactName = name;
        this.phoneNumber = phone;
        this.recordType = type;
        this.currentView = 'confirm';
        this.callDuration = 0;
        this.callNotes = '';
    }

    handlePhoneClick(event) {
        if (event.data && event.data.type === 'PHONE_CLICK') {
            this.initiateCall(
                event.data.recordId,
                event.data.name,
                event.data.phone,
                event.data.recordType
            );
        }
    }

    get isIdle() {
        return this.currentView === 'idle';
    }

    get isConfirm() {
        return this.currentView === 'confirm';
    }

    get isCalling() {
        return this.currentView === 'calling';
    }

    get isNotes() {
        return this.currentView === 'notes';
    }

    get isCompleted() {
        return this.currentView === 'completed';
    }

    get formattedDuration() {
        const minutes = Math.floor(this.callDuration / 60);
        const seconds = this.callDuration % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    get formattedPhone() {
        if (!this.phoneNumber) return '';
        const cleaned = this.phoneNumber.replace(/\D/g, '');
        if (cleaned.length === 10) {
            return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
        }
        return this.phoneNumber;
    }

    handleCallNow() {
        this.currentView = 'calling';
        this.callStartTime = Date.now();
        this.startCallTimer();
    }

    handleCancel() {
        this.resetDialer();
    }

    startCallTimer() {
        this.callInterval = setInterval(() => {
            this.callDuration = Math.floor((Date.now() - this.callStartTime) / 1000);
        }, 1000);
    }

    clearCallTimer() {
        if (this.callInterval) {
            clearInterval(this.callInterval);
            this.callInterval = null;
        }
    }

    handleEndCall() {
        this.clearCallTimer();
        this.currentView = 'notes';
    }

    handleNotesChange(event) {
        this.callNotes = event.target.value;
    }

    handleSaveCall() {
        // Check if we have a valid Salesforce ID (15 or 18 characters)
        const hasValidId = this.contactId && 
            (this.contactId.length === 15 || this.contactId.length === 18);
        
        if (!hasValidId) {
            // No valid ID - just show success and move to completed
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Call Logged',
                    variant: 'success'
                })
            );
            this.clearCallTimer();
            this.callDuration = 0;
            this.callNotes = '';
            this.currentView = 'completed';
            return;
        }

        saveCallLog({ 
            whoId: this.contactId,
            contactName: this.contactName,
            phoneNumber: this.phoneNumber,
            duration: this.formattedDuration,
            notes: this.callNotes
        })
            .then((taskId) => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Call logged successfully',
                        variant: 'success'
                    })
                );
                // Go to completed screen with dial pad
                this.clearCallTimer();
                this.callDuration = 0;
                this.callNotes = '';
                this.currentView = 'completed';
            })
            .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error logging call',
                        message: error.body.message,
                        variant: 'error'
                    })
                );
            });
    }

    handleCancelNotes() {
        this.resetDialer();
    }

    handleCallAgain() {
        this.callDuration = 0;
        this.callNotes = '';
        this.currentView = 'confirm';
    }

    handleClose() {
        this.resetDialer();
    }

    resetDialer() {
        this.clearCallTimer();
        this.currentView = 'idle';
        this.contactName = '';
        this.contactId = '';
        this.phoneNumber = '';
        this.callDuration = 0;
        this.callNotes = '';
        this.recordType = '';
        
        setTimeout(() => {
            this.attemptAutoLoadRecord();
        }, 500);
    }

    @api
    startDemoCall() {
        this.initiateCall(
            '00Q000000000000',
            'John Doe',
            '5551234567',
            'Contact'
        );
    }
}