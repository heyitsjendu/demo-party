import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { loadScript } from 'lightning/platformResourceLoader';
import JSPDF from '@salesforce/resourceUrl/jspdf';

export default class ExportToPdf extends LightningElement {
    @api recordId;
    @api objectApiName;
    
    jsPdfInitialized = false;

    // Specify the fields you want to include
    @wire(getRecord, { 
        recordId: '$recordId', 
        fields: ['Account.Name', 'Account.Industry', 'Account.Phone', 'Account.BillingCity'] 
    })
    record;

    renderedCallback() {
        if (this.jsPdfInitialized) {
            return;
        }
        this.jsPdfInitialized = true;

        loadScript(this, JSPDF)
            .then(() => {
                console.log('jsPDF loaded successfully');
            })
            .catch(error => {
                this.showToast('Error', 'Error loading jsPDF library: ' + error.message, 'error');
            });
    }

    handleExportPdf() {
        if (!window.jspdf) {
            this.showToast('Error', 'PDF library not loaded yet', 'error');
            return;
        }

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Add content to PDF
            doc.setFontSize(20);
            doc.text('Account Details', 20, 20);
            
            doc.setFontSize(12);
            let yPosition = 40;
            
            if (this.record.data) {
                const fields = this.record.data.fields;
                
                doc.text(`Name: ${fields.Name.value || 'N/A'}`, 20, yPosition);
                yPosition += 10;
                
                doc.text(`Industry: ${fields.Industry.value || 'N/A'}`, 20, yPosition);
                yPosition += 10;
                
                doc.text(`Phone: ${fields.Phone.value || 'N/A'}`, 20, yPosition);
                yPosition += 10;
                
                doc.text(`City: ${fields.BillingCity.value || 'N/A'}`, 20, yPosition);
            }
            
            // Save the PDF
            doc.save(`${this.record.data.fields.Name.value || 'record'}.pdf`);
            
            this.showToast('Success', 'PDF downloaded successfully!', 'success');
        } catch (error) {
            this.showToast('Error', 'Error generating PDF: ' + error.message, 'error');
            console.error('PDF generation error:', error);
        }
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}