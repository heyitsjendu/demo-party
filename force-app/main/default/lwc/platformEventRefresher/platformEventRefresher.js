import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';
import { refreshApex } from '@salesforce/apex';

export default class PlatformEventRefresher extends LightningElement {
    @api recordId;
    @api objectApiName;
    
    subscription = {};
    channelName = '/event/Record_Refresh__e';
    wiredRecordResult;

    connectedCallback() {
        this.registerErrorListener();
        this.handleSubscribe();
    }

    @wire(getRecord, { recordId: '$recordId', layoutTypes: ['Full'] })
    wiredRecord(result) {
        this.wiredRecordResult = result;
    }

    handleSubscribe() {
        const messageCallback = (response) => {
            console.log('Platform event received: ', response);
            
            const eventRecordId = response.data.payload.Record_Id__c;
            const eventObjectName = response.data.payload.Object_Name__c;
            
            if (eventRecordId === this.recordId && 
                eventObjectName === this.objectApiName) {
                this.refreshRecord();
            }
        };

        subscribe(this.channelName, -1, messageCallback).then(response => {
            console.log('Subscribed to platform event');
            this.subscription = response;
        });
    }

    refreshRecord() {
        if (this.wiredRecordResult) {
            refreshApex(this.wiredRecordResult);
        }
    }

    registerErrorListener() {
        onError(error => {
            console.error('EmpApi error: ', error);
        });
    }

    disconnectedCallback() {
        unsubscribe(this.subscription);
    }
}