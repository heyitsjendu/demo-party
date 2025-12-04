import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

export default class RecordRefresher extends LightningElement {
    @api recordId;
    @api objectApiName;
    
    subscription = {};
    channelName;
    wiredRecordResult;

    connectedCallback() {
        console.log('RecordRefresher connected');
        console.log('Record ID:', this.recordId);
        console.log('Object API Name:', this.objectApiName);
        
        // Format the channel name correctly
        this.channelName = `/data/${this.objectApiName}ChangeEvent`;
        console.log('Subscribing to channel:', this.channelName);
        
        this.registerErrorListener();
        this.handleSubscribe();
    }

    @wire(getRecord, { recordId: '$recordId', layoutTypes: ['Full'] })
    wiredRecord(result) {
        this.wiredRecordResult = result;
        console.log('Wired record result:', result);
    }

    handleSubscribe() {
        const messageCallback = (response) => {
            console.log('🔔 Change event received!');
            console.log('Full response:', JSON.stringify(response, null, 2));
            
            try {
                const changedRecordIds = response.data.payload.ChangeEventHeader.recordIds;
                console.log('Changed record IDs:', changedRecordIds);
                console.log('Current record ID:', this.recordId);
                
                if (changedRecordIds.includes(this.recordId)) {
                    console.log('✅ Match found! Refreshing record...');
                    this.handleRecordChange();
                } else {
                    console.log('❌ No match - different record was changed');
                }
            } catch (error) {
                console.error('Error processing change event:', error);
            }
        };

        subscribe(this.channelName, -1, messageCallback).then(response => {
            console.log('✅ Successfully subscribed to channel:', this.channelName);
            console.log('Subscription response:', JSON.stringify(response));
            this.subscription = response;
        }).catch(error => {
            console.error('❌ Subscription failed:', error);
        });
    }

    handleRecordChange() {
        console.log('🔄 Refreshing record data...');
        
        // Refresh the wired record data
        if (this.wiredRecordResult) {
            return refreshApex(this.wiredRecordResult)
                .then(() => {
                    console.log('✅ Record refreshed successfully');
                    
                    // Show toast notification
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Record Updated',
                            message: 'This record has been refreshed',
                            variant: 'success'
                        })
                    );
                })
                .catch(error => {
                    console.error('❌ Refresh failed:', error);
                });
        } else {
            console.warn('⚠️ No wired result to refresh');
        }
    }

    registerErrorListener() {
        onError(error => {
            console.error('🚨 EmpApi error:', JSON.stringify(error, null, 2));
        });
    }

    disconnectedCallback() {
        console.log('RecordRefresher disconnected - unsubscribing');
        unsubscribe(this.subscription, response => {
            console.log('Unsubscribed:', response);
        });
    }
}