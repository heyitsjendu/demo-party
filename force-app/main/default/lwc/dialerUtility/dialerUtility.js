import { LightningElement, api, track, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import saveCallLog from '@salesforce/apex/DialerController.saveCallLog';  
import TASK_OBJECT from '@salesforce/schema/Task';
import SUBJECT_FIELD from '@salesforce/schema/Task.Subject';
import WHOID_FIELD from '@salesforce/schema/Task.WhoId';
import DESCRIPTION_FIELD from '@salesforce/schema/Task.Description';
import STATUS_FIELD from '@salesforce/schema/Task.Status';
import TASK_SUBTYPE_FIELD from '@salesforce/schema/Task.TaskSubtype';
import TYPE_FIELD from '@salesforce/schema/Task.Type';
import ACTIVITY_DATE_FIELD from '@salesforce/schema/Task.ActivityDate';

// Import fields for Contact
import CONTACT_NAME from '@salesforce/schema/Contact.Name';
import CONTACT_PHONE from '@salesforce/schema/Contact.Phone';
import CONTACT_MOBILE from '@salesforce/schema/Contact.MobilePhone';

// Import fields for Lead
import LEAD_NAME from '@salesforce/schema/Lead.Name';
import LEAD_PHONE from '@salesforce/schema/Lead.Phone';
import LEAD_MOBILE from '@salesforce/schema/Lead.MobilePhone';

export default class DialerUtility extends LightningElement {
    @track currentView = 'idle'; // idle, confirm, calling, notes
    @track contactName = '';
    @track contactId = '';
    @track phoneNumber = '';
    @track callDuration = 0;
    @track callNotes = '';
    @track recordType = ''; // Lead or Contact
    @track currentRecordId = null;
    @track autoLoadRecordId = null; // Used for @wire
    
    callInterval;
    callStartTime;
    recordData;

    // Wire to get record data when autoLoadRecordId is set
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

    // Process the record data from wire adapter
    processRecordData() {
        if (!this.recordData) return;

        try {
            // Determine if it's Contact or Lead based on which fields are populated
            let name = '';
            let phone = '';
            let mobile = '';
            
            // Try Contact fields first
            if (this.recordData.fields.Name) {
                name = this.recordData.fields.Name.value || '';
                phone = this.recordData.fields.Phone?.value || '';
                mobile = this.recordData.fields.MobilePhone?.value || '';
                this.recordType = 'Contact';
            } else {
                // Must be Lead
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

    // Listen for click to dial events and page changes
    connectedCallback() {
        // Subscribe to phone field click events
        window.addEventListener('message', this.handlePhoneClick.bind(this));
        
        // Subscribe to navigation events to detect record page
        window.addEventListener('popstate', this.handlePageChange.bind(this));
        
        // Try to auto-load current record on first open
        this.attemptAutoLoadRecord();
    }

    disconnectedCallback() {
        window.removeEventListener('message', this.handlePhoneClick.bind(this));
        window.removeEventListener('popstate', this.handlePageChange.bind(this));
        this.clearCallTimer();
    }

    // Detect when user navigates to different record
    handlePageChange() {
        if (this.currentView === 'idle') {
            this.attemptAutoLoadRecord();
        }
    }

    // Automatically load record info when utility is opened on a record page
    attemptAutoLoadRecord() {
        try {
            // Get the current URL
            const url = window.location.href;
            
            // Extract record ID from URL (pattern: /r/Contact/XXXXX/ or /r/Lead/XXXXX/)
            const contactMatch = url.match(/\/r\/Contact\/([a-zA-Z0-9]{15,18})\//);
            const leadMatch = url.match(/\/r\/Lead\/([a-zA-Z0-9]{15,18})\//);
            
            if (contactMatch) {
                this.currentRecordId = contactMatch[1];
                this.recordType = 'Contact';
                // Trigger wire adapter by setting autoLoadRecordId
                this.autoLoadRecordId = this.currentRecordId;
            } else if (leadMatch) {
                this.currentRecordId = leadMatch[1];
                this.recordType = 'Lead';
                // Trigger wire adapter by setting autoLoadRecordId
                this.autoLoadRecordId = this.currentRecordId;
            } else {
                // Not on a Contact or Lead page
                this.currentRecordId = null;
                this.recordType = '';
                this.autoLoadRecordId = null;
            }
        } catch (error) {
            console.log('Could not auto-detect record:', error);
        }
    }

    // This would be triggered by clicking a phone field
    // For demo purposes, you can also expose this as a public method
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
        // Handle phone field click events from Salesforce
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

    get formattedDuration() {
        const minutes = Math.floor(this.callDuration / 60);
        const seconds = this.callDuration % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    get formattedPhone() {
        if (!this.phoneNumber) return '';
        // Format phone number (simple US format)
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
            // Reset only the call-specific data, keep contact info
            this.clearCallTimer();
            this.callDuration = 0;
            this.callNotes = '';
            this.currentView = 'confirm';  // ← Go back to confirm screen
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

    resetDialer() {
        this.clearCallTimer();
        this.currentView = 'idle';
        this.contactName = '';
        this.contactId = '';
        this.phoneNumber = '';
        this.callDuration = 0;
        this.callNotes = '';
        this.recordType = '';
        
        // Try to auto-load if still on a record page
        setTimeout(() => {
            this.attemptAutoLoadRecord();
        }, 500);
    }

    // Demo method - you can call this from browser console for testing
    // component.startDemoCall()
    @api
    startDemoCall() {
        this.initiateCall(
            '00Q000000000000', // Sample Lead/Contact ID
            'John Doe',
            '5551234567',
            'Contact'
        );
    }
}