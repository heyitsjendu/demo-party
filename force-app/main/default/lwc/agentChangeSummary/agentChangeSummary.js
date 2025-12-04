import { LightningElement, api, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';

export default class AgentChangeSummary extends LightningElement {
    @api recordId;
    
    error;
    
    // Wire the record to get the Change_Summary__c field
    @wire(getRecord, { 
        recordId: '$recordId', 
        fields: ['OBJECT_API_NAME.Change_Summary__c']
    })
    record;
    
    // Getter to extract the change summary value
    get changeSummary() {
        if (this.record.data) {
            const summary = getFieldValue(this.record.data, 'OBJECT_API_NAME.Change_Summary__c');
            return summary ? summary : null;
        }
        return null;
    }
    
    // Check if there's no summary to display appropriate message
    get noSummary() {
        return this.record.data && !this.changeSummary;
    }
    
    // Handle errors
    get error() {
        return this.record.error;
    }
}