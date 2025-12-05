// pdfFiller.js
import { LightningElement, api, wire } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import pdfLib from '@salesforce/resourceUrl/pdfLib';
import pdfTemplate from '@salesforce/resourceUrl/PurchaseAgreementTemplate';
import attachPdfAndCreateEnvelope from '@salesforce/apex/PdfFillerController.attachPdfAndCreateEnvelope';

// Import Opportunity fields
import ACCOUNT_NAME from '@salesforce/schema/Opportunity.Account.Name';
import BILLING_STREET from '@salesforce/schema/Opportunity.Account.BillingStreet';
import BILLING_CITY from '@salesforce/schema/Opportunity.Account.BillingCity';
import BILLING_STATE from '@salesforce/schema/Opportunity.Account.BillingState';
import BILLING_POSTAL_CODE from '@salesforce/schema/Opportunity.Account.BillingPostalCode';
import AMOUNT from '@salesforce/schema/Opportunity.Amount';
import OPP_NAME from '@salesforce/schema/Opportunity.Name';

export default class PdfFiller extends LightningElement {
    @api recordId;
    isLoading = false;
    pdfLibLoaded = false;
    opportunityRecord;
    showPreview = false;
    
    // Picklist options
    millingPricingOptions = [
        { label: 'Option 1: $54,995', value: 'option1' },
        { label: 'Option 2: $76,995 / $71,995 (5 Years Support)', value: 'option2' }
    ];

    softwareBillingOptions = [
        { label: 'Monthly Billing ($250/Mo after 1st year)', value: 'monthly' },
        { label: 'Annual Billing ($2,995 annually after 1st year)', value: 'annual' }
    ];

    hardwareBillingOptions = [
        { label: 'Monthly Billing ($210/Mo after 1st year)', value: 'monthly' },
        { label: 'Annual Billing ($2,495 annually after 1st year)', value: 'annual' },
        { label: 'None (1st year only)', value: 'none' }
    ];

    paymentOptions = [
        { label: 'Check', value: 'check' },
        { label: 'Bank Wire Transfer', value: 'wire' },
        { label: 'Third-Party Financing', value: 'financing' }
    ];
    
    // Form data
    formData = {
        customerName: '',
        practiceName: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        email: '',
        telephone: '',
        millingQuantity: 1,
        millingPricingOption: 'option1',
        softwareBilling: 'monthly',
        hardwareBilling: 'monthly',
        furnaceQuantity: 1,
        furnacePrice: 4995,
        furnaceWarranty: true,
        subtotalGlidewell: 0,
        subtotalScanner: 0,
        shipping: 895,
        totalPrice: 0,
        paymentOption: 'check'
    };

    originalData = {};

    @wire(getRecord, { 
        recordId: '$recordId', 
        fields: [ACCOUNT_NAME, BILLING_STREET, BILLING_CITY, BILLING_STATE, BILLING_POSTAL_CODE, AMOUNT, OPP_NAME]
    })
    wiredOpportunity({ error, data }) {
        if (data) {
            this.opportunityRecord = data;
            this.loadDataIntoForm();
            console.log('✅ Opportunity loaded');
        } else if (error) {
            console.error('❌ Error loading opportunity:', error);
            this.showToast('Error', 'Failed to load opportunity data', 'error');
        }
    }

    async connectedCallback() {
        try {
            await loadScript(this, pdfLib);
            this.pdfLibLoaded = true;
            console.log('✅ PDF-lib loaded successfully');
        } catch (error) {
            console.error('❌ Error loading pdf-lib:', error);
            this.showToast('Error', 'Failed to load PDF library', 'error');
        }
    }

    loadDataIntoForm() {
        if (!this.opportunityRecord) return;

        const accountName = getFieldValue(this.opportunityRecord, ACCOUNT_NAME) || '';
        const billingStreet = getFieldValue(this.opportunityRecord, BILLING_STREET) || '';
        const billingCity = getFieldValue(this.opportunityRecord, BILLING_CITY) || '';
        const billingState = getFieldValue(this.opportunityRecord, BILLING_STATE) || '';
        const billingPostalCode = getFieldValue(this.opportunityRecord, BILLING_POSTAL_CODE) || '';
        const amount = getFieldValue(this.opportunityRecord, AMOUNT) || 0;
        const oppName = getFieldValue(this.opportunityRecord, OPP_NAME) || '';

        this.formData = {
            ...this.formData,
            customerName: accountName,
            practiceName: oppName,
            address: billingStreet,
            city: billingCity,
            state: billingState,
            zip: billingPostalCode,
            totalPrice: amount,
            subtotalGlidewell: amount > 0 ? amount - 895 : 0
        };

        this.originalData = { ...this.formData };
        this.showPreview = true;
    }

    handleFieldChange(event) {
        const field = event.target.dataset.field;
        const value = event.target.value;
        this.formData[field] = value;
    }

    handleMillingOptionChange(event) {
        this.formData.millingPricingOption = event.detail.value;
    }

    handleSoftwareBillingChange(event) {
        this.formData.softwareBilling = event.detail.value;
    }

    handleHardwareBillingChange(event) {
        this.formData.hardwareBilling = event.detail.value;
    }

    handleFurnaceWarrantyChange(event) {
        this.formData.furnaceWarranty = event.target.checked;
    }

    handlePaymentOptionChange(event) {
        this.formData.paymentOption = event.detail.value;
    }

    handleReset() {
        this.formData = { ...this.originalData };
        this.showToast('Success', 'Data reset to Salesforce values', 'success');
    }

    async handleGeneratePdf() {
        console.log('🔵 Generating PDF with data:', this.formData);

        if (!this.pdfLibLoaded) {
            this.showToast('Error', 'PDF library not loaded', 'error');
            return;
        }

        this.isLoading = true;
        
        try {
            // Generate PDF
            const response = await fetch(pdfTemplate);
            const pdfBytes = await response.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
            const form = pdfDoc.getForm();

            // Fill customer info
            this.fillTextField(form, 'Customer Name', this.formData.customerName, 12);
            this.fillTextField(form, 'Practice Name', this.formData.practiceName, 12);
            this.fillTextField(form, 'Address', this.formData.address, 10);
            this.fillTextField(form, 'City', this.formData.city, 10);
            this.fillTextField(form, 'State', this.formData.state, 10);
            this.fillTextField(form, 'ZIP', this.formData.zip, 10);
            this.fillTextField(form, 'Email', this.formData.email, 10);
            this.fillTextField(form, 'Telephone', this.formData.telephone, 10);

            // Fill pricing info
            this.fillTextField(form, 'Subtotal - glidewell.io', `$${Number(this.formData.subtotalGlidewell).toLocaleString()}`, 10);
            this.fillTextField(form, 'Subtotal - Intraoral Scanner', `$${Number(this.formData.subtotalScanner).toLocaleString()}`, 10);
            this.fillTextField(form, 'Subtotal - Shipping', `$${Number(this.formData.shipping).toLocaleString()}`, 10);
            this.fillTextField(form, 'Total Purchase Price', `$${Number(this.formData.totalPrice).toLocaleString()}`, 14);

            form.flatten();
            
            const modifiedPdfBytes = await pdfDoc.save();
            
            // Convert to base64 for Apex
            const base64Pdf = await this.arrayBufferToBase64(modifiedPdfBytes);
            const fileName = `Purchase_Agreement_${this.formData.customerName.replace(/[^a-z0-9]/gi, '_')}.pdf`;
            
            console.log('📤 Uploading to Salesforce...');
            
            // Call Apex to attach PDF and create records
            const result = await attachPdfAndCreateEnvelope({
                opportunityId: this.recordId,
                pdfBase64: base64Pdf,
                fileName: fileName
            });
            
            const resultData = JSON.parse(result);
            console.log('✅ Salesforce records created:', resultData);
            
            // Also download the PDF for user
            const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(url), 100);
            
            this.showToast('Success', 'PDF generated, attached to Opportunity, and DocuSign envelope created!', 'success');

        } catch (error) {
            console.error('❌ ERROR:', error);
            this.showToast('Error', 'Failed to generate PDF: ' + error.body?.message || error.message, 'error');
        } finally {
            this.isLoading = false;
        }
    }

    // Helper to convert ArrayBuffer to Base64
    arrayBufferToBase64(buffer) {
        return new Promise((resolve, reject) => {
            const blob = new Blob([buffer], { type: 'application/pdf' });
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    fillTextField(form, fieldName, value, fontSize = 10) {
        try {
            const field = form.getTextField(fieldName);
            field.setText(String(value || ''));
            field.setFontSize(fontSize);
            console.log(`✅ Set "${fieldName}" = "${value}" (${fontSize}pt)`);
        } catch (e) {
            console.warn(`⚠️ Could not set field "${fieldName}":`, e.message);
        }
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({
            title,
            message,
            variant
        }));
    }
}